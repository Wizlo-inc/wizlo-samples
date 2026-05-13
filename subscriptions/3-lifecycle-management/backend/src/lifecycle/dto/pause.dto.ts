import { IsOptional, IsDateString } from 'class-validator';

export class PauseDto {
  @IsOptional()
  @IsDateString()
  pausedUntilDate?: string;
}
