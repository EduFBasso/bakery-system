import { useState, useMemo } from 'react';
import { AdminLayout } from '../AdminLayout/AdminLayout';
import { AdminDashboardPage } from '../AdminDashboardPage/AdminDashboardPage';
import { AdminCustomersPage } from '../AdminCustomersPage/AdminCustomersPage';
import { AdminProductsPage } from '../AdminProductsPage/AdminProductsPage';
import { AdminOrdersPage } from '../AdminOrdersPage/AdminOrdersPage';
import { AdminSettingsPage } from '../AdminSettingsPage/AdminSettingsPage';
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

  const handleTabChange = (tab: 'dashboard' | 'customers' | 'products' | 'orders' | 'settings') => {
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
        <AdminDashboardPage
          onNavigateToCustomers={handleNavigateToCustomers}
          onError={handleError}
          onSuccess={handleSuccess}
        />
      )}

      {activeTab === 'customers' && (
        <AdminCustomersPage
          initialFilter={customerFilter}
          onError={handleError}
          onSuccess={handleSuccess}
        />
      )}

      {activeTab === 'products' && <AdminProductsPage />}

      {activeTab === 'orders' && <AdminOrdersPage />}

      {activeTab === 'settings' && (
        <AdminSettingsPage onError={handleError} onSuccess={handleSuccess} />
      )}
    </AdminLayout>
  );
}
