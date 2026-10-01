import { describe, expect, it } from 'vitest'
import { projects } from './projects'

describe('projects', () => {
  it('contains the planned projects in order', () => {
    expect(projects.map(({ id }) => id)).toEqual([1, 2, 3])
    expect(projects.map(({ name }) => name)).toEqual([
      'Herstel het aambeeld',
      'Bouw de smederij',
      'Bevrijd de vesting',
    ])
  })

  it('has unique numeric IDs and valid progression values', () => {
    const projectIds = projects.map(({ id }) => id)

    expect(new Set(projectIds).size).toBe(projects.length)
    expect(projectIds.every((id) => Number.isInteger(id))).toBe(true)

    for (const project of projects) {
      expect(project.name).toMatch(/^[A-Z]/)
      expect(project.name).toBe(project.name.trim())
      expect(project.name.slice(1)).toBe(project.name.slice(1).toLowerCase())
      expect(project.description).toMatch(/^[A-Z]/)
      expect(project.description.length).toBeGreaterThan(0)
      expect(Number.isFinite(project.requiredPoints)).toBe(true)
      expect(Number.isFinite(project.coinReward)).toBe(true)
      expect(Number.isFinite(project.unlockPoints)).toBe(true)
      expect(project.requiredPoints).toBeGreaterThan(0)
      expect(project.coinReward).toBeGreaterThanOrEqual(0)
      expect(project.unlockPoints).toBeGreaterThanOrEqual(0)
    }
  })
})
