import type { Notification } from '@pages/notifications/domain/notifications.model'

export const feedingDue: Notification = {
  id: 'ntf_feed_pm',
  category: 'CULTIVATION',
  type: 'FEEDING_DUE',
  title: 'Afternoon feeding is due',
  message: 'Tilapia Batch #001 has a planned feeding at 4:00 PM.',
  recommendedAmount: { value: 1.2, unit: 'KG' },
  occurredAt: '2026-09-23T07:45:00Z',
  readAt: null,
  action: {
    label: 'Review task',
    deepLink: '/app/cultivations/cul_tilapia_001/tasks?taskId=task_feed_pm',
  },
  cultivationId: 'cul_tilapia_001',
  orderId: null,
  taskId: 'task_feed_pm',
}

// Occurs 16:30 UTC on the 22nd, which is already the 23rd in Manila.
export const lateNightCheck: Notification = {
  ...feedingDue,
  id: 'ntf_night_check',
  type: 'WATER_CHECK_DUE',
  title: 'Night water observation',
  message: 'Look at the pond once more before morning.',
  recommendedAmount: null,
  occurredAt: '2026-09-22T16:30:00Z',
  action: null,
  taskId: null,
}

export const orderShipped: Notification = {
  ...feedingDue,
  id: 'ntf_order_shipped',
  category: 'ORDER',
  type: 'ORDER_UPDATE',
  title: 'Your order is on the way',
  message: 'Order GBY-10245 left the warehouse.',
  recommendedAmount: null,
  occurredAt: '2026-09-22T03:00:00Z',
  readAt: null,
  action: null,
  cultivationId: null,
  orderId: 'ord_10245',
  taskId: null,
}

export const feedingTip: Notification = {
  ...feedingDue,
  id: 'ntf_tip_feeding',
  category: 'EDUCATION',
  type: 'EDUCATIONAL_TIP',
  title: 'Look for changes in feeding response',
  message: 'Fish that stop feeding early may be telling you something about the water.',
  recommendedAmount: null,
  occurredAt: '2026-09-20T03:30:00Z',
  readAt: '2026-09-20T05:00:00Z',
  action: null,
  cultivationId: null,
  taskId: null,
}

export const notifications = [feedingDue, lateNightCheck, orderShipped, feedingTip]
