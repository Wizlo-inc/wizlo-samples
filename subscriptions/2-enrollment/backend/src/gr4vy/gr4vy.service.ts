import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@gr4vy/node';

@Injectable()
export class Gr4vyService {
  private readonly logger = new Logger(Gr4vyService.name);

  private createClient(): Client {
    const gr4vyId = process.env.GR4VY_ID;
    const environment = process.env.GR4VY_ENVIRONMENT || 'sandbox';
    const privateKeyBase64 = process.env.GR4VY_PRIVATE_KEY_BASE64;

    if (!gr4vyId || !privateKeyBase64) {
      throw new Error('Gr4vy environment variables are not configured');
    }

    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString();

    return new Client({
      gr4vyId,
      environment: environment as 'sandbox' | 'production',
      privateKey,
    });
  }

  private async ensureBuyerExists(
    client: Client,
    externalIdentifier: string,
    merchantAccountId: string,
  ): Promise<void> {
    try {
      const result = await client.listBuyers(
        undefined,
        externalIdentifier,
        1,
        undefined,
        { headers: { 'x-gr4vy-merchant-account-id': merchantAccountId } },
      );

      if (!result.body.items || result.body.items.length === 0) {
        this.logger.log(`Creating Gr4vy buyer for: ${externalIdentifier}`);
        await client.newBuyer(
          { externalIdentifier, displayName: externalIdentifier },
          { headers: { 'x-gr4vy-merchant-account-id': merchantAccountId } },
        );
      }
    } catch (err) {
      this.logger.warn(`Could not ensure buyer exists: ${err}`);
    }
  }

  async generateEmbedToken(
    amount: number,
    currency: string,
    buyerExternalIdentifier?: string,
  ): Promise<string> {
    const merchantAccountId =
      process.env.GR4VY_MERCHANT_ACCOUNT_ID || 'merchant-47a04580';

    const client = this.createClient();

    if (buyerExternalIdentifier) {
      await this.ensureBuyerExists(client, buyerExternalIdentifier, merchantAccountId);
    }

    const token = await client.getEmbedToken({
      amount,
      currency,
      merchantAccountId,
      ...(buyerExternalIdentifier && { buyerExternalIdentifier }),
    });

    return token;
  }
}
