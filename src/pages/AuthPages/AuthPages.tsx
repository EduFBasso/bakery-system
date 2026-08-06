import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerForm } from '../../components/forms/CustomerForm';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { useRegister } from '../../hooks';
import { RegistrationFormData } from '../../types/forms';
import styles from './AuthPages.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredNickname, setRegisteredNickname] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const { loading, error, register } = useRegister({
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
    } catch (err) {
      // Erro já foi capturado no hook
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

        {error && <div className={styles.errorAlert}>❌ {error}</div>}

        <CustomerForm onSubmit={handleRegisterSubmit} isLoading={loading} errors={formErrors} />

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
            Apelido cadastrado: <strong>{registeredNickname}</strong>
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
