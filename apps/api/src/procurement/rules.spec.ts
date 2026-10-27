import { describe, expect, it } from 'vitest'
import { SystemRole } from '@prisma/client'
import { approvalRolesForPurchaseOrder, canReceive, remainingQuantity } from './rules'

describe('procurement rules', () => {
  it('selects sequential approval roles by PO threshold', () => {
    expect(approvalRolesForPurchaseOrder(19999)).toEqual([SystemRole.PROJECT_MANAGER])
    expect(approvalRolesForPurchaseOrder(20000)).toEqual([SystemRole.PROJECT_MANAGER, SystemRole.FINANCE])
    expect(approvalRolesForPurchaseOrder(100001)).toEqual([SystemRole.PROJECT_MANAGER, SystemRole.FINANCE, SystemRole.OWNER_EXECUTIVE])
  })
  it('rejects over-receiving and calculates remaining quantity', () => {
    expect(remainingQuantity(10, 4)).toBe(6)
    expect(canReceive(6, 10, 4)).toBe(true)
    expect(canReceive(7, 10, 4)).toBe(false)
  })
  it('uses a validated company approval policy when configured', () => {
    expect(approvalRolesForPurchaseOrder(4999, { projectManagerLimit: 5000, financeLimit: 25000 })).toEqual([SystemRole.PROJECT_MANAGER])
    expect(approvalRolesForPurchaseOrder(25001, { projectManagerLimit: 5000, financeLimit: 25000 })).toEqual([SystemRole.PROJECT_MANAGER, SystemRole.FINANCE, SystemRole.OWNER_EXECUTIVE])
    expect(() => approvalRolesForPurchaseOrder(100, { projectManagerLimit: 5000, financeLimit: 1000 })).toThrow('Invalid purchase order approval policy')
  })
})
