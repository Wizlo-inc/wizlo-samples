'use client';
import { ChatWidget } from '@wizlo/chat-widget';
import type { MenuItemConfig } from '@wizlo/chat-widget';
import '@wizlo/chat-widget/styles.css';

export interface ChatPanelProps {
  baseUrl: string;
  authToken: string;
  orderNo: string;
  primaryColor: string;
  secondaryColor: string;
  showMenu: boolean;
}

/**
 * Thin wrapper around the drop-in <ChatWidget>. Loaded client-side only
 * (see page.tsx) because the widget manages its own Redux store and opens a
 * browser-side Azure Communication Services connection.
 *
 * The widget itself calls the Wizlo backend (initParams.baseUrl) directly:
 *   POST /chats/order-thread/patient  → create/return the thread for orderNo
 *   POST /chats/token                 → ACS token for the live connection
 *   GET/POST /chats/:threadId/messages…
 * We never write any of that — mounting the component is the whole integration.
 */
export default function ChatPanel(props: ChatPanelProps) {
  const menuItems: MenuItemConfig[] = [
    { label: 'End Chat', action: () => alert('End Chat clicked'), icon: '🔚' },
    { label: 'Transfer Chat', action: () => alert('Transfer Chat clicked'), icon: '🔄' },
  ];

  return (
    <ChatWidget
      initParams={{
        baseUrl: props.baseUrl,
        authToken: props.authToken,
        metaData: { orderNo: props.orderNo },
      }}
      primaryColor={props.primaryColor}
      secondaryColor={props.secondaryColor}
      menuItems={menuItems}
      showMenu={props.showMenu}
    />
  );
}
