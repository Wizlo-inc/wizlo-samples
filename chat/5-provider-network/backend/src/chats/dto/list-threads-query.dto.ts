import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsString,
  IsInt,
  IsEmail,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Query parameters for the provider-network chats list. Same filter surface as
 * the clinic list — Wizlo applies them across every clinic the network serves.
 *
 * `userEmail` is a **provider-network staff user**. The backend exchanges it
 * for a user-scoped Wizlo token via `POST /oauth/user-token`; without that,
 * the M2M client identity has no provider-network membership and Wizlo
 * returns no results.
 */
export class ListThreadsQueryDto {
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;

  @IsOptional()
  @IsEnum(['created_unassigned', 'active', 'resolved', 'escalated'])
  status?: 'created_unassigned' | 'active' | 'resolved' | 'escalated';

  @IsOptional()
  @IsEnum(['medical', 'non_medical'])
  type?: 'medical' | 'non_medical';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  hasUnread?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @IsEnum(['createdAt', 'lastMessageSentAt', 'patientName', 'status'])
  sortBy?: 'createdAt' | 'lastMessageSentAt' | 'patientName' | 'status' =
    'lastMessageSentAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
