import styles from './TableRow.module.css';

interface TableRowProps {
  cells: (string | React.ReactNode)[];
  onClick?: () => void;
  className?: string;
}

export function TableRow({ cells, onClick, className }: TableRowProps) {
  return (
    <tr className={`${styles.row} ${className || ''}`} onClick={onClick}>
      {cells.map((cell, index) => (
        <td key={index} className={styles.cell}>
          {cell}
        </td>
      ))}
    </tr>
  );
}
