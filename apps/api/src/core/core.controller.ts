import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators'
import type { AuthenticatedUser } from '../common/auth.types'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CoreService } from './core.service'
import { BoqItemDto, BudgetDto, CostCodeDto, DecisionDto, ListDto, MaterialRequestDto, SupplierDto } from './dto'

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('core')
@Controller()
export class CoreController {
  constructor(private readonly core: CoreService) {}
  @Get('dashboard/summary') dashboard(@CurrentUser() u: AuthenticatedUser) { return this.core.dashboard(u) }
  @Get('projects/:projectId/boq') boq(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Query() q: ListDto) { return this.core.boq(u, p, q) }
  @Post('projects/:projectId/boq/items') createBoq(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: BoqItemDto) { return this.core.createBoq(u, p, d) }
  @Patch('boq/items/:id') updateBoq(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: BoqItemDto) { return this.core.updateBoq(u, id, d) }
  @Get('projects/:projectId/cost-codes') costCodes(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Query() q: ListDto) { return this.core.costCodes(u, p, q) }
  @Post('projects/:projectId/cost-codes') createCode(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: CostCodeDto) { return this.core.createCostCode(u, p, d) }
  @Patch('cost-codes/:id') updateCode(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: CostCodeDto) { return this.core.updateCostCode(u, id, d) }
  @Get('projects/:projectId/budget') budget(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string) { return this.core.budget(u, p) }
  @Get('projects/:projectId/cost-control') cost(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string) { return this.core.budget(u, p) }
  @Post('projects/:projectId/budget') createBudget(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: BudgetDto) { return this.core.createBudget(u, p, d) }
  @Post('projects/:projectId/budget/revisions') reviseBudget(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: BudgetDto) { return this.core.reviseBudget(u, p, d) }
  @Get('suppliers') suppliers(@CurrentUser() u: AuthenticatedUser, @Query() q: ListDto) { return this.core.suppliers(u, q) }
  @Get('suppliers/:id') supplier(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.core.supplier(u, id) }
  @Post('suppliers') createSupplier(@CurrentUser() u: AuthenticatedUser, @Body() d: SupplierDto) { return this.core.createSupplier(u, d) }
  @Patch('suppliers/:id') updateSupplier(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: SupplierDto) { return this.core.updateSupplier(u, id, d) }
  @Get('projects/:projectId/material-requests') requests(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Query() q: ListDto) { return this.core.materialRequests(u, p, q) }
  @Get('material-requests/:id') request(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.core.materialRequest(u, id) }
  @Post('projects/:projectId/material-requests') createRequest(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: MaterialRequestDto) { return this.core.createMaterialRequest(u, p, d) }
  @Patch('material-requests/:id') updateRequest(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: MaterialRequestDto) { return this.core.updateMaterialRequest(u, id, d) }
  @Post('material-requests/:id/submit') submitRequest(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.core.submitMaterialRequest(u, id) }
  @Get('approvals') approvals(@CurrentUser() u: AuthenticatedUser, @Query() q: ListDto) { return this.core.approvals(u, q) }
  @Get('approvals/:id') approval(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.core.approval(u, id) }
  @Post('approvals/:id/approve') approve(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: DecisionDto) { return this.core.decision(u, id, { ...d, decision: 'APPROVE' } as DecisionDto) }
  @Post('approvals/:id/reject') reject(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: DecisionDto) { return this.core.decision(u, id, { ...d, decision: 'REJECT' } as DecisionDto) }
}
