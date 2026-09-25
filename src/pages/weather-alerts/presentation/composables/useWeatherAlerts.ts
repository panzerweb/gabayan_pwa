import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useSessionStore } from '@stores/session.store'

import { weatherAlertsKeys } from '../../data/weather-alerts.keys'
import { weatherAlertsRepository } from '../../data/weather-alerts.repository'
import type { WeatherAlertsRepository } from '../../domain/weather-alerts.repository.interface'

// The farm's current weather alerts. A missing location and an unreadable forecast are
// answers, not failures: only a failed request is offered a retry.
export function useWeatherAlerts(repository: WeatherAlertsRepository = weatherAlertsRepository) {
  const session = useSessionStore()

  const query = useQuery({
    queryKey: weatherAlertsKeys.current(),
    queryFn: () => repository.getWeatherAlerts(session.accessToken ?? ''),
  })

  const weather = computed(() => query.data.value?.data ?? null)

  return {
    weather,
    alerts: computed(() => weather.value?.alerts ?? []),
    needsLocation: computed(() => weather.value?.status === 'LOCATION_MISSING'),
    forecastUnavailable: computed(() => weather.value?.status === 'FORECAST_UNAVAILABLE'),
    loading: computed(() => query.isPending.value && !query.isError.value),
    loadFailed: computed(() => query.isError.value),
    refetch: query.refetch,
  }
}
