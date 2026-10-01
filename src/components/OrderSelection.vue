<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { formatOrderCommand } from '../data/orders'
import type { WorkOrder } from '../types/game'
import ItemSprite from './ItemSprite.vue'

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

    <p
      v-if="orders.length === 0"
      class="order-selection__empty"
      role="status"
    >
      Er is op dit moment geen opdracht beschikbaar. Je kunt doorklikken om een
      nieuwe opdracht te ontvangen zodra je meer punten hebt.
    </p>

    <div
      v-else
      class="order-selection__list"
    >
      <article
        v-for="order in orders"
        :key="order.id"
        class="order-selection__card"
      >
        <ItemSprite
          :item-id="order.itemId"
          :material-id="order.materialId"
          class="order-selection__sprite"
        />
        <h3 class="order-selection__command">
          {{ formatOrderCommand(order) }}
        </h3>
        <p class="order-selection__reward">
          Beloning: {{ order.coinReward }} munten
        </p>
        <button
          class="order-selection__button"
          type="button"
          :disabled="pendingOrderId !== null"
          :aria-disabled="pendingOrderId !== null ? 'true' : undefined"
          :aria-label="`Kies opdracht: ${formatOrderCommand(order)}`"
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

.order-selection__card h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  line-height: 1.3;
}

.order-selection__empty {
  padding: var(--space-5) var(--space-4);
  border: 1px dashed rgb(255 255 255 / 18%);
  border-radius: 0.7rem;
  color: var(--color-text-muted);
  text-align: center;
}

.order-selection__list {
  display: grid;
  gap: var(--space-3);
}

.order-selection__card {
  display: grid;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 0.7rem;
  background: var(--color-surface-raised);
  text-align: center;
}

.order-selection__sprite {
  margin-bottom: var(--space-2);
}

.order-selection__card:hover {
  border-color: rgb(255 209 102 / 35%);
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
  min-height: var(--control-min-height);
  margin-top: var(--space-3);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 0.6rem;
  color: #21120b;
  background: var(--color-focus);
  cursor: pointer;
  font-weight: 800;
  transition:
    filter var(--transition-fast),
    transform var(--transition-fast);
}

.order-selection__button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.order-selection__button:active:not(:disabled) {
  transform: translateY(0.1rem);
}

.order-selection__button:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface-raised);
  cursor: not-allowed;
  opacity: 0.85;
}
</style>
