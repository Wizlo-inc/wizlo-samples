import { IsOptional, IsString } from 'class-validator';

export class CitiesQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  // Fetch a single city by UUID (takes priority over `search` on the Wizlo side).
  @IsOptional()
  @IsString()
  id?: string;
}
