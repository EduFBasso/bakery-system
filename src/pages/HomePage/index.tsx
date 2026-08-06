import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components';
import styles from './HomePage.module.css';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>🥖 Panificadora Sistema de Pedidos</h1>
        <p>Gerenciamento simples e eficiente para seu negócio</p>
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
