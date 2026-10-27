import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ProjectsController, SitesController } from './projects.controller'
import { ProjectsService } from './projects.service'
import { SitesService } from './sites.service'

@Module({ imports: [AuthModule], controllers: [ProjectsController, SitesController], providers: [ProjectsService, SitesService], exports: [ProjectsService] })
export class ProjectsModule {}
