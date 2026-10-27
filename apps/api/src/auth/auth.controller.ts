import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshDto } from './dto/refresh.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators'
import type { AuthenticatedUser } from '../common/auth.types'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password) }
  @Post('refresh') refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken) }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout') async logout(@Req() request: Request, @CurrentUser() user: AuthenticatedUser) { await this.auth.logout(this.bearerOrBody(request), user); return { success: true } }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me') me(@CurrentUser() user: AuthenticatedUser) { return this.auth.me(user) }
  private bearerOrBody(request: Request) { return typeof request.body?.refreshToken === 'string' ? request.body.refreshToken : undefined }
}
