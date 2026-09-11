import { useState } from 'react';
import { PageFlashMessage } from '../../../components/PageFlashMessage/PageFlashMessage';
import { AdminPasswordDialog } from '../AdminPasswordDialog/AdminPasswordDialog';
import { buildAccessWhatsAppMessage, openWhatsAppMessage } from '../../../utils/whatsapp';

interface PendingCustomerActionProps {
  customer: {
    id: number;
    nickname: string;
    phone?: string;
  };
  action: 'approve' | 'discard';
  onClose: () => void;
  onCustomerUpdated: (message?: string) => void;
}

export function PendingCustomerAction({
  customer,
  action,
  onClose,
  onCustomerUpdated,
}: PendingCustomerActionProps) {
  const [creditLimit, setCreditLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleConfirm = async (adminPassword: string) => {
    const normalizedPassword = adminPassword.trim();
    if (!normalizedPassword) {
      setActionError('Digite a senha do dono para continuar');
      return;
    }

    if (action === 'approve' && (!creditLimit || Number.parseFloat(creditLimit) <= 0)) {
      setActionError('Limite de crédito deve ser maior que 0');
      return;
    }

    setIsLoading(true);
    setActionError(null);

    try {
      const token = localStorage.getItem('bread_admin_token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const endpoint = action === 'approve' ? 'approve' : 'reject';
      const body =
        action === 'approve'
          ? { credit_limit: creditLimit, admin_password: normalizedPassword }
          : { admin_password: normalizedPassword };
      const response = await fetch(`/api/v1/bakery/customers/${customer.id}/${endpoint}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.detail ||
            (action === 'approve' ? 'Erro ao aprovar cliente' : 'Erro ao descartar cadastro')
        );
      }

      const data = await response.json();
      const message =
        action === 'approve'
          ? `✅ Aprovação de ${customer.nickname} efetivada com sucesso.`
          : `✅ Cadastro de ${customer.nickname} descartado com sucesso.`;
      setActionSuccess(message);
      onCustomerUpdated(message);

      if (action === 'approve' && customer.phone && data.password_plain_text) {
        openWhatsAppMessage(
          customer.phone,
          buildAccessWhatsAppMessage(customer.nickname, data.password_plain_text)
        );
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível concluir a ação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToastClose = () => {
    setActionSuccess(null);
    onClose();
  };

  return (
    <>
      <AdminPasswordDialog
        isOpen={!actionSuccess}
        title={action === 'approve' ? 'Confirmar Aprovação' : 'Descartar cadastro pendente'}
        description={
          action === 'approve'
            ? 'Digite a senha do dono para aprovar este cadastro e gerar a senha oficial.'
            : 'Digite a senha para remover este cadastro pendente permanentemente.'
        }
        confirmLabel={action === 'approve' ? 'Confirmar Aprovação' : 'Descartar cadastro'}
        isLoading={isLoading}
        extraFieldLabel={action === 'approve' ? 'Limite de Crédito (R$)*' : undefined}
        extraFieldValue={action === 'approve' ? creditLimit : undefined}
        extraFieldPlaceholder={action === 'approve' ? 'Ex: 5000.00' : undefined}
        extraFieldType={action === 'approve' ? 'number' : undefined}
        extraFieldRequired={action === 'approve'}
        onExtraFieldChange={action === 'approve' ? setCreditLimit : undefined}
        onClose={onClose}
        onConfirm={handleConfirm}
      />
      <PageFlashMessage
        open={!!actionSuccess}
        message={actionSuccess}
        type="success"
        autoCloseMs={0}
        onClose={handleToastClose}
      />
      <PageFlashMessage
        open={!!actionError}
        message={actionError}
        type="error"
        onClose={() => setActionError(null)}
      />
    </>
  );
}
