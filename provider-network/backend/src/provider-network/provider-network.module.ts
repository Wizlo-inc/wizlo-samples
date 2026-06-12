import { Module } from '@nestjs/common';
import { WizloModule } from '../wizlo/wizlo.module';
import { ProviderNetworkController } from './provider-network.controller';
import { ProviderNetworkService } from './provider-network.service';

@Module({
  imports: [WizloModule],
  controllers: [ProviderNetworkController],
  providers: [ProviderNetworkService],
})
export class ProviderNetworkModule {}
