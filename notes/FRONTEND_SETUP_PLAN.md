# 🚀 Frontend - Plano de Fases com Ferramentas

**Objetivo**: Setup estruturado do React com Vite, TypeScript e CSS Modules  
**Stack**: React 19 + Vite 8.1 + TypeScript 7.0 + React Router 7.18  
**Tempo Estimado**: 2-3 horas para setup base  
**Pasta**: `/frontend`

---

## 📦 Versões Recomendadas (Testadas)

```json
{
  "dependencies": {
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1"
  },
  "devDependencies": {
    "vite": "^8.1.3",
    "typescript": "^7.0.2",
    "@vitejs/plugin-react": "^4.3.0",
    "eslint": "^9.11.1",
    "prettier": "^3.3.3"
  },
  "optionalDevDependencies": {
    "vitest": "^2.1.8",
    "cypress": "^15.14.2"
  }
}
```

### Por que essas versões?
- **React 19**: Última versão estável com Hooks modernos
- **Vite 8.1.3**: Build rápido, HMR perfeito, sem problemas de segurança
- **TypeScript 7.0**: Suporte completo a React 19
- **React Router 7.18**: SPA routing moderno
- **Prettier + ESLint 9**: Formatação e linting atualizados

---

## 🎯 FASE 1: Setup Base (30-45 min)

### Passo 1.1: Limpar package.json inicial
```bash
cd /Users/eduardofigueiredobasso/Documents/Dev/bread-sales-company/frontend

# Remover package-lock.json e node_modules
rm -rf package-lock.json node_modules
```

### Passo 1.2: Criar package.json correto
```bash
npm init -y
```

### Passo 1.3: Instalar dependências principais
```bash
npm install react@^19.2.7 react-dom@^19.2.7 react-router-dom@^7.18.1
```

### Passo 1.4: Instalar devDependencies (tooling)
```bash
npm install --save-dev \
  vite@^8.1.3 \
  @vitejs/plugin-react@^4.3.0 \
  typescript@^7.0.2 \
  eslint@^9.11.1 \
  prettier@^3.3.3
```

### Passo 1.5: Criar arquivos de configuração

#### `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    cors: true,
  },
})
```

#### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### `.eslintrc.cjs`
```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.3' } },
  rules: {
    'react-refresh/only-export-components': 'warn',
  },
}
```

#### `.prettierrc.json`
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

#### `.prettierignore`
```
node_modules
dist
.venv
*.lock
```

### Passo 1.6: Atualizar package.json com scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives",
    "format": "prettier --write 'src/**/*.{ts,tsx,css}'"
  }
}
```

### ✅ Validação Fase 1
- [ ] `npm run dev` inicia servidor em 5173
- [ ] Sem erros TypeScript
- [ ] ESLint e Prettier configurados

---

## 🏗️ FASE 2: Estrutura de Pastas (15-20 min)

### Passo 2.1: Criar estrutura de diretórios
```bash
mkdir -p src/{global/styles,components,hooks,utils,services,pages,types}
```

### Passo 2.2: Criar arquivos base

#### `src/index.tsx`
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './global/styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### `src/App.tsx`
```typescript
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </Router>
  )
}
```

#### `index.html`
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Panificadora - Sistema de Pedidos</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>
```

#### `public/favicon.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="50" fill="#D4825C"/>
  <text x="50" y="65" font-size="60" fill="white" text-anchor="middle">🥖</text>
</svg>
```

#### `vite-env.d.ts`
```typescript
/// <reference types="vite/client" />
```

### Passo 2.3: Criar arquivos de tipo global
#### `src/types/index.ts`
```typescript
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  nickname: string;
  customer_type: string;
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  credit_limit: number;
  token?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  customer: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  delivery_date: string;
  payment_method: string;
  total_value: number;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  customer: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  created_at: string;
}
```

### ✅ Validação Fase 2
- [ ] Estrutura de pastas criada
- [ ] `npm run dev` inicia sem erros
- [ ] TypeScript valida tipos

---

## 🎨 FASE 3: CSS Global + Tema (20-30 min)

### Passo 3.1: Criar variables.css
#### `src/global/styles/variables.css`
```css
:root {
  /* Core Colors (Panificadora) */
  --color-primary: #D4825C;
  --color-secondary: #FFF4E6;
  --color-accent: #8B5A3C;
  
  /* Status Colors */
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-danger: #F44336;
  --color-info: #2196F3;
  
  /* Neutrals */
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-text: #2C2C2C;
  --color-text-light: #666666;
  --color-border: #E0E0E0;
  
  /* Typography */
  --font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-base: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-base: 0.5rem;
  --radius-lg: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
}
```

### Passo 3.2: Criar theme.css
#### `src/global/styles/theme.css`
```css
/* Theme específico para Panificadora */
body {
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-primary);
}

a {
  color: var(--color-primary);
  text-decoration: none;
  transition: color var(--transition-base);
}

a:hover {
  color: var(--color-accent);
}

button {
  font-family: var(--font-primary);
  cursor: pointer;
  border: none;
  transition: all var(--transition-base);
}

