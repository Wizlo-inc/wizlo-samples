import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const CANCELLATION_REASONS = [
  'I am experiencing too many side effects',
  'Completed the current treatment',
  'Too expensive',
  "Using another company's product",
  'Health or medical reasons',
  'Others',
] as const;

export class CancelDto {
  @IsIn(CANCELLATION_REASONS)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
