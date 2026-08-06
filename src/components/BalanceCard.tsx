import { useCustomerDashboard } from '../hooks/useCustomerDashboard';
import styles from './BalanceCard.module.css';

interface BalanceCardProps {
  showHeader?: boolean;
}

export function BalanceCard({ showHeader = true }: BalanceCardProps) {
  const { data } = useCustomerDashboard();

  if (!data) {
    return null;
  }

  const financialLimit = Math.max(0, data.financialLimit);
  const financialUsed = Math.max(0, data.financialUsed);
  const financialAvailable = Math.max(0, data.financialAvailable);
  const usedPercentage =
    financialLimit > 0 ? Math.round((financialUsed / financialLimit) * 100) : 0;

  return (
    <div className={styles.container}>
      {showHeader && (
        <div className={styles.header}>
          <h3>💰 Resumo Financeiro</h3>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.item}>
          <div className={styles.label}>Saldo Limite</div>
          <div className={styles.value}>R$ {financialLimit.toFixed(2)}</div>
          <div className={styles.subtext}>Limite total aprovado</div>
        </div>

        <div className={styles.item}>
          <div className={styles.label}>Saldo Utilizado</div>
          <div className={styles.value}>R$ {financialUsed.toFixed(2)}</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${usedPercentage}%` }} />
          </div>
          <div className={styles.subtext}>{usedPercentage}% do limite</div>
        </div>

        <div className={styles.item}>
          <div className={styles.label}>Saldo Disponível</div>
          <div className={styles.value}>R$ {financialAvailable.toFixed(2)}</div>
          <div className={styles.subtext}>Disponível para compra</div>
        </div>
      </div>

      {financialAvailable <= financialLimit * 0.2 && (
        <div className={styles.warning}>⚠️ Limite próximo!</div>
      )}
    </div>
  );
}
