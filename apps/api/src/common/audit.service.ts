import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}
  record(input: { companyId: string; actorId?: string; action: string; entityType: string; entityId?: string; metadata?: Record<string, unknown> }) {
    return this.prisma.auditEvent.create({ data: { ...input, metadata: input.metadata as Prisma.InputJsonValue | undefined } })
  }
}
