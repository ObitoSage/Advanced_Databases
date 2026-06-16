import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import type { Usuario } from '@/types';

interface AuthValue {
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  registrar: (datos: { email: string; password: string; nombre: string; tipo: 'cliente' | 'vendedor' }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function leerUsuario(): Usuario | null {
  const raw = localStorage.getItem('usuario');
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(leerUsuario);

  const guardarSesion = (token: string, u: Usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(u));
    setUsuario(u);
  };

  const value = useMemo<AuthValue>(() => ({
    usuario,
    async login(email, password) {
      const { data } = await api.post('/auth/login', { email, password });
      guardarSesion(data.token, data.usuario);
    },
    async registrar(datos) {
      await api.post('/auth/registro', datos);
      await this.login(datos.email, datos.password);
    },
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUsuario(null);
    },
  }), [usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
