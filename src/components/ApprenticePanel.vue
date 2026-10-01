<script setup lang="ts">
defineProps<{
  autoClickerRate: number
  clickPower: number
}>()
</script>

<template>
  <section
    class="apprentice-panel panel"
    aria-labelledby="apprentice-panel-title"
  >
    <div class="apprentice-panel__heading">
      <p class="apprentice-panel__eyebrow">
        Automatisch klikken
      </p>
      <h2 id="apprentice-panel-title">
        Leerling
      </h2>
    </div>

    <p class="apprentice-panel__description">
      Je leerling klikt automatisch voor je. Elke seconde voegt hij
      <strong>{{ autoClickerRate.toFixed(1) }}</strong> punten toe —
      10% van je huidige clickkracht ({{ clickPower.toFixed(1) }}).
    </p>

    <div class="apprentice-panel__stats">
      <div class="apprentice-panel__stat">
        <span class="apprentice-panel__stat-value">
          {{ autoClickerRate.toFixed(1) }}
        </span>
        <span class="apprentice-panel__stat-label">
          punten per seconde
        </span>
      </div>
      <div class="apprentice-panel__stat">
        <span class="apprentice-panel__stat-value">
          {{ (autoClickerRate * 60).toFixed(0) }}
        </span>
        <span class="apprentice-panel__stat-label">
          punten per minuut
        </span>
      </div>
    </div>

    <p class="apprentice-panel__note">
      De leerling werkt ongeacht welke tab je bekijkt. Hij voedt hetzelfde
      doel als een normale klik: de actieve order, of het actieve project.
    </p>
  </section>
</template>

<style scoped>
.apprentice-panel {
  display: grid;
  gap: var(--space-4);
  width: 100%;
  padding: var(--space-5);
}

.apprentice-panel__heading {
  display: grid;
  gap: var(--space-1);
}

.apprentice-panel__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.apprentice-panel__heading h2 {
  margin: 0;
}

.apprentice-panel__description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.apprentice-panel__description strong {
  color: var(--color-focus);
  font-variant-numeric: tabular-nums;
}

.apprentice-panel__stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.apprentice-panel__stat {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border: 1px solid rgb(255 209 102 / 20%);
  border-radius: 0.6rem;
  background: rgb(255 209 102 / 5%);
}

.apprentice-panel__stat-value {
  color: var(--color-focus);
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-variant-numeric: tabular-nums;
}

.apprentice-panel__stat-label {
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.apprentice-panel__note {
  margin: 0;
  padding: var(--space-3);
  border-left: 3px solid var(--color-accent);
  color: var(--color-text-muted);
  background: rgb(255 255 255 / 4%);
  font-size: 0.85rem;
  line-height: 1.5;
}
</style>
