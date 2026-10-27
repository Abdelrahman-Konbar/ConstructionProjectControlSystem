import { describe, expect, it } from 'vitest'
import { paymentDue, validProgressQuantity } from './rules'

describe('operations rules', () => {
  it('rejects progress quantities above the contract quantity', () => {
    expect(validProgressQuantity(10, 10)).toBe(true)
    expect(validProgressQuantity(10.1, 10)).toBe(false)
  })
  it('calculates payment due after retention', () => {
    expect(paymentDue(100000, 10)).toBe(90000)
  })
})
