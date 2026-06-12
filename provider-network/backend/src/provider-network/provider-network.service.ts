import { Injectable } from '@nestjs/common';
import { WizloService } from '../wizlo/wizlo.service';

export interface ProviderNetworkItem {
  networkId: string;
  networkName: string;
}

@Injectable()
export class ProviderNetworkService {
  constructor(private readonly wizlo: WizloService) {}

  list(): Promise<ProviderNetworkItem[]> {
    return this.wizlo.request<ProviderNetworkItem[]>(
      '/provider-network/round-robin/available-networks-by-tenant',
    );
  }
}
