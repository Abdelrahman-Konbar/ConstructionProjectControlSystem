import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { AuthenticatedUser } from '../common/auth.types'
import { AuditService } from '../common/audit.service'
import { PrismaService } from '../prisma/prisma.service'
import { canManageCompany, canManageProject } from './authorization'
import type { CreateSiteDto, UpdateSiteDto } from './dto/site.dto'

@Injectable()
export class SitesService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}
  async list(user: AuthenticatedUser, projectId: string) { await this.project(user, projectId); return this.prisma.site.findMany({ where: { companyId: user.companyId, projectId }, orderBy: { name: 'asc' } }) }
  async create(user: AuthenticatedUser, projectId: string, dto: CreateSiteDto) { const project = await this.project(user, projectId); if (!canManageProject(user.role, (await this.prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId: user.id } } }))?.role)) throw new ForbiddenException('Site creation is not permitted'); const site = await this.prisma.site.create({ data: { companyId: project.companyId, projectId, code: dto.code, name: dto.name, location: dto.location, status: dto.status } }); await this.audit.record({ companyId: user.companyId, actorId: user.id, action: 'SITE_CREATED', entityType: 'Site', entityId: site.id }); return site }
  async update(user: AuthenticatedUser, siteId: string, dto: UpdateSiteDto) { const site = await this.prisma.site.findFirst({ where: { id: siteId, companyId: user.companyId } }); if (!site) throw new NotFoundException('Site not found'); await this.project(user, site.projectId); const member = await this.prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: site.projectId, userId: user.id } }, select: { role: true } }); if (!canManageCompany(user.role) && !canManageProject(user.role, member?.role)) throw new ForbiddenException('Site update is not permitted'); return this.prisma.site.update({ where: { id: siteId }, data: { code: dto.code, name: dto.name, location: dto.location, status: dto.status } }) }
  private async project(user: AuthenticatedUser, projectId: string) { const project = await this.prisma.project.findFirst({ where: { id: projectId, companyId: user.companyId, ...(canManageCompany(user.role) ? {} : { members: { some: { userId: user.id } } }) } }); if (!project) throw new NotFoundException('Project not found'); return project }
}
