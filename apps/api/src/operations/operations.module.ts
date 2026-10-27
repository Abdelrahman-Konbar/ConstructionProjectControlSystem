import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { OperationsController } from './operations.controller'
import { OperationsService } from './operations.service'
import { DocumentStorageService } from './document-storage.service'

@Module({ imports: [AuthModule], controllers: [OperationsController], providers: [OperationsService, DocumentStorageService] })
export class OperationsModule {}
