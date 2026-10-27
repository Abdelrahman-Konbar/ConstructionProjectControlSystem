import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from './auth'
import { getProject, listProjects, type ProjectListParams } from './projects'
import { getBudget, getDashboardSummary, getReportSummary, listApprovals, listAuditEvents, listBoq, listCostCodes, listDocuments, listExpenses, listMaterialRequests, listNotifications, listProgress, listPurchaseOrders, listReceipts, listRfqs, listSubcontractors, listSubcontracts, listSuppliers, listTeam } from './core'

export function useCurrentUser(enabled = true) { return useQuery({ queryKey: ['auth', 'me'], queryFn: getCurrentUser, enabled }) }
export function useProjects(params: ProjectListParams = {}, enabled = true) { return useQuery({ queryKey: ['projects', params], queryFn: () => listProjects(params), enabled }) }
export function useProject(projectId?: string) { return useQuery({ queryKey: ['projects', projectId], queryFn: () => getProject(projectId!), enabled: Boolean(projectId) }) }
export function useBoq(projectId?: string, search?: string) { return useQuery({ queryKey: ['boq', projectId, search], queryFn: () => listBoq(projectId!, search), enabled: Boolean(projectId) }) }
export function useCostCodes(projectId?: string, search?: string) { return useQuery({ queryKey: ['cost-codes', projectId, search], queryFn: () => listCostCodes(projectId!, search), enabled: Boolean(projectId) }) }
export function useBudget(projectId?: string) { return useQuery({ queryKey: ['budget', projectId], queryFn: () => getBudget(projectId!), enabled: Boolean(projectId) }) }
export function useSuppliers(search?: string) { return useQuery({ queryKey: ['suppliers', search], queryFn: () => listSuppliers(search) }) }
export function useMaterialRequests(projectId?: string, status?: string) { return useQuery({ queryKey: ['material-requests', projectId, status], queryFn: () => listMaterialRequests(projectId!, { status }), enabled: Boolean(projectId) }) }
export function useApprovals() { return useQuery({ queryKey: ['approvals'], queryFn: listApprovals }) }
export function useRfqs(projectId?: string, search?: string) { return useQuery({ queryKey: ['rfqs', projectId, search], queryFn: () => listRfqs(projectId!, search), enabled: Boolean(projectId) }) }
export function usePurchaseOrders(projectId?: string) { return useQuery({ queryKey: ['purchase-orders', projectId], queryFn: () => listPurchaseOrders(projectId!), enabled: Boolean(projectId) }) }
export function useReceipts(projectId?: string) { return useQuery({ queryKey: ['goods-receipts', projectId], queryFn: () => listReceipts(projectId!), enabled: Boolean(projectId) }) }
export function useExpenses(projectId?: string) { return useQuery({ queryKey: ['expenses', projectId], queryFn: () => listExpenses(projectId!), enabled: Boolean(projectId) }) }
export function useDashboardSummary() { return useQuery({ queryKey: ['dashboard-summary'], queryFn: getDashboardSummary }) }
export function useSubcontractors() { return useQuery({ queryKey: ['subcontractors'], queryFn: listSubcontractors }) }
export function useSubcontracts(projectId?: string) { return useQuery({ queryKey: ['subcontracts', projectId], queryFn: () => listSubcontracts(projectId!), enabled: Boolean(projectId) }) }
export function useProgress(projectId?: string) { return useQuery({ queryKey: ['progress', projectId], queryFn: () => listProgress(projectId!), enabled: Boolean(projectId) }) }
export function useDocuments(projectId?: string) { return useQuery({ queryKey: ['documents', projectId ?? 'all'], queryFn: () => listDocuments(projectId), enabled: true }) }
export function useNotifications() { return useQuery({ queryKey: ['notifications'], queryFn: listNotifications }) }
export function useTeam() { return useQuery({ queryKey: ['team'], queryFn: listTeam }) }
export function useReportSummary() { return useQuery({ queryKey: ['reports-summary'], queryFn: getReportSummary }) }
export function useAuditEvents(entityType?: string) { return useQuery({ queryKey: ['audit-events', entityType], queryFn: () => listAuditEvents(entityType) }) }
