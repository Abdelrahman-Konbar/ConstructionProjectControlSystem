import { Module } from '@nestjs/common'
import { CoreController } from './core.controller'
import { CoreService } from './core.service'
import { AuthModule } from '../auth/auth.module'

@Module({ imports: [AuthModule], controllers: [CoreController], providers: [CoreService] })
export class CoreModule {}
