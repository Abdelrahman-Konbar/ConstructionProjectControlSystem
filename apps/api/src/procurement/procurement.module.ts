import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ProcurementController } from './procurement.controller'
import { ProcurementService } from './procurement.service'

@Module({ imports: [AuthModule], controllers: [ProcurementController], providers: [ProcurementService] })
export class ProcurementModule {}
