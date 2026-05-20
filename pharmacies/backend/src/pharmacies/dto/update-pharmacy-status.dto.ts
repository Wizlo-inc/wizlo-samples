import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdatePharmacyStatusDto {
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
