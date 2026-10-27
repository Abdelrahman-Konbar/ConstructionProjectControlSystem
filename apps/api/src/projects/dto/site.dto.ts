import { IsEnum, IsOptional, IsString, Length } from 'class-validator'
import { PartialType } from '@nestjs/swagger'
import { SiteStatus } from '@prisma/client'

export class CreateSiteDto { @IsString() @Length(2, 40) code!: string; @IsString() @Length(2, 200) name!: string; @IsOptional() @IsString() location?: string; @IsOptional() @IsEnum(SiteStatus) status?: SiteStatus }
export class UpdateSiteDto extends PartialType(CreateSiteDto) {}
