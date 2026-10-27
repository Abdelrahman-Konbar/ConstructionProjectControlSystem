import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Response } from 'express'
import { CurrentUser } from '../common/decorators'
import type { AuthenticatedUser } from '../common/auth.types'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AcceptInvitationDto, DocumentDto, InvitationDto, ProgressUpdateDto, ProjectMembershipDto, SettingsDto, SubcontractDto, SubcontractorPatchDto, SubcontractProgressDto, TeamMemberDto } from './dto'
import { OperationsService } from './operations.service'
import { DocumentStorageService } from './document-storage.service'

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('operations')
@Controller()
export class OperationsController {
  constructor(private readonly service: OperationsService, private readonly storage: DocumentStorageService) {}
  @Get('subcontractors/:id') subcontractor(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.subcontractor(u, id) }
  @Patch('subcontractors/:id') updateSubcontractor(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: SubcontractorPatchDto) { return this.service.updateSubcontractor(u, id, d) }
  @Get('projects/:projectId/subcontracts') contracts(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) id: string) { return this.service.contracts(u, id) }
  @Post('projects/:projectId/subcontracts') createContract(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) id: string, @Body() d: SubcontractDto) { return this.service.createContract(u, id, d) }
  @Post('subcontracts/:id/progress') subcontractProgress(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: SubcontractProgressDto) { return this.service.subcontractProgress(u, id, d) }
  @Get('projects/:projectId/progress') progress(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) id: string) { return this.service.progress(u, id) }
  @Post('projects/:projectId/progress') createProgress(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) id: string, @Body() d: ProgressUpdateDto) { return this.service.createProgress(u, id, d) }
  @Get('progress/:id') progressDetail(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.progressDetail(u, id) }
  @Patch('progress/:id') updateProgress(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ProgressUpdateDto) { return this.service.updateProgress(u, id, d) }
  @Get('documents') documents(@CurrentUser() u: AuthenticatedUser, @Query('projectId') projectId?: string) { return this.service.documents(u, projectId) }
  @Get('documents/:id') document(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.document(u, id) }
  @Post('documents') createDocument(@CurrentUser() u: AuthenticatedUser, @Body() d: DocumentDto) { return this.service.createDocument(u, d) }
  @Post('documents/upload') @UseInterceptors(FileInterceptor('file')) async upload(@CurrentUser() u: AuthenticatedUser, @UploadedFile() file: any, @Body() d: { projectId?: string; entityType?: string; entityId?: string; name?: string }) { if (!file?.buffer || !file?.originalname || !file?.mimetype) throw new BadRequestException('A document file is required'); const stored = await this.storage.store(u.companyId, file.originalname, file.buffer); return this.service.createDocument(u, { projectId: d.projectId, entityType: d.entityType, entityId: d.entityId, name: d.name ?? file.originalname, originalName: file.originalname, mimeType: file.mimetype, size: stored.size, storageKey: stored.storageKey }) }
  @Post('documents/:id/versions/upload') @UseInterceptors(FileInterceptor('file')) async uploadVersion(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @UploadedFile() file: any) { if (!file?.buffer || !file?.originalname || !file?.mimetype) throw new BadRequestException('A document file is required'); const stored = await this.storage.store(u.companyId, file.originalname, file.buffer); return this.service.addDocumentVersion(u, id, { name: file.originalname, mimeType: file.mimetype, size: stored.size, storageKey: stored.storageKey }) }
  @Get('documents/:id/download') async download(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Res() response: Response) { const document = await this.service.document(u, id); const file = await this.storage.read(document.storageKey); response.setHeader('Content-Type', document.mimeType); response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName ?? document.name)}"`); response.send(file) }
  @Get('documents/:id/versions/:version/download') async downloadVersion(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Param('version') version: string, @Res() response: Response) { const document = await this.service.documentVersion(u, id, Number(version)); const file = await this.storage.read(document.storageKey); response.setHeader('Content-Type', document.mimeType); response.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.name)}"`); response.send(file) }
  @Get('notifications') notifications(@CurrentUser() u: AuthenticatedUser) { return this.service.notifications(u) }
  @Post('notifications/:id/read') read(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.markNotification(u, id) }
  @Post('notifications/read-all') readAll(@CurrentUser() u: AuthenticatedUser) { return this.service.markAllNotifications(u) }
  @Get('audit-events') auditEvents(@CurrentUser() u: AuthenticatedUser, @Query('entityType') entityType?: string) { return this.service.auditEvents(u, entityType) }
  @Get('team') team(@CurrentUser() u: AuthenticatedUser) { return this.service.team(u) }
  @Patch('team/:membershipId') updateTeam(@CurrentUser() u: AuthenticatedUser, @Param('membershipId', ParseUUIDPipe) id: string, @Body() d: TeamMemberDto) { return this.service.updateTeamMember(u, id, d) }
  @Post('team/:membershipId/activate') activateTeam(@CurrentUser() u: AuthenticatedUser, @Param('membershipId', ParseUUIDPipe) id: string) { return this.service.setMemberStatus(u, id, true) }
  @Post('team/:membershipId/deactivate') deactivateTeam(@CurrentUser() u: AuthenticatedUser, @Param('membershipId', ParseUUIDPipe) id: string) { return this.service.setMemberStatus(u, id, false) }
  @Post('projects/:projectId/members') assignProjectMember(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) id: string, @Body() d: ProjectMembershipDto) { return this.service.assignProjectMember(u, id, d) }
  @Delete('projects/:projectId/members/:userId') removeProjectMember(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) projectId: string, @Param('userId', ParseUUIDPipe) userId: string) { return this.service.removeProjectMember(u, projectId, userId) }
  @Get('invitations') invitations(@CurrentUser() u: AuthenticatedUser) { return this.service.invitations(u) }
  @Post('invitations') invite(@CurrentUser() u: AuthenticatedUser, @Body() d: InvitationDto) { return this.service.invite(u, d) }
  @Post('invitations/accept') acceptInvitation(@CurrentUser() u: AuthenticatedUser, @Body() d: AcceptInvitationDto) { return this.service.acceptInvitation(u, d) }
  @Get('settings/company') settings(@CurrentUser() u: AuthenticatedUser) { return this.service.settings(u) }
  @Patch('settings/company') updateSettings(@CurrentUser() u: AuthenticatedUser, @Body() d: SettingsDto) { return this.service.updateSettings(u, d) }
  @Get('reports/summary') report(@CurrentUser() u: AuthenticatedUser) { return this.service.report(u) }
}
