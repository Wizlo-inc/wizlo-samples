import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdatePharmacyLiveDto {
  @IsBoolean()
  @IsNotEmpty()
  isLive: boolean;
}
