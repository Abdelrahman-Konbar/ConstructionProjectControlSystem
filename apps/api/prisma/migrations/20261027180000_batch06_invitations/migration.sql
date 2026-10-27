-- Add tenant-scoped invitations without changing or deleting existing data.
CREATE TYPE "CompanyInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

CREATE TABLE "CompanyInvitation" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "SystemRole" NOT NULL,
    "projectIds" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "CompanyInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CompanyInvitation_tokenHash_key" ON "CompanyInvitation"("tokenHash");
CREATE INDEX "CompanyInvitation_companyId_email_status_idx" ON "CompanyInvitation"("companyId", "email", "status");
CREATE INDEX "CompanyInvitation_tokenHash_status_expiresAt_idx" ON "CompanyInvitation"("tokenHash", "status", "expiresAt");
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CompanyInvitation" ADD CONSTRAINT "CompanyInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
