import { test, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw';
import { AuthProvider, useAuth } from './AuthContext';

beforeEach(() => localStorage.clear());

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

test('login guarda token y usuario', async () => {
  server.use(http.post('/api/auth/login', () =>
    HttpResponse.json({ token: 'jwt-123', usuario: { id: 'u1', email: 'a@b.com', rol: 'CLIENTE' } })));

  const { result } = renderHook(() => useAuth(), { wrapper });
  await act(async () => { await result.current.login('a@b.com', 'x'); });

  await waitFor(() => expect(result.current.usuario?.rol).toBe('CLIENTE'));
  expect(localStorage.getItem('token')).toBe('jwt-123');
});

test('logout limpia la sesión', async () => {
  localStorage.setItem('token', 't');
  localStorage.setItem('usuario', JSON.stringify({ id: 'u1', email: 'a@b.com', rol: 'CLIENTE' }));
  const { result } = renderHook(() => useAuth(), { wrapper });
  expect(result.current.usuario?.id).toBe('u1'); // rehidrata de localStorage
  act(() => result.current.logout());
  expect(result.current.usuario).toBeNull();
  expect(localStorage.getItem('token')).toBeNull();
});
