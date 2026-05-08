import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
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
}
