import type { Company, User } from '@/types/domain'

export const mockCompany: Company = { id: 'company-al-masar', name: 'Al Masar Contracting Co.' }
export const mockUser: User = {
  id: 'user-khalid', companyId: mockCompany.id, name: 'Eng. Khalid Al-Otaibi', email: 'k.otaibi@almasar.sa',
  roles: ['OWNER_EXECUTIVE', 'PROJECT_MANAGER'], permissions: ['projects.read', 'approvals.read'],
}
