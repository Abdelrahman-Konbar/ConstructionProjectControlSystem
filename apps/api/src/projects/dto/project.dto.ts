import { Type } from 'class-transformer'
import { PartialType } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator'
import { ProjectStatus } from '@prisma/client'

export class CreateProjectDto {
  @IsString() @Length(2, 40) code!: string
  @IsString() @Length(2, 200) name!: string
  @IsOptional() @IsString() clientName?: string
  @IsOptional() @IsString() location?: string
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) contractValue?: number
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) budgetValue?: number
  @IsOptional() @IsDateString() startDate?: string
  @IsOptional() @IsDateString() plannedEndDate?: string
  @IsOptional() @IsUUID() projectManagerId?: string
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(100) progressPercent?: number
  @IsOptional() @IsString() description?: string
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
