import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { projects } from '../data/projects'
import ProjectList from './ProjectList.vue'
import ProjectTracker from './ProjectTracker.vue'

describe('ProjectList', () => {
  it('shows completed projects and only the next project', () => {
    const wrapper = mount(ProjectList, {
      props: {
        projects: [projects[0], projects[1], projects[2]],
        activeProjectId: undefined,
        completedProjectIds: [1],
        projectProgress: { 1: 10 },
      },
    })

    expect(wrapper.findAll('.project-list__item')).toHaveLength(2)
    expect(wrapper.text()).toContain('Herstel het aambeeld')
    expect(wrapper.text()).toContain('Bouw de smidse')
    expect(wrapper.text()).not.toContain('Bevrijd de vesting')
    expect(wrapper.get('.project-list__item--completed').text()).toContain('Voltooid')
    expect(wrapper.get('.project-list__item--locked').text()).toContain(
      'Ontgrendelt bij 1000 punten',
    )
  })

  it('renders the active project with its progress tracker', () => {
    const wrapper = mount(ProjectList, {
      props: {
        projects: [projects[0]],
        activeProjectId: 1,
        completedProjectIds: [],
        projectProgress: { 1: 4 },
      },
    })

    expect(wrapper.findComponent(ProjectTracker).exists()).toBe(true)
    expect(wrapper.getComponent(ProjectTracker).props('progress')).toBe(4)
  })

  it('forwards project completion events', async () => {
    const wrapper = mount(ProjectList, {
      props: {
        projects: [projects[0]],
        activeProjectId: 1,
        completedProjectIds: [],
        projectProgress: { 1: 9 },
      },
    })

    await wrapper.setProps({ projectProgress: { 1: 10 } })

    expect(wrapper.emitted('project-complete')).toEqual([[1]])
  })
})
