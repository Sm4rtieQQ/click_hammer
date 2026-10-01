<script setup lang="ts">
import { computed } from 'vue'
import { formatOrderCommand } from '../data/orders'
import type { WorkOrder } from '../types/game'

const props = defineProps<{
  order: WorkOrder
}>()

const pointsPerItem = computed(() =>
  props.order.quantity <= 0
    ? 1
    : props.order.requiredPoints / props.order.quantity,
)
const completedItems = computed(() => {
  if (pointsPerItem.value <= 0) {
    return 0
  }

  return Math.min(
    props.order.quantity,
    Math.floor(props.order.progress / pointsPerItem.value),
  )
})
const currentItemProgressPercentage = computed(() => {
  if (pointsPerItem.value <= 0) {
    return 0
  }

  return (
    ((props.order.progress % pointsPerItem.value) / pointsPerItem.value) *
    100
  )
})
const progressPercentage = computed(() => {
  if (props.order.requiredPoints <= 0) {
    return 0
  }

  return Math.min(
    100,
    Math.max(0, (props.order.progress / props.order.requiredPoints) * 100),
  )
})
const progressLabel = computed(
  () => `${Math.round(progressPercentage.value)}% voltooid`,
)
</script>

<template>
  <section
    class="order-tracker panel"
    aria-labelledby="order-tracker-title"
  >
    <div class="order-tracker__heading">
      <div>
        <p class="order-tracker__eyebrow">
          Lopende opdracht
        </p>
        <h2 id="order-tracker-title">
          {{ formatOrderCommand(order) }}
        </h2>
      </div>
      <span class="order-tracker__reward">
        {{ order.coinReward }} munten
      </span>
    </div>

    <div class="order-tracker__item-row">
      <span>Itemvoortgang</span>
      <strong>{{ completedItems }} / {{ order.quantity }}</strong>
    </div>
    <div
      class="order-tracker__item-bar"
      role="progressbar"
      aria-label="Status van het huidige item"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(currentItemProgressPercentage)"
      :aria-valuetext="`Item ${Math.min(completedItems + 1, order.quantity)} van ${order.quantity}`"
    >
      <div
        class="order-tracker__item-bar-fill"
        :style="{ width: `${currentItemProgressPercentage}%` }"
      />
    </div>

    <div class="order-tracker__total-row">
      <span>Totale opdrachtvoortgang</span>
      <span>{{ progressLabel }}</span>
    </div>
    <div
      class="order-tracker__total-bar"
      role="progressbar"
      aria-label="Totale opdrachtvoortgang"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(progressPercentage)"
      :aria-valuetext="progressLabel"
    >
      <div
        class="order-tracker__total-bar-fill"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>
  </section>
</template>

<style scoped>
.order-tracker {
  width: 100%;
}

.order-tracker__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-4);
}

.order-tracker__eyebrow {
  margin-bottom: var(--space-1);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.order-tracker h2 {
  margin-bottom: 0;
  font-size: clamp(1.3rem, 3vw, 1.8rem);
}

.order-tracker__reward {
  flex: 0 0 auto;
  color: var(--color-focus);
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
}

.order-tracker__item-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-5);
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.order-tracker__item-row strong {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-variant-numeric: tabular-nums;
}

.order-tracker__item-bar {
  height: 0.65rem;
  margin-top: var(--space-2);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: var(--color-background);
}

.order-tracker__item-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--color-focus);
  transition: width 180ms ease;
}

.order-tracker__total-bar {
  height: 0.85rem;
  margin-top: var(--space-2);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: var(--color-background);
}

.order-tracker__item-bar-fill,
.order-tracker__total-bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 180ms ease;
}

.order-tracker__item-bar-fill {
  background: linear-gradient(90deg, var(--color-accent), var(--color-focus));
}

.order-tracker__total-bar-fill {
  background: linear-gradient(90deg, #8f4818, var(--color-accent));
}

.order-tracker__total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-4);
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.order-tracker__total-row span:last-child {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 36rem) {
  .order-tracker__heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
