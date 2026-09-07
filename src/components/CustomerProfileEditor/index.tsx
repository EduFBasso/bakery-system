import { FormEvent, useEffect, useState } from 'react';
import { CustomerData } from '../../hooks/useCustomerAuth';
import styles from './styles.module.css';

interface CustomerProfileEditorProps {
  customer: CustomerData;
  token: string;
}

interface EditableCustomerData {
  nickname: string;
  company_name: string;
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const editableData = (customer: CustomerData): EditableCustomerData => ({
  nickname: customer.nickname ?? '',
  company_name: customer.company_name ?? '',
  phone: customer.phone ?? '',
  zip_code: customer.zip_code ?? '',
  street: customer.street ?? '',
  number: customer.number ?? '',
  complement: customer.complement ?? '',
  neighborhood: customer.neighborhood ?? '',
  city: customer.city ?? '',
  state: customer.state ?? '',
});

export function CustomerProfileEditor({ customer, token }: CustomerProfileEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => editableData(customer));

  useEffect(() => {
    if (!isEditing) {
      setFormData(editableData(customer));
    }
  }, [customer, isEditing]);

  const updateField = (field: keyof EditableCustomerData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const cancelEditing = () => {
    setFormData(editableData(customer));
    setError(null);
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/bakery/customers/${customer.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.replace(/\D/g, ''),
          zip_code: formData.zip_code.replace(/\D/g, ''),
          state: formData.state.trim().toUpperCase(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        const detail = Object.values(payload).flat().join(' ');
        throw new Error(detail || 'Não foi possível atualizar os dados.');
      }

      localStorage.setItem('bread_customer_user', JSON.stringify(payload));
      setIsEditing(false);
      window.dispatchEvent(new Event('bakery:customer-data-changed'));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível atualizar os dados.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const fullAddress = [
    customer.street,
    customer.number,
    customer.complement,
    customer.neighborhood,
    customer.city,
    customer.state,
    customer.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  if (!isEditing) {
    return (
      <div className={styles.profile}>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label>Apelido</label>
            <p>{customer.nickname}</p>
          </div>
          {customer.company_name && (
            <div className={styles.infoItem}>
              <label>Razão social</label>
              <p>{customer.company_name}</p>
            </div>
          )}
          <div className={styles.infoItem}>
            <label>Tipo</label>
            <p>{customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
          </div>
          {customer.cnpj_cpf && (
            <div className={styles.infoItem}>
              <label>CPF/CNPJ</label>
              <p>{customer.cnpj_cpf}</p>
            </div>
          )}
          <div className={styles.infoItem}>
            <label>Telefone</label>
            <p>{customer.phone || 'Não informado'}</p>
          </div>
          <div className={`${styles.infoItem} ${styles.addressItem}`}>
            <label>Endereço</label>
            <p>{fullAddress || 'Não informado'}</p>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.editButton} onClick={() => setIsEditing(true)}>
            Editar dados
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.profile} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label>
          Apelido
          <input
            value={formData.nickname}
            onChange={(event) => updateField('nickname', event.target.value)}
            required
          />
        </label>
        {customer.customer_type === 'PJ' && (
          <label>
            Razão social
            <input
              value={formData.company_name}
              onChange={(event) => updateField('company_name', event.target.value)}
              required
            />
          </label>
        )}
        <label>
          Telefone
          <input
            value={formData.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            inputMode="tel"
            required
          />
        </label>
        <label>
          CEP
          <input
            value={formData.zip_code}
            onChange={(event) => updateField('zip_code', event.target.value)}
            inputMode="numeric"
            required
          />
        </label>
        <label className={styles.wideField}>
          Rua/Avenida
          <input
            value={formData.street}
            onChange={(event) => updateField('street', event.target.value)}
            required
          />
        </label>
        <label>
          Número
          <input
            value={formData.number}
            onChange={(event) => updateField('number', event.target.value)}
            required
          />
        </label>
        <label>
          Complemento
          <input
            value={formData.complement}
            onChange={(event) => updateField('complement', event.target.value)}
          />
        </label>
        <label>
          Bairro
          <input
            value={formData.neighborhood}
            onChange={(event) => updateField('neighborhood', event.target.value)}
            required
          />
        </label>
        <label>
          Cidade
          <input
            value={formData.city}
            onChange={(event) => updateField('city', event.target.value)}
            required
          />
        </label>
        <label>
          Estado
          <input
            value={formData.state}
            onChange={(event) => updateField('state', event.target.value)}
            maxLength={2}
            required
          />
        </label>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={cancelEditing}>
          Cancelar
        </button>
        <button type="submit" className={styles.saveButton} disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
