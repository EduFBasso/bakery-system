import styles from '../Table.module.css';
import { formatCurrency } from '../../../utils/formatCurrency';

interface OrderTableRow {
  id: number;
  customer?: {
    nickname: string;
  };
  total_value: number | string;
  status: string;
  created_at: string;
}

interface OrdersTableProps {
  data: OrderTableRow[];
  onRowClick?: (id: number) => void;
}

export function OrdersTable({ data, onRowClick }: OrdersTableProps) {
  return (
    <table className={styles.table}>
      <thead className={styles.thead}>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th>Total</th>
          <th>Status</th>
          <th>Data</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className={styles.row}>
            <td>#{row.id}</td>
            <td>{row.customer?.nickname}</td>
            <td>{formatCurrency(row.total_value)}</td>
            <td>{row.status}</td>
            <td>{new Date(row.created_at).toLocaleDateString('pt-BR')}</td>
            <td>
              <button onClick={() => onRowClick?.(row.id)}>Ação</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
