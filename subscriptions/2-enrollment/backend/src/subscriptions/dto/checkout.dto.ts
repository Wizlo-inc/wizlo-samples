import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsUUID()
  clientSubscriptionId: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
