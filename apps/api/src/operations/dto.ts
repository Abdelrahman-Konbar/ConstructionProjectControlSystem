import { Type } from 'class-transformer'
import { IsArray, IsDateString, IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'
import { ProjectRole, RecordStatus, SystemRole, SubcontractStatus } from '@prisma/client'

export class SubcontractorPatchDto {
  @IsOptional() @IsString() code?: string
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() contactPerson?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() phone?: string
  @IsOptional() @IsString() specialties?: string
  @IsOptional() @IsEnum(RecordStatus) status?: RecordStatus
}

export class SubcontractDto {
  @IsUUID() subcontractorId!: string
  @IsString() contractNumber!: string
  @IsString() scope!: string
  @Type(() => Number) @IsNumber() @Min(0) contractAmount!: number
  @IsOptional() @IsDateString() startDate?: string
  @IsOptional() @IsDateString() endDate?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(100) retentionPercentage?: number
  @IsOptional() @IsString() paymentTerms?: string
  @IsOptional() @IsEnum(SubcontractStatus) status?: SubcontractStatus
}

export class SubcontractProgressDto {
  @Type(() => Number) @IsNumber() @Min(0) @Max(100) progressPercent!: number
  @Type(() => Number) @IsNumber() @Min(0) completedValue!: number
  @Type(() => Number) @IsNumber() @Min(0) certifiedValue!: number
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsDateString() updateDate?: string
}

export class ProgressUpdateDto {
  @IsOptional() @IsUUID() siteId?: string
  @IsOptional() @IsUUID() boqItemId?: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) measuredQuantity?: number
  @Type(() => Number) @IsNumber() @Min(0) @Max(100) progressPercent!: number
  @IsOptional() @IsDateString() measuredDate?: string
  @IsOptional() @IsString() notes?: string
}

export class DocumentDto {
  @IsOptional() @IsUUID() projectId?: string
  @IsOptional() @IsString() entityType?: string
  @IsOptional() @IsUUID() entityId?: string
  @IsString() name!: string
  @IsOptional() @IsString() originalName?: string
  @IsString() mimeType!: string
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) size?: number
  @IsString() storageKey!: string
}

export class SettingsDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() legalName?: string
  @IsOptional() @IsString() defaultCurrency?: string
  @IsOptional() @IsString() timezone?: string
  @IsOptional() @IsString() vatNumber?: string
  settings?: Record<string, unknown>
}

export class TeamMemberDto {
  @IsEnum(SystemRole) role!: SystemRole
}

export class ProjectMembershipDto {
  @IsUUID() userId!: string
  @IsEnum(ProjectRole) role!: ProjectRole
}

export class InvitationDto {
  @IsEmail() email!: string
  @IsEnum(SystemRole) role!: SystemRole
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) projectIds?: string[]
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(30) expiresInDays?: number
}

export class AcceptInvitationDto {
  @IsString() token!: string
}
