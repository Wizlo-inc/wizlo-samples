import { IsString, IsOptional, IsBoolean, IsInt, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SigningConfigDto {
  @IsString() @IsOptional() algorithm?: string;
  @IsString() @IsOptional() headerKey?: string;
}

export class UpdateWebhookDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() url?: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
  @IsInt() @Min(1) @Max(10) @IsOptional() maxRetries?: number;
  @IsBoolean() @IsOptional() isSigningRequired?: boolean;
  @IsObject() @IsOptional() customHeaders?: Record<string, string>;
  @ValidateNested() @Type(() => SigningConfigDto) @IsOptional() signingConfig?: SigningConfigDto;
}
