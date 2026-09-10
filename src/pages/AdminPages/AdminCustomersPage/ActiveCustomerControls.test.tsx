import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveCustomerControls } from './ActiveCustomerControls';

const onBlock = vi.fn();
const onCustomerUpdated = vi.fn();

const customer = {
  id: 12,
  nickname: 'Cliente Teste',
  phone: '19999999999',
  credit_limit: '1000.00',
  financial_limit: '1000.00',
};

describe('ActiveCustomerControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('bread_admin_token', 'token-admin');
  });

  it('mostra Bloquear quando o limite nao foi alterado', () => {
    render(
      <ActiveCustomerControls
        customer={customer}
        onBlock={onBlock}
        onCustomerUpdated={onCustomerUpdated}
      />
    );

    expect(screen.getByRole('button', { name: '🚫 Bloquear' })).toBeInTheDocument();
  });

  it('troca Bloquear por Salvar alteracao ao mudar o limite', async () => {
    const user = userEvent.setup();
    render(
      <ActiveCustomerControls
        customer={customer}
        onBlock={onBlock}
        onCustomerUpdated={onCustomerUpdated}
      />
    );

    const limitInput = screen.getByRole('spinbutton', { name: 'Limite de Cliente Teste' });
    await user.clear(limitInput);
    await user.type(limitInput, '1500');

    expect(screen.getByRole('button', { name: '💾 Salvar alteração' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '🚫 Bloquear' })).not.toBeInTheDocument();
  });

  it('mostra Salvar alteracao no painel expandido quando o limite muda', async () => {
    const user = userEvent.setup();
    render(
      <ActiveCustomerControls
        customer={customer}
        onBlock={onBlock}
        onCustomerUpdated={onCustomerUpdated}
        showBlockButton={false}
      />
    );

    const limitInput = screen.getByRole('spinbutton', { name: 'Limite de Cliente Teste' });
    await user.clear(limitInput);
    await user.type(limitInput, '1500');

    expect(screen.getByRole('button', { name: '💾 Salvar alteração' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '🚫 Bloquear' })).not.toBeInTheDocument();
  });

  it('abre confirmacao protegida para visualizar a senha', async () => {
    const user = userEvent.setup();
    render(
      <ActiveCustomerControls
        customer={customer}
        onBlock={onBlock}
        onCustomerUpdated={onCustomerUpdated}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Visualizar senha de Cliente Teste' }));

    expect(screen.getByRole('heading', { name: 'Visualizar senha' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite sua senha')).toBeInTheDocument();
  });
});
