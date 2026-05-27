import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSubcategoryDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subCategoryName: string;
}
