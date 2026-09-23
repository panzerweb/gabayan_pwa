import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export interface ToastMessage {
  id: string
  message: string
  tone: ToastTone
}

let toastSequence = 0

export const useToastStore = defineStore('toast', () => {
  const messages = ref<ToastMessage[]>([])

  function show(message: string, tone: ToastTone = 'info', durationMs = 3500) {
    toastSequence += 1
    const id = `toast_${toastSequence}`
    messages.value.push({ id, message, tone })

    if (durationMs > 0) {
      window.setTimeout(() => dismiss(id), durationMs)
    }

    return id
  }

  function dismiss(id: string) {
    messages.value = messages.value.filter((message) => message.id !== id)
  }

  return { messages, show, dismiss }
})
