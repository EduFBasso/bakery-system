import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../../hooks';
import { BalanceCard } from '../../components/BalanceCard';
import { OrdersList } from '../../components/OrdersList';
import { TransactionHistory } from '../../components/TransactionHistory';
import { SmartSection } from '../../components/SmartSection';
import styles from './ClientPages.module.css';

export function ClientPages() {
  const navigate = useNavigate();
  const { customer, isLoading, logout } = useCustomerAuth();
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !customer) {
      navigate('/customer/login');
    }
  }, [isLoading, customer, navigate]);

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
  const customerTypeLabel = customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica';
  const fullAddress = [
    customer.street,
    customer.number,
    customer.complement,
    customer.neighborhood,
    customer.city,
    customer.state,
    customer.zip_code,
  ]
    .filter(Boolean)
    .join(', ');
  const toggleSection = (sectionId: string) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerMainRow}>
            <h1>{customer.nickname}</h1>
            <button onClick={handleLogout} className={styles.logoutButton}>
              Sair
            </button>
          </div>
          <div className={styles.headerStatusRow}>
            <span className={styles.headerStatusLabel}>Status:</span>
            <strong className={styles.headerStatusValue}>{statusLabel}</strong>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <SmartSection
          title="Informações da Conta"
          stickyWhenOpen
          isOpen={openSection === 'account'}
          onToggle={() => toggleSection('account')}
        >
          <div className={styles.infoGrid}>
            {customer.company_name && (
              <div className={styles.infoItem}>
                <label>Nome Comercial</label>
                <p>{customer.company_name}</p>
              </div>
            )}
            <div className={styles.infoItem}>
              <label>Apelido</label>
              <p>{customer.nickname}</p>
            </div>
            <div className={styles.infoItem}>
              <label>Tipo</label>
              <p>{customerTypeLabel}</p>
            </div>
            {customer.cnpj_cpf && (
              <div className={styles.infoItem}>
                <label>CPF/CNPJ</label>
                <p>{customer.cnpj_cpf}</p>
              </div>
            )}
            {customer.phone && (
              <div className={styles.infoItem}>
                <label>Telefone</label>
                <p>{customer.phone}</p>
              </div>
            )}
            {fullAddress && (
              <div className={styles.infoItem}>
                <label>Endereço</label>
                <p>{fullAddress}</p>
              </div>
            )}
          </div>
        </SmartSection>

        <SmartSection
          title="Resumo Financeiro"
          stickyWhenOpen
          isOpen={openSection === 'financial'}
          onToggle={() => toggleSection('financial')}
        >
          <BalanceCard showHeader={false} />
        </SmartSection>

        <SmartSection
          title="Meus Pedidos"
          stickyWhenOpen
          isOpen={openSection === 'orders'}
          onToggle={() => toggleSection('orders')}
        >
          <OrdersList showHeader={false} isExpanded={openSection === 'orders'} />
        </SmartSection>

        <div className={styles.newOrderButton}>
          <button
            onClick={() => navigate('/customer/orders/create')}
            className={styles.primaryButton}
          >
            🛒 Fazer Novo Pedido
          </button>
        </div>

        <SmartSection
          title="Histórico de Pagamentos"
          stickyWhenOpen
          isOpen={openSection === 'transactions'}
          onToggle={() => toggleSection('transactions')}
        >
          <TransactionHistory showHeader={false} />
        </SmartSection>
      </main>
    </div>
  );
}
