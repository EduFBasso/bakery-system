import styles from './CustomerPrintView.module.css';

export interface PrintableCustomer {
  nickname?: string;
  company_name?: string;
  customer_type?: string;
  cpf?: string;
  cnpj?: string;
  cnpj_cpf?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status?: string;
  created_at?: string;
  credit_limit?: string;
  financial_limit?: string;
  financial_used?: string;
  financial_available?: string;
  available_credit?: string;
}

interface CustomerPrintViewProps {
  customer: PrintableCustomer;
  formatCurrency: (value?: string | number | null) => string;
  formatDocument: (value?: string | null, type?: string) => string;
  formatPhone: (value?: string | null) => string;
  formatDate: (value?: string | null) => string;
  formatAddress: (customer: PrintableCustomer) => string;
  companyName?: string;
  companyAddress?: string;
  screenPreview?: boolean;
}

export function CustomerPrintView({
  customer,
  formatCurrency,
  formatDocument,
  formatPhone,
  formatDate,
  formatAddress,
  companyName = 'Sistema de Pedidos da Panificadora',
  companyAddress,
  screenPreview = false,
}: CustomerPrintViewProps) {
  const documentValue =
    customer.customer_type === 'PF'
      ? customer.cpf || customer.cnpj_cpf
      : customer.cnpj || customer.cnpj_cpf;

  return (
    <article
      className={`${styles.printSheet} ${screenPreview ? styles.screenPreview : ''}`}
      data-print-card="customer-summary"
    >
      <header className={styles.printHeader}>
        <div>
          <p className={styles.tenantName}>{companyName}</p>
          <p className={styles.printSubtitle}>{companyAddress || 'Endereço não informado'}</p>
        </div>
        <div className={styles.headerMeta}>
          <strong>Resumo do cliente</strong>
          <p className={styles.printDate}>Emitido em {formatDate(new Date().toISOString())}</p>
        </div>
      </header>

      <section className={styles.section}>
        <h2>Dados cadastrais</h2>
        <dl className={styles.dataGrid}>
          <div>
            <dt>Apelido:</dt>
            <dd>{customer.nickname || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Tipo:</dt>
            <dd>{customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd>
          </div>
          <div>
            <dt>{customer.customer_type === 'PF' ? 'CPF:' : 'CNPJ:'}</dt>
            <dd>{formatDocument(documentValue, customer.customer_type)}</dd>
          </div>
          <div>
            <dt>Telefone:</dt>
            <dd>{formatPhone(customer.phone)}</dd>
          </div>
          <div>
            <dt>Status:</dt>
            <dd>{customer.status || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Cadastro em:</dt>
            <dd>{formatDate(customer.created_at)}</dd>
          </div>
          <div className={styles.fullWidth}>
            <dt>Endereço:</dt>
            <dd>{formatAddress(customer)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section}>
        <h2>Resumo financeiro</h2>
        <dl className={styles.financeGrid}>
          <div>
            <dt>Limite de crédito:</dt>
            <dd>{formatCurrency(customer.credit_limit ?? customer.financial_limit)}</dd>
          </div>
          <div>
            <dt>Saldo utilizado:</dt>
            <dd>{formatCurrency(customer.financial_used)}</dd>
          </div>
          <div>
            <dt>Saldo disponível:</dt>
            <dd>{formatCurrency(customer.financial_available ?? customer.available_credit)}</dd>
          </div>
        </dl>
      </section>

      <footer className={styles.printFooter}>Documento informativo para uso administrativo.</footer>
    </article>
  );
}
