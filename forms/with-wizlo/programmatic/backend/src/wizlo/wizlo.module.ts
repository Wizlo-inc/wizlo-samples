import { Module } from '@nestjs/common';
import { WizloService } from './wizlo.service';

/**
 * Shared module that provides WizloService to any module that imports it.
 * WizloService handles OAuth2 token acquisition and all HTTP requests to the Wizlo API.
 */
@Module({
  providers: [WizloService],
  exports: [WizloService],
})
export class WizloModule {}
