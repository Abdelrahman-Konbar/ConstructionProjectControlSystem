export function validProgressQuantity(measured: number | undefined, contract: number): boolean {
  return measured === undefined || (measured >= 0 && measured <= contract)
}

export function paymentDue(certified: number, retentionPercentage: number): number {
  return certified - certified * (retentionPercentage / 100)
}
