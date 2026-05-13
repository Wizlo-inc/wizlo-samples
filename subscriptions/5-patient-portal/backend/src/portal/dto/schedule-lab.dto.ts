import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class ScheduleLabDto {
  @IsString()
  bookingKey: string;

  @IsOptional()
  @IsBoolean()
  asyncConfirmation?: boolean;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
