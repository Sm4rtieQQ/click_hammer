import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import ProjectTracker from './ProjectTracker.vue'

const project = projects[0]

function mountTracker(progress: number) {
  return mount(ProjectTracker, {
    props: {
      project,
      progress,
    },
  })
}

describe('ProjectTracker', () => {
  it('renders an empty project at zero percent', () => {
    const wrapper = mountTracker(0)
    const progressBar = wrapper.get('[role="progressbar"]')

    expect(wrapper.get('h2').text()).toBe(project.name)
    expect(wrapper.find('.project-tracker__progress-row').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Resterende punten')
    expect(progressBar.attributes('aria-valuenow')).toBe('0')
    expect(progressBar.attributes('aria-valuemax')).toBe('10')
    expect(wrapper.get('.project-tracker__bar-fill').attributes('style')).toContain(
      'width: 0%',
    )
    expect(wrapper.get('.project-tracker__status').text()).toBe('In uitvoering')
    expect(wrapper.emitted('project-complete')).toBeUndefined()
  })

  it('renders partial progress without a remaining-points counter', () => {
    const wrapper = mountTracker(4)
    const progressBar = wrapper.get('[role="progressbar"]')

    expect(wrapper.find('.project-tracker__progress-row').exists()).toBe(false)
    expect(progressBar.attributes('aria-valuenow')).toBe('4')
    expect(progressBar.attributes('aria-valuetext')).toBe('4 van 10 punten')
    expect(wrapper.get('.project-tracker__bar-fill').attributes('style')).toContain(
      'width: 40%',
    )
    expect(wrapper.get('.project-tracker__percentage').text()).toBe('40% voltooid')
    expect(wrapper.emitted('project-complete')).toBeUndefined()
  })

  it('emits project-complete once when crossing the completion boundary', async () => {
    const wrapper = mountTracker(9)

    await wrapper.setProps({ progress: 10 })

    expect(wrapper.emitted('project-complete')).toEqual([[project.id]])
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('10')
    expect(wrapper.get('.project-tracker__bar-fill').attributes('style')).toContain(
      'width: 100%',
    )
    expect(wrapper.get('.project-tracker__status').text()).toBe('Voltooid')
  })

  it('does not emit repeatedly for repeated completed input', async () => {
    const wrapper = mountTracker(10)

    await wrapper.setProps({ progress: 10 })
    await wrapper.setProps({ progress: 10 })

    expect(wrapper.emitted('project-complete')).toEqual([[project.id]])
  })

  it('emits once for a new project that is already complete', async () => {
    const wrapper = mountTracker(10)
    const secondProject = projects[1]

    await wrapper.setProps({
      project: secondProject,
      progress: secondProject.requiredPoints,
    })

    expect(wrapper.emitted('project-complete')).toEqual([
      [project.id],
      [secondProject.id],
    ])
  })

  it('clamps invalid progress without emitting completion', async () => {
    const wrapper = mountTracker(Number.NaN)

    expect(wrapper.find('.project-tracker__progress-row').exists()).toBe(false)
    expect(wrapper.emitted('project-complete')).toBeUndefined()

    await wrapper.setProps({ progress: -5 })

    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('0')
    expect(wrapper.emitted('project-complete')).toBeUndefined()
  })
})
