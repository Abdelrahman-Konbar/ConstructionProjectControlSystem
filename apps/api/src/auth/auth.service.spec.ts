import { describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  const config = { get: vi.fn((key: string) => key === 'JWT_SECRET' ? 'access-test-secret' : 'refresh-test-secret') }
  const audit = { record: vi.fn() }

  it('accepts a valid password and issues both tokens', async () => {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1', email: 'user@example.com', passwordHash: await bcrypt.hash('password123', 4), status: 'ACTIVE', memberships: [{ companyId: 'company-1', role: 'PROJECT_MANAGER' }] }),
        update: vi.fn(),
      },
      refreshSession: { create: vi.fn() },
    }
    const result = await new AuthService(prisma as never, config as never, audit as never).login('USER@example.com', 'password123')
    expect(result.accessToken).toEqual(expect.any(String))
    expect(result.refreshToken).toEqual(expect.any(String))
    expect(prisma.refreshSession.create).toHaveBeenCalledOnce()
  })

  it('rejects invalid credentials', async () => {
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } }
    await expect(new AuthService(prisma as never, config as never, audit as never).login('missing@example.com', 'bad-password')).rejects.toThrow('Invalid email or password')
  })
})
