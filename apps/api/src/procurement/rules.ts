import { SystemRole } from '@prisma/client'

export interface PurchaseOrderApprovalPolicy { projectManagerLimit?: number; financeLimit?: number }

export function approvalRolesForPurchaseOrder(total: number, policy: PurchaseOrderApprovalPolicy = {}): SystemRole[] {
  const projectManagerLimit = Number(policy.projectManagerLimit ?? 20000)
  const financeLimit = Number(policy.financeLimit ?? 100000)
  if (!Number.isFinite(projectManagerLimit) || !Number.isFinite(financeLimit) || projectManagerLimit < 0 || financeLimit < projectManagerLimit) throw new Error('Invalid purchase order approval policy')
  if (total < projectManagerLimit) return [SystemRole.PROJECT_MANAGER]
  if (total <= financeLimit) return [SystemRole.PROJECT_MANAGER, SystemRole.FINANCE]
  return [SystemRole.PROJECT_MANAGER, SystemRole.FINANCE, SystemRole.OWNER_EXECUTIVE]
}

export function remainingQuantity(ordered: number, received: number) { return Math.max(0, ordered - received) }
export function canReceive(quantity: number, ordered: number, received: number) { return quantity >= 0 && quantity <= remainingQuantity(ordered, received) }
