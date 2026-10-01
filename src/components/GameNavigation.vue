<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GameView } from '../types/ui'

const props = defineProps<{
  activeView: GameView
}>()

const emit = defineEmits<{
  select: [view: GameView]
}>()

const isMenuOpen = ref(false)

const views: ReadonlyArray<{
  id: GameView
  label: string
}> = [
  { id: 'projects', label: 'Projecten' },
  { id: 'smithy', label: 'Smidse' },
  { id: 'upgrades', label: 'Upgrades' },
]

function selectView(view: GameView): void {
  emit('select', view)
  isMenuOpen.value = false
}

watch(
  () => props.activeView,
  () => {
    isMenuOpen.value = false
  },
)
</script>

<template>
  <nav
    class="game-navigation"
    aria-label="Spelnavigatie"
  >
    <div
      class="game-navigation__tabs"
      role="tablist"
      aria-label="Spelschermen"
    >
      <button
        v-for="view in views"
        :id="`game-tab-${view.id}`"
        :key="view.id"
        class="game-navigation__tab"
        :class="{ 'game-navigation__tab--active': activeView === view.id }"
        type="button"
        role="tab"
        :data-view="view.id"
        :aria-selected="activeView === view.id"
        :aria-controls="`game-panel-${view.id}`"
        :tabindex="activeView === view.id ? 0 : -1"
        @click="selectView(view.id)"
      >
        {{ view.label }}
      </button>
    </div>

    <button
      class="game-navigation__menu-toggle"
      type="button"
      aria-controls="game-mobile-menu"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
      @click="isMenuOpen = !isMenuOpen"
    >
      <span
        class="game-navigation__menu-icon"
        aria-hidden="true"
      >☰</span>
      Menu
    </button>

    <div
      v-if="isMenuOpen"
      id="game-mobile-menu"
      class="game-navigation__mobile-menu"
      role="menu"
      aria-label="Spelschermen"
    >
      <button
        v-for="view in views"
        :key="view.id"
        class="game-navigation__mobile-item"
        :class="{ 'game-navigation__mobile-item--active': activeView === view.id }"
        type="button"
        role="menuitem"
        :aria-current="activeView === view.id ? 'page' : undefined"
        @click="selectView(view.id)"
      >
        {{ view.label }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.game-navigation {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, var(--content-max-width));
  margin: 0 auto var(--space-5);
}

.game-navigation__tabs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 0.7rem;
  background: var(--color-surface);
}

.game-navigation__tab,
.game-navigation__menu-toggle,
.game-navigation__mobile-item {
  min-height: 2.5rem;
  padding: var(--space-2) var(--space-4);
  border: 0;
  border-radius: 0.5rem;
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 800;
}

.game-navigation__tab--active,
.game-navigation__mobile-item--active {
  color: #21120b;
  background: var(--color-accent);
}

.game-navigation__menu-toggle,
.game-navigation__mobile-menu {
  display: none;
}

@media (max-width: 48rem) {
  .game-navigation {
    justify-content: flex-end;
    margin-bottom: var(--space-4);
  }

  .game-navigation__tabs {
    display: none;
  }

  .game-navigation__menu-toggle {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    border: 1px solid rgb(255 255 255 / 14%);
    background: var(--color-surface);
  }

  .game-navigation__menu-icon {
    font-size: 1.1rem;
    line-height: 1;
  }

  .game-navigation__mobile-menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    z-index: 30;
    display: grid;
    min-width: 10rem;
    padding: var(--space-1);
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 0.7rem;
    background: var(--color-surface-raised);
    box-shadow: var(--panel-shadow);
  }

  .game-navigation__mobile-item {
    text-align: left;
  }
}
</style>
