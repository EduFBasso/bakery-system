import { useEffect, useState } from 'react';
import { useAdminCustomers } from '../../hooks/useAdminCustomers';
import { CustomerDetailModal } from './CustomerDetailModal';
import BlockConfirmModal from './BlockConfirmModal';
import styles from './AdminPages.module.css';

interface CustomersPageProps {
  initialFilter?: string;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function CustomersPage({ initialFilter, onError, onSuccess }: CustomersPageProps) {
  const { allCustomers, loading, error, fetchAllCustomers } = useAdminCustomers({
    onError,
    onSuccess,
  });

  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'all'>(
    initialFilter === 'PENDENTE' ? 'pending' : 'all'
  );
  const [searchInput, setSearchInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [blockCustomerData, setBlockCustomerData] = useState<{
    id: number;
    nickname: string;
    action: 'block' | 'unblock';
  } | null>(null);
  const [openApproveDirectly, setOpenApproveDirectly] = useState(false);

  useEffect(() => {
    const status = activeSubTab === 'pending' ? 'PENDENTE' : undefined;
    fetchAllCustomers({ status, search: searchInput || undefined });
  }, [activeSubTab, searchInput, fetchAllCustomers]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleBlock = (id: number, nickname: string) => {
    setBlockCustomerData({ id, nickname, action: 'block' });
    setShowBlockConfirmModal(true);
  };

  const handleUnblock = (id: number, nickname: string) => {
    setBlockCustomerData({ id, nickname, action: 'unblock' });
    setShowBlockConfirmModal(true);
  };

  const handleCloseBlockConfirmModal = () => {
    setShowBlockConfirmModal(false);
    setBlockCustomerData(null);
  };

  const handleBlockCustomerUpdated = () => {
    setSuccessMessage(`✅ Ação realizada com sucesso!`);
    fetchAllCustomers({
      status: activeSubTab === 'pending' ? 'PENDENTE' : undefined,
      search: searchInput || undefined,
    });
  };

  const handleOpenModal = (customerId: number) => {
    setOpenApproveDirectly(false);
    setSelectedCustomerId(customerId);
    setIsModalOpen(true);
  };

  const handleOpenApproveFlow = (customerId: number) => {
    setOpenApproveDirectly(true);
    setSelectedCustomerId(customerId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomerId(null);
    setOpenApproveDirectly(false);
  };

  const handleCustomerUpdated = () => {
    const status = activeSubTab === 'pending' ? 'PENDENTE' : undefined;
    fetchAllCustomers({ status, search: searchInput || undefined });
  };

  const displayedCustomers =
    activeSubTab === 'pending' ? allCustomers.filter((c) => c.status === 'PENDENTE') : allCustomers;

  const formatCurrency = (value?: string) => {
    const numeric = Number.parseFloat(value || '0');
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return `R$ ${safe.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div>
      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* Sub-tabs: Pendentes / Todos */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeSubTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('pending')}
        >
          ⏳ Pendentes de Aprovação
        </button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'all' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('all')}
        >
          👥 Todos os Clientes
        </button>
      </div>

      {/* Search Input */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou apelido..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Table Section */}
      <section className={styles.tableSection}>
        <h2>
          {activeSubTab === 'pending' ? 'Clientes Pendentes de Aprovação' : 'Todos os Clientes'}
        </h2>

        {loading && <p className={styles.emptyState}>Carregando clientes...</p>}

        {!loading && displayedCustomers.length === 0 ? (
          <p className={styles.emptyState}>
            {activeSubTab === 'pending' ? 'Nenhum cliente pendente!' : 'Nenhum cliente encontrado!'}
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Apelido</th>
                  <th>Tipo</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th>Gasto</th>
                  <th className={styles.actionHeader}>Ação</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.nickname}</strong>
                    </td>
                    <td>{customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${styles[`status-${(customer.status || 'pendente').toLowerCase()}`]}`}
                      >
                        {customer.status === 'PENDENTE'
                          ? '⏳ Pendente'
                          : customer.status === 'APROVADO'
                            ? '✅ Aprovado'
                            : '🚫 Bloqueado'}
                      </span>
                    </td>
                    <td>{formatCurrency(customer.financial_used || customer.current_balance)}</td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionButtonsGroup}>
                        <button
                          className={`${styles.detailsButton} ${styles.tableActionButton}`}
                          onClick={() => handleOpenModal(customer.id)}
                        >
                          📋 Detalhes
                        </button>
                        {customer.status === 'PENDENTE' && (
                          <button
                            className={`${styles.approveButton} ${styles.tableActionButton}`}
                            onClick={() => handleOpenApproveFlow(customer.id)}
                          >
                            ✅ Aprovar
                          </button>
                        )}
                        {customer.status === 'APROVADO' && (
                          <button
                            className={`${styles.blockButton} ${styles.tableActionButton}`}
                            onClick={() => handleBlock(customer.id, customer.nickname)}
                          >
                            🚫 Bloquear
                          </button>
                        )}
                        {customer.status === 'BLOQUEADO' && (
                          <button
                            className={`${styles.unblockButton} ${styles.tableActionButton}`}
                            onClick={() => handleUnblock(customer.id, customer.nickname)}
                          >
                            🔓 Desbloquear
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CustomerDetailModal
        customerId={selectedCustomerId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCustomerUpdated={handleCustomerUpdated}
        autoOpenApproveConfirm={openApproveDirectly}
      />

      {blockCustomerData && (
        <BlockConfirmModal
          isOpen={showBlockConfirmModal}
          customerId={blockCustomerData.id}
          customerNickname={blockCustomerData.nickname}
          action={blockCustomerData.action}
          onClose={handleCloseBlockConfirmModal}
          onCustomerUpdated={handleBlockCustomerUpdated}
        />
      )}
    </div>
  );
}
