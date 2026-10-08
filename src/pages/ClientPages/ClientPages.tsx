import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../hooks';
import { BalanceCard } from '../../components/BalanceCard/BalanceCard';
import { OrdersList } from '../../components/CustomerOrdersList/CustomerOrdersList';
import { TransactionHistory } from '../../components/CustomerTransactionHistory/CustomerTransactionHistory';
import { SmartSection } from '../../components/SmartSection/SmartSection';
import { CustomerProfileEditor } from '../../components/CustomerProfileEditor/CustomerProfileEditor';
import { SystemMessageToast } from '../../components/ui/SystemMessageToast/SystemMessageToast';
import { ApiService } from '../../services/api';
import styles from './ClientPages.module.css';

export function ClientPages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, token, isLoading, logout } = useCustomerAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Panificadora');
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const routeState =
      location.state && typeof location.state === 'object'
        ? (location.state as {
            openSection?: string;
            orderConfirmation?: { title?: string; message?: string };
          })
        : null;
    if (!routeState) {
      return;
    }

    if (routeState.openSection === 'orders') {
      setOpenSection('orders');
    }

    if (routeState.orderConfirmation?.title && routeState.orderConfirmation.message) {
      setToastMessage({
        title: routeState.orderConfirmation.title,
        message: routeState.orderConfirmation.message,
      });
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    ApiService.getTenantIdentity()
      .then((identity) => {
        if (identity.trade_name) {
          setTenantName(identity.trade_name);
        }
      })
      .catch(() => {
        // Mantém o nome genérico quando a identidade pública não estiver disponível.
      });
  }, []);

  useEffect(() => {
    if (!isLoading && !customer) {
      navigate('/customer/login');
    }
  }, [isLoading, customer, navigate]);

  useEffect(() => {
    document.documentElement.classList.add('clientPageBody');
    document.body.classList.add('clientPageBody');

    return () => {
      document.documentElement.classList.remove('clientPageBody');
      document.body.classList.remove('clientPageBody');
    };
  }, []);

  if (isLoading) {
    return <div className={styles.container}>Carregando...</div>;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!customer) {
    return <div className={styles.container}>Redirecionando para login...</div>;
  }

  const statusLabel = customer.status === 'APPROVED' ? 'APROVADO' : customer.status;
  const toggleSection = (sectionId: string) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerMainRow}>
            <h1>🥖 {tenantName}</h1>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Sair
            </button>
          </div>
          <div className={styles.headerCustomerRow}>
            <div className={styles.headerCustomerIdentity}>
              <span className={styles.headerStatusLabel}>Cliente:</span>
              <strong className={styles.customerNickname}>{customer.nickname}</strong>
            </div>
            <div className={styles.headerStatusRow}>
              <span className={styles.headerStatusLabel}>Status:</span>
              <strong className={styles.headerStatusValue}>{statusLabel}</strong>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {toastMessage && (
          <SystemMessageToast
            open={true}
            title={toastMessage.title}
            message={toastMessage.message}
            onClose={() => setToastMessage(null)}
          />
        )}

        {token && (
          <SmartSection
            title="Meus dados"
            isOpen={openSection === 'profile'}
            onToggle={() => toggleSection('profile')}
          >
            <CustomerProfileEditor customer={customer} token={token} />
          </SmartSection>
        )}

        <SmartSection
          title="Resumo Financeiro"
          isOpen={openSection === 'financial'}
          onToggle={() => toggleSection('financial')}
        >
        <BalanceCard showHeader={false} enabled={openSection === 'financial'} />
        </SmartSection>

        <SmartSection
          title="Histórico de Pedidos"
          isOpen={openSection === 'orders'}
          onToggle={() => toggleSection('orders')}
        >
        <OrdersList enabled={openSection === 'orders'} />
        </SmartSection>

        <SmartSection
          title="Histórico de Pagamentos"
          isOpen={openSection === 'payments'}
          onToggle={() => toggleSection('payments')}
        >
        <TransactionHistory enabled={openSection === 'payments'} />
        </SmartSection>

        <div className={styles.newOrderButton}>
          <button
            onClick={() => navigate('/customer/orders/create')}
            className={styles.primaryButton}
          >
            🛒 Fazer Novo Pedido
          </button>
        </div>
      </main>
    </div>
  );
}
