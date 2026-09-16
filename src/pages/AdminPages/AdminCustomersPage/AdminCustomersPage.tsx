import { useEffect, useState } from 'react';
import { useAdminCustomers } from '../../../hooks/useAdminCustomers';
import { formatCurrency } from '../../../utils/formatCurrency';
import AdminBlockConfirmModal from '../AdminBlockConfirmModal/AdminBlockConfirmModal';
import { ActiveCustomerControls } from './ActiveCustomerControls';
import { PendingCustomerAction } from './PendingCustomerAction';
import { PageFlashMessage } from '../../../components/PageFlashMessage/PageFlashMessage';
import styles from './AdminCustomersPage.module.css';

interface AdminCustomersPageProps {
  initialFilter?: string;
  onNavigateToOrders?: (customerNickname: string, customerId?: number) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function AdminCustomersPage({
  initialFilter,
  onNavigateToOrders,
  onError,
  onSuccess,
}: AdminCustomersPageProps) {
  const { allCustomers, loading, error, fetchAllCustomers } = useAdminCustomers({
    onError,
    onSuccess,
  });

  const [activeSubTab, setActiveSubTab] = useState<'active' | 'pending' | 'blocked'>(
    initialFilter === 'PENDENTE' ? 'pending' : initialFilter === 'BLOQUEADO' ? 'blocked' : 'active'
  );
  const [searchInput, setSearchInput] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [blockCustomerData, setBlockCustomerData] = useState<{
    id: number;
    nickname: string;
    action: 'block' | 'unblock';
  } | null>(null);
  const [pendingCustomerAction, setPendingCustomerAction] = useState<{
    customer: { id: number; nickname: string; phone?: string };
    action: 'approve' | 'discard';
  } | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [openBalanceOnly, setOpenBalanceOnly] = useState(initialFilter === 'EM_ABERTO');
  const [includeOrderDetails, setIncludeOrderDetails] = useState(false);

  useEffect(() => {
    setExpandedCustomerId(null);
    const status =
      activeSubTab === 'pending'
        ? 'PENDENTE'
        : activeSubTab === 'blocked'
          ? 'BLOQUEADO'
          : 'APROVADO';
    fetchAllCustomers({
      status,
      search: searchInput || undefined,
      has_open_balance: activeSubTab === 'active' && openBalanceOnly,
    });
  }, [activeSubTab, searchInput, openBalanceOnly, fetchAllCustomers]);

  useEffect(() => {
    setOpenBalanceOnly(activeSubTab === 'active' && initialFilter === 'EM_ABERTO');
  }, [activeSubTab, initialFilter]);

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

  const handleOpenCustomerOrders = (customerNickname: string) => {
    const customer = allCustomers.find((item) => item.nickname === customerNickname);
    onNavigateToOrders?.(customerNickname, customer?.id);
  };

  const handleOpenApproveFlow = (customer: { id: number; nickname: string; phone?: string }) => {
    setPendingCustomerAction({ customer, action: 'approve' });
  };

  const handleOpenDiscardFlow = (customer: { id: number; nickname: string; phone?: string }) => {
    setPendingCustomerAction({ customer, action: 'discard' });
  };

  const handleClosePendingAction = () => {
    setPendingCustomerAction(null);
  };

  const handleCustomerUpdated = (message?: string) => {
    if (message) {
      setSuccessMessage(message);
    }
    const status =
      activeSubTab === 'pending'
        ? 'PENDENTE'
        : activeSubTab === 'blocked'
          ? 'BLOQUEADO'
          : 'APROVADO';
    fetchAllCustomers({ status, search: searchInput || undefined });
  };

  const displayedCustomers =
    activeSubTab === 'active' && openBalanceOnly
      ? allCustomers.filter(
          (customer) => Number(customer.financial_used || customer.current_balance || 0) > 0
        )
      : allCustomers;
  const hasOpenBalance = allCustomers.some(
    (customer) => Number(customer.financial_used || customer.current_balance || 0) > 0
  );

  const handleOpenBalanceReport = () => {
    const params = new URLSearchParams({
      customer_status: activeSubTab === 'blocked' ? 'BLOQUEADO' : 'APROVADO',
      mode: includeOrderDetails ? 'complete' : 'summary',
    });
    if (activeSubTab === 'active') {
      params.set('has_open_balance', 'true');
    }
    window.open(
      `/admin/customers/open-balance/print?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div>
      <PageFlashMessage
        open={!!successMessage}
        message={successMessage}
        type="success"
        autoCloseMs={0}
        onClose={() => setSuccessMessage('')}
      />
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
          ⏳ Clientes Pendentes
        </button>
        <button
          className={`${styles.subTab} ${activeSubTab === 'blocked' ? styles.active : ''}`}
          onClick={() => setActiveSubTab('blocked')}
        >
          🚫 Clientes Bloqueados
        </button>
      </div>

      {/* Search Input */}
      <div className={styles.searchActions}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome ou apelido..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />
        {((activeSubTab === 'active' && openBalanceOnly) || activeSubTab === 'blocked') && (
          <>
            <label className={styles.reportModeLabel}>
              <input
                type="checkbox"
                checked={includeOrderDetails}
                onChange={(event) => setIncludeOrderDetails(event.target.checked)}
              />
              Incluir detalhes dos pedidos
            </label>
            <button
              type="button"
              className={styles.reportButton}
              disabled={activeSubTab === 'active' && !hasOpenBalance}
              onClick={handleOpenBalanceReport}
            >
              🖨️{' '}
              {activeSubTab === 'blocked'
                ? 'Abrir relatório de bloqueados'
                : 'Abrir relatório de saldo'}
            </button>
          </>
        )}
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
                  <th>
                    {activeSubTab === 'active' ? (
                      <button
                        type="button"
                        className={`${styles.openBalanceHeader} ${
                          openBalanceOnly ? styles.openBalanceHeaderActive : ''
                        }`}
                        aria-pressed={openBalanceOnly}
                        disabled={!openBalanceOnly && !hasOpenBalance}
                        onClick={() => setOpenBalanceOnly((currentValue) => !currentValue)}
                      >
                        EM ABERTO
                      </button>
                    ) : (
                      'EM ABERTO'
                    )}
                  </th>
                  <th className={styles.optionsHeader}>{activeSubTab !== 'blocked' && 'Opções'}</th>
                  <th className={styles.actionHeader}>
                    <div className={styles.actionHeaderLabels}>
                      {expandedCustomerId !== null && <span>Limite</span>}
                      {expandedCustomerId !== null && <span>Senha</span>}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.nickname}</strong>
                    </td>
                    <td>
                      {activeSubTab === 'pending' ? (
                        '—'
                      ) : Number(customer.financial_used || customer.current_balance || 0) > 0 ? (
                        <button
                          type="button"
                          className={styles.balanceLink}
                          onClick={() => onNavigateToOrders?.(customer.nickname, customer.id)}
                          aria-label={`Ver pedidos pendentes de ${customer.nickname}`}
                        >
                          {formatCurrency(customer.financial_used || customer.current_balance)}
                        </button>
                      ) : (
                        <strong>
                          {formatCurrency(customer.financial_used || customer.current_balance)}
                        </strong>
                      )}
                    </td>
                    <td className={styles.optionsCell}>
                      {customer.status === 'APROVADO' && (
                        <button
                          type="button"
                          className={styles.optionsToggle}
                          aria-label={`${expandedCustomerId === customer.id ? 'Ocultar' : 'Mostrar'} operações de ${customer.nickname}`}
                          aria-expanded={expandedCustomerId === customer.id}
                          title={
                            expandedCustomerId === customer.id
                              ? 'Ocultar operações'
                              : 'Editar Saldo Limite, Ver ou Copiar Senha, Enviar Senha WhatsApp'
                          }
                          onClick={() =>
                            setExpandedCustomerId((currentId) =>
                              currentId === customer.id ? null : customer.id
                            )
                          }
                        >
                          {expandedCustomerId === customer.id ? '↓' : '→'}
                        </button>
                      )}
                    </td>
                    <td className={styles.actionCell}>
                      {customer.status === 'APROVADO' && expandedCustomerId === customer.id ? (
                        <div className={`${styles.primaryActions} ${styles.operationActions}`}>
                          <ActiveCustomerControls
                            customer={customer}
                            onBlock={() => handleBlock(customer.id, customer.nickname)}
                            onCustomerUpdated={handleBlockCustomerUpdated}
                            showBlockButton={false}
                          />
                        </div>
                      ) : (
                        <div className={styles.primaryActions}>
                          <button
                            className={`${styles.detailsButton} ${styles.tableActionButton}`}
                            onClick={() => handleOpenCustomerOrders(customer.nickname)}
                          >
                            📋 Pedidos do Cliente
                          </button>
                          {customer.status === 'PENDENTE' && (
                            <>
                              <button
                                className={`${styles.approveButton} ${styles.tableActionButton}`}
                                onClick={() => handleOpenApproveFlow(customer)}
                              >
                                ✅ Aprovar
                              </button>
                              <button
                                className={`${styles.blockButton} ${styles.tableActionButton}`}
                                onClick={() => {
                                  handleOpenDiscardFlow(customer);
                                }}
                              >
                                🗑️ Descartar
                              </button>
                            </>
                          )}
                          {customer.status === 'APROVADO' && (
                            <button
                              className={`${styles.blockButton} ${styles.tableActionButton}`}
                              onClick={() => handleBlock(customer.id, customer.nickname)}
                            >
                              🚫 Bloquear Cliente
                            </button>
                          )}
                          {customer.status === 'BLOQUEADO' && (
                            <button
                              className={`${styles.unblockButton} ${styles.tableActionButton}`}
                              onClick={() => handleUnblock(customer.id, customer.nickname)}
                            >
                              🔓 Desbloquear Cliente
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pendingCustomerAction && (
        <PendingCustomerAction
          customer={pendingCustomerAction.customer}
          action={pendingCustomerAction.action}
          onClose={handleClosePendingAction}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

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
