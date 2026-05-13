import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListPlansQueryDto {
  @IsOptional()
  @IsIn(['all', 'ACTIVE', 'INACTIVE', 'DRAFT'])
  filter?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['PRODUCT', 'SERVICE'])
  planCreatedFor?: string;

  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  fulfillmentCycle?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  fulfillmentInterval?: number;

  @IsOptional()
  @IsIn(['subscriptionId', 'name', 'fulfillmentInterval', 'planPrice', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
