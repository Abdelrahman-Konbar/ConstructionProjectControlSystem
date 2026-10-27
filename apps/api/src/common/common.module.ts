import { Global, Module } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuditService } from './audit.service'

@Global()
@Module({ providers: [AuditService, Reflector], exports: [AuditService, Reflector] })
export class CommonModule {}
