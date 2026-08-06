import styles from './Input.module.css';
import { MaskType } from '../../../utils/maskPatterns';

interface InputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  mask?: MaskType; // Tipo de máscara: 'cpf', 'cnpj', 'phone', 'zipCode', 'streetNumber'
  inputMode?: 'numeric' | 'tel' | 'text' | 'email';
  pattern?: string;
  maxLength?: number;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled = false,
  required = false,
  name,
  id,
  mask,
  inputMode,
  pattern,
  maxLength,
  ref,
}: InputProps) {
  return (
    <input
      ref={ref}
      type={type}
      className={styles.input}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      disabled={disabled}
      required={required}
      name={name}
      id={id}
      inputMode={inputMode}
      pattern={pattern}
      maxLength={maxLength}
      data-mask={mask} // Atributo para referência (opcional)
    />
  );
}
