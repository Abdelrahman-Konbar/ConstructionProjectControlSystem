import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, ProjectStatus, SystemRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../common/audit.service'
import type { AuthenticatedUser } from '../common/auth.types'
import { canManageCompany, canManageProject } from './authorization'
import type { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'
import type { ListProjectsDto } from './dto/list-projects.dto'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  private decimal(value?: number) { return value === undefined ? undefined : new Prisma.Decimal(value) }
  private serialize(project: any) { return { ...project, contractValue: project.contractValue?.toString() ?? null, budgetValue: project.budgetValue?.toString() ?? null, progressPercent: project.progressPercent?.toString() ?? '0' } }
  private async membership(user: AuthenticatedUser) { return this.prisma.companyMembership.findUnique({ where: { companyId_userId: { companyId: user.companyId, userId: user.id } } }) }

  async list(user: AuthenticatedUser, query: ListProjectsDto) {
    const membership = await this.membership(user)
    if (!membership || membership.status !== 'ACTIVE') throw new ForbiddenException('Company membership required')
    const projectAccess = canManageCompany(membership.role) ? {} : { members: { some: { userId: user.id } } }
    const where: Prisma.ProjectWhereInput = { companyId: user.companyId, ...projectAccess, ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ code: { contains: query.search, mode: 'insensitive' } }, { name: { contains: query.search, mode: 'insensitive' } }] } : {}) }
    const [items, total] = await this.prisma.$transaction([this.prisma.project.findMany({ where, include: { projectManager: { select: { id: true, name: true, jobTitle: true } }, sites: true }, orderBy: { updatedAt: 'desc' }, skip: (query.page - 1) * query.limit, take: query.limit }), this.prisma.project.count({ where })])
    return { items: items.map((item) => this.serialize(item)), page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) }
  }

  async get(user: AuthenticatedUser, id: string) { const project = await this.findAccessible(user, id); return this.serialize(project) }

  async create(user: AuthenticatedUser, dto: CreateProjectDto) {
    const membership = await this.membership(user)
    if (!membership || !canManageProject(membership.role, undefined)) throw new ForbiddenException('Project creation is not permitted')
    if (dto.projectManagerId) await this.requireCompanyUser(user.companyId, dto.projectManagerId)
    try {
      const project = await this.prisma.project.create({ data: { companyId: user.companyId, code: dto.code, name: dto.name, clientName: dto.clientName, location: dto.location, status: dto.status, contractValue: this.decimal(dto.contractValue), budgetValue: this.decimal(dto.budgetValue), startDate: dto.startDate ? new Date(dto.startDate) : undefined, plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined, projectManagerId: dto.projectManagerId, progressPercent: this.decimal(dto.progressPercent) ?? new Prisma.Decimal(0), description: dto.description, members: { create: [{ userId: user.id, role: 'PROJECT_MANAGER' }] } }, include: { projectManager: { select: { id: true, name: true, jobTitle: true } }, sites: true } })
      await this.audit.record({ companyId: user.companyId, actorId: user.id, action: 'PROJECT_CREATED', entityType: 'Project', entityId: project.id, metadata: { code: project.code } })
      return this.serialize(project)
    } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Project code already exists in this company'); throw error }
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateProjectDto) {
    const project = await this.findAccessible(user, id)
    const member = await this.prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: id, userId: user.id } } })
    if (!canManageProject(user.role, member?.role)) throw new ForbiddenException('Project update is not permitted')
    if (dto.projectManagerId) await this.requireCompanyUser(user.companyId, dto.projectManagerId)
    try {
      const updated = await this.prisma.project.update({ where: { id: project.id }, data: { code: dto.code, name: dto.name, clientName: dto.clientName, location: dto.location, status: dto.status, contractValue: this.decimal(dto.contractValue), budgetValue: this.decimal(dto.budgetValue), startDate: dto.startDate ? new Date(dto.startDate) : undefined, plannedEndDate: dto.plannedEndDate ? new Date(dto.plannedEndDate) : undefined, projectManagerId: dto.projectManagerId, progressPercent: this.decimal(dto.progressPercent), description: dto.description }, include: { projectManager: { select: { id: true, name: true, jobTitle: true } }, sites: true } })
      await this.audit.record({ companyId: user.companyId, actorId: user.id, action: 'PROJECT_UPDATED', entityType: 'Project', entityId: updated.id })
      return this.serialize(updated)
    } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Project code already exists in this company'); throw error }
  }

  async findAccessible(user: AuthenticatedUser, id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, companyId: user.companyId, ...(canManageCompany(user.role) ? {} : { members: { some: { userId: user.id } } }) }, include: { projectManager: { select: { id: true, name: true, jobTitle: true } }, sites: true, members: { include: { user: { select: { id: true, name: true, jobTitle: true } } } } } })
    if (!project) throw new NotFoundException('Project not found')
    return project
  }

  private async requireCompanyUser(companyId: string, userId: string) { const membership = await this.prisma.companyMembership.findUnique({ where: { companyId_userId: { companyId, userId } } }); if (!membership || membership.status !== 'ACTIVE') throw new ForbiddenException('Project manager must belong to the company') }
}
