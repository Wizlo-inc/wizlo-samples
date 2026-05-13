import { Controller, Get, Patch, Post, Body, Param } from '@nestjs/common';
import { AutopayService } from './autopay.service';
import { UpdateAutopayDto } from './dto/update-autopay.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Controller('subscriptions')
export class AutopayController {
  constructor(private readonly service: AutopayService) {}

  @Get(':id/autopay')
  getAutopay(@Param('id') id: string) {
    return this.service.getAutopay(id);
  }

  @Patch(':id/autopay')
  updateAutopay(@Param('id') id: string, @Body() dto: UpdateAutopayDto) {
    return this.service.updateAutopay(id, dto);
  }

  @Patch(':id/autopay/payment-method')
  updatePaymentMethod(@Param('id') id: string, @Body() dto: UpdatePaymentMethodDto) {
    return this.service.updatePaymentMethod(id, dto);
  }

  @Post(':id/retry-payment')
  retryPayment(@Param('id') id: string) {
    return this.service.retryPayment(id);
  }

  @Post(':id/resend-payment-link')
  resendPaymentLink(@Param('id') id: string) {
    return this.service.resendPaymentLink(id);
  }
}
