import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductRxDto {
  @IsOptional()
  @IsString()
  rxNumber?: string;

  @IsOptional()
  @IsString()
  drugForm?: string;

  @IsOptional()
  @IsString()
  drugStrength?: string;

  @IsOptional()
  @IsString()
  directions?: string;

  @IsOptional()
  @IsString()
  rxQty?: string;

  @IsOptional()
  @IsString()
  rxType?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  refills?: number;

  @IsOptional()
  @IsUUID()
  deaScheduleId?: string;

  @IsOptional()
  @IsUUID()
  quantityUnitOfMeasureId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  daysSupply?: number;

  @IsOptional()
  @IsString()
  daw?: string;

  @IsOptional()
  @IsUUID()
  refrigerationTypeId?: string;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsUUID()
  pharmacyId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  clinicIds: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  productId: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @IsBoolean()
  isEncounterRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresLabs?: boolean;

  @IsOptional()
  @IsString()
  productEncounterType?: string;

  @IsOptional()
  @IsString()
  encounterMode?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductRxDto)
  productRx?: CreateProductRxDto;
}
