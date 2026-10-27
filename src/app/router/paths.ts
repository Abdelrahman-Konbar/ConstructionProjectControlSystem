export const projectPath = (projectId: string) => `/projects/${projectId}`

/** Replaces only an authorized project UUID segment while retaining its module suffix and query string. */
export function replaceProjectContextPath(currentPath: string, projectId: string): string | undefined {
  const projectPrefix = /^\/projects\/[^/?]+(?=\/|\?|$)/
  return projectPrefix.test(currentPath) ? currentPath.replace(projectPrefix, `/projects/${projectId}`) : undefined
}

export const APP_ROUTE_PATTERNS = [
  '/login', '/dashboard', '/projects', '/projects/:projectId', '/projects/:projectId/boq', '/projects/:projectId/cost-control', '/projects/:projectId/expenses',
  '/projects/:projectId/material-requests', '/material-requests/:requestId', '/expenses/:expenseId', '/projects/:projectId/rfqs', '/rfqs/:rfqId/compare', '/projects/:projectId/purchase-orders',
  '/suppliers/:supplierId', '/purchase-orders/:purchaseOrderId', '/goods-receipts/:receiptId', '/projects/:projectId/goods-receiving', '/suppliers', '/subcontractors', '/projects/:projectId/progress', '/approvals', '/notifications', '/documents', '/team', '/reports', '/audit-log', '/settings',
] as const

// Project-scoped destinations are templates. AppContent supplies the active UUID.
export const keyToPath: Record<string, string> = {
  dash: '/dashboard', proj: '/projects', pdash: '/projects/:projectId', boq: '/projects/:projectId/boq', cost: '/projects/:projectId/cost-control', exp: '/projects/:projectId/expenses',
  mr: '/projects/:projectId/material-requests', mrd: '/projects/:projectId/material-requests', rfq: '/projects/:projectId/rfqs', cmp: '/projects/:projectId/rfqs?comparison=1', po: '/projects/:projectId/purchase-orders', pod: '/projects/:projectId/purchase-orders', grn: '/projects/:projectId/goods-receiving', sup: '/suppliers', sub: '/subcontractors', prog: '/projects/:projectId/progress', appr: '/approvals', notifications: '/notifications', doc: '/documents', team: '/team', rep: '/reports', audit: '/audit-log', set: '/settings',
}

export function pathToKey(pathname: string): string {
  if (pathname === '/dashboard') return 'dash'
  if (pathname === '/projects') return 'proj'
  if (pathname === '/suppliers') return 'sup'
  if (pathname.startsWith('/suppliers/')) return 'supd'
  if (pathname === '/subcontractors') return 'sub'
  if (pathname === '/approvals') return 'appr'
  if (pathname === '/notifications') return 'notifications'
  if (pathname === '/documents') return 'doc'
  if (pathname === '/team') return 'team'
  if (pathname === '/reports') return 'rep'
  if (pathname === '/audit-log') return 'audit'
  if (pathname === '/settings') return 'set'
  if (pathname.startsWith('/material-requests/')) return 'mrd'
  if (pathname.startsWith('/expenses/')) return 'expd'
  if (pathname.startsWith('/purchase-orders/')) return 'pod'
  if (pathname.startsWith('/goods-receipts/')) return 'grnd'
  if (pathname.startsWith('/rfqs/')) return 'cmp'
  if (pathname.endsWith('/boq')) return 'boq'
  if (pathname.endsWith('/cost-control')) return 'cost'
  if (pathname.endsWith('/expenses')) return 'exp'
  if (pathname.endsWith('/material-requests')) return 'mr'
  if (pathname.endsWith('/rfqs')) return 'rfq'
  if (pathname.endsWith('/purchase-orders')) return 'po'
  if (pathname.endsWith('/goods-receiving')) return 'grn'
  if (pathname.endsWith('/progress')) return 'prog'
  if (pathname.startsWith('/projects/')) return 'pdash'
  return 'dash'
}
