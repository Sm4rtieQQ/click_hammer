<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import type { GameView } from '../types/ui'

const props = withDefaults(
  defineProps<{
    activeView: GameView
    disabledViews?: readonly GameView[]
  }>(),
  {
    disabledViews: () => [],
  },
)

const emit = defineEmits<{
  select: [view: GameView]
}>()

const isMenuOpen = ref(false)
const menuToggleRef = useTemplateRef<HTMLButtonElement>('menuToggle')
const tabListRef = useTemplateRef<HTMLDivElement>('tabList')

const views: ReadonlyArray<{
  id: GameView
  label: string
}> = [
  { id: 'projects', label: 'Projecten' },
  { id: 'smithy', label: 'Smederij' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'apprentice', label: 'Leerling' },
]

function isDisabled(view: GameView): boolean {
  return props.disabledViews.includes(view)
}

function getSelectableViews(): GameView[] {
  return views.filter(({ id }) => !isDisabled(id)).map(({ id }) => id)
}

function focusTab(view: GameView): void {
  tabListRef.value
    ?.querySelector<HTMLButtonElement>(
      `.game-navigation__tab[data-view="${view}"]`,
    )
    ?.focus()
}

function handleTabKeydown(event: KeyboardEvent): void {
  const selectableViews = getSelectableViews()

  if (selectableViews.length === 0) {
    return
  }

  const currentIndex = selectableViews.indexOf(props.activeView)
  const fallbackIndex = currentIndex === -1 ? 0 : currentIndex
  const lastIndex = selectableViews.length - 1
  let nextIndex: number

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown': {
      nextIndex = (fallbackIndex + 1) % selectableViews.length
      break
    }

    case 'ArrowLeft':
    case 'ArrowUp': {
      nextIndex =
        (fallbackIndex - 1 + selectableViews.length) % selectableViews.length
      break
    }

    case 'Home': {
      nextIndex = 0
      break
    }

    case 'End': {
      nextIndex = lastIndex
      break
    }

    default: {
      return
    }
  }

  event.preventDefault()

  const nextView = selectableViews[nextIndex]

  emit('select', nextView)
  focusTab(nextView)
}

function selectView(view: GameView): void {
  if (isDisabled(view)) {
    return
  }

  emit('select', view)
  isMenuOpen.value = false
}

function toggleMenu(): void {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenuAndRestoreFocus(): void {
  if (!isMenuOpen.value) {
    return
  }

  isMenuOpen.value = false
  menuToggleRef.value?.focus()
}

function handleMenuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenuAndRestoreFocus()
  }
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
      ref="tabList"
      class="game-navigation__tabs"
      role="tablist"
      aria-label="Spelschermen"
      @keydown="handleTabKeydown"
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
        :disabled="isDisabled(view.id)"
        @click="selectView(view.id)"
      >
        {{ view.label }}
      </button>
    </div>

    <button
      ref="menuToggle"
      class="game-navigation__menu-toggle"
      type="button"
      aria-controls="game-mobile-menu"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
      @click="toggleMenu"
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
      @keydown="handleMenuKeydown"
    >
      <button
        v-for="view in views"
        :key="view.id"
        class="game-navigation__mobile-item"
        :class="{ 'game-navigation__mobile-item--active': activeView === view.id }"
        type="button"
        role="menuitem"
        :aria-current="activeView === view.id ? 'page' : undefined"
        :disabled="isDisabled(view.id)"
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
  min-height: var(--control-min-height);
  padding: var(--space-2) var(--space-4);
  border: 0;
  border-radius: 0.5rem;
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 800;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.game-navigation__tab:not(:disabled):hover,
.game-navigation__mobile-item:not(:disabled):hover {
  color: var(--color-text);
  background: rgb(255 255 255 / 8%);
}

.game-navigation__tab:not(:disabled):active,
.game-navigation__mobile-item:not(:disabled):active {
  background: rgb(255 255 255 / 14%);
}

.game-navigation__tab--active,
.game-navigation__mobile-item--active {
  color: #21120b;
  background: var(--color-accent);
}

.game-navigation__tab--active:not(:disabled):hover,
.game-navigation__mobile-item--active:not(:disabled):hover {
  color: #21120b;
  background: var(--color-accent);
  filter: brightness(1.08);
}

.game-navigation__tab:disabled,
.game-navigation__mobile-item:disabled {
  color: rgb(203 181 142 / 70%);
  cursor: not-allowed;
}

.game-navigation__tab:disabled:hover,
.game-navigation__mobile-item:disabled:hover {
  background: transparent;
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

  .game-navigation__menu-toggle:hover {
    background: var(--color-surface-raised);
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
