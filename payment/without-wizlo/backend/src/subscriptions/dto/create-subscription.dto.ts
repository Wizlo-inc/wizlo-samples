import { IsString, IsIn, IsOptional, IsEmail } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  patientId: string;

  @IsIn(['1-month', '3-month', '6-month'])
  planType: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
