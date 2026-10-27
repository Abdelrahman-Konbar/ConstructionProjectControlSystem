import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common'
import type { AuthenticatedUser } from './auth.types'
import type { SystemRole } from '@prisma/client'

export const Roles = (...roles: SystemRole[]) => SetMetadata('roles', roles)
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => ctx.switchToHttp().getRequest().user)
