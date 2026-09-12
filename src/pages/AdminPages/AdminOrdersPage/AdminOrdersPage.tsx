import { useState } from 'react';
import { AdminOrdersPanel } from '../../../components/AdminOrdersPanel/AdminOrdersPanel';
import { PageFlashMessage } from '../../../components/PageFlashMessage/PageFlashMessage';
import styles from './AdminOrdersPage.module.css';

export function AdminOrdersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRefresh = (message?: string) => {
    setRefreshTrigger((prev) => prev + 1);
    setErrorMessage(null);
    setSuccessMessage(message || null);
  };

  return (
    <div className={styles.container}>
      <AdminOrdersPanel
        key={refreshTrigger}
        onRefresh={handleRefresh}
        onActionError={setErrorMessage}
      />
      <PageFlashMessage
        open={!!errorMessage}
        message={errorMessage}
        type="error"
        autoCloseMs={0}
        onClose={() => setErrorMessage(null)}
      />
      <PageFlashMessage
        open={!!successMessage}
        message={successMessage}
        type="success"
        autoCloseMs={0}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}
