<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { Upgrade } from '../types/game'

const props = defineProps<{
  upgrade: Upgrade
  currentCost: number
  purchaseCount: number
  affordable: boolean
}>()

const emit = defineEmits<{
  'buy-upgrade': [upgradeId: number]
}>()

const isPurchasePending = ref(false)

function handleBuy(): void {
  if (!props.affordable || isPurchasePending.value) {
    return
  }

  isPurchasePending.value = true
  emit('buy-upgrade', props.upgrade.id)
  void nextTick(() => {
    isPurchasePending.value = false
  })
}
</script>

<template>
  <article
    class="upgrade-item panel"
    :class="{ 'upgrade-item--purchased': purchaseCount > 0 }"
  >
    <div class="upgrade-item__content">
      <div
        class="upgrade-item__icon"
        aria-hidden="true"
      >
        ✦
      </div>
      <div class="upgrade-item__details">
        <div class="upgrade-item__heading">
          <h3>{{ upgrade.name }}</h3>
          <span
            v-if="purchaseCount > 0"
            class="upgrade-item__badge"
          >
            Gekocht {{ purchaseCount }}×
          </span>
        </div>
        <p class="upgrade-item__description">
          {{ upgrade.description }}
        </p>
        <ul class="upgrade-item__facts">
          <li>+{{ upgrade.clickBonus }}% clickkracht</li>
          <li>{{ currentCost }} munten</li>
        </ul>
      </div>
    </div>

    <button
      class="upgrade-item__button"
      type="button"
      :disabled="!affordable || isPurchasePending"
      :aria-disabled="!affordable || isPurchasePending ? 'true' : undefined"
      :aria-label="`Koop ${upgrade.name}`"
      @click="handleBuy"
    >
      {{ affordable ? 'Koop upgrade' : 'Niet betaalbaar' }}
    </button>
  </article>
</template>

<style scoped>
.upgrade-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-4);
}

.upgrade-item--purchased {
  border-color: rgb(255 209 102 / 30%);
}

.upgrade-item__content {
  display: flex;
  align-items: start;
  gap: var(--space-3);
  min-width: 0;
}

.upgrade-item__icon {
  display: grid;
  flex: 0 0 2.5rem;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgb(255 209 102 / 35%);
  border-radius: 0.6rem;
  color: var(--color-focus);
  background: rgb(255 209 102 / 10%);
  font-size: 1.35rem;
}

.upgrade-item__details {
  min-width: 0;
}

.upgrade-item__heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.upgrade-item h3 {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1.2;
}

.upgrade-item__badge {
  padding: var(--space-1) var(--space-2);
  border-radius: 999px;
  color: var(--color-focus);
  background: rgb(255 209 102 / 10%);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.upgrade-item__description {
  margin-top: var(--space-2);
  font-size: 0.9rem;
}

.upgrade-item__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin: var(--space-3) 0 0;
  padding: 0;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  list-style: none;
}

.upgrade-item__facts li::before {
  margin-right: var(--space-1);
  color: var(--color-focus);
  content: '◆';
}

.upgrade-item__button {
  flex: 0 0 auto;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-3);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 0.6rem;
  color: #21120b;
  background: var(--color-focus);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 800;
  transition:
    filter 100ms ease,
    transform 100ms ease;
}

.upgrade-item__button:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.upgrade-item__button:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface-raised);
  cursor: not-allowed;
  opacity: 0.65;
}

@media (max-width: 36rem) {
  .upgrade-item {
    align-items: stretch;
    flex-direction: column;
  }

  .upgrade-item__button {
    width: 100%;
  }
}
</style>
