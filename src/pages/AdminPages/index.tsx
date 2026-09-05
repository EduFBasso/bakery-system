import { useState, useMemo } from 'react';
import { AdminLayout } from './AdminLayout';
import { DashboardPage } from './DashboardPage';
import { CustomersPage } from './CustomersPage';
import { ProductsPage } from './ProductsPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { SettingsPage } from './SettingsPage';
import styles from './AdminPages.module.css';

export function AdminPages() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'customers' | 'products' | 'orders' | 'settings'
  >('dashboard');
  const [customerFilter, setCustomerFilter] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const adminUser = localStorage.getItem('bread_admin_user');
  const userName = useMemo(() => {
    if (!adminUser) {
      return 'Admin';
    }
    const parsed = JSON.parse(adminUser) as {
      first_name?: string;
      last_name?: string;
      email?: string;
    };
    return (
      [parsed.first_name, parsed.last_name].filter(Boolean).join(' ').trim() ||
      parsed.email ||
      'Admin'
    );
  }, []);

  const handleNavigateToCustomers = (filter?: string) => {
    setCustomerFilter(filter);
    setActiveTab('customers');
  };

  const handleTabChange = (
    tab: 'dashboard' | 'customers' | 'products' | 'orders' | 'settings'
  ) => {
    setActiveTab(tab);
  };

  const handleError = (error: string) => {
    setErrorMessage(error);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={handleTabChange} userName={userName}>
      {errorMessage && <div className={styles.errorAlert}>{errorMessage}</div>}
      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}

      {activeTab === 'dashboard' && (
        <DashboardPage
          onNavigateToCustomers={handleNavigateToCustomers}
          onError={handleError}
          onSuccess={handleSuccess}
        />
      )}

      {activeTab === 'customers' && (
        <CustomersPage
          initialFilter={customerFilter}
          onError={handleError}
          onSuccess={handleSuccess}
        />
      )}

      {activeTab === 'products' && <ProductsPage />}

      {activeTab === 'orders' && <AdminOrdersPage />}

      {activeTab === 'settings' && <SettingsPage onError={handleError} onSuccess={handleSuccess} />}
    </AdminLayout>
  );
}
