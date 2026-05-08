import { IsString, IsArray, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitIntakeDto {
  @IsString()
  full_name: string;

  @IsString()
  date_of_birth: string;

  @IsString()
  gender: string;

  @IsNumber()
  @Type(() => Number)
  height_ft: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  height_in?: number;

  @IsNumber()
  @Type(() => Number)
  weight_lbs: number;

  @IsString()
  activity_level: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  health_goals?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medical_conditions?: string[];

  @IsOptional()
  @IsString()
  current_medications?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsString()
  smoking_status: string;

  @IsString()
  alcohol_use: string;
}
