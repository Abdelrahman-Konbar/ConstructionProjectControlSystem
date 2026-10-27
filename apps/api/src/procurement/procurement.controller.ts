import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators'
import type { AuthenticatedUser } from '../common/auth.types'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { ProcurementService } from './procurement.service'
import { AwardDto, ExpenseDto, ReceiptDto, QuoteDto, QuotePatchDto, RfqDto, RfqPatchDto, SubcontractorDto } from './dto'

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('procurement')
@Controller()
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}
  @Get('projects/:projectId/rfqs') rfqs(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Query('search') search?: string) { return this.service.rfqs(u, p, search) }
  @Get('rfqs/:id') rfq(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.rfq(u, id) }
  @Post('projects/:projectId/rfqs') createRfq(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: RfqDto) { return this.service.createRfq(u, p, d) }
  @Patch('rfqs/:id') updateRfq(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: RfqPatchDto) { return this.service.updateRfq(u, id, d) }
  @Post('rfqs/:id/issue') issue(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.issueRfq(u, id) }
  @Post('rfqs/:id/suppliers/:supplierId') invite(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Param('supplierId', ParseUUIDPipe) supplierId: string) { return this.service.addSupplier(u, id, supplierId) }
  @Delete('rfqs/:id/suppliers/:supplierId') removeSupplier(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Param('supplierId', ParseUUIDPipe) supplierId: string) { return this.service.removeSupplier(u, id, supplierId) }
  @Get('rfqs/:rfqId/quotes') quotes(@CurrentUser() u: AuthenticatedUser, @Param('rfqId', ParseUUIDPipe) id: string) { return this.service.quotes(u, id) }
  @Get('quotes/:id') quote(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.quote(u, id) }
  @Post('rfqs/:rfqId/quotes') createQuote(@CurrentUser() u: AuthenticatedUser, @Param('rfqId', ParseUUIDPipe) id: string, @Body() d: QuoteDto) { return this.service.createQuote(u, id, d) }
  @Patch('quotes/:id') updateQuote(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: QuotePatchDto) { return this.service.updateQuote(u, id, d) }
  @Get('rfqs/:rfqId/comparison') comparison(@CurrentUser() u: AuthenticatedUser, @Param('rfqId', ParseUUIDPipe) id: string) { return this.service.comparison(u, id) }
  @Post('rfqs/:rfqId/award') award(@CurrentUser() u: AuthenticatedUser, @Param('rfqId', ParseUUIDPipe) id: string, @Body() d: AwardDto) { return this.service.award(u, id, d) }
  @Get('projects/:projectId/purchase-orders') purchaseOrders(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string) { return this.service.purchaseOrders(u, p) }
  @Get('purchase-orders/:id') purchaseOrder(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.purchaseOrder(u, id) }
  @Post('rfqs/:rfqId/purchase-order') createPo(@CurrentUser() u: AuthenticatedUser, @Param('rfqId', ParseUUIDPipe) id: string) { return this.service.createPurchaseOrder(u, id) }
  @Post('purchase-orders/:id/submit') submitPo(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.submitPurchaseOrder(u, id) }
  @Post('purchase-orders/:id/issue') issuePo(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.issuePurchaseOrder(u, id) }
  @Post('purchase-orders/:id/close') closePo(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.closePurchaseOrder(u, id) }
  @Get('projects/:projectId/goods-receipts') receipts(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string) { return this.service.receipts(u, p) }
  @Get('goods-receipts/:id') receipt(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.receipt(u, id) }
  @Post('purchase-orders/:poId/goods-receipts') createReceipt(@CurrentUser() u: AuthenticatedUser, @Param('poId', ParseUUIDPipe) id: string, @Body() d: ReceiptDto) { return this.service.createReceipt(u, id, d) }
  @Get('projects/:projectId/expenses') expenses(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string) { return this.service.expenses(u, p) }
  @Get('expenses/:id') expense(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.expense(u, id) }
  @Post('projects/:projectId/expenses') createExpense(@CurrentUser() u: AuthenticatedUser, @Param('projectId', ParseUUIDPipe) p: string, @Body() d: ExpenseDto) { return this.service.createExpense(u, p, d) }
  @Patch('expenses/:id') updateExpense(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string, @Body() d: ExpenseDto) { return this.service.updateExpense(u, id, d) }
  @Post('expenses/:id/submit') submitExpense(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.submitExpense(u, id) }
  @Post('expenses/:id/post') postExpense(@CurrentUser() u: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) { return this.service.postExpense(u, id) }
  @Get('subcontractors') subcontractors(@CurrentUser() u: AuthenticatedUser) { return this.service.subcontractors(u) }
  @Post('subcontractors') createSubcontractor(@CurrentUser() u: AuthenticatedUser, @Body() d: SubcontractorDto) { return this.service.createSubcontractor(u, d) }
}
