import { beforeEach, describe, expect, it } from 'vitest';
import { fakeJwt } from '../test/fakeJwt';
import { getAdminSessionToken, getCustomerSessionToken } from './session';

describe('session guards', () => {
  beforeEach(() => localStorage.clear());

  it.each(['owner', 'admin'])('aceita token admin com role %s', (role) => {
    const token = fakeJwt({ ecosystem: 'bakery', role });
    localStorage.setItem('bread_admin_token', token);

    expect(getAdminSessionToken()).toBe(token);
  });

  it('descarta token admin com role member', () => {
    localStorage.setItem('bread_admin_token', fakeJwt({ ecosystem: 'bakery', role: 'member' }));
    localStorage.setItem('bread_admin_user', '{}');

    expect(getAdminSessionToken()).toBeNull();
    expect(localStorage.getItem('bread_admin_token')).toBeNull();
    expect(localStorage.getItem('bread_admin_user')).toBeNull();
  });

  it('descarta token admin malformado ou de outro ecossistema', () => {
    localStorage.setItem('bread_admin_token', 'token-invalido');
    expect(getAdminSessionToken()).toBeNull();

    localStorage.setItem('bread_admin_token', fakeJwt({ ecosystem: 'clinic', role: 'owner' }));
    expect(getAdminSessionToken()).toBeNull();
  });

  it('aceita token de cliente somente com role member', () => {
    const token = fakeJwt({ ecosystem: 'bakery', role: 'member' });
    localStorage.setItem('bread_customer_token', token);
    expect(getCustomerSessionToken()).toBe(token);

    localStorage.setItem('bread_customer_token', fakeJwt({ ecosystem: 'bakery', role: 'owner' }));
    localStorage.setItem('bread_customer_user', '{}');
    expect(getCustomerSessionToken()).toBeNull();
    expect(localStorage.getItem('bread_customer_user')).toBeNull();
  });

  it('retorna null sem token', () => {
    expect(getAdminSessionToken()).toBeNull();
    expect(getCustomerSessionToken()).toBeNull();
  });
});
