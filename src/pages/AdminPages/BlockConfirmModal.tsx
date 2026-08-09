import { useState } from 'react';
import { AdminPasswordDialog } from './AdminPasswordDialog';

interface BlockConfirmModalProps {
  isOpen: boolean;
  customerId: number;
  customerNickname: string;
  action: 'block' | 'unblock';
  onClose: () => void;
  onCustomerUpdated: () => void;
}

export default function BlockConfirmModal({
  isOpen,
  customerId,
  customerNickname,
  action,
  onClose,
  onCustomerUpdated,
}: BlockConfirmModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const readErrorMessage = async (response: Response, fallbackMessage: string) => {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (data?.detail) {
        return data.detail;
      }
      return fallbackMessage;
    }

    const text = (await response.text()).trim();
    return text || fallbackMessage;
  };

  const handleConfirm = async (adminPassword: string) => {
    const normalizedAdminPassword = adminPassword
      .replace(/[\u00A0\u200B-\u200D\u2060\uFEFF]/g, '')
      .trim();

    if (!normalizedAdminPassword) {
      setActionError('Digite a senha do dono para continuar');
      return;
    }

    setIsLoading(true);
    setActionError(null);

    try {
      const token = localStorage.getItem('bread_admin_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const endpoint = action === 'block' ? '/block/' : '/unblock/';
      const actionName = action === 'block' ? 'bloquear' : 'desbloquear';

      const response = await fetch(`/api/v1/bakery/customers/${customerId}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          admin_password: normalizedAdminPassword,
          reason: action === 'block' ? 'Bloqueado via admin panel' : 'Desbloqueado via admin panel',
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response, `Erro ao ${actionName} cliente`);
        throw new Error(message);
      }

      onCustomerUpdated();
      onClose();
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : `Erro ao ${action === 'block' ? 'bloquear' : 'desbloquear'} cliente`;
      setActionError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setActionError(null);
    onClose();
  };

  return (
    <AdminPasswordDialog
      isOpen={isOpen}
      title={action === 'block' ? 'Confirmar Bloqueio' : 'Confirmar Desbloqueio'}
      description={`Digite a senha do dono para ${action === 'block' ? 'bloquear' : 'desbloquear'} ${customerNickname}.`}
      confirmLabel={action === 'block' ? 'Bloquear Cliente' : 'Desbloquear Cliente'}
      isLoading={isLoading}
      error={actionError}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );
}
