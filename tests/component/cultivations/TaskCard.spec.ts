import { mount } from '@vue/test-utils'

import type { FarmTask } from '@pages/cultivations/domain/cultivations.model'
import TaskCard from '@pages/cultivations/presentation/components/TaskCard.vue'

const task: FarmTask = {
  id: 'task_feed_pm',
  cultivationId: 'cul_001',
  type: 'FEEDING',
  title: 'Afternoon feeding',
  instruction: 'Give the planned portion.',
  scheduledAt: '2026-09-22T08:00:00Z',
  dueAt: '2026-09-22T09:00:00Z',
  status: 'DUE',
  recommendedAmount: { value: 1.2, unit: 'KG' },
  completedAt: null,
  completionRecordType: null,
  completionRecordId: null,
  deepLink: '/app/cultivations/cul_001/tasks?taskId=task_feed_pm',
  audit: {
    createdAt: '2026-09-21T08:00:00Z',
    updatedAt: '2026-09-21T08:00:00Z',
    version: 1,
  },
}

describe('TaskCard', () => {
  it('shows explicit task status and emits the selected feeding task', async () => {
    const wrapper = mount(TaskCard, { props: { task, actionable: true } })

    expect(wrapper.text()).toContain('DUE')
    expect(wrapper.text()).toContain('1.2 kg planned')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([task])
  })

  it('does not offer completion for an already completed task', () => {
    const wrapper = mount(TaskCard, {
      props: {
        task: { ...task, status: 'COMPLETED', completedAt: '2026-09-22T08:05:00Z' },
        actionable: true,
      },
    })

    expect(wrapper.text()).toContain('Done')
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
