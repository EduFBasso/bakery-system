/**
 * Gerador de Senhas Aleatórias
 * Compatível com validação backend (6+ chars, maiúscula, minúscula, número)
 */

/**
 * Gera uma senha aleatória com critérios de segurança
 * @param length Tamanho da senha (padrão 8)
 * @returns Senha em texto plano (letras + números)
 */
export function generateRandomPassword(length: number = 8): string {
  if (length < 6) length = 6;

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const allChars = uppercase + lowercase + numbers;

  // Garantir pelo menos 1 de cada tipo
  const characters = [
    uppercase[Math.floor(Math.random() * uppercase.length)], // 1 maiúscula
    lowercase[Math.floor(Math.random() * lowercase.length)], // 1 minúscula
    numbers[Math.floor(Math.random() * numbers.length)], // 1 número
  ];

  // Preencher resto aleatoriamente
  for (let i = 0; i < length - 3; i++) {
    characters.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }

  // Embaralhar para não seguir padrão previsível
  return characters.sort(() => Math.random() - 0.5).join('');
}

/**
 * Valida se a senha atende aos critérios mínimos
 * @param password Senha a validar
 * @returns { valid: boolean, message: string }
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password) {
    return { valid: false, message: 'Senha não pode estar vazia' };
  }

  if (password.length < 6) {
    return { valid: false, message: 'Senha deve ter no mínimo 6 caracteres' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos 1 letra maiúscula' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos 1 letra minúscula' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Senha deve conter pelo menos 1 número' };
  }

  return { valid: true, message: 'Senha válida' };
}

/**
 * Verifica a força da senha (feedback visual)
 * @param password Senha a avaliar
 * @returns Nível: 'fraca' | 'media' | 'forte'
 */
export function getPasswordStrength(password: string): 'fraca' | 'media' | 'forte' {
  const { valid } = validatePassword(password);
  if (!valid) return 'fraca';

  // Verificar critérios extras para força
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLong = password.length >= 12;
  const hasMixed = /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

  const points = (hasMixed ? 1 : 0) + (isLong ? 1 : 0) + (hasSpecial ? 1 : 0);

  if (points >= 2) return 'forte';
  if (points >= 1) return 'media';
  return 'fraca';
}
