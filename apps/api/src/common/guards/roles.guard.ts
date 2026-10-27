import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { SystemRole } from '@prisma/client'
import type { RequestWithUser } from '../auth.types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<SystemRole[]>('roles', [context.getHandler(), context.getClass()])
    if (!roles?.length) return true
    const user = context.switchToHttp().getRequest<RequestWithUser>().user
    if (!roles.includes(user.role) && user.role !== 'ADMIN') throw new ForbiddenException('Insufficient role')
    return true
  }
}
