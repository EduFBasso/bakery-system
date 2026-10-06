import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminLayout } from './AdminLayout';

describe('AdminLayout', () => {
  it('exibe os tabs na ordem Dashboard, Clientes, Pedidos, Produtos e Configurações', () => {
    render(
      <AdminLayout
        activeTab="customers"
        onTabChange={vi.fn()}
        userName="Admin"
        tenant={{ trade_name: 'Panificadora' }}
      >
        <div>Conteúdo</div>
      </AdminLayout>
    );

    const tabLabels = screen
      .getAllByRole('button')
      .map((button) => button.textContent?.trim())
      .filter((label) => label && !label.includes('Sair'));

    expect(tabLabels).toEqual([
      '📊 Dashboard',
      '👥 Clientes',
      '📋 Pedidos',
      '📦 Produtos',
      '⚙️ Configurações',
    ]);
  });
});
