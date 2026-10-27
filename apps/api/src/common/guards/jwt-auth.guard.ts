import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { AuthService } from '../../auth/auth.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>()
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Authentication required')
    request.user = await this.authService.verifyAccessToken(header.slice(7))
    return true
  }
}
