import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TokenRequestDto } from './dto/token-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  getToken(@Body() dto: TokenRequestDto) {
    return this.authService.getUserToken(dto);
  }
}
