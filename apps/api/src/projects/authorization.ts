import type { ProjectRole, SystemRole } from '@prisma/client'

export const companyWideRoles: SystemRole[] = ['OWNER_EXECUTIVE', 'ADMIN']
export const projectManageRoles: SystemRole[] = ['OWNER_EXECUTIVE', 'ADMIN', 'PROJECT_MANAGER']
export const canManageCompany = (role: SystemRole) => companyWideRoles.includes(role)
export const canManageProject = (role: SystemRole, projectRole?: ProjectRole) => projectManageRoles.includes(role) || projectRole === 'PROJECT_MANAGER'
