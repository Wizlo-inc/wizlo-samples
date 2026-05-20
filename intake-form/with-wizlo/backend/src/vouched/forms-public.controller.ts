import { Controller, Get, Post, Body, Headers, Req } from '@nestjs/common';
import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { VouchedVerificationService } from './vouched-verification.service';
import {
  CheckPriorVerificationDto,
  VouchedVerifyDto,
  VouchedIdvResultDto,
} from './dto/vouched-verify.dto';

@Controller('forms/public')
export class FormsPublicController {
  constructor(private readonly vouchedService: VouchedVerificationService) {}

  /**
   * GET /forms/public/vouched-public-config
   * Returns the tenant's Vouched public key needed to initialise the JS SDK on the frontend.
   */
  @Get('vouched-public-config')
  getVouchedPublicConfig() {
    return this.vouchedService.getPublicConfig();
  }

  /**
   * POST /forms/public/check-prior-verification
   * Returns immediately if the user was already verified (PHI fingerprint match),
   * allowing the frontend to skip the full IDV flow.
   */
  @Post('check-prior-verification')
  checkPriorVerification(@Body() dto: CheckPriorVerificationDto) {
    return this.vouchedService.checkPriorVerification(dto);
  }

  /**
   * POST /forms/public/vouched-verify
   * Step 1 verification:
   *   1. CrossCheck (name + phone + email) — passes if matchRate >= 85 %
   *   2. DOB verify fallback — passes if matchRate >= 85 %
   *   3. If both fail returns { requiresIdv: true } so the frontend renders the IDV widget
   */
  @Post('vouched-verify')
  vouchedVerify(@Body() dto: VouchedVerifyDto) {
    return this.vouchedService.verify(dto);
  }

  /**
   * POST /forms/public/vouched-idv-result
   * Called by the frontend after the Vouched IDV widget completes.
   * Fetches the job result from Vouched and stores the verified status.
   */
  @Post('vouched-idv-result')
  vouchedIdvResult(@Body() dto: VouchedIdvResultDto) {
    return this.vouchedService.saveIdvResult(dto);
  }

  /**
   * POST /forms/public/vouched-webhook
   * Webhook endpoint called by Vouched servers.
   * Validates the HMAC-SHA1 signature in X-Vouched-Signature before processing.
   */
  @Post('vouched-webhook')
  vouchedWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-vouched-signature') signature: string,
  ) {
    return this.vouchedService.handleWebhook(req.rawBody, signature);
  }
}
