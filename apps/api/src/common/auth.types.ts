import type { SystemRole } from '@prisma/client'

export interface AuthenticatedUser { id: string; email: string; companyId: string; role: SystemRole }
export interface RequestWithUser extends Request { user: AuthenticatedUser }
