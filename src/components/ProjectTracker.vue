<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Project } from '../types/game'

const props = defineProps<{
  project: Project
  progress: number
}>()

const emit = defineEmits<{
  'project-complete': [projectId: number]
}>()

const safeProgress = computed(() => {
  if (!Number.isFinite(props.progress)) {
    return 0
  }

  return Math.min(
    props.project.requiredPoints,
    Math.max(0, props.progress),
  )
})
const remainingPoints = computed(() =>
  Math.max(0, props.project.requiredPoints - safeProgress.value),
)
const progressPercentage = computed(() => {
  if (props.project.requiredPoints <= 0) {
    return 0
  }

  return (safeProgress.value / props.project.requiredPoints) * 100
})
const isComplete = computed(
  () => props.project.requiredPoints > 0 && remainingPoints.value === 0,
)
const progressLabel = computed(
  () => `${Math.round(progressPercentage.value)}% voltooid`,
)

let lastCompletedProjectId: number | null = null

watch(
  () => ({
    projectId: props.project.id,
    isComplete: isComplete.value,
  }),
  ({ projectId, isComplete: complete }) => {
    if (complete && lastCompletedProjectId !== projectId) {
      lastCompletedProjectId = projectId
      emit('project-complete', projectId)
    } else if (!complete && lastCompletedProjectId === projectId) {
      lastCompletedProjectId = null
    }
  },
  { immediate: true, flush: 'sync' },
)
</script>

<template>
  <section
    class="project-tracker panel"
    aria-labelledby="project-tracker-title"
  >
    <div class="project-tracker__heading">
      <div>
        <p class="project-tracker__eyebrow">
          Actief project
        </p>
        <h2 id="project-tracker-title">
          {{ project.name }}
        </h2>
      </div>
      <span
        class="project-tracker__status"
        :class="{ 'project-tracker__status--complete': isComplete }"
      >
        {{ isComplete ? 'Voltooid' : 'In uitvoering' }}
      </span>
    </div>

    <p class="project-tracker__description">
      {{ project.description }}
    </p>

    <div
      class="project-tracker__bar"
      role="progressbar"
      aria-label="Projectvoortgang"
      aria-valuemin="0"
      :aria-valuemax="project.requiredPoints"
      :aria-valuenow="safeProgress"
      :aria-valuetext="`${safeProgress} van ${project.requiredPoints} punten`"
    >
      <div
        class="project-tracker__bar-fill"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>
    <p class="project-tracker__percentage">
      {{ progressLabel }}
    </p>
  </section>
</template>

<style scoped>
.project-tracker {
  width: 100%;
}

.project-tracker__heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: var(--space-4);
}

.project-tracker__eyebrow {
  margin-bottom: var(--space-1);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.project-tracker h2 {
  margin-bottom: 0;
  font-size: clamp(1.35rem, 3vw, 1.85rem);
}

.project-tracker__status {
  flex: 0 0 auto;
  padding: var(--space-1) var(--space-3);
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.project-tracker__status--complete {
  border-color: rgb(255 209 102 / 45%);
  color: var(--color-focus);
  background: rgb(255 209 102 / 10%);
}

.project-tracker__description {
  margin-top: var(--space-4);
}

.project-tracker__bar {
  height: 0.85rem;
  margin-top: var(--space-5);
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 14%);
  border-radius: 999px;
  background: var(--color-background);
}

.project-tracker__bar-fill {
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--color-accent), var(--color-focus));
  transition: width var(--transition-medium);
}

.project-tracker__percentage {
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  text-align: right;
}

@media (max-width: 36rem) {
  .project-tracker__heading {
    align-items: stretch;
    flex-direction: column;
  }

  .project-tracker__status {
    align-self: flex-start;
  }
}
</style>
