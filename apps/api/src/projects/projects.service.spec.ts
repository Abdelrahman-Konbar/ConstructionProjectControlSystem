import { describe, expect, it, vi } from 'vitest'
import { ProjectsService } from './projects.service'

describe('ProjectsService tenancy', () => {
  it('always scopes project lookup to the authenticated company', async () => {
    const prisma = { project: { findFirst: vi.fn().mockResolvedValue(null) } }
    const service = new ProjectsService(prisma as never, {} as never)
    await expect(service.findAccessible({ id: 'user-1', email: 'user@example.com', companyId: 'company-a', role: 'PROJECT_MANAGER' }, 'project-1')).rejects.toThrow('Project not found')
    expect(prisma.project.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'project-1', companyId: 'company-a' }) }))
  })
})
