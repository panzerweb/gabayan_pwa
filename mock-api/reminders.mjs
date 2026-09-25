import { dateInManila, daysBetween, manilaInstant } from './dates.mjs'

// In-app reminders (contract §12 "Reminders", BLOCKERS D-22). Nothing runs in the background:
// when a farmer's Home or notifications are read, the reminders that have fallen due for
// their open cultivations are raised. Each one is keyed in `reminderSlots` per cultivation,
// kind and slot, so a slot is decided once - raised while its settings switch is on, and
// skipped for good when the switch is off at that moment.

const OPEN_STATUSES = ['ACTIVE', 'GROWING', 'PRE_HARVEST']

const FEEDING_SLOTS = [
  { code: 'MORNING', label: 'Morning', timeField: 'morningFeedingTime', index: 0, suffix: 'am' },
  {
    code: 'AFTERNOON',
    label: 'Afternoon',
    timeField: 'afternoonFeedingTime',
    index: 1,
    suffix: 'pm',
  },
]

const FEEDING_BASIS =
  "The planned amount is today's demo feeding plan: estimated live fish, the latest sample weight and the stage feed rate. Without a sample no amount is planned."
const WATER_CHANGE_DISCLAIMER =
  'A demo schedule, not yet reviewed for your farm. Look at the water and the fish first, and change less or wait if local technical guidance says so.'
const HARVEST_DISCLAIMER =
  'Harvest readiness is an estimate, not a guarantee. Use a current representative sample and local professional judgment.'

const timeFormat = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Manila',
})

function weightInGrams(weight) {
  return weight.unit === 'KG' ? weight.value * 1000 : weight.value
}

function isDemo(sourceStatus) {
  return sourceStatus !== 'VERIFIED'
}

function reminderDetail(fields) {
  return {
    waterChangePercent: null,
    harvestWindowDays: null,
    latestAverageWeight: null,
    targetWeightRange: null,
    ...fields,
  }
}

/**
 * Raises the reminders due at `now` (an RFC 3339 instant) for `user`'s open, stocked
 * cultivations, as `settings` (their NotificationSettings) allow. `feedingPlan(cultivation,
 * date)` answers the day's FeedingPlan. Returns the ids of the cultivations that gained a
 * feeding task, whose `nextTaskAt` the caller refreshes.
 */
