<script setup lang="ts">
interface KeyboardActivationEvent {
  readonly key: string
  readonly repeat: boolean
  preventDefault: () => void
}

const props = withDefaults(
  defineProps<{
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

function activate(): void {
  if (!props.disabled) {
    emit('click')
  }
}

function handleClick(): void {
  activate()
}

function handleKeydown(event: KeyboardActivationEvent): void {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return
  }

  event.preventDefault()

  if (!event.repeat) {
    activate()
  }
}
</script>

<template>
  <button
    class="game-button"
    type="button"
    :disabled="disabled"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <span
      class="game-button__hammer"
      aria-hidden="true"
    >⚒</span>
    <span>Sla op het aambeeld</span>
  </button>
</template>

<style scoped>
.game-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-width: min(100%, 18rem);
  min-height: 4rem;
  padding: var(--space-3) var(--space-5);
  border: 2px solid rgb(255 255 255 / 18%);
  border-radius: var(--panel-radius);
  color: #21120b;
  background: linear-gradient(180deg, #efa64b, var(--color-accent));
  box-shadow:
    0 0.35rem 0 #8f4818,
    0 0.9rem 1.5rem rgb(0 0 0 / 28%);
  cursor: pointer;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.2;
  touch-action: manipulation;
  user-select: none;
  transition:
    transform 100ms ease,
    box-shadow 100ms ease,
    filter 100ms ease;
}

.game-button:hover:not(:disabled) {
  filter: brightness(1.08);
}

.game-button:active:not(:disabled) {
  transform: translateY(0.25rem);
  box-shadow:
    0 0.1rem 0 #8f4818,
    0 0.45rem 0.8rem rgb(0 0 0 / 25%);
}

.game-button:disabled {
  color: var(--color-text-muted);
  background: var(--color-surface-raised);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

.game-button__hammer {
  display: inline-block;
  font-size: 1.5rem;
  line-height: 1;
  transform-origin: 75% 75%;
}

.game-button:active:not(:disabled) .game-button__hammer {
  animation: game-button-strike 140ms ease-out;
}

@keyframes game-button-strike {
  0% {
    transform: rotate(0deg) translateY(0);
  }

  45% {
    transform: rotate(-24deg) translateY(-0.2rem);
  }

  100% {
    transform: rotate(0deg) translateY(0);
  }
}
</style>
