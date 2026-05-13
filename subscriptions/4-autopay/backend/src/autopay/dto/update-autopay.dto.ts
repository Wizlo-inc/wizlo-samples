import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAutopayDto {
  @IsOptional()
  @IsBoolean()
  autopayEnabled?: boolean;

  @IsOptional()
  @IsString()
  autopayPaymentMethodId?: string;
}