export function raiseDueReminders(db, { user, settings, now, feedingPlan }) {
  const today = dateInManila(now)
  const nowMs = Date.parse(now)
  const withNewTasks = new Set()

  function isDecided(cultivationId, kind, slot) {
    return Boolean(db.get('reminderSlots').find({ cultivationId, kind, slot }).value())
  }

  function decide(cultivationId, kind, slot, { taskId = null, notificationId = null } = {}) {
    db.get('reminderSlots')
      .push({
        id: `rem_${cultivationId}_${kind.toLowerCase()}_${slot.replace(/[^0-9a-z]/gi, '').toLowerCase()}`,
        ownerUserId: user.id,
        cultivationId,
        kind,
        slot,
        taskId,
        notificationId,
        decidedAt: now,
      })
      .write()
  }

  function notify(notification) {
    db.get('notifications')
      .push({
        ownerUserId: user.id,
        category: 'CULTIVATION',
        recommendedAmount: null,
        readAt: null,
        orderId: null,
        taskId: null,
        ...notification,
      })
      .write()
    return notification.id
  }

  // The day's FEEDING task for each feeding time that has passed, with its FEEDING_DUE
  // notification. The task is part of the day's schedule, so it is created even when feeding
  // reminders are off; only the notification follows the switch.
  function raiseFeeding(cultivation) {
    const stamp = today.replaceAll('-', '')
    for (const slot of FEEDING_SLOTS) {
      const time = settings[slot.timeField]
      if (!time) continue
      const scheduledAt = manilaInstant(today, time)
      const key = `${today}:${slot.code}`
      if (Date.parse(scheduledAt) > nowMs || isDecided(cultivation.id, 'FEEDING', key)) continue

      const plan = feedingPlan(cultivation, today)
      const amount = cultivation.latestGrowthMeasurement
        ? (plan.feedings[slot.index]?.recommendedAmount ?? null)
        : null
      const taskId = `task_feed_${cultivation.id}_${stamp}_${slot.suffix}`
      const deepLink = `/app/cultivations/${cultivation.id}/tasks?taskId=${taskId}`
      db.get('tasks')
        .push({
          id: taskId,
          cultivationId: cultivation.id,
          type: 'FEEDING',
          title: `${slot.label} feeding`,
          instruction: `Give the planned ${slot.label.toLowerCase()} portion and stop if fish are not actively feeding.`,
          scheduledAt,
          dueAt: new Date(Date.parse(scheduledAt) + 60 * 60 * 1000)
            .toISOString()
            .replace('.000Z', 'Z'),
          status: 'DUE',
          recommendedAmount: amount,
          completedAt: null,
          completionRecordType: null,
          completionRecordId: null,
          deepLink,
          audit: { createdAt: now, updatedAt: now, version: 1 },
        })
        .write()
      withNewTasks.add(cultivation.id)

      const notificationId = settings.feedingReminders
        ? notify({
            id: `ntf_feed_${cultivation.id}_${stamp}_${slot.suffix}`,
            type: 'FEEDING_DUE',
            title: `${slot.label} feeding is due`,
            message: `${cultivation.name} has a planned feeding at ${timeFormat.format(new Date(scheduledAt))}.`,
            recommendedAmount: amount,
            occurredAt: scheduledAt,
            action: { label: 'Review task', deepLink },
            cultivationId: cultivation.id,
            taskId,
            reminder: reminderDetail({
              basis: FEEDING_BASIS,
              isDemo: plan.isDemo,
              sourceStatus: plan.sourceStatus,
              ruleVersion: plan.ruleVersion,
              disclaimer: plan.disclaimer,
            }),
          })
        : null
      decide(cultivation.id, 'FEEDING', key, { taskId, notificationId })
    }
  }

  // A partial water change once per interval of the species/environment row, counted from
  // the stocking date. An environment without a row (a fish cage in open water) gets none.
  function raiseWaterChange(cultivation, profile) {
    const rule = (profile?.waterExchange ?? []).find(
      (row) => row.environmentId === cultivation.environment.id,
    )
    if (!rule) return
    const interval = Math.floor(daysBetween(cultivation.stockedOn, today) / rule.intervalDays)
    const key = String(interval)
    if (interval < 1 || isDecided(cultivation.id, 'WATER_CHANGE', key)) return

    const notificationId = settings.waterMaintenance
      ? notify({
          id: `ntf_water_change_${cultivation.id}_${interval}`,
          type: 'WATER_CHANGE_DUE',
          title: 'Partial water change due',
          message: `${cultivation.name}: change about ${rule.percentOfVolume}% of the water, a little at a time. Keep the rest so conditions stay steady for the fish.`,
          occurredAt: now,
          action: {
            label: 'Open water records',
            deepLink: `/app/cultivations/${cultivation.id}/records?tab=water`,
          },
          cultivationId: cultivation.id,
          reminder: reminderDetail({
            waterChangePercent: rule.percentOfVolume,
            basis: rule.basis,
            isDemo: isDemo(rule.sourceStatus),
            sourceStatus: rule.sourceStatus,
            ruleVersion: rule.ruleVersion,
            disclaimer: WATER_CHANGE_DISCLAIMER,
          }),
        })
      : null
    decide(cultivation.id, 'WATER_CHANGE', key, { notificationId })
  }

  // A harvest alert once per growth sample that reaches the target band while it is still
  // current (BLOCKERS D-33). Days since stocking never raise one; they are only a hint.
  function raiseHarvestAlert(cultivation, profile) {
    const target = profile?.harvestTarget
    const latest = cultivation.latestGrowthMeasurement
    if (!target || !latest) return
    const age = daysBetween(latest.measuredOn, today)
    const grams = weightInGrams(latest.averageWeight)
    if (age < 0 || age > target.measurementFreshDays || grams < target.targetMinimumG) return
    if (isDecided(cultivation.id, 'HARVEST', latest.id)) return

    const notificationId = settings.harvestReminders
      ? notify({
          id: `ntf_harvest_${cultivation.id}_${latest.id}`,
          type: 'HARVEST_APPROACHING',
          title: 'Your fish may be near harvest size',
          message: `The latest sample from ${cultivation.name} averages ${grams} g, which reaches the ${target.targetMinimumG}-${target.targetMaximumG} g demo target. You decide when the size is right; weigh a fresh sample before you harvest.`,
          occurredAt: now,
          action: {
            label: 'Check harvest readiness',
            deepLink: `/app/cultivations/${cultivation.id}/harvest`,
          },
          cultivationId: cultivation.id,
          reminder: reminderDetail({
            harvestWindowDays: target.harvestWindowDays ?? null,
            latestAverageWeight: latest.averageWeight,
            targetWeightRange: {
              minimum: { value: target.targetMinimumG, unit: 'G' },
              maximum: { value: target.targetMaximumG, unit: 'G' },
            },
            basis: target.basis,
            isDemo: isDemo(target.sourceStatus),
            sourceStatus: target.sourceStatus,
            ruleVersion: target.ruleVersion,
            disclaimer: HARVEST_DISCLAIMER,
          }),
        })
      : null
    decide(cultivation.id, 'HARVEST', latest.id, { notificationId })
  }

  const cultivations = db
    .get('cultivations')
    .filter(
      (cultivation) =>
        cultivation.ownerUserId === user.id &&
        OPEN_STATUSES.includes(cultivation.status) &&
        Boolean(cultivation.stockedOn) &&
        cultivation.stockedOn <= today,
    )
    .value()
  for (const cultivation of cultivations) {
    const profile = db.get('speciesProfiles').find({ speciesId: cultivation.species.id }).value()
    raiseFeeding(cultivation)
    raiseWaterChange(cultivation, profile)
    raiseHarvestAlert(cultivation, profile)
  }
  return [...withNewTasks]
}
