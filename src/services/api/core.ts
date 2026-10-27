import { apiRequest, tokenStore } from './client'
import { API_BASE_URL } from './config'

export interface BoqItem { id: string; code: string; description: string; unit: string; contractQuantity: string; contractRate: string; contractValue: string; progressPercent: string }
export interface CostCode { id: string; code: string; name: string; category?: string; status: string }
export interface BudgetLine { id: string; costCodeId: string; original: string; revised: string; committed: string; actual: string; forecast: string }
export interface BudgetResponse { budget: { id: string; name: string } | null; lines: BudgetLine[]; summary: { original: number; revised: number; committed: number; actual: number; forecast: number; variance: number } }
export interface Supplier { id: string; code: string; name: string; category?: string; city?: string; rating?: string; status: string }
export interface MaterialRequestItem { id: string; description: string; unit: string; requestedQuantity: string }
export interface MaterialRequest { id: string; requestNumber: string; projectId: string; status: string; priority: string; purpose?: string; requestedForDate?: string; items: MaterialRequestItem[] }
export interface Approval { id: string; entityType: string; entityId: string; projectId?: string; status: string; createdAt: string }
export interface Rfq { id: string; rfqNumber: string; title: string; projectId: string; status: string; closingDate?: string }
export interface Quote { id: string; quoteNumber: string; supplierId: string; rfqId: string; totalAmount: string; status: string; deliveryDays?: number }
export interface PurchaseOrder { id: string; poNumber: string; supplierId: string; projectId: string; status: string; currency: string; subtotal: string; taxAmount: string; totalAmount: string }
export interface Expense { id: string; projectId: string; expenseNumber: string; description: string; amount: string; category: string; status: string; expenseDate: string }
export interface DashboardHistoryPoint { period: string; planned: number; actual: number }
export interface DashboardSummary { rfqCount: number; openRfqCount: number; poCount: number; pendingReceipts: number; postedExpenses: number; pendingExpenseApprovals: number; materialRequests: number; pendingApprovals: number; budgetTotal: number; committed: number; actual: number; history: DashboardHistoryPoint[] }
export interface Subcontractor { id: string; code: string; name: string; contactPerson?: string; email?: string; phone?: string; specialties?: string; status: string }
export interface ProgressUpdate { id: string; projectId: string; boqItemId?: string; measuredQuantity?: string; progressPercent: string; measuredDate: string; notes?: string }
export interface DocumentRecord { id: string; projectId?: string; name: string; originalName?: string; mimeType: string; size?: number; entityType?: string; entityId?: string; version: number; createdAt: string }
export interface Notification { id: string; type: string; title: string; message: string; entityType?: string; entityId?: string; readAt?: string; createdAt: string }
export interface ReportSummary { projects: Array<{ id: string; code: string; name: string; status: string; progressPercent: string; contractValue?: string }>; budget: { revised: number; committed: number; actual: number }; purchaseOrders: unknown[]; expenses: unknown[]; approvals: unknown[]; rfqs: unknown[] }

