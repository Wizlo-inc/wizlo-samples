import { IsString, IsNumber, IsOptional, IsIn, IsArray, IsUUID, Min, IsPositive, MaxLength, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  planPrice?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  firstPurchaseDiscount?: number;

  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  fulfillmentCycle?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  fulfillmentInterval?: number;

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
  @IsIn(['PRODUCT', 'SERVICE'])
  planCreatedFor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxRenewal?: number;

  @IsOptional()
  @IsUUID()
  reassessmentFormId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
