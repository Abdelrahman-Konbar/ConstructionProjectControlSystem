import { ApprovalDecision, ApprovalStatus, BoqVersionStatus, ExpenseStatus, GoodsReceiptStatus, MaterialRequestStatus, NotificationType, PrismaClient, ProjectRole, ProjectStatus, PurchaseOrderStatus, QuoteStatus, RequestPriority, RfqStatus, SystemRole } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()
const password = 'Construction123!'

const users = [
  ['owner@al-riyada.test', 'Faisal Al-Riyada', 'Owner / Executive', SystemRole.OWNER_EXECUTIVE],
  ['admin@al-riyada.test', 'Noura Al-Harbi', 'System Administrator', SystemRole.ADMIN],
  ['k.otaibi@almasar.sa', 'Khalid Al-Otaibi', 'Project Manager', SystemRole.PROJECT_MANAGER],
  ['pm2@al-riyada.test', 'Maha Al-Qahtani', 'Project Manager', SystemRole.PROJECT_MANAGER],
  ['site1@al-riyada.test', 'Samer Haddad', 'Site Engineer', SystemRole.SITE_ENGINEER],
  ['site2@al-riyada.test', 'Fahad Al-Qahtani', 'Site Engineer', SystemRole.SITE_ENGINEER],
  ['procurement@al-riyada.test', 'Rania Saleh', 'Procurement', SystemRole.PROCUREMENT],
  ['finance@al-riyada.test', 'Omar Nasser', 'Finance', SystemRole.FINANCE],
  ['qs@al-riyada.test', 'Reem Omar', 'Quantity Surveyor', SystemRole.QUANTITY_SURVEYOR],
  ['storekeeper@al-riyada.test', 'Abdullah Saleh', 'Storekeeper', SystemRole.STOREKEEPER],
] as const

