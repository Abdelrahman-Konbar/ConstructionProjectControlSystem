import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../common/audit.service'
import type { AuthenticatedUser } from '../common/auth.types'
import type { SystemRole } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { createHash, randomUUID } from 'node:crypto'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly audit: AuditService) {}

  private secret(name: string) { const value = this.config.get<string>(name); if (!value) throw new Error(`Missing required auth secret: ${name}`); return value }
  private accessSecret() { return this.secret('JWT_SECRET') }
  private refreshSecret() { return this.secret('JWT_REFRESH_SECRET') }
  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { memberships: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 1 } } })
    if (!user || user.status !== 'ACTIVE' || !user.memberships[0] || !(await bcrypt.compare(password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password')
    const membership = user.memberships[0]
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    await this.audit.record({ companyId: membership.companyId, actorId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id })
    return this.issueTokens({ id: user.id, email: user.email, companyId: membership.companyId, role: membership.role })
  }

  private async issueTokens(user: AuthenticatedUser) {
    const accessToken = jwt.sign({ sub: user.id, email: user.email, companyId: user.companyId, role: user.role }, this.accessSecret(), { expiresIn: '15m' })
    const sessionId = randomUUID()
    const refreshToken = jwt.sign({ sub: user.id, sid: sessionId }, this.refreshSecret(), { expiresIn: '30d' })
    await this.prisma.refreshSession.create({ data: { id: sessionId, userId: user.id, tokenHash: this.hashToken(refreshToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } })
    return { accessToken, refreshToken, user }
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload
    try { payload = jwt.verify(refreshToken, this.refreshSecret()) as JwtPayload } catch { throw new UnauthorizedException('Invalid refresh token') }
    const session = await this.prisma.refreshSession.findFirst({ where: { id: String(payload.sid), userId: String(payload.sub), tokenHash: this.hashToken(refreshToken), revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: { include: { memberships: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 1 } } } } })
    const membership = session?.user.memberships[0]
    if (!session || !membership) throw new UnauthorizedException('Refresh session expired')
    await this.prisma.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } })
    return this.issueTokens({ id: session.user.id, email: session.user.email, companyId: membership.companyId, role: membership.role })
  }

  async logout(refreshToken: string | undefined, actor?: AuthenticatedUser) {
    if (refreshToken) await this.prisma.refreshSession.updateMany({ where: { tokenHash: this.hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } })
    if (actor) await this.audit.record({ companyId: actor.companyId, actorId: actor.id, action: 'LOGOUT', entityType: 'User', entityId: actor.id })
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    let payload: JwtPayload
    try { payload = jwt.verify(token, this.accessSecret()) as JwtPayload } catch { throw new UnauthorizedException('Invalid access token') }
    const user = await this.prisma.user.findUnique({ where: { id: String(payload.sub) }, include: { memberships: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'asc' }, take: 1 } } })
    const membership = user?.memberships[0]
    if (!user || user.status !== 'ACTIVE' || !membership || membership.companyId !== String(payload.companyId)) throw new UnauthorizedException('User session is no longer active')
    return { id: user.id, email: user.email, companyId: membership.companyId, role: membership.role }
  }

  async me(user: AuthenticatedUser) {
    const record = await this.prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, phone: true, jobTitle: true, status: true, memberships: { where: { status: 'ACTIVE' }, select: { companyId: true, role: true, company: { select: { id: true, name: true, slug: true, defaultCurrency: true, timezone: true } } } } } })
    if (!record) throw new UnauthorizedException('User not found')
    return record
  }
}
