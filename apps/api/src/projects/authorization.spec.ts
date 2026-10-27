import { describe, expect, it } from 'vitest'
import { canManageCompany, canManageProject } from './authorization'

describe('project authorization', () => {
  it('allows company owners and admins to manage company projects', () => {
    expect(canManageCompany('OWNER_EXECUTIVE')).toBe(true)
    expect(canManageCompany('ADMIN')).toBe(true)
    expect(canManageCompany('FINANCE')).toBe(false)
  })

  it('requires project membership for non-company-wide users', () => {
    expect(canManageProject('PROJECT_MANAGER', 'PROJECT_MANAGER')).toBe(true)
    expect(canManageProject('SITE_ENGINEER', 'SITE_ENGINEER')).toBe(false)
    expect(canManageProject('FINANCE')).toBe(false)
  })
})
