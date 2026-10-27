-- CreateEnum
CREATE TYPE "RfqStatus" AS ENUM ('DRAFT', 'OPEN', 'QUOTES_RECEIVED', 'EVALUATION', 'AWARDED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('INVITED', 'RESPONDED', 'DECLINED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VALID', 'EXPIRED', 'REJECTED', 'AWARDED');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GoodsReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Rfq" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "rfqNumber" TEXT NOT NULL,
    "sourceMaterialRequestId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "issueDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "status" "RfqStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "awardedSupplierId" UUID,
    "awardedQuoteId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqItem" (
    "id" UUID NOT NULL,
    "rfqId" UUID NOT NULL,
    "materialRequestItemId" UUID,
    "description" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "boqItemId" UUID,
    "costCodeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RfqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqSupplier" (
    "id" UUID NOT NULL,
    "rfqId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "invitationStatus" "InvitationStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "RfqSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierQuote" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "rfqId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "quoteDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "deliveryDays" INTEGER,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierQuoteItem" (
    "id" UUID NOT NULL,
    "supplierQuoteId" UUID NOT NULL,
    "rfqItemId" UUID NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitRate" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SupplierQuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" UUID NOT NULL,
    "sourceRfqId" UUID,
    "sourceQuoteId" UUID,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "subtotal" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "deliveryTerms" TEXT,
    "createdById" UUID NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" UUID NOT NULL,
    "purchaseOrderId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitRate" DECIMAL(18,4) NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,
    "costCodeId" UUID,
    "boqItemId" UUID,
    "orderedQuantity" DECIMAL(18,4) NOT NULL,
    "receivedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "siteId" UUID,
    "purchaseOrderId" UUID NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "supplierId" UUID NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedById" UUID NOT NULL,
    "status" "GoodsReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "deliveryNoteNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptItem" (
    "id" UUID NOT NULL,
    "goodsReceiptId" UUID NOT NULL,
    "purchaseOrderItemId" UUID NOT NULL,
    "receivedQuantity" DECIMAL(18,4) NOT NULL,
    "acceptedQuantity" DECIMAL(18,4) NOT NULL,
    "rejectedQuantity" DECIMAL(18,4) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "siteId" UUID,
    "expenseNumber" TEXT NOT NULL,
    "costCodeId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "payee" TEXT,
    "createdById" UUID NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "attachmentRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontractor" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "specialties" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcontractor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Rfq_companyId_projectId_status_idx" ON "Rfq"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Rfq_companyId_rfqNumber_key" ON "Rfq"("companyId", "rfqNumber");

-- CreateIndex
CREATE INDEX "RfqItem_rfqId_idx" ON "RfqItem"("rfqId");

-- CreateIndex
CREATE INDEX "RfqSupplier_supplierId_idx" ON "RfqSupplier"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "RfqSupplier_rfqId_supplierId_key" ON "RfqSupplier"("rfqId", "supplierId");

-- CreateIndex
CREATE INDEX "SupplierQuote_companyId_rfqId_status_idx" ON "SupplierQuote"("companyId", "rfqId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuote_companyId_quoteNumber_key" ON "SupplierQuote"("companyId", "quoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierQuoteItem_supplierQuoteId_rfqItemId_key" ON "SupplierQuoteItem"("supplierQuoteId", "rfqItemId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_companyId_projectId_status_idx" ON "PurchaseOrder"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_companyId_poNumber_key" ON "PurchaseOrder"("companyId", "poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "GoodsReceipt_companyId_projectId_status_idx" ON "GoodsReceipt"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_companyId_receiptNumber_key" ON "GoodsReceipt"("companyId", "receiptNumber");

-- CreateIndex
CREATE INDEX "Expense_companyId_projectId_status_idx" ON "Expense"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_companyId_expenseNumber_key" ON "Expense"("companyId", "expenseNumber");

-- CreateIndex
CREATE INDEX "Subcontractor_companyId_status_idx" ON "Subcontractor"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Subcontractor_companyId_code_key" ON "Subcontractor"("companyId", "code");
