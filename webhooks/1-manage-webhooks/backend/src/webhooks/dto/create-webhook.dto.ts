import { IsString, IsOptional, IsBoolean, IsInt, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SigningConfigDto {
  @IsString() @IsOptional() secret?: string;
  @IsString() @IsOptional() algorithm?: string;
  @IsString() @IsOptional() headerKey?: string;
}

export class CreateWebhookDto {
  @IsString() url: string;
  @IsString() module: string;
  @IsString() event: string;
  @IsString() @IsOptional() name?: string;
  @IsObject() @IsOptional() customHeaders?: Record<string, string>;
  @IsInt() @Min(1) @Max(10) @IsOptional() maxRetries?: number;
  @IsBoolean() @IsOptional() isSigningRequired?: boolean;
  @ValidateNested() @Type(() => SigningConfigDto) @IsOptional() signingConfig?: SigningConfigDto;
}
