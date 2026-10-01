<script setup lang="ts">
import { computed } from 'vue'
import { formatScore } from '../utils/formatScore'

const props = defineProps<{
  points: number
  coins: number
}>()

const formattedScore = computed(() => formatScore(props.points))
</script>

<template>
  <header
    class="game-header"
    aria-label="ClickHammer spelstatus"
  >
    <div class="game-header__brand">
      <h1>
        ClickHammer
      </h1>
    </div>

    <dl
      class="game-header__stats"
      aria-label="Spelstatus"
    >
      <div class="game-header__stat">
        <dt>
          Score
        </dt>
        <dd>
          {{ formattedScore }}
        </dd>
      </div>

      <div class="game-header__stat">
        <dt>
          Munten
        </dt>
        <dd>
          {{ coins }}
        </dd>
      </div>
    </dl>
  </header>
</template>

<style scoped>
.game-header {
  position: relative;
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-5);
  width: 100%;
  margin-bottom: var(--space-6);
}

.game-header__brand {
  min-width: 0;
}

.game-header h1 {
  font-size: clamp(2rem, 6vw, 3.5rem);
}

.game-header__stats {
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  width: min(100%, 17rem);
  margin: 0;
}

.game-header__stat {
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: var(--panel-radius);
  background: var(--color-surface-raised);
  box-shadow: var(--panel-shadow);
}

.game-header dt {
  color: var(--color-text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.game-header dd {
  margin: var(--space-1) 0 0;
  overflow-wrap: anywhere;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 2.5vw, 1.4rem);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

@media (max-width: 48rem) {
  .game-header {
    align-items: start;
    flex-direction: row;
    min-height: 2.75rem;
    margin-bottom: var(--space-5);
  }

  .game-header h1 {
    max-width: 9rem;
    font-size: 1.4rem;
    line-height: 1.1;
  }

  .game-header__stats {
    position: absolute;
    top: 0;
    right: 0;
    gap: var(--space-1);
    width: 9.5rem;
  }

  .game-header__stat {
    padding: var(--space-1) var(--space-2);
    border-radius: 0.45rem;
    box-shadow: none;
  }

  .game-header dt {
    font-size: 0.55rem;
    letter-spacing: 0.04em;
  }

  .game-header dd {
    margin-top: 2px;
    font-size: 0.9rem;
  }
}

@media (min-width: 64rem) {
  .game-header {
    margin-bottom: var(--space-7);
  }
}
</style>
