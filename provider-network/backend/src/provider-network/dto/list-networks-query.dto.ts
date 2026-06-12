import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListNetworksQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  supportsSync?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  supportsAsync?: boolean;
}
