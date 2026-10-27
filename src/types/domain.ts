export type Id = string

export type Role = 'OWNER_EXECUTIVE' | 'PROJECT_MANAGER' | 'SITE_ENGINEER' | 'PROCUREMENT' | 'FINANCE' | 'QUANTITY_SURVEYOR' | 'STOREKEEPER' | 'ADMIN'
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'AT_RISK' | 'COMPLETED' | 'CLOSED'

export interface Company { id: Id; name: string }
export interface User { id: Id; companyId: Id; name: string; email: string; jobTitle?: string | null; roles: Role[]; permissions: string[] }
export interface Site { id: Id; projectId: Id; name: string; city?: string; country?: string }
export interface Project { id: Id; companyId: Id; code: string; name: string; city: string; contractValue: number; progress: number; spent: number; status: string }
export interface BOQItem { id: Id; projectId: Id; code: string; description: string; unit: string; quantity: number; rate: number; amount: number; status: string }
export interface CostCode { id: Id; projectId: Id; code: string; name: string }
export interface Budget { id: Id; projectId: Id; costCodeId: Id; budget: number; committed: number; actual: number; status: string }
export interface MaterialRequestItem { id: Id; description: string; quantity: number; unit: string; boqItemId?: Id }
export interface MaterialRequest { id: Id; projectId: Id; number: string; description: string; status: string; requestedBy: Id; neededAt?: string; items: MaterialRequestItem[] }
export interface RFQ { id: Id; projectId: Id; number: string; description: string; status: string; closesAt?: string; supplierIds: Id[] }
export interface SupplierQuote { id: Id; rfqId: Id; supplierId: Id; total: number; leadTimeDays: number; rating: number; status: string }
export interface PurchaseOrderItem { id: Id; description: string; quantity: number; unit: string; unitPrice: number }
export interface PurchaseOrder { id: Id; projectId: Id; number: string; supplierId: Id; status: string; total: number; items: PurchaseOrderItem[] }
export interface GoodsReceipt { id: Id; purchaseOrderId: Id; number: string; status: string; receivedAt?: string }
export interface Supplier { id: Id; companyId: Id; code: string; name: string; category: string; city: string; rating: number; status: string }
export interface Subcontractor { id: Id; companyId: Id; contractNumber: string; name: string; scope: string; value: number; status: string }
export interface Expense { id: Id; projectId: Id; number: string; description: string; category: string; amount: number; status: string; incurredAt: string }
export interface ProgressUpdate { id: Id; projectId: Id; activityCode: string; description: string; planned: number; actual: number; varianceDays: number; status: string }
export interface Approval { id: Id; entityType: string; entityId: Id; status: string; currentStep: string; requestedBy: Id }
export interface Notification { id: Id; userId: Id; type: string; title: string; readAt?: string }
export interface Document { id: Id; companyId: Id; projectId?: Id; name: string; mimeType: string; storageKey: string; uploadedBy: Id }
