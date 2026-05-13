import { IsOptional, IsIn, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['all', 'draft', 'pending', 'partially_paid', 'paid', 'fulfilled', 'cancelled', 'refunded', 'failed'])
  paymentStatus?: string;

  @IsOptional()
  @IsIn(['orderedAt', 'fulfillmentDate', 'deliveredOn', 'paymentStatus', 'updatedAt'])
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
