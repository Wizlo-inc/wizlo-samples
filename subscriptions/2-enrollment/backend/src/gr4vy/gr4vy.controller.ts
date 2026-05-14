import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { Gr4vyService } from './gr4vy.service';

@Controller('payments')
export class Gr4vyController {
  constructor(private readonly gr4vyService: Gr4vyService) {}

  @Post('token')
  async generateToken(
    @Body() body: { amount?: number; currency?: string; buyerExternalIdentifier?: string },
  ) {
    try {
      const token = await this.gr4vyService.generateEmbedToken(
        body.amount ?? 1000,
        body.currency ?? 'USD',
        body.buyerExternalIdentifier,
      );
      return { token };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpException({ error: message }, HttpStatus.BAD_GATEWAY);
    }
  }
}