export const listBoq = (projectId: string, search?: string) => apiRequest<{ version: unknown; items: BoqItem[] }>(`/projects/${projectId}/boq`, { query: { search } })
export const createBoqItem = (projectId: string, body: Record<string, unknown>) => apiRequest<BoqItem>(`/projects/${projectId}/boq/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const updateBoqItem = (id: string, body: Record<string, unknown>) => apiRequest<BoqItem>(`/boq/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const listCostCodes = (projectId: string, search?: string) => apiRequest<CostCode[]>(`/projects/${projectId}/cost-codes`, { query: { search } })
export const getBudget = (projectId: string) => apiRequest<BudgetResponse>(`/projects/${projectId}/cost-control`)
export const listSuppliers = (search?: string) => apiRequest<{ items: Supplier[]; total: number }>('/suppliers', { query: { search } })
export const getSupplier = (id: string) => apiRequest<Supplier>(`/suppliers/${id}`)
export const createSupplier = (body: Record<string, unknown>) => apiRequest<Supplier>('/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const updateSupplier = (id: string, body: Record<string, unknown>) => apiRequest<Supplier>(`/suppliers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const listMaterialRequests = (projectId: string, params: Record<string, string | undefined> = {}) => apiRequest<MaterialRequest[]>(`/projects/${projectId}/material-requests`, { query: params })
export const getMaterialRequest = (id: string) => apiRequest<MaterialRequest>(`/material-requests/${id}`)
export const createMaterialRequest = (projectId: string, body: Record<string, unknown>) => apiRequest<MaterialRequest>(`/projects/${projectId}/material-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const updateMaterialRequest = (id: string, body: Record<string, unknown>) => apiRequest<MaterialRequest>(`/material-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const submitMaterialRequest = (id: string) => apiRequest<MaterialRequest>(`/material-requests/${id}/submit`, { method: 'POST' })
export const listApprovals = () => apiRequest<Approval[]>('/approvals')
export const decideApproval = (id: string, decision: 'approve' | 'reject') => apiRequest(`/approvals/${id}/${decision}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
export const approveApproval = (id: string, comment?: string) => apiRequest(`/approvals/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment }) })
export const rejectApproval = (id: string, comment?: string) => apiRequest(`/approvals/${id}/reject`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment }) })
export const listRfqs = (projectId: string, search?: string) => apiRequest<Rfq[]>(`/projects/${projectId}/rfqs`, { query: { search } })
export const createRfq = (projectId: string, body: Record<string, unknown>) => apiRequest<Rfq>(`/projects/${projectId}/rfqs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const getRfq = (id: string) => apiRequest<Rfq & { items: unknown[]; invitations: unknown[]; quotes: Quote[] }>(`/rfqs/${id}`)
export const issueRfq = (id: string) => apiRequest<Rfq>(`/rfqs/${id}/issue`, { method: 'POST' })
export const inviteRfqSupplier = (rfqId: string, supplierId: string) => apiRequest(`/rfqs/${rfqId}/suppliers/${supplierId}`, { method: 'POST' })
export const removeRfqSupplier = (rfqId: string, supplierId: string) => apiRequest(`/rfqs/${rfqId}/suppliers/${supplierId}`, { method: 'DELETE' })
export const listQuotes = (rfqId: string) => apiRequest<Quote[]>(`/rfqs/${rfqId}/quotes`)
export const getComparison = (rfqId: string) => apiRequest<{ rfq: Rfq & { invitations: any[] }; items: any[]; quotes: Quote[]; quoteItems: any[] }>(`/rfqs/${rfqId}/comparison`)
export const createQuote = (rfqId: string, body: Record<string, unknown>) => apiRequest<Quote>(`/rfqs/${rfqId}/quotes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const awardRfq = (rfqId: string, quoteId: string) => apiRequest(`/rfqs/${rfqId}/award`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quoteId }) })
export const listPurchaseOrders = (projectId: string) => apiRequest<PurchaseOrder[]>(`/projects/${projectId}/purchase-orders`)
export const getPurchaseOrder = (id: string) => apiRequest<PurchaseOrder & { items: unknown[] }>(`/purchase-orders/${id}`)
export const createPurchaseOrder = (rfqId: string) => apiRequest<PurchaseOrder>(`/rfqs/${rfqId}/purchase-order`, { method: 'POST' })
export const submitPurchaseOrder = (id: string) => apiRequest<PurchaseOrder>(`/purchase-orders/${id}/submit`, { method: 'POST' })
export const issuePurchaseOrder = (id: string) => apiRequest<PurchaseOrder>(`/purchase-orders/${id}/issue`, { method: 'POST' })
export const closePurchaseOrder = (id: string) => apiRequest<PurchaseOrder>(`/purchase-orders/${id}/close`, { method: 'POST' })
export const listReceipts = (projectId: string) => apiRequest<unknown[]>(`/projects/${projectId}/goods-receipts`)
export const getReceipt = (id: string) => apiRequest<any>(`/goods-receipts/${id}`)
export const createReceipt = (poId: string, body: Record<string, unknown>) => apiRequest<any>(`/purchase-orders/${poId}/goods-receipts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const listExpenses = (projectId: string) => apiRequest<Expense[]>(`/projects/${projectId}/expenses`)
export const getExpense = (id: string) => apiRequest<Expense>(`/expenses/${id}`)
export const createExpense = (projectId: string, body: Record<string, unknown>) => apiRequest<Expense>(`/projects/${projectId}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const updateExpense = (id: string, body: Record<string, unknown>) => apiRequest<Expense>(`/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const submitExpense = (id: string) => apiRequest<Expense>(`/expenses/${id}/submit`, { method: 'POST' })
export const postExpense = (id: string) => apiRequest<Expense>(`/expenses/${id}/post`, { method: 'POST' })
export const getDashboardSummary = () => apiRequest<DashboardSummary>('/dashboard/summary')
export const listSubcontractors = () => apiRequest<Subcontractor[]>('/subcontractors')
export const createSubcontractor = (body: Record<string, unknown>) => apiRequest<Subcontractor>('/subcontractors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const getSubcontractor = (id: string) => apiRequest<Subcontractor>(`/subcontractors/${id}`)
export const updateSubcontractor = (id: string, body: Record<string, unknown>) => apiRequest<Subcontractor>(`/subcontractors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const listSubcontracts = (projectId: string) => apiRequest<any[]>(`/projects/${projectId}/subcontracts`)
export const createSubcontract = (projectId: string, body: Record<string, unknown>) => apiRequest<any>(`/projects/${projectId}/subcontracts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const createSubcontractProgress = (id: string, body: Record<string, unknown>) => apiRequest<any>(`/subcontracts/${id}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const listProgress = (projectId: string) => apiRequest<ProgressUpdate[]>(`/projects/${projectId}/progress`)
export const createProgress = (projectId: string, body: Record<string, unknown>) => apiRequest<ProgressUpdate>(`/projects/${projectId}/progress`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const getProgress = (id: string) => apiRequest<ProgressUpdate>(`/progress/${id}`)
export const updateProgress = (id: string, body: Record<string, unknown>) => apiRequest<ProgressUpdate>(`/progress/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const listDocuments = (projectId?: string) => apiRequest<DocumentRecord[]>('/documents', { query: { projectId } })
export const createDocument = (body: Record<string, unknown>) => apiRequest<DocumentRecord>('/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const getDocument = (id: string) => apiRequest<DocumentRecord & { versions: DocumentRecord[] }>(`/documents/${id}`)
export async function uploadDocument(file: File, body: { projectId?: string; entityType?: string; entityId?: string; name?: string } = {}) { const form = new FormData(); form.append('file', file); Object.entries(body).forEach(([key, value]) => { if (value) form.append(key, value) }); return apiRequest<DocumentRecord>('/documents/upload', { method: 'POST', body: form }) }
export async function uploadDocumentVersion(id: string, file: File) { const form = new FormData(); form.append('file', file); return apiRequest<DocumentRecord>(`/documents/${id}/versions/upload`, { method: 'POST', body: form }) }
export async function downloadDocument(id: string, fileName: string, version?: number) { const path = version ? `/documents/${id}/versions/${version}/download` : `/documents/${id}/download`; const response = await fetch(`${API_BASE_URL}${path}`, { headers: tokenStore.accessToken ? { Authorization: `Bearer ${tokenStore.accessToken}` } : {} }); if (!response.ok) throw new Error('Unable to download document'); const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url) }
export const listNotifications = () => apiRequest<Notification[]>('/notifications')
export const markNotificationRead = (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'POST' })
export const markAllNotificationsRead = () => apiRequest('/notifications/read-all', { method: 'POST' })
export const listAuditEvents = (entityType?: string) => apiRequest<Array<{ id: string; action: string; entityType: string; entityId?: string; createdAt: string; actor?: { name: string } }>>('/audit-events', { query: { entityType } })
export const listTeam = () => apiRequest<any[]>('/team')
export const updateTeamMember = (id: string, body: Record<string, unknown>) => apiRequest(`/team/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const setTeamMemberActive = (id: string, active: boolean) => apiRequest(`/team/${id}/${active ? 'activate' : 'deactivate'}`, { method: 'POST' })
export const assignProjectMember = (projectId: string, body: Record<string, unknown>) => apiRequest(`/projects/${projectId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const removeProjectMember = (projectId: string, userId: string) => apiRequest(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' })
export const listInvitations = () => apiRequest<any[]>('/invitations')
export const createInvitation = (body: Record<string, unknown>) => apiRequest<any>('/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const acceptInvitation = (token: string) => apiRequest('/invitations/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
export const getCompanySettings = () => apiRequest<any>('/settings/company')
export const updateCompanySettings = (body: Record<string, unknown>) => apiRequest<any>('/settings/company', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
export const getReportSummary = () => apiRequest<ReportSummary>('/reports/summary')
