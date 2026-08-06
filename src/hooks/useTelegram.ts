import { useCallback } from 'react';

export function useTelegram() {
  const notifyPendingCustomer = useCallback(async (customerId: number) => {
    try {
      const response = await fetch('/api/telegram/notify-pending-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
      return response.json();
    } catch (error) {
      console.error('Erro ao notificar Telegram:', error);
      throw error;
    }
  }, []);

  const notifyNewOrder = useCallback(async (orderId: number) => {
    try {
      const response = await fetch('/api/telegram/notify-new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      return response.json();
    } catch (error) {
      console.error('Erro ao notificar pedido:', error);
      throw error;
    }
  }, []);

  return { notifyPendingCustomer, notifyNewOrder };
}
