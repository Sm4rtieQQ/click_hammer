<script setup lang="ts">
import type { Upgrade } from '../types/game'
import { getUpgradeCost } from '../composables/useGameState'
import UpgradeItem from './UpgradeItem.vue'

const props = defineProps<{
  upgrades: readonly Upgrade[]
  coins: number
  purchaseCounts: Readonly<Record<number, number>>
  currentCosts: Readonly<Record<number, number>>
  affordableUpgradeIds: ReadonlySet<number>
}>()

const emit = defineEmits<{
  'buy-upgrade': [upgradeId: number]
}>()

function getPurchaseCount(upgradeId: number): number {
  return props.purchaseCounts[upgradeId] ?? 0
}

function getCurrentCost(upgrade: Upgrade): number {
  return (
    props.currentCosts[upgrade.id] ??
    getUpgradeCost(upgrade, getPurchaseCount(upgrade.id))
  )
}

function isAffordable(upgrade: Upgrade, currentCost: number): boolean {
  return (
    props.affordableUpgradeIds.has(upgrade.id) &&
    props.coins >= currentCost
  )
}

function handleBuy(upgradeId: number): void {
  emit('buy-upgrade', upgradeId)
}
</script>

<template>
  <section
    class="upgrade-shop panel"
    aria-labelledby="upgrade-shop-title"
  >
    <div class="upgrade-shop__heading">
      <div>
        <p class="upgrade-shop__eyebrow">
          Verbeter je hamer
        </p>
        <h2 id="upgrade-shop-title">
          Upgrades
        </h2>
      </div>
      <p class="upgrade-shop__balance">
        {{ coins }} munten
      </p>
    </div>

    <p
      v-if="upgrades.length === 0"
      class="upgrade-shop__empty"
    >
      Er zijn momenteel geen upgrades beschikbaar.
    </p>

    <div
      v-else
      class="upgrade-shop__list"
    >
      <UpgradeItem
        v-for="upgrade in upgrades"
        :key="upgrade.id"
        :upgrade="upgrade"
        :current-cost="getCurrentCost(upgrade)"
        :purchase-count="getPurchaseCount(upgrade.id)"
        :affordable="isAffordable(upgrade, getCurrentCost(upgrade))"
        @buy-upgrade="handleBuy"
      />
    </div>
  </section>
</template>

<style scoped>
.upgrade-shop {
  width: 100%;
}

.upgrade-shop__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.upgrade-shop__eyebrow {
  margin-bottom: var(--space-1);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.upgrade-shop h2 {
  margin-bottom: 0;
}

.upgrade-shop__balance {
  flex: 0 0 auto;
  color: var(--color-focus);
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-variant-numeric: tabular-nums;
}

.upgrade-shop__list {
  display: grid;
  gap: var(--space-3);
}

.upgrade-shop__empty {
  margin: 0;
  padding: var(--space-5) var(--space-3);
  border: 1px dashed rgb(255 255 255 / 18%);
  border-radius: 0.6rem;
  color: var(--color-text-muted);
  text-align: center;
}

@media (max-width: 36rem) {
  .upgrade-shop__heading {
    align-items: stretch;
    flex-direction: column;
  }

  .upgrade-shop__balance {
    font-size: 1rem;
  }
}
</style>
