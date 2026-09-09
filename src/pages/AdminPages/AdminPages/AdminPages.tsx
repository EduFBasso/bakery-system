import { useState } from 'react';
import { AdminLayout } from '../AdminLayout/AdminLayout';
import { AdminDashboardPage } from '../AdminDashboardPage/AdminDashboardPage';
import { AdminCustomersPage } from '../AdminCustomersPage/AdminCustomersPage';
import { AdminProductsPage } from '../AdminProductsPage/AdminProductsPage';
import { AdminOrdersPage } from '../AdminOrdersPage/AdminOrdersPage';
import { AdminSettingsPage } from '../AdminSettingsPage/AdminSettingsPage';
import { BakeryTenantProfile } from '../../../types';
import styles from './AdminPages.module.css';

interface AdminTenantSnapshot {
  trade_name?: string;
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
}

interface StoredAdminUser {
  first_name?: string;
  last_name?: string;
  email?: string;
  tenant?: AdminTenantSnapshot;
}

function readStoredAdminUser(): StoredAdminUser {
  const storedUser = localStorage.getItem('bread_admin_user');
  if (!storedUser) return {};
  try {
    return JSON.parse(storedUser) as StoredAdminUser;
  } catch {
    return {};
  }
}

export function AdminPages() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'customers' | 'products' | 'orders' | 'settings'
  >('dashboard');
  const [customerFilter, setCustomerFilter] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [storedAdminUser, setStoredAdminUser] = useState(readStoredAdminUser);
  const [tenant, setTenant] = useState<AdminTenantSnapshot | undefined>(storedAdminUser.tenant);
  const userName =
    [storedAdminUser.first_name, storedAdminUser.last_name].filter(Boolean).join(' ').trim() ||
    storedAdminUser.email ||
    'Admin';

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

  const handleTenantUpdated = (profile: BakeryTenantProfile) => {
    const nextTenant: AdminTenantSnapshot = {
      trade_name: profile.trade_name,
      address: {
        street: profile.street,
        number: profile.number,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
      },
    };
    const nextAdminUser = { ...storedAdminUser, tenant: nextTenant };
    setTenant(nextTenant);
    setStoredAdminUser(nextAdminUser);
    localStorage.setItem('bread_admin_user', JSON.stringify(nextAdminUser));
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      userName={userName}
      tenant={tenant}
    >
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
        <AdminSettingsPage
          onError={handleError}
          onSuccess={handleSuccess}
          onTenantUpdated={handleTenantUpdated}
        />
      )}
    </AdminLayout>
  );
}
