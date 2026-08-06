import { useCallback } from 'react';
import styles from './AdminPages.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'customers' | 'products' | 'orders';
  onTabChange: (tab: 'dashboard' | 'customers' | 'products' | 'orders') => void;
  userName: string;
}

export function AdminLayout({ children, activeTab, onTabChange, userName }: AdminLayoutProps) {
  const handleLogout = useCallback(() => {
    localStorage.removeItem('bread_admin_token');
    localStorage.removeItem('bread_admin_refresh');
    localStorage.removeItem('bread_admin_role');
    localStorage.removeItem('bread_admin_user');
    // Usar window.location.replace para garantir que redireciona imediatamente
    // e evita requisições pendentes com token inválido
    window.location.replace('/admin');
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>🛠️ Painel Admin</h1>
          <p className={styles.userName}>
            Olá, <strong>{userName}</strong>
          </p>
        </div>
        <button className={styles.logoutButton} onClick={handleLogout}>
          🚪 Sair
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.navTabs}>
        <button
          className={`${styles.navTab} ${activeTab === 'dashboard' ? styles.active : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'customers' ? styles.active : ''}`}
          onClick={() => onTabChange('customers')}
        >
          👥 Clientes
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'products' ? styles.active : ''}`}
          onClick={() => onTabChange('products')}
        >
          📦 Produtos
        </button>
        <button
          className={`${styles.navTab} ${activeTab === 'orders' ? styles.active : ''}`}
          onClick={() => onTabChange('orders')}
        >
          📋 Pedidos
        </button>
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
