import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiService } from '../../../services/api';
import {
  AdminOrderPrintView,
  type PrintableOrder,
  type PrintableOrderCustomer,
} from './AdminOrderPrintView';
import styles from './AdminOrderPrintPage.module.css';

const formatAddress = (profile: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}) =>
  [
    [profile.street, profile.number].filter(Boolean).join(', '),
    [profile.neighborhood, profile.city, profile.state].filter(Boolean).join(' - '),
    profile.zip_code ? `CEP ${profile.zip_code}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ');

export function AdminOrderPrintPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<PrintableOrder | null>(null);
  const [customer, setCustomer] = useState<PrintableOrderCustomer | null>(null);
  const [company, setCompany] = useState({ name: 'Panificadora', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numericOrderId = Number(orderId);
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
      setError('Pedido inválido.');
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('bread_admin_token');
    if (!token) {
      setError('Token de admin não disponível.');
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const loadData = async () => {
      try {
        const orderResponse = await fetch(`/api/v1/bakery/orders/${numericOrderId}/`, { headers });
        if (!orderResponse.ok) throw new Error('Não foi possível carregar o pedido.');
        const loadedOrder = (await orderResponse.json()) as PrintableOrder & { customer_id: number };

        const [customerResponse, tenantProfile] = await Promise.all([
          fetch(`/api/v1/bakery/customers/${loadedOrder.customer_id}/`, { headers }),
          ApiService.getTenantProfile(),
        ]);
        if (!customerResponse.ok) throw new Error('Não foi possível carregar os dados do cliente.');

        setOrder(loadedOrder);
        setCustomer((await customerResponse.json()) as PrintableOrderCustomer);
        setCompany({
          name: tenantProfile.trade_name || 'Panificadora',
          address: formatAddress(tenantProfile),
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Erro ao carregar a impressão.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [orderId]);

  if (loading) return <div className={styles.state}>Carregando pedido...</div>;
  if (error || !order || !customer) {
    return <div className={styles.state}>{error || 'Pedido não encontrado.'}</div>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.toolbar} data-screen-only>
        <button type="button" onClick={() => window.close()} className={styles.backButton}>
          ← Voltar
        </button>
        <button type="button" onClick={() => window.print()} className={styles.printButton}>
          🖨️ Imprimir
        </button>
      </div>
      <section className={styles.paper}>
        <AdminOrderPrintView
          order={order}
          customer={customer}
          companyName={company.name}
          companyAddress={company.address}
          screenPreview
        />
      </section>
    </main>
  );
}
