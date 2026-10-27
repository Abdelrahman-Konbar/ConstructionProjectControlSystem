/*
  Warnings:

  - Added the required column `updatedAt` to the `Document` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubcontractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_ASSIGNED', 'STATUS_CHANGED', 'PROJECT_ASSIGNMENT', 'SYSTEM');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "settings" JSONB,
ADD COLUMN     "vatNumber" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "size" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER,
    "storageKey" TEXT NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcontract" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "subcontractorId" UUID NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "contractAmount" DECIMAL(18,2) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "retentionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "status" "SubcontractStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcontract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcontractProgress" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "subcontractId" UUID NOT NULL,
    "progressPercent" DECIMAL(5,2) NOT NULL,
    "completedValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "certifiedValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "retentionValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "paymentDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "updateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubcontractProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressUpdate" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "siteId" UUID,
    "boqItemId" UUID,
    "measuredQuantity" DECIMAL(18,4),
    "progressPercent" DECIMAL(5,2) NOT NULL,
    "measuredDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_createdAt_idx" ON "DocumentVersion"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "Subcontract_companyId_projectId_status_idx" ON "Subcontract"("companyId", "projectId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Subcontract_companyId_contractNumber_key" ON "Subcontract"("companyId", "contractNumber");

-- CreateIndex
CREATE INDEX "SubcontractProgress_companyId_projectId_subcontractId_updat_idx" ON "SubcontractProgress"("companyId", "projectId", "subcontractId", "updateDate");

-- CreateIndex
CREATE INDEX "ProgressUpdate_companyId_projectId_measuredDate_idx" ON "ProgressUpdate"("companyId", "projectId", "measuredDate");

-- CreateIndex
CREATE INDEX "ProgressUpdate_boqItemId_measuredDate_idx" ON "ProgressUpdate"("boqItemId", "measuredDate");

-- CreateIndex
CREATE INDEX "Notification_companyId_userId_readAt_createdAt_idx" ON "Notification"("companyId", "userId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
