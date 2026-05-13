import { IsString, IsNumber, IsOptional, IsIn, IsArray, IsUUID, Min, IsPositive, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsArray()
  @IsString({ each: true })
  productIds: string[];

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  planPrice: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  firstPurchaseDiscount?: number;

  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  fulfillmentCycle: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  fulfillmentInterval: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  fulfillmentDateChangeCutoffHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pauseCutoffDays?: number;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
  status?: string;

  @IsOptional()
  @IsIn(['PRODUCT', 'SERVICE'])
  planCreatedFor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxRenewal?: number;

  @IsUUID()
  reassessmentFormId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