input,
textarea,
select {
  font-family: var(--font-primary);
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(212, 130, 92, 0.1);
}
```

### Passo 3.3: Criar index.css (reset + base)
#### `src/global/styles/index.css`
```css
@import './variables.css';
@import './theme.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-primary);
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-bold);
  line-height: 1.2;
  margin-bottom: var(--spacing-base);
}

h1 { font-size: var(--font-size-2xl); }
h2 { font-size: var(--font-size-xl); }
h3 { font-size: var(--font-size-lg); }

p {
  margin-bottom: var(--spacing-base);
}

button, input, textarea, select {
  font-size: inherit;
}

ul, ol {
  list-style-position: inside;
}

code {
  background-color: var(--color-secondary);
  padding: 0.2em 0.4em;
  border-radius: var(--radius-sm);
  font-family: 'Courier New', monospace;
}
```

### ✅ Validação Fase 3
- [ ] Cores carregam correto
- [ ] Variáveis CSS acessíveis
- [ ] Reset funciona

---

## 📱 FASE 4: Componentes Base (1-1.5h)

### Passo 4.1: Button Component
#### `src/components/Button/index.tsx`
```typescript
import React from 'react'
import styles from './styles.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'link'
type ButtonSize = 'sm' | 'base' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? '⏳' : children}
    </button>
  )
}
```

#### `src/components/Button/styles.module.css`
```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 0.75rem 1.5rem;
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-base);
  cursor: pointer;
  transition: all var(--transition-base);
  white-space: nowrap;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background-color: var(--color-primary);
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.secondary {
  background-color: var(--color-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.secondary:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
}

.danger {
  background-color: var(--color-danger);
  color: white;
}

.danger:hover:not(:disabled) {
  background-color: #d32f2f;
}

.link {
  background: none;
  color: var(--color-primary);
  padding: 0;
}

.link:hover:not(:disabled) {
  text-decoration: underline;
}

.sm {
  padding: 0.5rem 1rem;
  font-size: var(--font-size-sm);
}

.lg {
  padding: 1rem 2rem;
  font-size: var(--font-size-lg);
}
```

### Passo 4.2: Input Component
#### `src/components/Input/index.tsx`
```typescript
import React from 'react'
import styles from './styles.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  mask?: (value: string) => string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  mask,
  value,
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    if (mask) {
      newValue = mask(newValue)
    }
    onChange?.(e)
  }

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={`${styles.input} ${error ? styles.error : ''}`}
        value={value}
        onChange={handleChange}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  )
}
```

#### `src/components/Input/styles.module.css`
```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.label {
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.input {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(212, 130, 92, 0.1);
}

.error {
  border-color: var(--color-danger);
}

.errorText {
  color: var(--color-danger);
  font-size: var(--font-size-sm);
}
```

### Passo 4.3: Card Component
#### `src/components/Card/index.tsx`
```typescript
import React from 'react'
import styles from './styles.module.css'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}
```

#### `src/components/Card/styles.module.css`
```css
.card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-base);
  transition: all var(--transition-base);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### ✅ Validação Fase 4
- [ ] Botões renderizam com 4 variantes
- [ ] Input aceita e formata dados
- [ ] Card aplica styling correto
- [ ] `npm run lint` sem erros
- [ ] TypeScript valida props

---

## 📊 Próximas Fases (Fases 5-8)

**Fase 5** (1.5-2h): Autenticação + Customer  
**Fase 6** (1-1.5h): Catálogo + ProductCard  
**Fase 7** (2-2.5h): Carrinho + Pedido  
**Fase 8** (1-1.5h): Saldo + Histórico  

---

## ✅ Checklist de Implementação

### Fase 1: Setup Base
- [ ] `npm install` executado
- [ ] vite.config.ts criado
- [ ] tsconfig.json validado
- [ ] ESLint e Prettier configurados
- [ ] Scripts npm atualizados
- [ ] `npm run dev` funciona

### Fase 2: Estrutura
- [ ] Pastas criadas
- [ ] src/index.tsx pronto
- [ ] src/App.tsx com router
- [ ] index.html configurado
- [ ] types/index.ts com interfaces

### Fase 3: CSS Global
- [ ] variables.css completo
- [ ] theme.css aplicado
- [ ] index.css com reset
- [ ] Cores carregam correto
- [ ] Variáveis acessíveis

### Fase 4: Componentes Base
- [ ] Button com 4 variantes
- [ ] Input com mascaras
- [ ] Card renderizando
- [ ] Tipos TypeScript corretos
- [ ] Styling sem conflitos

---

## 🚀 Começar Agora!

**Próximo passo**: Executar **FASE 1** (Setup Base)

```bash
cd /Users/eduardofigueiredobasso/Documents/Dev/bread-sales-company/frontend

# Começar com Passo 1.1
rm -rf package-lock.json node_modules
npm init -y
npm install react@^19.2.7 react-dom@^19.2.7 react-router-dom@^7.18.1
# ... continuar com próximos passos
```

---

