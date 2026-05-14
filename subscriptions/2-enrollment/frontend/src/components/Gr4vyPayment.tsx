'use client';
import Embed from '@gr4vy/embed-react';
import { useEffect, useRef } from 'react';

interface Gr4vyPaymentProps {
  token: string;
  amount: number;
  buyerExternalIdentifier: string;
  onComplete: (transactionId: string) => void;
  onReady: (submitFn: (() => void) | null) => void;
}

export default function Gr4vyPayment({ token, amount, buyerExternalIdentifier, onComplete, onReady }: Gr4vyPaymentProps) {
  const embedRef = useRef<any>(null);

  useEffect(() => {
    onReady(() => {
      if (embedRef.current) embedRef.current.submit();
    });
    return () => onReady(null);
  }, []);

  const connectedAccountId =
    process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID || 'acct_1SXfaOBJt9C7EroP';

  const connectionOptions = {
    'stripe-card': {
      stripe_connect: {
        on_behalf_of: connectedAccountId,
        transfer_data_destination: connectedAccountId,
      },
    },
  };

  const handleComplete = (transaction: any) => {
    const txId: string = transaction?.id ?? transaction?.transactionId ?? '';
    if (txId) onComplete(txId);
  };

  return (
    <Embed
      ref={embedRef}
      gr4vyId={process.env.NEXT_PUBLIC_GR4VY_ID || 'smarteremr'}
      environment={(process.env.NEXT_PUBLIC_GR4VY_ENVIRONMENT as any) || 'sandbox'}
      token={token}
      amount={amount}
      currency="USD"
      country="US"
      merchantAccountId={process.env.NEXT_PUBLIC_GR4VY_MERCHANT_ACCOUNT_ID || 'merchant-47a04580'}
      buyerExternalIdentifier={buyerExternalIdentifier}
      store={true}
      display="all"
      intent="capture"
      connectionOptions={connectionOptions}
      onComplete={handleComplete}
      onEvent={(event: any) => console.log('Gr4vy event:', event)}
    />
  );
}
