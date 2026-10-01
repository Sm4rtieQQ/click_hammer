<script setup lang="ts">
const emit = defineEmits<{
  reset: []
}>()

function handleReset(): void {
  emit('reset')
}
</script>

<template>
  <aside
    class="test-controls panel"
    aria-label="Testbeheer"
  >
    <div class="test-controls__content">
      <p class="test-controls__label">
        Alleen zichtbaar tijdens development en tests
      </p>
      <p class="test-controls__description">
        Zet de volledige game terug naar de beginstate.
      </p>
    </div>
    <button
      class="test-controls__button"
      type="button"
      @click="handleReset"
    >
      Game resetten
    </button>
  </aside>
</template>

<style scoped>
.test-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border-style: dashed;
}

.test-controls__content {
  min-width: 0;
}

.test-controls__label {
  color: var(--color-focus);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.test-controls__description {
  margin-top: var(--space-1);
  font-size: 0.85rem;
}

.test-controls__button {
  flex: 0 0 auto;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-4);
  border: 1px solid rgb(255 209 102 / 45%);
  border-radius: 0.6rem;
  color: var(--color-focus);
  background: rgb(255 209 102 / 10%);
  cursor: pointer;
  font-weight: 800;
}

.test-controls__button:hover {
  background: rgb(255 209 102 / 18%);
}

@media (max-width: 36rem) {
  .test-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .test-controls__button {
    width: 100%;
  }
}
</style>
