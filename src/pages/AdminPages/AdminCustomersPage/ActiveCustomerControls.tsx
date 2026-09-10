import { useEffect, useState } from 'react';
import { PageFlashMessage } from '../../../components/PageFlashMessage/PageFlashMessage';
import { AdminPasswordDialog } from '../AdminPasswordDialog/AdminPasswordDialog';
import { buildAccessWhatsAppMessage, openWhatsAppMessage } from '../../../utils/whatsapp';
import styles from './ActiveCustomerControls.module.css';

interface ActiveCustomer {
  id: number;
  nickname: string;
  phone?: string;
  credit_limit?: string;
  financial_limit?: string;
}

interface ActiveCustomerControlsProps {
  customer: ActiveCustomer;
  onBlock: () => void;
  onCustomerUpdated: () => void;
  showBlockButton?: boolean;
}

type ProtectedAction = 'reveal' | 'share' | 'update-limit' | null;

export function ActiveCustomerControls({
  customer,
  onBlock,
  onCustomerUpdated,
  showBlockButton = true,
}: ActiveCustomerControlsProps) {
  const [creditLimit, setCreditLimit] = useState('');
  const [officialPassword, setOfficialPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [protectedAction, setProtectedAction] = useState<ProtectedAction>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCreditLimit(customer.financial_limit || customer.credit_limit || '');
    setOfficialPassword('');
    setShowPassword(false);
  }, [customer.credit_limit, customer.financial_limit, customer.id]);

  const readErrorMessage = async (response: Response, fallback: string) => {
    const payload = await response.json().catch(() => null);
    return payload?.detail || fallback;
  };

  const getToken = () => {
    const token = localStorage.getItem('bread_admin_token');
    if (!token) throw new Error('Token de admin não encontrado');
    return token;
  };

  const revealOfficialPassword = async (adminPassword: string) => {
    const response = await fetch(`/api/v1/bakery/customers/${customer.id}/reveal-password/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ admin_password: adminPassword.trim() }),
    });
    if (!response.ok) {
      throw new Error(await readErrorMessage(response, 'Erro ao recuperar senha oficial'));
    }
    const data = await response.json();
    if (!data.password_plain_text) {
      throw new Error('Senha oficial não está disponível para este cliente');
    }
    setOfficialPassword(data.password_plain_text);
    setShowPassword(true);
    return data.password_plain_text as string;
  };

  const handleConfirm = async (adminPassword: string) => {
    setIsLoading(true);
    setActionError(null);
    try {
      if (protectedAction === 'reveal') {
        await revealOfficialPassword(adminPassword);
      } else if (protectedAction === 'share') {
        const password = await revealOfficialPassword(adminPassword);
        openWhatsAppMessage(
          customer.phone,
          buildAccessWhatsAppMessage(customer.nickname, password)
        );
        setActionSuccess(`✅ Senha de ${customer.nickname} enviada para o WhatsApp.`);
      } else if (protectedAction === 'update-limit') {
        const response = await fetch(
          `/api/v1/bakery/customers/${customer.id}/update-credit-limit/`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({
              admin_password: adminPassword.trim(),
              credit_limit: creditLimit,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(await readErrorMessage(response, 'Erro ao atualizar limite de crédito'));
        }
        setActionSuccess(`✅ Limite de ${customer.nickname} atualizado com sucesso.`);
        onCustomerUpdated();
      }
      setProtectedAction(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Não foi possível concluir a ação.');
    } finally {
      setIsLoading(false);
    }
  };

  const openProtectedAction = (action: Exclude<ProtectedAction, null>) => {
    setActionError(null);
    setProtectedAction(action);
  };

  const handleCopyPassword = async () => {
    if (!officialPassword) {
      openProtectedAction('reveal');
      return;
    }

    try {
      await navigator.clipboard.writeText(officialPassword);
      setActionSuccess(`✅ Senha de ${customer.nickname} copiada.`);
    } catch {
      setActionError('Não foi possível copiar a senha.');
    }
  };

  const hasLimitChanged = creditLimit !== (customer.financial_limit || customer.credit_limit || '');

  return (
    <>
      <div className={styles.controls}>
        <label className={styles.field}>
          <input
            aria-label={`Limite de ${customer.nickname}`}
            type="number"
            min="0"
            step="0.01"
            value={creditLimit}
            onChange={(event) => setCreditLimit(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <div className={styles.passwordField}>
            <input
              aria-label={`Senha de ${customer.nickname}`}
              type={showPassword ? 'text' : 'password'}
              value={officialPassword || '••••••••'}
              readOnly
            />
            <button
              type="button"
              className={styles.iconButton}
              aria-label={
                showPassword ? 'Ocultar senha' : `Visualizar senha de ${customer.nickname}`
              }
              onClick={() =>
                showPassword ? setShowPassword(false) : openProtectedAction('reveal')
              }
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={`Copiar senha de ${customer.nickname}`}
              title="Copiar senha"
              onClick={handleCopyPassword}
            >
              📋
            </button>
          </div>
        </label>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`Compartilhar senha de ${customer.nickname} no WhatsApp`}
          onClick={() => openProtectedAction('share')}
        >
          📲
        </button>
      </div>

      {(showBlockButton || hasLimitChanged) && (
        <div className={styles.actionButtons}>
          <button
            type="button"
            className={`${styles.actionButton} ${hasLimitChanged ? styles.saveButton : styles.blockButton}`}
            onClick={() => {
              if (hasLimitChanged) {
                openProtectedAction('update-limit');
              } else if (showBlockButton) {
                onBlock();
              }
            }}
          >
            {hasLimitChanged ? '💾 Salvar alteração' : '🚫 Bloquear'}
          </button>
        </div>
      )}

      <AdminPasswordDialog
        isOpen={protectedAction !== null}
        title={
          protectedAction === 'reveal'
            ? 'Visualizar senha'
            : protectedAction === 'share'
              ? 'Compartilhar senha'
              : 'Alterar limite de crédito'
        }
        description="Digite a senha do dono para confirmar esta ação."
        confirmLabel={protectedAction === 'update-limit' ? 'Salvar alteração' : 'Confirmar'}
        isLoading={isLoading}
        onClose={() => setProtectedAction(null)}
        onConfirm={handleConfirm}
      />

      <PageFlashMessage
        open={!!actionError}
        message={actionError}
        type="error"
        onClose={() => setActionError(null)}
      />
      <PageFlashMessage
        open={!!actionSuccess}
        message={actionSuccess}
        type="success"
        onClose={() => setActionSuccess(null)}
      />
    </>
  );
}
