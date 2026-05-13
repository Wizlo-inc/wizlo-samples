import { IsIn } from 'class-validator';

export class UpdatePlanStatusDto {
  @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE'])
  status: string;
}
