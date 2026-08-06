/**
 * Tipos relacionados ao Telegram Bot
 */

export interface TelegramNotification {
  id: string;
  type: 'pending_customer' | 'new_order' | 'approval';
  customer_id?: number;
  order_id?: number;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface TelegramCallbackData {
  action: 'approve_customer' | 'reject_customer' | 'approve_order' | 'reject_order';
  id: number;
  timestamp: string;
}
