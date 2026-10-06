import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { fakeJwt } from '../test/fakeJwt';
import { ProtectedRoute } from './ProtectedRoute';

function renderRoute(requiredRole: 'admin' | 'customer') {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>conteudo protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={<div>login admin</div>} />
        <Route path="/login" element={<div>login cliente</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => localStorage.clear());

  it('libera o painel admin para owner', () => {
    localStorage.setItem('bread_admin_token', fakeJwt({ ecosystem: 'bakery', role: 'owner' }));
    renderRoute('admin');
    expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
  });

  it('bloqueia token admin com role member', () => {
    localStorage.setItem('bread_admin_token', fakeJwt({ ecosystem: 'bakery', role: 'member' }));
    renderRoute('admin');
    expect(screen.getByText('login admin')).toBeInTheDocument();
  });

  it('libera o painel do cliente para member', () => {
    localStorage.setItem('bread_customer_token', fakeJwt({ ecosystem: 'bakery', role: 'member' }));
    renderRoute('customer');
    expect(screen.getByText('conteudo protegido')).toBeInTheDocument();
  });

  it('bloqueia token de cliente com role admin', () => {
    localStorage.setItem('bread_customer_token', fakeJwt({ ecosystem: 'bakery', role: 'admin' }));
    renderRoute('customer');
    expect(screen.getByText('login cliente')).toBeInTheDocument();
  });

  it('não aceita token admin no painel do cliente e vice-versa', () => {
    localStorage.setItem('bread_admin_token', fakeJwt({ ecosystem: 'bakery', role: 'owner' }));
    renderRoute('customer');
    expect(screen.getByText('login cliente')).toBeInTheDocument();
  });
});
