import { useState, useRef, useEffect } from 'react';
import type { FormEvent, ChangeEvent, InvalidEvent, RefObject } from 'react';
import { FormGroup } from '../FormGroup';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useMaskInput, useViaCEPLookup } from '../../../hooks';
import { RegistrationFormData, FormErrors, CustomerType } from '../../../types/forms';
import { maskPatterns } from '../../../utils/maskPatterns';
import { focusAndSelectInput } from '../../../utils/focusInput';
import styles from './CustomerForm.module.css';

interface CustomerFormProps {
  onSubmit: (data: RegistrationFormData) => void;
  onNicknameFocus?: (nickname: string) => Promise<string | null>;
  onUniqueFieldFocus?: (
    field: 'cpf' | 'cnpj' | 'phone',
    value: string
  ) => Promise<string | null>;
  isLoading?: boolean;
  errors?: FormErrors;
}

export function CustomerForm({
  onSubmit,
  onNicknameFocus,
  onUniqueFieldFocus,
  isLoading = false,
  errors = {},
}: CustomerFormProps) {
  // Refs para auto-focus após ViaCEP
  const numberInputRef = useRef<HTMLInputElement>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);
  const suppressNicknameFocusCheckRef = useRef(false);

  // Estado dos campos básicos
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    complement: '',
    companyName: '',
  });

  const [customerType, setCustomerType] = useState<CustomerType>('PF');

  // Estado dos campos de endereço que vêm do ViaCEP
  const [address, setAddress] = useState({
    street: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [addressAutoFilled, setAddressAutoFilled] = useState(false);
  const [cepMessage, setCepMessage] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const cpfInputRef = useRef<HTMLInputElement>(null);
  const cnpjInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const companyNameInputRef = useRef<HTMLInputElement>(null);
  const zipCodeInputRef = useRef<HTMLInputElement>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const neighborhoodInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const stateInputRef = useRef<HTMLInputElement>(null);

  // Máscaras dos campos numéricos
  const cpfMask = useMaskInput('cpf');
  const cnpjMask = useMaskInput('cnpj');
  const phoneMask = useMaskInput('phone');
  const zipCodeMask = useMaskInput('zipCode');
  const numberMask = useMaskInput('streetNumber');

  // Ref para debounce do lookup
  const lookupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cepMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showCepMessage = (message: string) => {
    if (cepMessageTimerRef.current) {
      clearTimeout(cepMessageTimerRef.current);
    }
    setCepMessage(message);
    cepMessageTimerRef.current = setTimeout(() => setCepMessage(''), 4000);
  };

  // Hook para ViaCEP lookup (sem auto-focus para evitar re-renders em loop)
  const { lookup: lookupCEP } = useViaCEPLookup({
    onSuccess: (newAddress) => {
      setAddress(newAddress);
      setAddressAutoFilled(true);
      setCepMessage('');
    },
    onError: () => {
      showCepMessage('CEP não localizado. Você pode preencher o endereço manualmente.');
    },
    // onAutoFocusField removido para evitar loop infinito de re-renders
  });

  // Monitorar mudanças no CEP e chamar lookup ao completar
  const handleZipCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    zipCodeMask.onChangeHandler(e);
  };

  // Monitorar o valor do CEP e fazer lookup quando completar (8 dígitos)
  useEffect(() => {
    // Limpar timeout anterior
    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    if (zipCodeMask.value.length === 8) {
      // Debounce de 300ms para não fazer múltiplas requisições enquanto digita
      lookupTimeoutRef.current = setTimeout(() => {
        lookupCEP(zipCodeMask.value);
      }, 300);
    } else if (zipCodeMask.value.length < 8) {
      setCepMessage('');
      setAddressAutoFilled(false);
      // Limpar endereço quando CEP fica incompleto
      setAddress({
        street: '',
        neighborhood: '',
        city: '',
        state: '',
      });
    }

    return () => {
      if (lookupTimeoutRef.current) {
        clearTimeout(lookupTimeoutRef.current);
      }
    };
  }, [zipCodeMask.value]);

  useEffect(() => {
    return () => {
      if (cepMessageTimerRef.current) {
        clearTimeout(cepMessageTimerRef.current);
      }
    };
  }, []);

  // Enviar formulário
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setNicknameError('');

    const validateRequired = (
      field: string,
      value: string,
      message: string,
      ref: RefObject<HTMLInputElement | null>
    ) => {
      if (value.trim()) return true;
      setFieldErrors((current) => ({ ...current, [field]: message }));
      if (ref.current) focusAndSelectInput(ref.current);
      return false;
    };

    if (!validateRequired('name', formData.name, 'Informe o nome completo do cliente.', nameInputRef)) {
      return;
    }
    if (!validateRequired('nickname', formData.nickname, 'Informe um nome ou apelido para o cliente.', nicknameInputRef)) {
      setNicknameError('Informe um nome ou apelido para o cliente.');
      return;
    }

    if (onNicknameFocus) {
      const nicknameValidationError = (await onNicknameFocus(formData.nickname)) || '';
      setNicknameError(nicknameValidationError);
      if (nicknameValidationError) {
        if (nicknameInputRef.current) focusAndSelectInput(nicknameInputRef.current);
        return;
      }
    }

    const documentField = customerType === 'PF' ? 'cpf' : 'cnpj';
    const documentValue = customerType === 'PF' ? cpfMask.value : cnpjMask.value;
    const documentRef = customerType === 'PF' ? cpfInputRef : cnpjInputRef;
    const documentLabel = customerType === 'PF' ? 'CPF' : 'CNPJ';
    if (!validateRequired(documentField, documentValue, `Informe o ${documentLabel} do cliente.`, documentRef)) {
      return;
    }

    if (onUniqueFieldFocus) {
      const documentError = (await onUniqueFieldFocus(documentField, documentValue)) || '';
      setFieldErrors((current) => ({ ...current, [documentField]: documentError }));
      if (documentError) {
        if (documentRef.current) focusAndSelectInput(documentRef.current);
        return;
      }
    }

    if (
      customerType === 'PJ' &&
      !validateRequired(
        'company_name',
        formData.companyName,
        'Informe a razão social do cliente.',
        companyNameInputRef
      )
    ) {
      return;
    }

    if (!validateRequired('phone', phoneMask.value, 'Informe o telefone do cliente.', phoneInputRef)) {
      return;
    }
    if (onUniqueFieldFocus) {
      const phoneError = (await onUniqueFieldFocus('phone', phoneMask.value)) || '';
      setFieldErrors((current) => ({ ...current, phone: phoneError }));
      if (phoneError) {
        if (phoneInputRef.current) focusAndSelectInput(phoneInputRef.current);
        return;
      }
    }

    const requiredAddressFields = [
      ['zip_code', zipCodeMask.value, 'Informe o CEP do cliente.', zipCodeInputRef],
      ['street', address.street, 'Informe a rua ou avenida.', streetInputRef],
      ['number', numberMask.value, 'Informe o número do endereço.', numberInputRef],
      ['neighborhood', address.neighborhood, 'Informe o bairro.', neighborhoodInputRef],
      ['city', address.city, 'Informe a cidade.', cityInputRef],
      ['state', address.state, 'Informe o estado.', stateInputRef],
    ] as const;
    for (const [field, value, message, ref] of requiredAddressFields) {
      if (!validateRequired(field, value, message, ref)) return;
    }

    const submitData: RegistrationFormData = {
      name: formData.name,
      nickname: formData.nickname,
      customer_type: customerType,
      phone: phoneMask.value,
      zip_code: zipCodeMask.value,
      street: address.street,
      number: numberMask.value,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      ...(formData.complement && { complement: formData.complement }),
      ...(customerType === 'PF'
        ? { cpf: cpfMask.value, company_name: formData.name }
        : { cnpj: cnpjMask.value, company_name: formData.companyName }),
    };

    onSubmit(submitData);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'nickname') setNicknameError('');
  };

  const handleNicknameFocus = async () => {
    if (suppressNicknameFocusCheckRef.current) {
      suppressNicknameFocusCheckRef.current = false;
      return;
    }
    if (!onNicknameFocus || !formData.nickname.trim()) return;
    const error = await onNicknameFocus(formData.nickname);
    setNicknameError(error || '');
    if (error) {
      requestAnimationFrame(() => {
        const input = nicknameInputRef.current;
        if (!input) return;
        suppressNicknameFocusCheckRef.current = true;
        focusAndSelectInput(input);
        window.setTimeout(() => {
          suppressNicknameFocusCheckRef.current = false;
        }, 250);
      });
    }
  };

  const handleNicknameInvalid = (event: InvalidEvent<HTMLInputElement>) => {
    event.preventDefault();
    setNicknameError('Informe um nome ou apelido para o cliente.');
    focusAndSelectInput(event.currentTarget);
  };

  const handleUniqueFieldFocus = async (
    field: 'cpf' | 'cnpj' | 'phone',
    value: string
  ) => {
    if (!onUniqueFieldFocus || !value.trim()) return;
    const error = await onUniqueFieldFocus(field, value);
    setFieldErrors((current) => ({ ...current, [field]: error || '' }));
    if (error) {
      const input = { cpf: cpfInputRef, cnpj: cnpjInputRef, phone: phoneInputRef }[field].current;
      if (input) focusAndSelectInput(input);
    }
  };

  const handleUniqueFieldInvalid = (
    field: 'cpf' | 'cnpj' | 'phone',
    event: InvalidEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const labels = { cpf: 'CPF', cnpj: 'CNPJ', phone: 'telefone' };
    setFieldErrors((current) => ({
      ...current,
      [field]: `Informe o ${labels[field]} do cliente.`,
    }));
    focusAndSelectInput(event.currentTarget);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* ===== SEÇÃO: IDENTIFICAÇÃO ===== */}
      <h3 className={styles.sectionTitle}>Informações Pessoais</h3>

      <FormGroup label="Nome completo" required error={errors.name || fieldErrors.name}>
        <Input
          name="name"
          placeholder="João da Silva Santos"
          value={formData.name}
          ref={nameInputRef}
          onChange={(e) => handleFormChange('name', e.target.value)}
          required
        />
      </FormGroup>

      <FormGroup label="Cliente" required error={errors.nickname || nicknameError}>
        <Input
          name="nickname"
          placeholder="João"
          value={formData.nickname}
          ref={nicknameInputRef}
          onChange={(e) => handleFormChange('nickname', e.target.value)}
          onFocus={() => void handleNicknameFocus()}
          onInvalid={handleNicknameInvalid}
          required
        />
      </FormGroup>

      {/* Tipo de Cliente */}
      <FormGroup label="Tipo de Cliente" required error={errors.customer_type}>
        <div className={styles.customerTypeButtons}>
          <button
            type="button"
            className={`${styles.typeButton} ${customerType === 'PF' ? styles.active : ''}`}
            onClick={() => setCustomerType('PF')}
          >
            Pessoa Física (PF)
          </button>
          <button
            type="button"
            className={`${styles.typeButton} ${customerType === 'PJ' ? styles.active : ''}`}
            onClick={() => setCustomerType('PJ')}
          >
            Pessoa Jurídica (PJ)
          </button>
        </div>
      </FormGroup>

      {/* CPF ou CNPJ - renderizar baseado no tipo */}
      {customerType === 'PF' ? (
        <FormGroup label="CPF" required error={errors.cpf || fieldErrors.cpf}>
          <Input
            name="cpf"
            placeholder={maskPatterns.cpf.placeholder}
            value={cpfMask.formattedValue}
            onChange={(event) => {
              cpfMask.onChangeHandler(event);
              setFieldErrors((current) => ({ ...current, cpf: '' }));
            }}
            ref={cpfInputRef}
            onFocus={() => void handleUniqueFieldFocus('cpf', cpfMask.value)}
            onInvalid={(event) => handleUniqueFieldInvalid('cpf', event)}
            inputMode={cpfMask.inputMode}
            maxLength={14}
            required
          />
        </FormGroup>
      ) : (
        <>
          <FormGroup label="CNPJ" required error={errors.cnpj || fieldErrors.cnpj}>
            <Input
              name="cnpj"
              placeholder={maskPatterns.cnpj.placeholder}
              value={cnpjMask.formattedValue}
              onChange={(event) => {
                cnpjMask.onChangeHandler(event);
                setFieldErrors((current) => ({ ...current, cnpj: '' }));
              }}
              ref={cnpjInputRef}
              onFocus={() => void handleUniqueFieldFocus('cnpj', cnpjMask.value)}
              onInvalid={(event) => handleUniqueFieldInvalid('cnpj', event)}
              inputMode={cnpjMask.inputMode}
              maxLength={18}
              required
            />
          </FormGroup>

          <FormGroup label="Razão Social" required error={errors.company_name || fieldErrors.company_name}>
            <Input
              name="company_name"
              placeholder="Panificadora XYZ Ltda"
              value={formData.companyName}
              ref={companyNameInputRef}
              onChange={(e) => handleFormChange('companyName', e.target.value)}
              required
            />
          </FormGroup>
        </>
      )}

      <FormGroup label="Telefone (Celular)" required error={errors.phone || fieldErrors.phone}>
        <Input
          name="phone"
          placeholder={maskPatterns.phone.placeholder}
          value={phoneMask.formattedValue}
          onChange={(event) => {
            phoneMask.onChangeHandler(event);
            setFieldErrors((current) => ({ ...current, phone: '' }));
          }}
          ref={phoneInputRef}
          onFocus={() => void handleUniqueFieldFocus('phone', phoneMask.value)}
          onInvalid={(event) => handleUniqueFieldInvalid('phone', event)}
          inputMode={phoneMask.inputMode}
          maxLength={15}
          required
        />
      </FormGroup>

      {/* ===== SEÇÃO: ENDEREÇO ===== */}
      <h3 className={styles.sectionTitle}>Endereço de Entrega</h3>

      <FormGroup label="CEP" required error={errors.zip_code || fieldErrors.zip_code}>
        <Input
          name="zip_code"
          placeholder={maskPatterns.zipCode.placeholder}
          value={zipCodeMask.formattedValue}
          ref={zipCodeInputRef}
          onChange={handleZipCodeChange}
          inputMode={zipCodeMask.inputMode}
          maxLength={9}
          required
        />
        {cepMessage && (
          <span className={styles.cepMessage} role="status">
            {cepMessage}
          </span>
        )}
      </FormGroup>

      <FormGroup label="Rua/Avenida" required error={errors.street || fieldErrors.street}>
        <Input
          name="street"
          placeholder="Avenida Paulista"
          value={address.street}
          ref={streetInputRef}
          disabled={addressAutoFilled}
          onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
          required
        />
      </FormGroup>

      <FormGroup label="Número" required error={errors.number || fieldErrors.number}>
        <Input
          ref={numberInputRef}
          name="number"
          placeholder="123"
          value={numberMask.formattedValue}
          onChange={(e) => numberMask.onChangeHandler(e)}
          inputMode={numberMask.inputMode}
          maxLength={10}
          required
        />
      </FormGroup>

      <FormGroup label="Complemento" error={errors.complement}>
        <Input
          name="complement"
          placeholder="Apto 456, Sala B"
          value={formData.complement}
          onChange={(e) => handleFormChange('complement', e.target.value)}
        />
      </FormGroup>

      <FormGroup label="Bairro" required error={errors.neighborhood || fieldErrors.neighborhood}>
        <Input
          name="neighborhood"
          placeholder="Centro"
          value={address.neighborhood}
          ref={neighborhoodInputRef}
          disabled={addressAutoFilled}
          onChange={(e) => setAddress((prev) => ({ ...prev, neighborhood: e.target.value }))}
          required
        />
      </FormGroup>

      <FormGroup label="Cidade" required error={errors.city || fieldErrors.city}>
        <Input
          name="city"
          placeholder="São Paulo"
          value={address.city}
          ref={cityInputRef}
          disabled={addressAutoFilled}
          onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
          required
        />
      </FormGroup>

      <FormGroup label="Estado (UF)" required error={errors.state || fieldErrors.state}>
        <Input
          name="state"
          placeholder="SP"
          value={address.state}
          ref={stateInputRef}
          disabled={addressAutoFilled}
          onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
          maxLength={2}
          required
        />
      </FormGroup>

      {/* Botão de Envio */}
      <Button variant="primary" type="submit" disabled={isLoading}>
        {isLoading ? '⏳ Enviando...' : '✅ Enviar Cadastro'}
      </Button>
    </form>
  );
}
