/**
 * Telegram Bot Service
 * Gerencia notificações via Telegram Bot
 */

const TELEGRAM_API = '/api/telegram';

export const telegramService = {
  notifyPendingCustomer: async (customerId: number) => {
    const response = await fetch(`${TELEGRAM_API}/notify-pending-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId }),
    });
    if (!response.ok) throw new Error('Erro ao notificar Telegram');
    return response.json();
  },

  notifyNewOrder: async (orderId: number) => {
    const response = await fetch(`${TELEGRAM_API}/notify-new-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
    });
    if (!response.ok) throw new Error('Erro ao notificar pedido');
    return response.json();
  },

  approveCustomer: async (customerId: number) => {
    const response = await fetch(`${TELEGRAM_API}/approve-customer/${customerId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Erro ao aprovar cliente');
    return response.json();
  },

  rejectCustomer: async (customerId: number) => {
    const response = await fetch(`${TELEGRAM_API}/reject-customer/${customerId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Erro ao rejeitar cliente');
    return response.json();
  },
};
