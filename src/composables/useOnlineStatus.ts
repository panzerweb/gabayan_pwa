import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useOnlineStatus() {
  const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const update = () => (isOnline.value = navigator.onLine)

  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })

  return { isOnline }
}
