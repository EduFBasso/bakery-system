import { useEffect, useState } from 'react';
import { useAdminCustomers } from '../../../hooks/useAdminCustomers';
import { AdminCustomerDetailModal } from '../AdminCustomerDetailModal/AdminCustomerDetailModal';
import AdminBlockConfirmModal from '../AdminBlockConfirmModal/AdminBlockConfirmModal';
import { formatPhone } from '../../../utils/formatPhone';
import styles from './AdminCustomersPage.module.css';

interface AdminCustomersPageProps {
  initialFilter?: string;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function AdminCustomersPage({ initialFilter, onError, onSuccess }: AdminCustomersPageProps) {
  const { allCustomers, loading, error, fetchAllCustomers } = useAdminCustomers({
    onError,
    onSuccess,
  });

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'pending' | 'blocked'>(
    initialFilter === 'PENDENTE' ? 'pending' : initialFilter === 'BLOQUEADO' ? 'blocked' : 'active'
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
    const status =
      activeSubTab === 'pending'
        ? 'PENDENTE'
        : activeSubTab === 'blocked'
          ? 'BLOQUEADO'
          : 'APROVADO';
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
      status:
        activeSubTab === 'pending'
          ? 'PENDENTE'
          : activeSubTab === 'blocked'
            ? 'BLOQUEADO'
            : 'APROVADO',
      search: searchInput || undefined,
    });
  };

  const handleOpenSummary = (customerId: number) => {
    window.open(`/admin/customers/${customerId}/summary`, '_blank', 'noopener,noreferrer');
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
    const status =
      activeSubTab === 'pending'
        ? 'PENDENTE'
        : activeSubTab === 'blocked'
          ? 'BLOQUEADO'
          : 'APROVADO';
    fetchAllCustomers({ status, search: searchInput || undefined });
  };

  const displayedCustomers = allCustomers;

  const formatCurrency = (value?: string) => {
    const numeric = Number.parseFloat(value || '0');
    const safe = Number.isFinite(numeric) ? numeric : 0;
    return `R$ ${safe.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div>
      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* Sub-tabs: estado do cliente */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTab} ${activeSubTab === 'active' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('active')}
        >
          ✅ Clientes Ativos
        </button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'pending' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('pending')}
        >
          ⏳ Pendentes de Aprovação
        </button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'blocked' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('blocked')}
        >
          🚫 Bloqueados
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
          {activeSubTab === 'pending'
            ? 'Clientes Pendentes de Aprovação'
            : activeSubTab === 'blocked'
              ? 'Clientes Bloqueados'
              : 'Clientes Ativos'}
        </h2>

        {loading && <p className={styles.emptyState}>Carregando clientes...</p>}

        {!loading && displayedCustomers.length === 0 ? (
          <p className={styles.emptyState}>
            {activeSubTab === 'pending'
              ? 'Nenhum cliente pendente!'
              : activeSubTab === 'blocked'
                ? 'Nenhum cliente bloqueado!'
                : 'Nenhum cliente ativo!'}
          </p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Apelido</th>
                  <th>Tipo</th>
                  <th>Telefone</th>
                  <th>EM ABERTO</th>
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
                    <td>{formatPhone(customer.phone) || '—'}</td>
                    <td>
                      {activeSubTab === 'pending'
                        ? '—'
                        : formatCurrency(customer.financial_used || customer.current_balance)}
                    </td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionButtonsGroup}>
                        <button
                          className={`${styles.detailsButton} ${styles.tableActionButton}`}
                          onClick={() => handleOpenSummary(customer.id)}
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

      <AdminCustomerDetailModal
        customerId={selectedCustomerId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCustomerUpdated={handleCustomerUpdated}
        autoOpenApproveConfirm={openApproveDirectly}
      />

      {blockCustomerData && (
        <AdminBlockConfirmModal
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
