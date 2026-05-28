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
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Query parameters accepted by `GET /chats-v2`.
 *
 * The Wizlo endpoint filters threads by `req.user.userId`. A plain M2M token
 * has no membership in any clinic's chats, so it returns an empty list. We
 * therefore mint a user-scoped token from `userEmail` (a clinic staff user)
 * before calling Wizlo — see `WizloService.requestAsUser`.
 *
 * This mirrors the integration-facing subset of Wizlo's ChatQueryDto. Only the
 * fields a third-party client typically needs are exposed here; the full list
 * also supports SLA / clinic / state filters used by the internal Wizlo portal.
 */
export class ListThreadsQueryDto {
  /** Email of the clinic staff user whose chats should be listed. */
  @IsNotEmpty()
  @IsEmail()
  userEmail!: string;

  @IsOptional()
  @IsEnum(['created_unassigned', 'active', 'resolved', 'escalated'])
  status?: 'created_unassigned' | 'active' | 'resolved' | 'escalated';

  @IsOptional()
  @IsEnum(['medical', 'non_medical'])
  type?: 'medical' | 'non_medical';

  /** Filter to a single encounter's thread (GFE ID, e.g. EA00000077). */
  @IsOptional()
  @IsString()
  encounterId?: string;

  /** Free-text search by patient name, email, or order number. */
  @IsOptional()
  @IsString()
  search?: string;

  /** Only return threads that currently have unread messages. */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  hasUnread?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

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
