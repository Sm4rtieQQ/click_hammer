<script setup lang="ts">
import { computed } from 'vue'

type StatusTone = 'info' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    tone?: StatusTone
    title: string
    message?: string
  }>(),
  {
    tone: 'info',
    message: undefined,
  },
)

const role = computed(() => (props.tone === 'info' ? 'status' : 'alert'))
const live = computed(() => (props.tone === 'info' ? 'polite' : 'assertive'))
</script>

<template>
  <section
    class="game-status panel"
    :class="`game-status--${tone}`"
    :role="role"
    :aria-live="live"
  >
    <p class="game-status__eyebrow">
      <slot
        name="eyebrow"
        :tone="tone"
      />
    </p>
    <h2 class="game-status__title">
      {{ title }}
    </h2>
    <p
      v-if="message"
      class="game-status__message"
    >
      {{ message }}
    </p>

    <slot />
  </section>
</template>

<style scoped>
.game-status {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  width: 100%;
  text-align: center;
}

.game-status__eyebrow:empty {
  display: none;
}

.game-status__eyebrow {
  margin-bottom: var(--space-2);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.game-status__title {
  margin-bottom: 0;
}

.game-status__message {
  margin: 0 auto;
}

.game-status--info .game-status__eyebrow {
  color: var(--color-focus);
}

.game-status--info .game-status__title {
  color: var(--color-accent);
}

.game-status--warning {
  border-color: rgb(255 209 102 / 45%);
}

.game-status--warning .game-status__eyebrow {
  color: var(--color-focus);
}

.game-status--warning .game-status__title {
  color: var(--color-focus);
}

.game-status--error {
  border-color: rgb(224 108 82 / 55%);
}

.game-status--error .game-status__eyebrow {
  color: #e0705f;
}

.game-status--error .game-status__title {
  color: #e0705f;
}
</style>