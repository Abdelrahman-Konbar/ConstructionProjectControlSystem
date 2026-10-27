import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser, Roles } from '../common/decorators'
import type { AuthenticatedUser } from '../common/auth.types'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ProjectsService } from './projects.service'
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto'
import { ListProjectsDto } from './dto/list-projects.dto'
import { CreateSiteDto, UpdateSiteDto } from './dto/site.dto'
import { SitesService } from './sites.service'

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService, private readonly sites: SitesService) {}
  @Get() list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListProjectsDto) { return this.projects.list(user, query) }
  @Get(':id') get(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.projects.get(user, id) }
  @Post() @Roles('OWNER_EXECUTIVE', 'PROJECT_MANAGER') create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) { return this.projects.create(user, dto) }
  @Patch(':id') update(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto) { return this.projects.update(user, id, dto) }
  @Get(':projectId/sites') listSites(@CurrentUser() user: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) projectId: string) { return this.sites.list(user, projectId) }
  @Post(':projectId/sites') @Roles('OWNER_EXECUTIVE', 'PROJECT_MANAGER') createSite(@CurrentUser() user: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) projectId: string, @Body() dto: CreateSiteDto) { return this.sites.create(user, projectId, dto) }
}

@ApiTags('sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}
  @Patch(':siteId') update(@CurrentUser() user: AuthenticatedUser, @Param('siteId', ParseUUIDPipe) siteId: string, @Body() dto: UpdateSiteDto) { return this.sites.update(user, siteId, dto) }
}
