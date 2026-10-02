import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

vi.mock('@/services/api', () => ({
  ApiService: { getTenantIdentity: vi.fn().mockRejectedValue(new Error('offline')) },
}));

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<div>tela admin</div>} />
        <Route path="/login" element={<div>tela cliente</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('encaminha o dono para /admin', async () => {
    renderHome();
    await userEvent.click(screen.getByRole('button', { name: 'Admin' }));
    expect(screen.getByText('tela admin')).toBeInTheDocument();
  });

  it('encaminha o cliente para /login', async () => {
    renderHome();
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(screen.getByText('tela cliente')).toBeInTheDocument();
  });
});
