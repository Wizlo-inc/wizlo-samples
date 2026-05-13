import { IsDateString } from 'class-validator';

export class DelayDto {
  @IsDateString()
  newFulfillmentDate: string;
}
