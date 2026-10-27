-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BoqVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'APPROVED');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MaterialRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PROCUREMENT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVE', 'REJECT', 'RETURN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED');

-- CreateTable
CREATE TABLE "Boq" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Main BOQ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoqVersion" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "boqId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "BoqVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveAt" TIMESTAMP(3),
    "createdById" UUID NOT NULL,
    "approvedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoqVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoqItem" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "boqVersionId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "contractQuantity" DECIMAL(18,4) NOT NULL,
    "contractRate" DECIMAL(18,4) NOT NULL,
    "contractValue" DECIMAL(18,2) NOT NULL,
    "executedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "progressPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "costCodeId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCode" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "parentId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "budgetId" UUID NOT NULL,
    "costCodeId" UUID NOT NULL,
    "original" DECIMAL(18,2) NOT NULL,
    "revised" DECIMAL(18,2) NOT NULL,
    "committed" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "actual" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "forecast" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "taxNumber" TEXT,
    "city" TEXT,
    "country" TEXT,
    "category" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "rating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "siteId" UUID,
    "requestNumber" TEXT NOT NULL,
    "requestedById" UUID NOT NULL,
    "requestedForDate" TIMESTAMP(3),
    "priority" "RequestPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaterialRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "purpose" TEXT,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequestItem" (
    "id" UUID NOT NULL,
    "materialRequestId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL,
    "requestedQuantity" DECIMAL(18,4) NOT NULL,
    "costCodeId" UUID,
    "boqItemId" UUID,
    "notes" TEXT,

    CONSTRAINT "MaterialRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "role" "SystemRole" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ApprovalStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalInstance" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "workflowId" UUID NOT NULL,
    "currentStepId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID,
    "instanceId" UUID NOT NULL,
    "stepId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "actorRole" "SystemRole" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Boq_companyId_projectId_idx" ON "Boq"("companyId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Boq_projectId_name_key" ON "Boq"("projectId", "name");

-- CreateIndex
CREATE INDEX "BoqVersion_companyId_projectId_status_idx" ON "BoqVersion"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BoqVersion_boqId_version_key" ON "BoqVersion"("boqId", "version");

-- CreateIndex
CREATE INDEX "BoqItem_companyId_projectId_code_idx" ON "BoqItem"("companyId", "projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "BoqItem_boqVersionId_code_key" ON "BoqItem"("boqVersionId", "code");

-- CreateIndex
CREATE INDEX "CostCode_companyId_projectId_status_idx" ON "CostCode"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CostCode_companyId_projectId_code_key" ON "CostCode"("companyId", "projectId", "code");

-- CreateIndex
CREATE INDEX "Budget_companyId_projectId_status_idx" ON "Budget"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_projectId_version_key" ON "Budget"("projectId", "version");

-- CreateIndex
CREATE INDEX "BudgetLine_companyId_projectId_idx" ON "BudgetLine"("companyId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_budgetId_costCodeId_key" ON "BudgetLine"("budgetId", "costCodeId");

-- CreateIndex
CREATE INDEX "Supplier_companyId_status_category_idx" ON "Supplier"("companyId", "status", "category");

-- CreateIndex
CREATE INDEX "Supplier_companyId_name_idx" ON "Supplier"("companyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_companyId_code_key" ON "Supplier"("companyId", "code");

-- CreateIndex
CREATE INDEX "MaterialRequest_companyId_projectId_status_idx" ON "MaterialRequest"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialRequest_companyId_requestNumber_key" ON "MaterialRequest"("companyId", "requestNumber");

-- CreateIndex
CREATE INDEX "MaterialRequestItem_materialRequestId_idx" ON "MaterialRequestItem"("materialRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflow_companyId_entityType_name_key" ON "ApprovalWorkflow"("companyId", "entityType", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalStep_workflowId_stepNumber_key" ON "ApprovalStep"("workflowId", "stepNumber");

-- CreateIndex
CREATE INDEX "ApprovalInstance_companyId_status_idx" ON "ApprovalInstance"("companyId", "status");

-- CreateIndex
CREATE INDEX "ApprovalInstance_entityType_entityId_idx" ON "ApprovalInstance"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ApprovalAction_companyId_instanceId_createdAt_idx" ON "ApprovalAction"("companyId", "instanceId", "createdAt");
