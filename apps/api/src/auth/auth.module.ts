import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { CommonModule } from '../common/common.module'

@Module({ imports: [CommonModule], controllers: [AuthController], providers: [AuthService, JwtAuthGuard, RolesGuard], exports: [AuthService, JwtAuthGuard, RolesGuard] })
export class AuthModule {}
