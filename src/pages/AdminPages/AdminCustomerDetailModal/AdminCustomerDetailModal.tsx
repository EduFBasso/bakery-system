import React, { useEffect, useState } from 'react';
import { PageFlashMessage } from '../../../components/PageFlashMessage/PageFlashMessage';
import { useAdminCustomers } from '../../../hooks/useAdminCustomers';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDocument } from '../../../utils/formatDocument';
import { formatDate } from '../../../utils/formatDate';
import { formatPhone } from '../../../utils/formatPhone';
import { normalizeCustomerStatus } from '../../../utils/normalizeCustomerStatus';
import {
  buildAccessWhatsAppMessage,
  normalizeWhatsAppPhone,
  openWhatsAppMessage,
} from '../../../utils/whatsapp';
import { AdminPasswordDialog } from '../AdminPasswordDialog/AdminPasswordDialog';
import { CustomerPrintView, type PrintableCustomer } from './CustomerPrintView';
import styles from './AdminCustomerDetailModal.module.css';

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
    <path
      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m20 6-11 11-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 20h9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20l1.1-4.7A8.5 8.5 0 1 1 20.5 11.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.7 8.9c.2-.5.4-.5.6-.5h.5c.2 0 .4.1.4.3l.4 1c.1.2 0 .4-.1.6l-.4.5c-.1.1-.1.3 0 .4.3.6.8 1.1 1.4 1.4.1.1.3.1.4 0l.5-.4c.2-.1.4-.2.6-.1l1 .4c.2.1.3.2.3.4v.5c0 .2 0 .4-.5.6-.5.2-1.1.2-1.6 0-1.3-.5-2.3-1.5-2.8-2.8-.2-.5-.2-1.1 0-1.6Z"
      fill="currentColor"
    />
  </svg>
);

interface AdminCustomerDetailModalProps {
  customerId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdated: (message?: string) => void;
  autoOpenApproveConfirm?: boolean;
  autoOpenDiscardConfirm?: boolean;
}

