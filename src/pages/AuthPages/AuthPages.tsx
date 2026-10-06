import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useRegister } from '../../hooks';
import { FormErrors, RegistrationFormData } from '../../types/forms';
import { ApiService } from '../../services/api';
import { clearAuthExpiryMessage } from '../../services/authExpiry';
import styles from './AuthPages.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredNickname, setRegisteredNickname] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    clearAuthExpiryMessage();
  }, []);

  const { loading, register } = useRegister({
    onSuccess: (response) => {
      setRegisteredNickname(response.nickname);
      setShowSuccessModal(true);
    },
    onError: (err) => {
      console.error('Erro ao registrar:', err);
      // Mostrar erro no formulário
    },
  });

  const handleRegisterSubmit = async (formData: RegistrationFormData) => {
    setFormErrors({});
    try {
      await register(formData);
    } catch {
      // Erro já foi capturado no hook
    }
  };

  const handleNicknameFocus = async (nickname: string) => {
    if (!nickname.trim()) return null;
    try {
      const available = await ApiService.checkCustomerNicknameAvailability(nickname);
      return available ? null : 'Esse nome ou apelido já está em uso. Escolha outro identificador.';
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do nome do cliente:', error);
      return 'Não foi possível verificar o nome ou apelido. Tente novamente.';
    }
  };

  const handleUniqueFieldFocus = async (field: 'cpf' | 'cnpj' | 'phone', value: string) => {
    if (!value.trim()) return null;
    try {
      const available = await ApiService.checkCustomerFieldAvailability(field, value);
      if (available) return null;
      const labels = { cpf: 'CPF', cnpj: 'CNPJ', phone: 'Telefone' };
      return `Este ${labels[field]} já está em uso. Informe outro valor.`;
    } catch (error) {
      console.error(`Erro ao verificar disponibilidade de ${field}:`, error);
      return `Não foi possível verificar o ${field}. Tente novamente.`;
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>🥖 Registrar Novo Cliente</h1>
        <p className={styles.subtitle}>Preencha os dados para se cadastrar no sistema</p>

        <CustomerForm
          onSubmit={handleRegisterSubmit}
          onNicknameFocus={handleNicknameFocus}
          onUniqueFieldFocus={handleUniqueFieldFocus}
          isLoading={loading}
          errors={formErrors}
        />

        <button className={styles.backLink} onClick={handleGoHome}>
          ← Voltar para Home
        </button>
      </div>

      {/* Modal de Sucesso */}
      <Modal isOpen={showSuccessModal} onClose={handleCloseModal}>
        <div className={styles.successContent}>
          <div className={styles.successIcon}>✅</div>
          <h2 className={styles.successTitle}>Cadastro Recebido!</h2>
          <p className={styles.successMessage}>Seu acesso está em análise pelo administrador.</p>
          <p className={styles.successDetail}>
            Cliente cadastrado: <strong>{registeredNickname}</strong>
          </p>
          <p className={styles.successSubtext}>Aguarde a aprovação para receber a senha oficial.</p>
          <div className={styles.successActions}>
            <Button variant="primary" onClick={handleCloseModal}>
              ✅ Ir para Home
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function PendingPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.pendingContent}>
          <div className={styles.spinnerWrapper}>
            <Spinner />
          </div>
          <h1 className={styles.pendingTitle}>⏳ Aguardando Aprovação</h1>
          <p className={styles.pendingMessage}>Seu cadastro está em análise pelo administrador.</p>
          <p className={styles.pendingSubtext}>
            Você será notificado em breve quando sua conta for aprovada.
          </p>
        </div>
      </div>
    </div>
  );
}
