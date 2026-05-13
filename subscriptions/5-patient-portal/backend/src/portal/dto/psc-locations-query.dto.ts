import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PscLocationsQueryDto {
  @IsString()
  zipCode: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  radius?: number;
}
