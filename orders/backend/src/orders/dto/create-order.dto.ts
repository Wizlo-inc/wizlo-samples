import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsString()
  patientId: string;

  @IsString()
  productOfferId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  qty?: number;

  @IsOptional()
  @IsString()
  @IsIn(['internal_staff', 'provider_network'])
  serviceQueue?: string;

  @IsOptional()
  @IsString()
  @IsIn(['synchronous', 'asynchronous'])
  reviewType?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CLINIC', 'FORMS'])
  source?: string;
}
