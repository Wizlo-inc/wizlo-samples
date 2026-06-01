import { IsString, IsEmail, IsOptional } from 'class-validator';

/** Minimum fields required to create a new patient in Wizlo. */
export class CreatePatientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;
}

/** All fields are optional — only the ones provided will be updated. */
export class UpdatePatientDto {
  @IsOptional() @IsString()
  firstName?: string;

  @IsOptional() @IsString()
  lastName?: string;

  @IsOptional() @IsEmail()
  email?: string;
}
