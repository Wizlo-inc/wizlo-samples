import { Module } from '@nestjs/common';
import { ProviderNetworkModule } from './provider-network/provider-network.module';

@Module({ imports: [ProviderNetworkModule] })
export class AppModule {}
