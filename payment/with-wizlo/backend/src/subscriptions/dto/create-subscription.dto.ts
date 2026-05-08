import { IsString, IsIn } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  patientId: string;

  @IsIn(['1-month', '3-month', '6-month'])
  planType: string;
}
