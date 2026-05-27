import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  categoryName: string;

  @IsOptional()
  @IsString()
  reviewOften?: string;

  @IsOptional()
  @IsBoolean()
  reviewRecurring?: boolean;
}
