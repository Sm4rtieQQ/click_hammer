<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../types/game'
import ProjectTracker from './ProjectTracker.vue'

const props = defineProps<{
  projects: readonly Project[]
  activeProjectId: number | undefined
  completedProjectIds: readonly number[]
  projectProgress: Readonly<Record<number, number>>
}>()

const emit = defineEmits<{
  'project-complete': [projectId: number]
}>()

const visibleProjects = computed(() => {
  const completedProjects = props.projects.filter((project) =>
    props.completedProjectIds.includes(project.id),
  )
  const nextProject = props.projects.find(
    (project) => !props.completedProjectIds.includes(project.id),
  )

  return nextProject === undefined
    ? completedProjects
    : [...completedProjects, nextProject]
})

function isCompleted(projectId: number): boolean {
  return props.completedProjectIds.includes(projectId)
}
</script>

<template>
  <section
    class="project-list"
    aria-labelledby="project-list-title"
  >
    <p class="project-list__eyebrow">
      Grote doelen
    </p>
    <h2 id="project-list-title">
      Projecten
    </h2>

    <p
      v-if="visibleProjects.length === 0"
      class="project-list__empty"
      role="status"
    >
      Er zijn geen projecten beschikbaar. Je huidige voortgang blijft behouden.
    </p>

    <div
      v-else
      class="project-list__items"
    >
      <article
        v-for="project in visibleProjects"
        :key="project.id"
        class="project-list__item panel"
        :class="{
          'project-list__item--completed': isCompleted(project.id),
          'project-list__item--locked': project.id !== activeProjectId && !isCompleted(project.id),
        }"
      >
        <template v-if="isCompleted(project.id)">
          <div class="project-list__status">
            <span
              class="project-list__status-icon"
              aria-hidden="true"
            >✓</span>
            <div>
              <h3>{{ project.name }}</h3>
              <p>{{ project.description }}</p>
            </div>
          </div>
          <p class="project-list__meta">
            Voltooid · {{ project.coinReward }} munten ontvangen
          </p>
        </template>

        <ProjectTracker
          v-else-if="project.id === activeProjectId"
          :project="project"
          :progress="projectProgress[project.id] ?? 0"
          @project-complete="emit('project-complete', $event)"
        />

        <template v-else>
          <div class="project-list__status">
            <span
              class="project-list__status-icon"
              aria-hidden="true"
            >🔒</span>
            <div>
              <h3>{{ project.name }}</h3>
              <p>{{ project.description }}</p>
            </div>
          </div>
          <p class="project-list__meta">
            Ontgrendelt bij {{ project.unlockPoints }} punten
          </p>
        </template>
      </article>
    </div>
  </section>
</template>

<style scoped>
.project-list {
  width: 100%;
}

.project-list__eyebrow {
  margin-bottom: var(--space-1);
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.project-list h2 {
  margin-bottom: var(--space-4);
}

.project-list__empty {
  padding: var(--space-5) var(--space-4);
  border: 1px dashed rgb(255 255 255 / 18%);
  border-radius: var(--panel-radius);
  color: var(--color-text-muted);
  text-align: center;
}

.project-list__items {
  display: grid;
  gap: var(--space-3);
}

.project-list__item {
  padding: var(--space-4);
}

.project-list__item:hover:not(.project-list__item--locked) {
  border-color: rgb(255 209 102 / 35%);
}

.project-list__item--completed {
  border-color: rgb(255 209 102 / 30%);
}

.project-list__item--locked {
  opacity: 0.75;
}

.project-list__status {
  display: flex;
  align-items: start;
  gap: var(--space-3);
}

.project-list__status-icon {
  display: grid;
  flex: 0 0 2rem;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  color: var(--color-focus);
  background: rgb(255 209 102 / 10%);
  font-size: 1.1rem;
}

.project-list__item h3 {
  margin: 0;
  color: var(--color-text);
  font-family: var(--font-display);
  font-size: 1.2rem;
}

.project-list__item p {
  margin-top: var(--space-1);
  font-size: 0.9rem;
}

.project-list__meta {
  margin-top: var(--space-3);
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.project-list__item :deep(.project-tracker) {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}
</style>
