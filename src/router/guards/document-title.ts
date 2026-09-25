import type { RouteLocationNormalized } from 'vue-router'

const APP_TITLE = 'Gabayan'

// Titles the browser tab after the page, as "<page> | Gabayan".
export function applyDocumentTitle(route: RouteLocationNormalized) {
  const title = typeof route.meta.title === 'string' ? route.meta.title : APP_TITLE
  document.title = title === APP_TITLE ? title : `${title} | ${APP_TITLE}`
}