export const AdminCustomerDetailModal: React.FC<AdminCustomerDetailModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onCustomerUpdated,
  autoOpenApproveConfirm = false,
  autoOpenDiscardConfirm = false,
}) => {
  const { customerDetail, fetchCustomerDetail, loading, error } = useAdminCustomers();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [closeAfterSuccess, setCloseAfterSuccess] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [securityDialogTitle, setSecurityDialogTitle] = useState('');
  const [securityDialogDescription, setSecurityDialogDescription] = useState('');
  const [securityDialogConfirmLabel, setSecurityDialogConfirmLabel] = useState('');
  const [pendingSecureAction, setPendingSecureAction] = useState<
    | 'approve'
    | 'cancel-pending'
    | 'edit-credit-limit'
    | 'set-password'
    | 'view-password'
    | 'copy-password'
    | 'share-password'
    | null
  >(null);

  const [creditLimit, setCreditLimit] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetail(customerId);
      setActionError(null);
      setActionSuccess(null);
      setCloseAfterSuccess(false);
      setCreditLimit('');
      setShowPassword(false);
      setCurrentPassword('');
      setCopiedToClipboard(false);

      if (autoOpenApproveConfirm || autoOpenDiscardConfirm) {
        const action = autoOpenApproveConfirm ? 'approve' : 'cancel-pending';
        setPendingSecureAction(action);
        setSecurityDialogTitle(
          autoOpenApproveConfirm ? 'Confirmar Aprovação' : 'Descartar cadastro pendente'
        );
        setSecurityDialogDescription(
          autoOpenApproveConfirm
            ? 'Digite a senha do dono para aprovar este cadastro e gerar a senha oficial.'
            : 'Digite a senha para remover este cadastro pendente permanentemente.'
        );
        setSecurityDialogConfirmLabel(
          autoOpenApproveConfirm ? 'Confirmar Aprovação' : 'Descartar cadastro'
        );
        setSecurityDialogOpen(true);
      } else {
        setSecurityDialogOpen(false);
        setPendingSecureAction(null);
      }
    }
  }, [isOpen, customerId, fetchCustomerDetail, autoOpenApproveConfirm, autoOpenDiscardConfirm]);

  if (!isOpen || !customerId) {
    return null;
  }

  const formatAddress = (value: PrintableCustomer) =>
    [
      value?.street,
      value?.number,
      value?.complement,
      value?.neighborhood,
      value?.city,
      value?.state,
      value?.zip_code ? `CEP ${value.zip_code}` : undefined,
    ]
      .filter(Boolean)
      .join(', ') || 'Não informado';

  const handlePrint = () => window.print();

  const normalizeSecretInput = (value: string) =>
    value.replace(/[\u00A0\u200B-\u200D\u2060\uFEFF]/g, '').trim();

  const readErrorMessage = async (response: Response, fallbackMessage: string) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.detail) {
        return data.detail;
      }
      if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) {
        return String(data.non_field_errors[0]);
      }
      return fallbackMessage;
    }

    const text = (await response.text()).trim();
    if (!text) {
      return fallbackMessage;
    }

    // Avoid showing raw HTML blobs from backend debug pages.
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      return fallbackMessage;
    }

    return text;
  };

  const customer = customerDetail;

  const normalizedStatus = normalizeCustomerStatus(customer?.status);
  const isPending = normalizedStatus === 'PENDENTE';
  const isBlocked = normalizedStatus === 'BLOQUEADO';
  const canManageSensitiveActions = normalizedStatus === 'APROVADO';
  const normalizedWhatsAppPhone = normalizeWhatsAppPhone(customer?.phone);

  const executeApprove = async (adminPassword: string) => {
    const normalizedAdminPassword = normalizeSecretInput(adminPassword);
    if (!creditLimit) {
      setActionError('Limite de crédito é obrigatório');
      return;
    }

    if (!normalizedAdminPassword) {
      setActionError('Digite a senha do dono para aprovar o cliente');
      return;
    }

    if (parseFloat(creditLimit) <= 0) {
      setActionError('Limite de crédito deve ser maior que 0');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setCloseAfterSuccess(false);
    try {
      const token = localStorage.getItem('bread_admin_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`/api/v1/bakery/customers/${customerId}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          credit_limit: creditLimit,
          admin_password: normalizedAdminPassword,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Erro ao aprovar cliente');
        throw new Error(message);
      }

      const data = await response.json();
      const approvedPassword = data.password_plain_text || '';
      setCurrentPassword(approvedPassword);
      setCloseAfterSuccess(true);
      setActionSuccess(`✅ Aprovação de ${customer?.nickname || 'cliente'} efetivada com sucesso.`);
      setSecurityDialogOpen(false);
      setPendingSecureAction(null);
      onCustomerUpdated(
        `✅ Aprovação de ${customer?.nickname || 'cliente'} efetivada com sucesso.`
      );
      await fetchCustomerDetail(customerId);

      if (customer?.phone && approvedPassword) {
        openWhatsAppMessage(
          customer.phone,
          buildAccessWhatsAppMessage(customer.nickname || 'Cliente', approvedPassword)
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao aprovar cliente';
      setActionError(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const revealOfficialPassword = async (adminPassword: string) => {
    const normalizedAdminPassword = normalizeSecretInput(adminPassword);
    const token = localStorage.getItem('bread_admin_token');
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`/api/v1/bakery/customers/${customerId}/reveal-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ admin_password: normalizedAdminPassword }),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response, 'Erro ao recuperar senha oficial');
      throw new Error(message);
    }

    const data = await response.json();
    const password = data.password_plain_text || '';
    if (!password) {
      throw new Error('Senha oficial não está disponível para este cliente');
    }

    setCurrentPassword(password);
    return password;
  };

  const executeCancelPending = async (adminPassword: string) => {
    const normalizedAdminPassword = normalizeSecretInput(adminPassword);
    if (!normalizedAdminPassword) {
      setActionError('Digite a senha do dono para cancelar o cadastro');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setCloseAfterSuccess(false);

    try {
      const token = localStorage.getItem('bread_admin_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`/api/v1/bakery/customers/${customerId}/reject/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_password: normalizedAdminPassword,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Erro ao cancelar cadastro');
        throw new Error(message);
      }

      setCloseAfterSuccess(true);
      setActionSuccess(`✅ Cadastro de ${customer?.nickname || 'cliente'} descartado com sucesso.`);
      setSecurityDialogOpen(false);
      setPendingSecureAction(null);
      onCustomerUpdated();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao cancelar cadastro';
      setActionError(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeUpdateCreditLimit = async (adminPassword: string) => {
    const normalizedAdminPassword = normalizeSecretInput(adminPassword);
    if (!normalizedAdminPassword) {
      setActionError('Digite a senha do dono para atualizar o limite de crédito');
      return;
    }

    if (!creditLimit) {
      setActionError('Limite de crédito é obrigatório');
      return;
    }

    if (parseFloat(creditLimit) <= 0) {
      setActionError('Limite de crédito deve ser maior que 0');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);
    setActionSuccess(null);
    setCloseAfterSuccess(false);

    try {
      const token = localStorage.getItem('bread_admin_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`/api/v1/bakery/customers/${customerId}/update-credit-limit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_password: normalizedAdminPassword,
          credit_limit: creditLimit,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Erro ao atualizar limite de crédito');
        throw new Error(message);
      }

      setActionSuccess('✅ Limite de crédito atualizado com sucesso.');
      setSecurityDialogOpen(false);
      setPendingSecureAction(null);
      onCustomerUpdated();
      await fetchCustomerDetail(customerId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar limite de crédito';
      setActionError(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const copyPasswordToClipboard = async (text: string) => {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error('Não foi possível copiar no navegador atual');
    }
  };

  const executeSetPassword = async (adminPassword: string) => {
    const normalizedAdminPassword = normalizeSecretInput(adminPassword);
    if (!normalizedAdminPassword) {
      setActionError('Digite a senha do dono para alterar a senha do cliente');
      return;
    }

    setIsActionLoading(true);
    setActionError(null);
    setCloseAfterSuccess(false);
    try {
      const token = localStorage.getItem('bread_admin_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`/api/v1/bakery/customers/${customerId}/set-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_password: normalizedAdminPassword,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, 'Erro ao atualizar senha do cliente');
        throw new Error(message);
      }

      const data = await response.json();
      const updatedPassword = data.password_plain_text || '';
      setCurrentPassword(updatedPassword);

      setActionSuccess(
        '✅ Nova senha definida com sucesso. Use copiar ou compartilhar para enviar.'
      );
      setSecurityDialogOpen(false);
      setPendingSecureAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar senha do cliente');
    } finally {
      setIsActionLoading(false);
    }
  };

  const openSecurityDialog = (
    action:
      | 'approve'
      | 'cancel-pending'
      | 'edit-credit-limit'
      | 'set-password'
      | 'view-password'
      | 'copy-password'
      | 'share-password'
  ) => {
    setActionError(null);
    setPendingSecureAction(action);

    if (action === 'approve') {
      setSecurityDialogTitle('Confirmar Aprovação');
      setSecurityDialogDescription(
        'Digite a senha do dono para aprovar este cadastro e gerar a senha oficial.'
      );
      setSecurityDialogConfirmLabel('Confirmar Aprovação');
    } else if (action === 'edit-credit-limit') {
      setSecurityDialogTitle('Alterar Limite de Crédito');
      setSecurityDialogDescription(
        'Digite a senha do dono para confirmar a alteração do limite de crédito.'
      );
      setSecurityDialogConfirmLabel('Salvar Limite');
      setCreditLimit(
        (customer?.credit_limit as string) || (customer?.financial_limit as string) || ''
      );
    } else if (action === 'cancel-pending') {
      setSecurityDialogTitle('Descartar cadastro pendente');
      setSecurityDialogDescription(
        'Digite a senha do dono para recusar este cadastro pendente. O cliente será removido permanentemente.'
      );
      setSecurityDialogConfirmLabel('Descartar cadastro');
    } else if (action === 'set-password') {
      setSecurityDialogTitle('Confirmar Nova Senha');
      setSecurityDialogDescription(
        'Digite a senha do dono para gerar uma nova senha oficial do cliente.'
      );
      setSecurityDialogConfirmLabel('Atualizar Senha');
    } else if (action === 'view-password') {
      setSecurityDialogTitle('Confirmar Visualização');
      setSecurityDialogDescription('Digite a senha do dono para visualizar a senha do cliente.');
      setSecurityDialogConfirmLabel('Visualizar Senha');
    } else if (action === 'copy-password') {
      setSecurityDialogTitle('Confirmar Cópia');
      setSecurityDialogDescription('Digite a senha do dono para copiar a senha do cliente.');
      setSecurityDialogConfirmLabel('Copiar Senha');
    } else {
      setSecurityDialogTitle('Confirmar Compartilhamento');
      setSecurityDialogDescription('Digite a senha do dono para compartilhar a senha no WhatsApp.');
      setSecurityDialogConfirmLabel('Compartilhar');
    }

    setSecurityDialogOpen(true);
  };

  const handleSecurityConfirm = async (adminPassword: string) => {
    if (pendingSecureAction === 'approve') {
      await executeApprove(adminPassword);
      return;
    }

    if (pendingSecureAction === 'set-password') {
      await executeSetPassword(adminPassword);
      return;
    }

    if (pendingSecureAction === 'cancel-pending') {
      await executeCancelPending(adminPassword);
      return;
    }

    if (pendingSecureAction === 'edit-credit-limit') {
      await executeUpdateCreditLimit(adminPassword);
      return;
    }

    if (pendingSecureAction === 'view-password') {
      try {
        setIsActionLoading(true);
        setActionError(null);
        await revealOfficialPassword(adminPassword);
        setShowPassword((prev) => !prev);
        setSecurityDialogOpen(false);
        setPendingSecureAction(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Erro ao confirmar senha do dono');
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if (pendingSecureAction === 'copy-password') {
      try {
        setIsActionLoading(true);
        setActionError(null);
        const password = await revealOfficialPassword(adminPassword);
        await copyPasswordToClipboard(password);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
        setSecurityDialogOpen(false);
        setPendingSecureAction(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Erro ao confirmar senha do dono');
      } finally {
        setIsActionLoading(false);
      }
      return;
    }

    if (pendingSecureAction === 'share-password') {
      try {
        setIsActionLoading(true);
        setActionError(null);
        const password = await revealOfficialPassword(adminPassword);

        if (!customer?.phone) {
          throw new Error('Cliente sem telefone para compartilhamento via WhatsApp');
        }

        openWhatsAppMessage(
          customer.phone,
          buildAccessWhatsAppMessage(customer.nickname || 'Cliente', password)
        );
        setSecurityDialogOpen(false);
        setPendingSecureAction(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Erro ao confirmar senha do dono');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleErrorToastClose = () => {
    setActionError(null);
  };

  const handleSuccessToastClose = () => {
    setActionSuccess(null);
    if (closeAfterSuccess) {
      onClose();
    }
  };

  if (autoOpenApproveConfirm || autoOpenDiscardConfirm) {
    return (
      <>
        <AdminPasswordDialog
          isOpen={securityDialogOpen}
          title={securityDialogTitle}
          description={securityDialogDescription}
          confirmLabel={securityDialogConfirmLabel}
          isLoading={isActionLoading}
          extraFieldLabel={autoOpenApproveConfirm ? 'Limite de Crédito (R$)*' : undefined}
          extraFieldValue={autoOpenApproveConfirm ? creditLimit : undefined}
          extraFieldPlaceholder={autoOpenApproveConfirm ? 'Ex: 5000.00' : undefined}
          extraFieldType={autoOpenApproveConfirm ? 'number' : undefined}
          extraFieldRequired={autoOpenApproveConfirm}
          onExtraFieldChange={autoOpenApproveConfirm ? setCreditLimit : undefined}
          onClose={onClose}
          onConfirm={handleSecurityConfirm}
        />
        <PageFlashMessage
          open={!!actionError}
          message={actionError}
          type="error"
          autoCloseMs={3000}
          onClose={handleErrorToastClose}
        />
        <PageFlashMessage
          open={!!actionSuccess}
          message={actionSuccess}
          type="success"
          autoCloseMs={3000}
          onClose={handleSuccessToastClose}
        />
      </>
    );
  }

  const documentLabel = customer?.customer_type === 'PF' ? 'CPF' : 'CNPJ';
  const documentValue =
    customer?.customer_type === 'PF'
      ? customer?.cpf || customer?.cnpj_cpf
      : customer?.cnpj || customer?.cnpj_cpf;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Detalhes do Cliente</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading ? (
          <div className={styles.modalBody}>
            <p>Carregando...</p>
          </div>
        ) : error ? (
          <div className={styles.modalBody}>
            <p className={styles.errorText}>Erro ao carregar detalhes: {error}</p>
          </div>
        ) : customer ? (
          <div className={styles.modalBody}>
            <div className={styles.readOnlyNotice}>
              <strong>Consulta administrativa</strong>
              <span>
                Os dados cadastrais são somente leitura. Apenas o limite de crédito e a senha do
                cliente possuem ações administrativas.
              </span>
            </div>
            {/* Customer Info Section */}
            <div className={styles.detailSection}>
              <h3>Informações do Cliente</h3>
              <div className={styles.detailGrid}>
                {customer.company_name &&
                  customer.company_name.trim() !== customer.nickname?.trim() && (
                    <div className={styles.detailItem}>
                      <label>Nome Comercial</label>
                      <p>{customer.company_name}</p>
                    </div>
                  )}
                <div className={styles.detailItem}>
                  <label>Apelido</label>
                  <p>{customer.nickname || '-'}</p>
                </div>
                <div className={styles.detailItem}>
                  <label>Tipo</label>
                  <p>{customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                </div>
                <div className={styles.detailItem}>
                  <label>{documentLabel}</label>
                  <p>{formatDocument(documentValue, customer.customer_type)}</p>
                </div>
                <div className={styles.detailItem}>
                  <label>Telefone</label>
                  <p>
                    {formatPhone(customer.phone)}
                    {normalizedWhatsAppPhone && (
                      <a
                        href={`https://wa.me/${normalizedWhatsAppPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`${styles.inlineActionLink} ${styles.inlineIconLink} ${styles.whatsAppAction}`}
                        title="Abrir conversa no WhatsApp"
                        aria-label="Abrir conversa no WhatsApp"
                      >
                        <WhatsAppIcon />
                      </a>
                    )}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <label>Endereço</label>
                  <p>
                    {[
                      customer.street,
                      customer.number,
                      customer.complement,
                      customer.neighborhood,
                      customer.city,
                      customer.state,
                      customer.zip_code,
                    ]
                      .filter(Boolean)
                      .join(', ') || '-'}
                    {customer.street && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          [
                            customer.street,
                            customer.number,
                            customer.neighborhood,
                            customer.city,
                            customer.state,
                            customer.zip_code,
                          ]
                            .filter(Boolean)
                            .join(', ')
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.inlineActionLink}
                      >
                        Ver no mapa
                      </a>
                    )}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <label>Status</label>
                  <p>
                    <span
                      className={`${styles.statusBadge} ${styles[`status-${normalizedStatus.toLowerCase()}`]}`}
                    >
                      {normalizedStatus}
                    </span>
                  </p>
                </div>
                <div className={styles.detailInfoPair}>
                  <div className={styles.detailItem}>
                    <label>Cadastro em</label>
                    <p>{formatDate(customer.created_at)}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Limite de Crédito</label>
                    <p className={styles.detailItemWithAction}>
                      <span>
                        {formatCurrency(customer.credit_limit ?? customer.financial_limit)}
                      </span>
                      <button
                        type="button"
                        className={styles.editInlineButton}
                        onClick={() => openSecurityDialog('edit-credit-limit')}
                        disabled={isActionLoading || !canManageSensitiveActions}
                        title="Editar limite de crédito"
                        aria-label="Editar limite de crédito"
                      >
                        <PencilIcon />
                      </button>
                    </p>
                  </div>
                </div>

                <div className={`${styles.detailItem} ${styles.detailFullWidth}`}>
                  <label>Senha do cliente (acesso)</label>
                  {isPending ? (
                    <p className={styles.pendingReadOnly}>
                      Será gerada após a aprovação do cadastro.
                    </p>
                  ) : (
                    <div className={styles.passwordInlineRow}>
                      <input
                        type={showPassword && canManageSensitiveActions ? 'text' : 'password'}
                        value={
                          showPassword && canManageSensitiveActions && currentPassword
                            ? currentPassword
                            : '********'
                        }
                        readOnly
                        className={styles.passwordReadOnlyInput}
                      />
                      <button
                        type="button"
                        onClick={() => openSecurityDialog('view-password')}
                        className={`${styles.inlinePasswordAction} ${styles.iconActionButton}`}
                        disabled={isActionLoading || !canManageSensitiveActions}
                        title="Visualizar senha"
                        aria-label="Visualizar senha"
                      >
                        <EyeIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => openSecurityDialog('copy-password')}
                        className={`${styles.inlinePasswordAction} ${styles.iconActionButton}`}
                        disabled={isActionLoading || !canManageSensitiveActions}
                        title="Copiar senha"
                        aria-label="Copiar senha"
                      >
                        {copiedToClipboard ? <CheckIcon /> : <CopyIcon />}
                      </button>
                      <button
                        type="button"
                        onClick={() => openSecurityDialog('set-password')}
                        className={`${styles.inlinePasswordAction} ${styles.iconActionButton} ${styles.editActionIcon}`}
                        disabled={isActionLoading || !canManageSensitiveActions}
                        title="Editar senha"
                        aria-label="Editar senha"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => openSecurityDialog('share-password')}
                        className={`${styles.inlinePasswordAction} ${styles.iconActionButton} ${styles.whatsAppAction}`}
                        disabled={
                          isActionLoading || !canManageSensitiveActions || !normalizedWhatsAppPhone
                        }
                        title="Compartilhar senha no WhatsApp"
                        aria-label="Compartilhar senha no WhatsApp"
                      >
                        <WhatsAppIcon />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Section - Renamed to Debt */}
            <div className={styles.detailSection}>
              <h3>Resumo Financeiro</h3>
              <div className={styles.balanceDetail}>
                <div className={styles.balanceItem}>
                  <label>Limite de Crédito</label>
                  <p className={styles.balanceValue}>{formatCurrency(customer.financial_limit)}</p>
                </div>
                <div className={styles.balanceItem}>
                  <label>Em Aberto</label>
                  <p className={styles.balanceValue}>{formatCurrency(customer.financial_used)}</p>
                </div>
                <div className={styles.balanceItem}>
                  <label>Limite Disponível</label>
                  <p className={styles.balanceValue}>
                    {formatCurrency(customer.financial_available ?? customer.available_credit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Approval Form - Só mostra quando status é PENDENTE */}
            {isPending && (
              <div className={styles.detailSection}>
                <h3>Deseja aprovar ou cancelar este cliente?</h3>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.modalActions}>
              <button
                className={styles.printButton}
                onClick={handlePrint}
                disabled={isActionLoading}
              >
                🖨️ Imprimir resumo
              </button>
              {isPending && (
                <>
                  <button
                    className={styles.approveButton}
                    onClick={() => openSecurityDialog('approve')}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? '⏳ Processando...' : '✅ Aprovar'}
                  </button>
                  <button
                    className={styles.blockButton}
                    onClick={() => openSecurityDialog('cancel-pending')}
                    disabled={isActionLoading}
                  >
                    🗑️ Descartar
                  </button>
                </>
              )}
              {isBlocked && (
                <p className={styles.blockedNote}>Cliente bloqueado - sem ações disponíveis</p>
              )}
              {!isPending && (
                <button
                  className={styles.closeButtonModal}
                  onClick={onClose}
                  disabled={isActionLoading}
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.modalBody}>
            <p>Cliente não encontrado.</p>
          </div>
        )}

        {customer && (
          <CustomerPrintView
            customer={customer}
            formatCurrency={formatCurrency}
            formatDocument={formatDocument}
            formatPhone={formatPhone}
            formatDate={formatDate}
            formatAddress={formatAddress}
          />
        )}

        <AdminPasswordDialog
          isOpen={securityDialogOpen}
          title={securityDialogTitle}
          description={securityDialogDescription}
          confirmLabel={securityDialogConfirmLabel}
          isLoading={isActionLoading}
          extraFieldLabel={
            pendingSecureAction === 'approve' || pendingSecureAction === 'edit-credit-limit'
              ? 'Limite de Crédito (R$)*'
              : undefined
          }
          extraFieldValue={
            pendingSecureAction === 'approve' || pendingSecureAction === 'edit-credit-limit'
              ? creditLimit
              : undefined
          }
          extraFieldPlaceholder={
            pendingSecureAction === 'approve' || pendingSecureAction === 'edit-credit-limit'
              ? 'Ex: 5000.00'
              : undefined
          }
          extraFieldType={
            pendingSecureAction === 'approve' || pendingSecureAction === 'edit-credit-limit'
              ? 'number'
              : undefined
          }
          extraFieldRequired={
            pendingSecureAction === 'approve' || pendingSecureAction === 'edit-credit-limit'
          }
          onExtraFieldChange={
            pendingSecureAction === 'approve' || pendingSecureAction === 'edit-credit-limit'
              ? setCreditLimit
              : undefined
          }
          onClose={() => setSecurityDialogOpen(false)}
          onConfirm={handleSecurityConfirm}
        />
      </div>

      <PageFlashMessage
        open={!!actionSuccess}
        message={actionSuccess}
        type="success"
        autoCloseMs={3000}
        onClose={handleSuccessToastClose}
      />

      <PageFlashMessage
        open={!!actionError}
        message={actionError}
        type="error"
        autoCloseMs={3000}
        onClose={handleErrorToastClose}
      />
    </div>
  );
};
