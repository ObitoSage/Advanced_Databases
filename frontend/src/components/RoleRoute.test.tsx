import { test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RoleRoute } from './RoleRoute';

beforeEach(() => localStorage.clear());

function montar(rol: string | null) {
  if (rol) {
    localStorage.setItem('token', 't');
    localStorage.setItem('usuario', JSON.stringify({ id: 'u', email: 'a@b.com', rol }));
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/panel']}>
        <Routes>
          <Route element={<RoleRoute roles={['VENDEDOR']} />}>
            <Route path="/panel" element={<div>PANEL</div>} />
          </Route>
          <Route path="/login" element={<div>LOGIN</div>} />
          <Route path="/" element={<div>HOME</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

test('VENDEDOR entra al panel', () => { montar('VENDEDOR'); expect(screen.getByText('PANEL')).toBeInTheDocument(); });
test('CLIENTE es redirigido (no ve el panel)', () => { montar('CLIENTE'); expect(screen.queryByText('PANEL')).not.toBeInTheDocument(); });
test('sin sesión va a login', () => { montar(null); expect(screen.getByText('LOGIN')).toBeInTheDocument(); });
