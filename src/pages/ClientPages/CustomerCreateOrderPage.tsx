import { CreateOrderForm } from '../../components/CreateOrderForm';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CustomerCreateOrderPage.module.css';

export function CustomerCreateOrderPage() {
  const navigate = useNavigate();
  const { customer, isLoading, logout } = useCustomerAuth();

  useEffect(() => {
    if (!isLoading && !customer) {
      navigate('/customer/login');
    }
  }, [isLoading, customer, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return <div className={styles.container}>Carregando...</div>;
  }

  if (!customer) {
    return <div className={styles.container}>Redirecionando para login...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerMainRow}>
          <h1>{customer.nickname}</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Sair
          </button>
        </div>
        <p>Novo Pedido</p>
      </div>

      <main className={styles.main}>
        <CreateOrderForm />
      </main>
    </div>
  );
}
