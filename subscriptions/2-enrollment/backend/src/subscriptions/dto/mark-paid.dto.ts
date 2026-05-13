import { IsUUID, IsString } from 'class-validator';

export class MarkPaidDto {
  @IsUUID()
  clientSubscriptionId: string;

  @IsString()
  transactionId: string;
}