async function main() {
  const company = await prisma.company.upsert({ where: { slug: 'al-riyada-construction' }, update: {}, create: { name: 'Al-Riyada Construction', legalName: 'Al-Riyada Construction Company', slug: 'al-riyada-construction' } })
  const roles = Object.values(SystemRole).map((key) => ({ key, label: key.replaceAll('_', ' '), permissions: key === SystemRole.ADMIN || key === SystemRole.OWNER_EXECUTIVE ? ['*'] : ['projects.read', 'sites.read'] }))
  for (const role of roles) await prisma.role.upsert({ where: { key: role.key }, update: role, create: role })
  const createdUsers = new Map<string, { id: string; role: SystemRole }>()
  const passwordHash = await bcrypt.hash(password, 12)
  for (const [email, name, jobTitle, role] of users) {
    const user = await prisma.user.upsert({ where: { email }, update: { name, jobTitle, status: 'ACTIVE' }, create: { email, name, jobTitle, passwordHash, status: 'ACTIVE' } })
    await prisma.companyMembership.upsert({ where: { companyId_userId: { companyId: company.id, userId: user.id } }, update: { role, status: 'ACTIVE' }, create: { companyId: company.id, userId: user.id, role, status: 'ACTIVE' } })
    createdUsers.set(email, { id: user.id, role })
  }
  const projects = [
    ['PRJ-2407', 'Al Reem Residential Tower', 'Riyadh', ProjectStatus.ACTIVE, 184500000, 62, 'k.otaibi@almasar.sa'],
    ['PRJ-2411', 'Business Oasis Complex', 'Jeddah', ProjectStatus.AT_RISK, 96200000, 41, 'pm2@al-riyada.test'],
    ['PRJ-2415', 'Al Nakheel Specialist Hospital', 'Dammam', ProjectStatus.AT_RISK, 241000000, 28, 'k.otaibi@almasar.sa'],
    ['PRJ-2420', 'Horizon Model Schools', 'Khobar', ProjectStatus.ACTIVE, 38700000, 83, 'pm2@al-riyada.test'],
    ['PRJ-2423', 'Port Logistics Warehouses', 'Jubail', ProjectStatus.PLANNING, 52400000, 12, 'k.otaibi@almasar.sa'],
  ] as const
  for (const [code, name, location, status, contractValue, progressPercent, managerEmail] of projects) {
    const manager = createdUsers.get(managerEmail)!
    const project = await prisma.project.upsert({ where: { companyId_code: { companyId: company.id, code } }, update: { name, location, status, contractValue, progressPercent, projectManagerId: manager.id }, create: { companyId: company.id, code, name, location, status, contractValue, progressPercent, projectManagerId: manager.id } })
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: manager.id } }, update: { role: ProjectRole.PROJECT_MANAGER }, create: { projectId: project.id, userId: manager.id, role: ProjectRole.PROJECT_MANAGER } })
    const siteUser = createdUsers.get('site1@al-riyada.test')!
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: siteUser.id } }, update: { role: ProjectRole.SITE_ENGINEER }, create: { projectId: project.id, userId: siteUser.id, role: ProjectRole.SITE_ENGINEER } })
    const storekeeper = createdUsers.get('storekeeper@al-riyada.test')!
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: storekeeper.id } }, update: { role: ProjectRole.STOREKEEPER }, create: { projectId: project.id, userId: storekeeper.id, role: ProjectRole.STOREKEEPER } })
    const finance = createdUsers.get('finance@al-riyada.test')!
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: finance.id } }, update: { role: ProjectRole.FINANCE }, create: { projectId: project.id, userId: finance.id, role: ProjectRole.FINANCE } })
    const procurementUser = createdUsers.get('procurement@al-riyada.test')!
    await prisma.projectMember.upsert({ where: { projectId_userId: { projectId: project.id, userId: procurementUser.id } }, update: { role: ProjectRole.PROCUREMENT }, create: { projectId: project.id, userId: procurementUser.id, role: ProjectRole.PROCUREMENT } })
    await prisma.site.upsert({ where: { projectId_code: { projectId: project.id, code: 'MAIN' } }, update: { name: `${name} Main Site`, location, status: 'ACTIVE' }, create: { companyId: company.id, projectId: project.id, code: 'MAIN', name: `${name} Main Site`, location, status: 'ACTIVE' } })
  }
  const seededProjects = await prisma.project.findMany({ where: { companyId: company.id }, orderBy: { code: 'asc' } })
  const qs = createdUsers.get('qs@al-riyada.test')!
  const siteEngineer = createdUsers.get('site1@al-riyada.test')!
  const projectManager = createdUsers.get('k.otaibi@almasar.sa')!
  const costCodeTemplates = [
    ['01', 'General Requirements', 'Preliminaries'],
    ['02', 'Civil Works', 'Structure'],
    ['03', 'Architectural Works', 'Finishes'],
    ['04', 'MEP Services', 'MEP'],
  ] as const
  const costCodesByProject = new Map<string, string[]>()
  for (const project of seededProjects) {
    const ids: string[] = []
    for (const [suffix, name, category] of costCodeTemplates) {
      const costCode = await prisma.costCode.upsert({ where: { companyId_projectId_code: { companyId: company.id, projectId: project.id, code: `${project.code}-${suffix}` } }, update: { name, category, status: 'ACTIVE' }, create: { companyId: company.id, projectId: project.id, code: `${project.code}-${suffix}`, name, category, status: 'ACTIVE' } })
      ids.push(costCode.id)
    }
    costCodesByProject.set(project.id, ids)
    const boq = await prisma.boq.upsert({ where: { projectId_name: { projectId: project.id, name: 'Main BOQ' } }, update: {}, create: { companyId: company.id, projectId: project.id, name: 'Main BOQ' } })
    const version = await prisma.boqVersion.upsert({ where: { boqId_version: { boqId: boq.id, version: 1 } }, update: { status: BoqVersionStatus.ACTIVE }, create: { companyId: company.id, projectId: project.id, boqId: boq.id, version: 1, status: BoqVersionStatus.ACTIVE, createdById: qs.id } })
    for (let index = 1; index <= 6; index++) {
      const quantity = 100 + index * 25
      const rate = 120 + index * 15
      await prisma.boqItem.upsert({ where: { boqVersionId_code: { boqVersionId: version.id, code: `${project.code}-BOQ-${String(index).padStart(2, '0')}` } }, update: { description: `Construction work package ${index}`, contractQuantity: quantity, contractRate: rate, contractValue: quantity * rate, costCodeId: ids[(index - 1) % ids.length] }, create: { companyId: company.id, projectId: project.id, boqVersionId: version.id, code: `${project.code}-BOQ-${String(index).padStart(2, '0')}`, description: `Construction work package ${index}`, unit: index % 2 ? 'm2' : 'No.', contractQuantity: quantity, contractRate: rate, contractValue: quantity * rate, costCodeId: ids[(index - 1) % ids.length] } })
    }
    const budget = await prisma.budget.upsert({ where: { projectId_version: { projectId: project.id, version: 1 } }, update: { name: 'Approved baseline budget', status: 'ACTIVE' }, create: { companyId: company.id, projectId: project.id, name: 'Approved baseline budget', version: 1, status: 'ACTIVE' } })
    for (let index = 0; index < ids.length; index++) {
      const amount = 500000 + index * 125000
      await prisma.budgetLine.upsert({ where: { budgetId_costCodeId: { budgetId: budget.id, costCodeId: ids[index] } }, update: { original: amount, revised: amount, forecast: amount }, create: { companyId: company.id, projectId: project.id, budgetId: budget.id, costCodeId: ids[index], original: amount, revised: amount, forecast: amount } })
    }
  }
  const suppliers = [
    ['SUP-001', 'Gulf Steel Trading', 'Steel'], ['SUP-002', 'Riyadh Ready Mix', 'Concrete'], ['SUP-003', 'Nour Electrical Supplies', 'Electrical'],
    ['SUP-004', 'Al-Bunyan Building Materials', 'Building Materials'], ['SUP-005', 'Modern HVAC Systems', 'Mechanical'], ['SUP-006', 'Sama Safety Equipment', 'Safety'],
    ['SUP-007', 'Jeddah Doors & Joinery', 'Finishes'], ['SUP-008', 'Eastern Insulation Co.', 'Insulation'], ['SUP-009', 'Afaq Plumbing Supplies', 'Plumbing'],
    ['SUP-010', 'Najd Scaffolding Services', 'Plant'], ['SUP-011', 'Madar Glass & Aluminium', 'Façade'], ['SUP-012', 'Wadi Landscaping', 'Landscaping'],
  ] as const
  for (const [code, name, category] of suppliers) await prisma.supplier.upsert({ where: { companyId_code: { companyId: company.id, code } }, update: { name, category, status: 'ACTIVE' }, create: { companyId: company.id, code, name, category, country: 'Saudi Arabia', status: 'ACTIVE' } })
  const workflow = await prisma.approvalWorkflow.upsert({ where: { companyId_entityType_name: { companyId: company.id, entityType: 'MaterialRequest', name: 'Project Manager Approval' } }, update: {}, create: { companyId: company.id, entityType: 'MaterialRequest', name: 'Project Manager Approval' } })
  const approvalStep = await prisma.approvalStep.upsert({ where: { workflowId_stepNumber: { workflowId: workflow.id, stepNumber: 1 } }, update: {}, create: { workflowId: workflow.id, stepNumber: 1, role: SystemRole.PROJECT_MANAGER, name: 'Project Manager approval' } })
  let requestIndex = 0
  for (const project of seededProjects) {
    const site = await prisma.site.findFirst({ where: { projectId: project.id } })
    const codeIds = costCodesByProject.get(project.id)!
    for (let offset = 0; offset < 3; offset++) {
      requestIndex++
      const requestNumber = `MR-SEED-${String(requestIndex).padStart(3, '0')}`
      const status = requestIndex % 3 === 0 ? MaterialRequestStatus.APPROVED : requestIndex % 3 === 1 ? MaterialRequestStatus.PENDING_APPROVAL : MaterialRequestStatus.DRAFT
      const request = await prisma.materialRequest.upsert({ where: { companyId_requestNumber: { companyId: company.id, requestNumber } }, update: { status, purpose: `Planned material package ${requestIndex}` }, create: { companyId: company.id, projectId: project.id, siteId: site?.id, requestedById: siteEngineer.id, requestNumber, priority: requestIndex % 4 === 0 ? RequestPriority.HIGH : RequestPriority.NORMAL, status, purpose: `Planned material package ${requestIndex}`, notes: 'Seeded development request', submittedAt: status === MaterialRequestStatus.DRAFT ? undefined : new Date() } })
      const existingItem = await prisma.materialRequestItem.findFirst({ where: { materialRequestId: request.id } })
      if (!existingItem) await prisma.materialRequestItem.create({ data: { materialRequestId: request.id, description: `Material package ${requestIndex}`, specification: 'Development specification', unit: 'No.', requestedQuantity: 10 + requestIndex, costCodeId: codeIds[requestIndex % codeIds.length] } })
      if (status === MaterialRequestStatus.PENDING_APPROVAL || status === MaterialRequestStatus.APPROVED) {
        const instance = await prisma.approvalInstance.findFirst({ where: { companyId: company.id, entityType: 'MaterialRequest', entityId: request.id } }) ?? await prisma.approvalInstance.create({ data: { companyId: company.id, projectId: project.id, entityType: 'MaterialRequest', entityId: request.id, workflowId: workflow.id, currentStepId: approvalStep.id, status: status === MaterialRequestStatus.APPROVED ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING } })
        if (status === MaterialRequestStatus.APPROVED && !(await prisma.approvalAction.findFirst({ where: { instanceId: instance.id } }))) await prisma.approvalAction.create({ data: { companyId: company.id, projectId: project.id, instanceId: instance.id, stepId: approvalStep.id, actorId: projectManager.id, actorRole: SystemRole.PROJECT_MANAGER, decision: ApprovalDecision.APPROVE, comment: 'Seeded approval history' } })
      }
    }
  }
  const seededSuppliers = await prisma.supplier.findMany({ where: { companyId: company.id }, orderBy: { code: 'asc' }, take: 3 })
  let procurementIndex = 0
  for (const project of seededProjects.slice(0, 3)) {
    const approvedRequest = await prisma.materialRequest.findFirst({ where: { companyId: company.id, projectId: project.id, status: MaterialRequestStatus.APPROVED }, orderBy: { requestNumber: 'asc' } })
    if (!approvedRequest) continue
    procurementIndex++
    const historicalDate = new Date()
    historicalDate.setUTCDate(5 + procurementIndex)
    historicalDate.setUTCMonth(historicalDate.getUTCMonth() - (3 - procurementIndex))
    historicalDate.setUTCHours(9, 0, 0, 0)
    const requestItems = await prisma.materialRequestItem.findMany({ where: { materialRequestId: approvedRequest.id } })
    const rfqNumber = `RFQ-SEED-${String(procurementIndex).padStart(3, '0')}`
    const rfq = await prisma.rfq.upsert({ where: { companyId_rfqNumber: { companyId: company.id, rfqNumber } }, update: { status: RfqStatus.AWARDED, title: `Materials for ${project.code}`, awardedSupplierId: seededSuppliers[0]?.id }, create: { companyId: company.id, projectId: project.id, rfqNumber, sourceMaterialRequestId: approvedRequest.id, title: `Materials for ${project.code}`, status: RfqStatus.AWARDED, createdById: createdUsers.get('procurement@al-riyada.test')!.id, awardedSupplierId: seededSuppliers[0]?.id } })
    for (const item of requestItems) await prisma.rfqItem.upsert({ where: { id: `${rfq.id.slice(0, 8)}00000000-0000-0000-0000-${item.id.replaceAll('-', '').slice(0, 12)}` }, update: {}, create: { rfqId: rfq.id, materialRequestItemId: item.id, description: item.description, specification: item.specification, unit: item.unit, quantity: item.requestedQuantity, costCodeId: item.costCodeId, boqItemId: item.boqItemId } }).catch(async () => { if (!(await prisma.rfqItem.findFirst({ where: { rfqId: rfq.id, materialRequestItemId: item.id } }))) await prisma.rfqItem.create({ data: { rfqId: rfq.id, materialRequestItemId: item.id, description: item.description, specification: item.specification, unit: item.unit, quantity: item.requestedQuantity, costCodeId: item.costCodeId, boqItemId: item.boqItemId } }) })
    const rfqItems = await prisma.rfqItem.findMany({ where: { rfqId: rfq.id } })
    for (const supplier of seededSuppliers) {
      await prisma.rfqSupplier.upsert({ where: { rfqId_supplierId: { rfqId: rfq.id, supplierId: supplier.id } }, update: { invitationStatus: 'RESPONDED' }, create: { rfqId: rfq.id, supplierId: supplier.id, invitationStatus: 'RESPONDED', respondedAt: new Date() } })
      const quoteNumber = `QUOTE-SEED-${procurementIndex}-${supplier.code}`
      const multiplier = supplier.id === seededSuppliers[0]?.id ? 1 : supplier.id === seededSuppliers[1]?.id ? 1.08 : 1.15
      const subtotal = rfqItems.reduce((sum, item) => sum + Number(item.quantity) * 100 * multiplier, 0)
      const quote = await prisma.supplierQuote.upsert({ where: { companyId_quoteNumber: { companyId: company.id, quoteNumber } }, update: { status: supplier.id === seededSuppliers[0]?.id ? QuoteStatus.AWARDED : QuoteStatus.SUBMITTED }, create: { companyId: company.id, projectId: project.id, rfqId: rfq.id, supplierId: supplier.id, quoteNumber, quoteDate: new Date(), validUntil: new Date(Date.now() + 30 * 86400000), subtotal, taxAmount: subtotal * 0.15, totalAmount: subtotal * 1.15, deliveryDays: 14, currency: 'SAR', paymentTerms: '30 days', status: supplier.id === seededSuppliers[0]?.id ? QuoteStatus.AWARDED : QuoteStatus.SUBMITTED } })
      for (const item of rfqItems) await prisma.supplierQuoteItem.upsert({ where: { supplierQuoteId_rfqItemId: { supplierQuoteId: quote.id, rfqItemId: item.id } }, update: {}, create: { supplierQuoteId: quote.id, rfqItemId: item.id, quantity: item.quantity, unitRate: 100 * multiplier, lineTotal: Number(item.quantity) * 100 * multiplier } })
      if (supplier.id === seededSuppliers[0]?.id) {
        const poNumber = `PO-SEED-${String(procurementIndex).padStart(3, '0')}`
        const po = await prisma.purchaseOrder.upsert({ where: { companyId_poNumber: { companyId: company.id, poNumber } }, update: { status: PurchaseOrderStatus.PARTIALLY_RECEIVED, orderDate: historicalDate, issuedAt: historicalDate }, create: { companyId: company.id, projectId: project.id, poNumber, supplierId: supplier.id, sourceRfqId: rfq.id, sourceQuoteId: quote.id, status: PurchaseOrderStatus.PARTIALLY_RECEIVED, subtotal, taxAmount: subtotal * 0.15, totalAmount: subtotal * 1.15, createdById: createdUsers.get('procurement@al-riyada.test')!.id, orderDate: historicalDate, issuedAt: historicalDate } })
        for (const item of rfqItems) { const existing = await prisma.purchaseOrderItem.findFirst({ where: { purchaseOrderId: po.id, description: item.description } }); if (!existing) await prisma.purchaseOrderItem.create({ data: { purchaseOrderId: po.id, description: item.description, unit: item.unit, quantity: item.quantity, unitRate: 100, lineTotal: Number(item.quantity) * 100, orderedQuantity: item.quantity, receivedQuantity: Number(item.quantity) / 2, costCodeId: item.costCodeId, boqItemId: item.boqItemId } }) }
        const poItems = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } })
        const receiptNumber = `GRN-SEED-${String(procurementIndex).padStart(3, '0')}`
        const receipt = await prisma.goodsReceipt.upsert({ where: { companyId_receiptNumber: { companyId: company.id, receiptNumber } }, update: { status: GoodsReceiptStatus.POSTED, receivedDate: historicalDate }, create: { companyId: company.id, projectId: project.id, purchaseOrderId: po.id, receiptNumber, supplierId: supplier.id, receivedById: createdUsers.get('storekeeper@al-riyada.test')!.id, status: GoodsReceiptStatus.POSTED, receivedDate: historicalDate, notes: 'Seeded partial receipt' } })
        for (const poItem of poItems) await prisma.goodsReceiptItem.upsert({ where: { id: `${receipt.id.slice(0, 8)}00000000-0000-0000-0000-${poItem.id.replaceAll('-', '').slice(0, 12)}` }, update: {}, create: { goodsReceiptId: receipt.id, purchaseOrderItemId: poItem.id, receivedQuantity: Number(poItem.orderedQuantity) / 2, acceptedQuantity: Number(poItem.orderedQuantity) / 2, rejectedQuantity: 0 } }).catch(async () => { if (!(await prisma.goodsReceiptItem.findFirst({ where: { goodsReceiptId: receipt.id, purchaseOrderItemId: poItem.id } }))) await prisma.goodsReceiptItem.create({ data: { goodsReceiptId: receipt.id, purchaseOrderItemId: poItem.id, receivedQuantity: Number(poItem.orderedQuantity) / 2, acceptedQuantity: Number(poItem.orderedQuantity) / 2, rejectedQuantity: 0 } }) })
      }
    }
    const costCode = await prisma.costCode.findFirst({ where: { companyId: company.id, projectId: project.id } })
    if (costCode) await prisma.expense.upsert({ where: { companyId_expenseNumber: { companyId: company.id, expenseNumber: `EXP-SEED-${String(procurementIndex).padStart(3, '0')}` } }, update: { status: ExpenseStatus.POSTED, expenseDate: historicalDate }, create: { companyId: company.id, projectId: project.id, expenseNumber: `EXP-SEED-${String(procurementIndex).padStart(3, '0')}`, costCodeId: costCode.id, category: 'Fuel', description: 'Site equipment fuel', amount: 9840, taxAmount: 1476, expenseDate: historicalDate, payee: 'Seeded site vendor', createdById: createdUsers.get('finance@al-riyada.test')!.id, status: ExpenseStatus.POSTED } })
  }
  // Twelve-month financial history for the real dashboard aggregation. The records
  // are deterministic and scoped to the three projects visible to the demo PM.
  const historyProjects = seededProjects.filter((project) => ['PRJ-2407', 'PRJ-2415', 'PRJ-2423'].includes(project.code))
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const project = historyProjects[monthIndex % historyProjects.length]
    const site = await prisma.site.findFirst({ where: { projectId: project.id } })
    const codeIds = costCodesByProject.get(project.id)!
    const costCodeId = codeIds[monthIndex % codeIds.length]
    const supplier = seededSuppliers[monthIndex % seededSuppliers.length]
    const historicalDate = new Date()
    historicalDate.setUTCDate(4 + (monthIndex % 20))
    historicalDate.setUTCMonth(historicalDate.getUTCMonth() - (11 - monthIndex))
    historicalDate.setUTCHours(9, 0, 0, 0)
    const baseAmount = 72000 + (monthIndex % 4) * 11500 + Math.floor(monthIndex / 4) * 6500
    const quantity = 100 + (monthIndex % 5) * 10
    const unitRate = baseAmount / quantity
    const taxAmount = baseAmount * 0.15
    const poNumber = `PO-HIST-${String(monthIndex + 1).padStart(3, '0')}`
    const po = await prisma.purchaseOrder.upsert({
      where: { companyId_poNumber: { companyId: company.id, poNumber } },
      update: { projectId: project.id, supplierId: supplier.id, status: PurchaseOrderStatus.PARTIALLY_RECEIVED, subtotal: baseAmount, taxAmount, totalAmount: baseAmount + taxAmount, orderDate: historicalDate, issuedAt: historicalDate },
      create: { companyId: company.id, projectId: project.id, poNumber, supplierId: supplier.id, status: PurchaseOrderStatus.PARTIALLY_RECEIVED, subtotal: baseAmount, taxAmount, totalAmount: baseAmount + taxAmount, createdById: createdUsers.get('procurement@al-riyada.test')!.id, orderDate: historicalDate, issuedAt: historicalDate, paymentTerms: '30 days', deliveryTerms: 'Project site delivery' },
    })
    const poItem = await prisma.purchaseOrderItem.findFirst({ where: { purchaseOrderId: po.id, description: `Historical material package ${monthIndex + 1}` } }) ?? await prisma.purchaseOrderItem.create({ data: { purchaseOrderId: po.id, description: `Historical material package ${monthIndex + 1}`, unit: 'No.', quantity, unitRate, lineTotal: baseAmount, orderedQuantity: quantity, receivedQuantity: quantity / 2, costCodeId } })
    await prisma.purchaseOrderItem.update({ where: { id: poItem.id }, data: { quantity, unitRate, lineTotal: baseAmount, orderedQuantity: quantity, receivedQuantity: quantity / 2, costCodeId } })
    const receiptNumber = `GRN-HIST-${String(monthIndex + 1).padStart(3, '0')}`
    const receipt = await prisma.goodsReceipt.upsert({ where: { companyId_receiptNumber: { companyId: company.id, receiptNumber } }, update: { projectId: project.id, siteId: site?.id, purchaseOrderId: po.id, supplierId: supplier.id, status: GoodsReceiptStatus.POSTED, receivedDate: historicalDate }, create: { companyId: company.id, projectId: project.id, siteId: site?.id, purchaseOrderId: po.id, receiptNumber, supplierId: supplier.id, receivedById: createdUsers.get('storekeeper@al-riyada.test')!.id, status: GoodsReceiptStatus.POSTED, receivedDate: historicalDate, notes: 'Seeded historical partial receipt' } })
    const receiptItem = await prisma.goodsReceiptItem.findFirst({ where: { goodsReceiptId: receipt.id, purchaseOrderItemId: poItem.id } })
    if (receiptItem) await prisma.goodsReceiptItem.update({ where: { id: receiptItem.id }, data: { receivedQuantity: quantity / 2, acceptedQuantity: quantity / 2, rejectedQuantity: 0 } })
    else await prisma.goodsReceiptItem.create({ data: { goodsReceiptId: receipt.id, purchaseOrderItemId: poItem.id, receivedQuantity: quantity / 2, acceptedQuantity: quantity / 2, rejectedQuantity: 0 } })
    await prisma.expense.upsert({ where: { companyId_expenseNumber: { companyId: company.id, expenseNumber: `EXP-HIST-${String(monthIndex + 1).padStart(3, '0')}` } }, update: { projectId: project.id, siteId: site?.id, costCodeId, status: ExpenseStatus.POSTED, amount: baseAmount * 0.12, taxAmount: baseAmount * 0.018, expenseDate: historicalDate }, create: { companyId: company.id, projectId: project.id, siteId: site?.id, expenseNumber: `EXP-HIST-${String(monthIndex + 1).padStart(3, '0')}`, costCodeId, category: monthIndex % 3 === 0 ? 'Transport' : monthIndex % 3 === 1 ? 'Equipment rental' : 'Fuel', description: `Historical site operating expense ${monthIndex + 1}`, amount: baseAmount * 0.12, taxAmount: baseAmount * 0.018, expenseDate: historicalDate, payee: 'Al-Riyada site operations', createdById: createdUsers.get('finance@al-riyada.test')!.id, status: ExpenseStatus.POSTED } })
  }
  const subcontractorSeed = ['SUB-001', 'Al-Binaa Civil Works', 'Civil and structural works'] as const
  const subcontractor = await prisma.subcontractor.upsert({ where: { companyId_code: { companyId: company.id, code: subcontractorSeed[0] } }, update: { name: subcontractorSeed[1], specialties: subcontractorSeed[2], status: 'ACTIVE' }, create: { companyId: company.id, code: subcontractorSeed[0], name: subcontractorSeed[1], specialties: subcontractorSeed[2], status: 'ACTIVE' } })
  const progressProjects = seededProjects.filter((project) => ['PRJ-2407', 'PRJ-2415', 'PRJ-2423'].includes(project.code))
  for (const project of progressProjects) {
    const contract = await prisma.subcontract.upsert({ where: { companyId_contractNumber: { companyId: company.id, contractNumber: `SC-${project.code}-001` } }, update: { status: 'ACTIVE' }, create: { companyId: company.id, projectId: project.id, subcontractorId: subcontractor.id, contractNumber: `SC-${project.code}-001`, scope: 'Civil and structural works', contractAmount: 2400000, retentionPercentage: 10, status: 'ACTIVE', createdById: projectManager.id } })
    if (!(await prisma.subcontractProgress.findFirst({ where: { subcontractId: contract.id } }))) await prisma.subcontractProgress.create({ data: { companyId: company.id, projectId: project.id, subcontractId: contract.id, progressPercent: project.progressPercent, completedValue: 720000, certifiedValue: 650000, retentionValue: 65000, paymentDue: 585000, notes: 'Seeded progress measurement', createdById: projectManager.id } })
    const boqItems = await prisma.boqItem.findMany({ where: { projectId: project.id }, orderBy: { code: 'asc' }, take: 4 })
    const progressValues = [
      [100, 100, 'Completed structural package'],
      [64, 48, 'Under review: facade installation is behind plan'],
      [52, 45, 'On track mechanical services'],
      [38, 24, 'Delayed internal finishing package'],
    ] as const
    for (let index = 0; index < boqItems.length; index++) {
      const boqItem = boqItems[index]
      const [, actual, note] = progressValues[index]
      const measuredDate = new Date()
      measuredDate.setUTCDate(6 + index)
      measuredDate.setUTCMonth(measuredDate.getUTCMonth() - (3 - index))
      measuredDate.setUTCHours(10, 0, 0, 0)
      const existing = await prisma.progressUpdate.findFirst({ where: { projectId: project.id, boqItemId: boqItem.id, notes: note } })
      if (existing) await prisma.progressUpdate.update({ where: { id: existing.id }, data: { measuredQuantity: Number(boqItem.contractQuantity) * (actual / 100), progressPercent: actual, measuredDate, notes: note } })
      else await prisma.progressUpdate.create({ data: { companyId: company.id, projectId: project.id, siteId: (await prisma.site.findFirst({ where: { projectId: project.id } }))?.id, boqItemId: boqItem.id, measuredQuantity: Number(boqItem.contractQuantity) * (actual / 100), progressPercent: actual, measuredDate, notes: note, createdById: siteEngineer.id } })
    }
    if (!(await prisma.document.findFirst({ where: { companyId: company.id, projectId: project.id, name: 'Site progress report' } }))) await prisma.document.create({ data: { companyId: company.id, projectId: project.id, name: 'Site progress report', originalName: 'site-progress-report.pdf', mimeType: 'application/pdf', size: 256000, storageKey: `dev/${project.code}/site-progress-report.pdf`, uploadedBy: siteEngineer.id, entityType: 'Project', entityId: project.id } })
  }
  for (const [userEmail, title, message] of [['k.otaibi@almasar.sa', 'Approval inbox ready', 'Review pending project approvals'], ['procurement@al-riyada.test', 'Procurement data ready', 'RFQ and purchase order records are available'], ['storekeeper@al-riyada.test', 'Receiving records ready', 'Review open goods receipts']] as const) {
    const target = createdUsers.get(userEmail)!
    if (!(await prisma.notification.findFirst({ where: { companyId: company.id, userId: target.id, title } }))) await prisma.notification.create({ data: { companyId: company.id, userId: target.id, type: NotificationType.SYSTEM, title, message } })
  }
  console.log(`Seeded ${company.name}. Development password for all users: ${password}`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
