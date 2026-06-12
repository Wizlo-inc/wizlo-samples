import { Controller, Get } from '@nestjs/common';
import { ProviderNetworkService } from './provider-network.service';

@Controller('provider-networks')
export class ProviderNetworkController {
  constructor(private readonly providerNetworkService: ProviderNetworkService) {}

  @Get()
  list() {
    return this.providerNetworkService.list();
  }
}
