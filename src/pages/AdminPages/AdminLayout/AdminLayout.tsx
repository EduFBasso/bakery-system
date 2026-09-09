import { useCallback } from 'react';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'customers' | 'products' | 'orders' | 'settings';
  onTabChange: (tab: 'dashboard' | 'customers' | 'products' | 'orders' | 'settings') => void;
  userName: string;
  tenant?: {
    trade_name?: string;
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    };
  };
}

export function AdminLayout({
  children,
  activeTab,
  onTabChange,
  userName,
  tenant,
}: AdminLayoutProps) {
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
          <h1>🛠️ Painel Admin · {userName}</h1>
          <p className={styles.tenantName}>
            {tenant?.trade_name || 'Gerenciamento simples e eficiente para seu negócio'}
          </p>
          {tenant?.address && (
            <p className={styles.tenantAddress}>
              {[
                [tenant.address.street, tenant.address.number].filter(Boolean).join(', '),
                [tenant.address.neighborhood, tenant.address.city, tenant.address.state]
                  .filter(Boolean)
                  .join(' - '),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
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
        <button
          className={`${styles.navTab} ${activeTab === 'settings' ? styles.active : ''}`}
          onClick={() => onTabChange('settings')}
        >
          ⚙️ Configurações
        </button>
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
