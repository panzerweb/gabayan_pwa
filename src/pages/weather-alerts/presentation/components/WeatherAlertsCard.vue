<script setup lang="ts">
import { computed } from 'vue'

import EmptyState from '@components/feedback/EmptyState.vue'
import ErrorState from '@components/feedback/ErrorState.vue'
import LoadingState from '@components/feedback/LoadingState.vue'
import BaseCard from '@components/ui/BaseCard.vue'
import { ROUTE_NAMES } from '@router/route-names'

import { weatherPlace } from '../../domain/weather-alerts.model'
import { useWeatherAlerts } from '../composables/useWeatherAlerts'
import WeatherAlertDetail from './WeatherAlertDetail.vue'

// The farm's weather card on Home: its current alerts, a calm line when there are none, and
// a prompt to add the farm's location when the weather cannot be read without it.
const { weather, alerts, needsLocation, forecastUnavailable, loading, loadFailed, refetch } =
  useWeatherAlerts()

const place = computed(() => (weather.value?.location ? weatherPlace(weather.value.location) : ''))
</script>

<template>
  <BaseCard class="weather-card" padding="md" aria-labelledby="weather-card-title">
    <div class="weather-card__heading">
      <p class="weather-card__eyebrow">Weather for your fish</p>
      <h2 id="weather-card-title">Weather alerts</h2>
      <p v-if="place" class="weather-card__place">{{ place }}</p>
    </div>
    <LoadingState v-if="loading" compact label="Checking the weather…" />
    <ErrorState
      v-else-if="loadFailed"
      title="We couldn’t check the weather"
      message="Check your connection and try again."
      @retry="refetch()"
    />
    <EmptyState
      v-else-if="needsLocation"
      icon="sun"
      title="Add your farm’s location"
      :message="weather?.message ?? ''"
      action-label="Add farm location"
      :action-to="{ name: ROUTE_NAMES.profile, hash: '#farm-profile' }"
    />
    <template v-else-if="weather">
      <p
        class="weather-card__message"
        :class="{ 'weather-card__message--notice': forecastUnavailable }"
      >
        {{ weather.message }}
      </p>
      <WeatherAlertDetail v-for="alert in alerts" :key="alert.id" :alert="alert" />
    </template>
  </BaseCard>
</template>

<style scoped>
.weather-card {
  display: grid;
  gap: var(--space-3);
}
.weather-card__heading {
  display: grid;
  gap: var(--space-1);
}
.weather-card h2,
.weather-card p {
  margin: 0;
}
.weather-card__eyebrow {
  color: var(--color-aqua-700);
  font-size: 0.75rem;
  font-weight: 800;
}
.weather-card h2 {
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.weather-card__place,
.weather-card__message {
  color: var(--color-text-muted);
  font-size: 0.8125rem;
  line-height: 1.5;
}
.weather-card__message--notice {
  color: var(--color-text);
  font-weight: 650;
}
.weather-card :deep(.weather-alert) {
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}
</style>
