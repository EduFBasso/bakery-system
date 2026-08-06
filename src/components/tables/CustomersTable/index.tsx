import styles from './CustomersTable.module.css';

interface CustomersTableProps {
  data: any[];
  onRowClick?: (id: number) => void;
}

export function CustomersTable({ data, onRowClick }: CustomersTableProps) {
  return (
    <table className={styles.table}>
      <thead className={styles.thead}>
        <tr>
          <th>Apelido</th>
          <th>Tipo</th>
          <th>Telefone</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id} className={styles.row}>
            <td>{row.nickname}</td>
            <td>{row.customer_type}</td>
            <td>{row.phone}</td>
            <td>
              <button onClick={() => onRowClick?.(row.id)}>Ação</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
