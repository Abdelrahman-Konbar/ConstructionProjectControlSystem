import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { CommonModule } from './common/common.module'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { ProjectsModule } from './projects/projects.module'
import { CoreModule } from './core/core.module'
import { ProcurementModule } from './procurement/procurement.module'
import { OperationsModule } from './operations/operations.module'
import { resolve } from 'node:path'

const envFilePaths = [resolve(process.cwd(), 'apps/api/.env'), resolve(process.cwd(), '.env'), resolve(__dirname, '../../.env'), resolve(__dirname, '../.env')]

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: envFilePaths }), PrismaModule, CommonModule, HealthModule, AuthModule, ProjectsModule, CoreModule, ProcurementModule, OperationsModule] })
export class AppModule {}
