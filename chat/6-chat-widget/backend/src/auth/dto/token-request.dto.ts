import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * The frontend only sends the patient's email. The client_id / client_secret
 * and Wizlo base URL live in the backend's environment and never reach the
 * browser.
 */
export class TokenRequestDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;
}
