<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { formatOrderCommand } from '../data/orders'
import type { WorkOrder } from '../types/game'

const props = defineProps<{
  orders: readonly WorkOrder[]
}>()

const emit = defineEmits<{
  select: [orderId: number]
}>()

const pendingOrderId = ref<number | null>(null)

function selectOrder(orderId: number): void {
  if (pendingOrderId.value !== null || props.orders.length === 0) {
    return
  }

  pendingOrderId.value = orderId
  emit('select', orderId)
  void nextTick(() => {
    pendingOrderId.value = null
  })
}
</script>

<template>
  <section
    class="order-selection panel"
    aria-labelledby="order-selection-title"
  >
    <p class="order-selection__eyebrow">
      Nieuwe opdracht
    </p>
    <h2 id="order-selection-title">
      Kies je volgende werk
    </h2>
    <p class="order-selection__description">
      Selecteer één van de twee opdrachten. Het materiaal mag vaker voorkomen,
      maar elk item is uniek.
    </p>

    <div class="order-selection__list">
      <article
        v-for="order in orders"
        :key="order.id"
        class="order-selection__card"
      >
        <p class="order-selection__command">
          {{ formatOrderCommand(order) }}
        </p>
        <p class="order-selection__reward">
          Beloning: {{ order.coinReward }} munten
        </p>
        <button
          class="order-selection__button"
          type="button"
          :disabled="pendingOrderId !== null"
          @click="selectOrder(order.id)"
        >
          Kies opdracht
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.order-selection {
  width: 100%;
}

.order-selection__eyebrow {
  margin-bottom: var(--space-1);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.order-selection h2 {
  margin-bottom: var(--space-2);
}

.order-selection__description {
  margin-bottom: var(--space-4);
}

.order-selection__list {
  display: grid;
  gap: var(--space-3);
}

.order-selection__card {
  padding: var(--space-4);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 0.7rem;
  background: var(--color-surface-raised);
}

.order-selection__command {
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.15rem;
  line-height: 1.3;
}

.order-selection__reward {
  margin-top: var(--space-2);
  color: var(--color-focus);
  font-size: 0.85rem;
  font-weight: 700;
}

.order-selection__button {
  width: 100%;
  min-height: 2.75rem;
  margin-top: var(--space-3);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 0.6rem;
  color: #21120b;
  background: var(--color-focus);
  cursor: pointer;
  font-weight: 800;
}

.order-selection__button:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface);
  cursor: not-allowed;
  opacity: 0.65;
}
</style>
