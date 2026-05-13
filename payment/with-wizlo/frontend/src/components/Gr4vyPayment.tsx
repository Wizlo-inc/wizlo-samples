'use client';
import Embed from '@gr4vy/embed-react';
import { useEffect, useRef } from 'react';

interface Gr4vyPaymentProps {
  token: string;
  amount: number;
  buyerExternalIdentifier: string;
  merchantAccountId: string;
  onComplete: (transaction: any) => void;
  onReady: (submitFn: (() => void) | null) => void;
}

export default function Gr4vyPayment(props: Gr4vyPaymentProps) {
  const embedRef = useRef<any>(null);

  useEffect(() => {
    props.onReady(() => {
      if (embedRef.current) embedRef.current.submit();
      else console.warn('Gr4vy embedRef not ready');
    });
    return () => props.onReady(null);
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
    'stripe-klarna': {
      stripe_connect: {
        on_behalf_of: connectedAccountId,
        transfer_data_destination: connectedAccountId,
      },
    },
    'stripe-affirm': {
      stripe_connect: {
        on_behalf_of: connectedAccountId,
        transfer_data_destination: connectedAccountId,
      },
    },
  };

  const theme = {
    colors: {
      primary: '#ff6b6b',
      danger: '#dc3545',
      focus: '#ff6b6b',
      text: '#1a1a1a',
      labelText: '#333333',
      subtleText: '#666666',
      inputBorder: '#0b60dfff',
      inputBackground: '#ffffffff',
      inputText: '#1a1a1a',
      inputRadioBorder: '#d93c11ff',
      inputRadioBorderChecked: '#ff6b6b',
      pageBackground: '#f9f9f9',
      containerBackground: '#fff0e7',
      containerBorder: '#edb899ff',
    },
    borderWidths: { container: 'thin', input: 'thin' },
    radii: { container: 'rounded', input: 'rounded' },
    shadows: { focusRing: '0 0 0 3px rgba(255, 107, 107, 0.2)' },
    fontSizes: { base: '15px', input: '15px' },
    fonts: {
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  };

  return (
    <Embed
      ref={embedRef}
      gr4vyId={process.env.NEXT_PUBLIC_GR4VY_ID || 'smarteremr'}
      environment={(process.env.NEXT_PUBLIC_GR4VY_ENVIRONMENT as any) || 'sandbox'}
      token={props.token}
      amount={props.amount}
      currency="USD"
      country="US"
      merchantAccountId={props.merchantAccountId}
      buyerExternalIdentifier={props.buyerExternalIdentifier}
      store={true}
      theme={theme}
      display="all"
      intent="capture"
      connectionOptions={connectionOptions}
      onComplete={props.onComplete}
      onEvent={(event: any) => console.log('Gr4vy event:', event)}
    />
  );
}
