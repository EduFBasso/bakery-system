import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { consumeAuthExpiryMessage } from '@/services/authExpiry';
import { ApiService } from '@/services/api';
import { Card, Button } from '@/components';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState('Panificadora Sistema de Pedidos');

  useEffect(() => {
    setSessionMessage(consumeAuthExpiryMessage());

    ApiService.getTenantIdentity()
      .then((identity) => {
        if (identity.trade_name) {
          setTenantName(identity.trade_name);
        }
      })
      .catch(() => {
        // Mantém o nome genérico quando a identidade pública não estiver disponível.
      });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>🥖 {tenantName}</h1>
        <p>Gerenciamento simples e eficiente para seu negócio</p>
        {sessionMessage && <div className={styles.sessionMessage}>{sessionMessage}</div>}
      </div>

      <div className={styles.cards}>
        <Card>
          <h2>Novo Cliente</h2>
          <p>Faça seu cadastro e comece a fazer pedidos</p>
          <Button onClick={() => navigate('/register')}>Registrar</Button>
        </Card>

        <Card>
          <h2>Já é Cliente</h2>
          <p>Acesse sua conta para fazer pedidos</p>
          <Button onClick={() => navigate('/login')}>Entrar</Button>
        </Card>

        <Card>
          <h2>Sou o Dono</h2>
          <p>Gerencie clientes e pedidos</p>
          <Button onClick={() => navigate('/admin')}>Admin</Button>
        </Card>
      </div>
    </div>
  );
}
