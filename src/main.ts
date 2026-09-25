import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'

import { queryClient } from '@core/query'

import App from './App.vue'
import { router } from './router'
import './styles/tokens.css'
import './styles/global.css'

createApp(App).use(createPinia()).use(router).use(VueQueryPlugin, { queryClient }).mount('#app')
