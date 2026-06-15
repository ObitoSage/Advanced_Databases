# Frontend Marketplace (NOVAmarket) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the React frontend for the polyglot e-commerce marketplace (cliente + vendedor), consuming the Express API (auth, catalog, cart, checkout/invoices, payment methods).

**Architecture:** SPA in `frontend/` (Vite + React + TypeScript). React Router for routing, TanStack Query for server state, React Context for the session (JWT in `localStorage`), axios client with auth interceptors. UI with Tailwind CSS + shadcn/ui in a minimalist editorial style. Organized by feature.

**Tech Stack:** Vite, React 18, TypeScript, React Router v6, @tanstack/react-query v5, axios, Tailwind CSS v4, shadcn/ui, react-hook-form + zod. Tests: Vitest + React Testing Library + MSW.

---

## Prerequisites & conventions

- **Plan 1 (backend endpoints) must be implemented and the API running** (`npm run dev` at repo root → `http://localhost:3000`) with seeded catalog (`npm run demo`). Containers up (`npm run db:up`).
- All frontend commands run **inside `frontend/`** unless stated. The repo root keeps the backend.
- **Dev proxy:** Vite proxies `/api` → `http://localhost:3000`, so the client uses relative `/api/...` URLs (no CORS in dev).
- **Decimal fields** from PostgreSQL (`subtotal`, `impuestos`, `total`, `precioUnit`) arrive as **strings** in JSON; parse with `Number(...)` before formatting.
- **Testing scope (per spec):** full TDD for logic units (AuthContext, catalog filter params, cart totals). Pages/components get complete code + a build/verify step; extra component tests are welcome but not required.
- Path alias `@/` → `frontend/src/`.

## File structure (created)

```
frontend/
├── index.html · vite.config.ts · tsconfig*.json · components.json · package.json
├── src/
│   ├── main.tsx · App.tsx · index.css
│   ├── lib/        api.ts · queryClient.ts · utils.ts · money.ts
│   ├── context/    AuthContext.tsx
│   ├── types/      index.ts
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── layout/  Navbar.tsx · Layout.tsx · Footer.tsx
│   │   ├── ProtectedRoute.tsx · RoleRoute.tsx
│   ├── features/
│   │   ├── auth/      LoginPage.tsx · RegistroPage.tsx
│   │   ├── catalogo/  CatalogoPage.tsx · ProductoDetallePage.tsx · ProductoCard.tsx · FiltrosSidebar.tsx · filtros.ts · hooks.ts
│   │   ├── carrito/   CarritoPage.tsx · CheckoutPage.tsx · totales.ts · hooks.ts
│   │   ├── pagos/     MetodosPagoPage.tsx · hooks.ts
│   │   ├── pedidos/   PedidosPage.tsx · PedidoDetallePage.tsx · hooks.ts
│   │   └── vendedor/  PanelPage.tsx · ProductoFormPage.tsx · hooks.ts
│   └── test/   setup.ts · msw.ts
```

---

## Task 1: Scaffold the Vite app (Tailwind v4 + shadcn/ui + deps)

**Files:** the whole `frontend/` skeleton + config.

- [ ] **Step 1: Create the Vite React+TS app** (run from the **repo root**)

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

- [ ] **Step 2: Install runtime + Tailwind deps**

```bash
npm install react-router-dom @tanstack/react-query axios react-hook-form zod @hookform/resolvers
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

- [ ] **Step 3: Configure Tailwind v4 + path alias**

Replace `src/index.css` with:
```css
@import "tailwindcss";
```

Replace `vite.config.ts` with:
```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
```

In `tsconfig.json`, add `compilerOptions.baseUrl` and `paths` (merge with existing):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

And in `tsconfig.app.json` add the same `baseUrl`/`paths` under `compilerOptions` (shadcn reads this).

- [ ] **Step 4: Initialize shadcn/ui and add components**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input label card badge select table dialog skeleton sonner textarea checkbox form
```

(`-d` accepts defaults: neutral base color, CSS variables. This writes `components.json`, `src/lib/utils.ts`, and the `ui/` components.)

- [ ] **Step 5: Verify build + dev**

```bash
npm run build
```
Expected: build succeeds (no TS/Tailwind errors).

- [ ] **Step 6: Commit** (from repo root)

```bash
git add frontend
git commit -m "chore(frontend): scaffold Vite + React + TS + Tailwind + shadcn"
```

---

## Task 2: Test tooling (Vitest + RTL + MSW)

**Files:**
- Modify: `frontend/package.json`, `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`, `frontend/src/test/msw.ts`, `frontend/src/test/sanity.test.ts`

- [ ] **Step 1: Install test deps**

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

- [ ] **Step 2: Configure Vitest** — add a `test` block to `vite.config.ts` (inside the config object):
```ts
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
```
Add the test script to `package.json` scripts:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 3: Create the test setup + MSW server**

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

`src/test/msw.ts`:
```ts
import { setupServer } from 'msw/node';
export const server = setupServer();
```

- [ ] **Step 4: Sanity test**

`src/test/sanity.test.ts`:
```ts
import { test, expect } from 'vitest';
test('vitest funciona', () => { expect(1 + 1).toBe(2); });
```

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/test
git commit -m "test(frontend): add vitest + RTL + MSW harness"
```

---

## Task 3: Types, API client, query client

**Files:**
- Create: `frontend/src/types/index.ts`, `frontend/src/lib/api.ts`, `frontend/src/lib/queryClient.ts`, `frontend/src/lib/money.ts`

- [ ] **Step 1: Types** — `src/types/index.ts`:
```ts
export type Rol = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';
export interface Usuario { id: string; email: string; rol: Rol; }

export interface Variante { nombre: string; valor: string; stock: number; precio?: number; }
export interface Producto {
  id: string; sku: string; nombre: string; descripcion?: string | null;
  categoria: string; precio: number; stock: number; tiendaId: string;
  atributos: Record<string, unknown>;
  etiquetas: string[]; marcas: string[]; industria: string[]; variantes: Variante[];
  activo: boolean; creadoEn: string;
}
export interface Paginado<T> { data: T[]; total: number; page: number; limit: number; }

export interface CarritoItem { productoId: string; sku: string; nombre: string; cantidad: number; precio: number; }
export interface Carrito { id: string; usuarioId: string; items: CarritoItem[]; actualizadoEn: string; }

// Decimales de Postgres llegan como string en JSON.
export interface FacturaItem { id: string; productoId: string; descripcion: string; cantidad: number; precioUnit: string; subtotal: string; }
export interface Factura { id: string; numero: string; usuarioId: string; subtotal: string; impuestos: string; total: string; estado: string; items: FacturaItem[]; emitidaEn: string; }

export interface MetodoPago { id: string; titular: string; marca: string; ultimos4: string; expMes: number; expAnio: number; creadoEn: string; }
```

- [ ] **Step 2: Money helper** — `src/lib/money.ts`:
```ts
export const formatoMoneda = (valor: number | string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(Number(valor));
```

- [ ] **Step 3: API client** — `src/lib/api.ts`:
```ts
import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

/** Extrae un mensaje de error legible de una respuesta de axios. */
export const mensajeError = (e: unknown, fallback = 'Ocurrió un error') => {
  if (axios.isAxiosError(e)) return e.response?.data?.error ?? fallback;
  return fallback;
};
```

- [ ] **Step 4: Query client** — `src/lib/queryClient.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types frontend/src/lib
git commit -m "feat(frontend): types, axios client and query client"
```

---

## Task 4: AuthContext (TDD)

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/context/AuthContext.test.tsx`

- [ ] **Step 1: Write the failing test**

`src/context/AuthContext.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `./AuthContext` has no exports yet.

- [ ] **Step 3: Implement AuthContext** — `src/context/AuthContext.tsx`:
```tsx
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: PASS — login stores token/usuario; logout clears; rehydration works.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context
git commit -m "feat(frontend): AuthContext with JWT persistence (TDD)"
```

---

## Task 5: App shell — providers, router, layout, route guards

**Files:**
- Modify: `frontend/src/main.tsx`, `frontend/src/App.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`, `RoleRoute.tsx`, `layout/Layout.tsx`, `layout/Navbar.tsx`, `layout/Footer.tsx`
- Create: `frontend/src/components/RoleRoute.test.tsx`

- [ ] **Step 1: Write the failing test (RoleRoute)**

`src/components/RoleRoute.test.tsx`:
```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `./RoleRoute` not found.

- [ ] **Step 3a: ProtectedRoute** — `src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute() {
  const { usuario } = useAuth();
  return usuario ? <Outlet /> : <Navigate to="/login" replace />;
}
```

- [ ] **Step 3b: RoleRoute** — `src/components/RoleRoute.tsx`:
```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Rol } from '@/types';

export function RoleRoute({ roles }: { roles: Rol[] }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (!roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

- [ ] **Step 3c: Navbar** — `src/components/layout/Navbar.tsx`:
```tsx
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Carrito } from '@/types';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => (await api.get<Carrito>('/carrito')).data,
    enabled: usuario?.rol === 'CLIENTE',
  });
  const numItems = carrito?.items.reduce((a, i) => a + i.cantidad, 0) ?? 0;

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight">NOVA<span className="font-normal">market</span></Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-foreground">Catálogo</Link>
          {usuario?.rol === 'VENDEDOR' && <Link to="/vendedor" className="text-muted-foreground hover:text-foreground">Panel vendedor</Link>}
          {usuario?.rol === 'CLIENTE' && (
            <>
              <Link to="/carrito" className="text-muted-foreground hover:text-foreground">Carrito{numItems > 0 ? ` (${numItems})` : ''}</Link>
              <Link to="/pedidos" className="text-muted-foreground hover:text-foreground">Pedidos</Link>
              <Link to="/pagos" className="text-muted-foreground hover:text-foreground">Pagos</Link>
            </>
          )}
          {usuario ? (
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>Salir</Button>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>Entrar</Button>
          )}
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3d: Footer + Layout** — `src/components/layout/Footer.tsx`:
```tsx
export function Footer() {
  return <footer className="border-t py-8 text-center text-sm text-muted-foreground">NOVAmarket · Proyecto Bases de Datos Avanzadas</footer>;
}
```
`src/components/layout/Layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 3e: main.tsx (providers)** — replace `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 3f: App.tsx (routes)** — replace `src/App.tsx`. Pages referenced here are created in later tasks; create minimal stubs now so it compiles, and flesh them out per task:
```tsx
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleRoute } from '@/components/RoleRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegistroPage } from '@/features/auth/RegistroPage';
import { CatalogoPage } from '@/features/catalogo/CatalogoPage';
import { ProductoDetallePage } from '@/features/catalogo/ProductoDetallePage';
import { CarritoPage } from '@/features/carrito/CarritoPage';
import { CheckoutPage } from '@/features/carrito/CheckoutPage';
import { MetodosPagoPage } from '@/features/pagos/MetodosPagoPage';
import { PedidosPage } from '@/features/pedidos/PedidosPage';
import { PedidoDetallePage } from '@/features/pedidos/PedidoDetallePage';
import { PanelPage } from '@/features/vendedor/PanelPage';
import { ProductoFormPage } from '@/features/vendedor/ProductoFormPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CatalogoPage />} />
        <Route path="/producto/:id" element={<ProductoDetallePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        <Route element={<RoleRoute roles={['CLIENTE']} />}>
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pagos" element={<MetodosPagoPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/pedidos/:id" element={<PedidoDetallePage />} />
        </Route>

        <Route element={<RoleRoute roles={['VENDEDOR']} />}>
          <Route path="/vendedor" element={<PanelPage />} />
          <Route path="/vendedor/productos/nuevo" element={<ProductoFormPage />} />
          <Route path="/vendedor/productos/:id/editar" element={<ProductoFormPage />} />
        </Route>

        <Route path="*" element={<div className="text-center text-muted-foreground">404 · Página no encontrada</div>} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Create temporary page stubs so it compiles**

For each page imported above that doesn't exist yet, create a minimal stub (it will be replaced in its task). Example for every file under `features/*`:
```tsx
// e.g. src/features/auth/LoginPage.tsx
export function LoginPage() { return <div>Login (pendiente)</div>; }
```
Create equivalently named stubs: `RegistroPage`, `CatalogoPage`, `ProductoDetallePage`, `CarritoPage`, `CheckoutPage`, `MetodosPagoPage`, `PedidosPage`, `PedidoDetallePage`, `PanelPage`, `ProductoFormPage` (each exporting a function of that name returning a placeholder `div`).

- [ ] **Step 5: Run tests + build**

Run: `npm test`
Expected: PASS — the three RoleRoute tests + previous tests.
Run: `npm run build`
Expected: builds cleanly.

- [ ] **Step 6: Commit**

```bash
git add frontend/src
git commit -m "feat(frontend): app shell — providers, router, layout, route guards"
```

---

## Task 6: Auth pages (Login + Registro)

**Files:**
- Replace stubs: `frontend/src/features/auth/LoginPage.tsx`, `RegistroPage.tsx`

- [ ] **Step 1: LoginPage** — `src/features/auth/LoginPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo iniciar sesión'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta? <Link to="/registro" className="underline">Regístrate</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: RegistroPage** — `src/features/auth/RegistroPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function RegistroPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', tipo: 'cliente' as 'cliente' | 'vendedor' });
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await registrar(form);
      toast.success('Cuenta creada');
      navigate(form.tipo === 'vendedor' ? '/vendedor' : '/');
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo crear la cuenta'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Crear cuenta</h1>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Quiero…</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as 'cliente' | 'vendedor' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Comprar (Cliente)</SelectItem>
                <SelectItem value="vendedor">Vender (Vendedor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={cargando}>{cargando ? 'Creando…' : 'Crear cuenta'}</Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta? <Link to="/login" className="underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` → clean. Run: `npm run dev`, with the backend up, register a cliente and a vendedor; confirm redirect + navbar reflects the role.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/auth
git commit -m "feat(frontend): login and registration pages"
```

---

## Task 7: Catalog — filter params (TDD), hooks, list page

**Files:**
- Create: `frontend/src/features/catalogo/filtros.ts`, `filtros.test.ts`, `hooks.ts`, `ProductoCard.tsx`, `FiltrosSidebar.tsx`
- Replace stub: `frontend/src/features/catalogo/CatalogoPage.tsx`

- [ ] **Step 1: Write the failing test (filter param builder)**

`src/features/catalogo/filtros.test.ts`:
```ts
import { test, expect } from 'vitest';
import { construirParams, type FiltrosCatalogo } from './filtros';

test('omite campos vacíos y serializa etiquetas como CSV', () => {
  const filtros: FiltrosCatalogo = { q: 'laptop', categoria: '', precioMin: 100, precioMax: undefined, etiquetas: ['oferta', 'gamer'], marca: '', page: 1 };
  const params = construirParams(filtros);
  expect(params).toEqual({ q: 'laptop', precioMin: 100, etiquetas: 'oferta,gamer', page: 1 });
});

test('carrito de filtros vacío produce objeto vacío salvo page', () => {
  expect(construirParams({ page: 2 })).toEqual({ page: 2 });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `./filtros` not found.

- [ ] **Step 3a: filtros.ts**:
```ts
export interface FiltrosCatalogo {
  q?: string;
  categoria?: string;
  precioMin?: number;
  precioMax?: number;
  etiquetas?: string[];
  marca?: string;
  page?: number;
  limit?: number;
}

export function construirParams(f: FiltrosCatalogo): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (f.q) params.q = f.q;
  if (f.categoria) params.categoria = f.categoria;
  if (f.precioMin != null) params.precioMin = f.precioMin;
  if (f.precioMax != null) params.precioMax = f.precioMax;
  if (f.etiquetas?.length) params.etiquetas = f.etiquetas.join(',');
  if (f.marca) params.marca = f.marca;
  if (f.page != null) params.page = f.page;
  if (f.limit != null) params.limit = f.limit;
  return params;
}

export const CATEGORIAS = ['electronica', 'ropa', 'muebles', 'adornos', 'cocina'];
export const ETIQUETAS = ['oferta', 'gamer', 'verano'];
```

- [ ] **Step 3b: hooks.ts**:
```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginado, Producto } from '@/types';
import { construirParams, type FiltrosCatalogo } from './filtros';

export function useProductos(filtros: FiltrosCatalogo) {
  return useQuery({
    queryKey: ['productos', filtros],
    queryFn: async () => {
      const { data } = await api.get<Paginado<Producto>>('/productos', { params: construirParams(filtros) });
      return data;
    },
  });
}
```

- [ ] **Step 3c: ProductoCard.tsx**:
```tsx
import { Link } from 'react-router-dom';
import type { Producto } from '@/types';
import { formatoMoneda } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <Link to={`/producto/${producto.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex h-40 items-center justify-center bg-muted text-xs text-muted-foreground">{producto.categoria}</div>
        <div className="space-y-1 p-4">
          <p className="line-clamp-1 text-sm">{producto.nombre}</p>
          <p className="font-semibold">{formatoMoneda(producto.precio)}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {producto.etiquetas.slice(0, 2).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 3d: FiltrosSidebar.tsx**:
```tsx
import type { FiltrosCatalogo } from './filtros';
import { CATEGORIAS, ETIQUETAS } from './filtros';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Props { filtros: FiltrosCatalogo; onChange: (f: FiltrosCatalogo) => void; }

export function FiltrosSidebar({ filtros, onChange }: Props) {
  const toggleEtiqueta = (t: string) => {
    const set = new Set(filtros.etiquetas ?? []);
    set.has(t) ? set.delete(t) : set.add(t);
    onChange({ ...filtros, etiquetas: [...set], page: 1 });
  };

  return (
    <aside className="w-48 shrink-0 space-y-6 text-sm">
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Categoría</Label>
        <select
          className="w-full rounded-md border px-2 py-1"
          value={filtros.categoria ?? ''}
          onChange={(e) => onChange({ ...filtros, categoria: e.target.value, page: 1 })}
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Precio</Label>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="min" value={filtros.precioMin ?? ''} onChange={(e) => onChange({ ...filtros, precioMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
          <Input type="number" placeholder="max" value={filtros.precioMax ?? ''} onChange={(e) => onChange({ ...filtros, precioMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Etiquetas</Label>
        {ETIQUETAS.map((t) => (
          <label key={t} className="flex items-center gap-2">
            <Checkbox checked={filtros.etiquetas?.includes(t) ?? false} onCheckedChange={() => toggleEtiqueta(t)} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}
```

- [ ] **Step 3e: CatalogoPage.tsx** (replace stub):
```tsx
import { useState } from 'react';
import { useProductos } from './hooks';
import type { FiltrosCatalogo } from './filtros';
import { FiltrosSidebar } from './FiltrosSidebar';
import { ProductoCard } from './ProductoCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function CatalogoPage() {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({ page: 1 });
  const { data, isLoading, isError } = useProductos(filtros);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
        <Input
          className="mt-4 max-w-md"
          placeholder="Buscar productos…"
          value={filtros.q ?? ''}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value, page: 1 })}
        />
      </div>
      <div className="flex gap-8">
        <FiltrosSidebar filtros={filtros} onChange={setFiltros} />
        <section className="flex-1">
          {isError && <p className="text-sm text-destructive">No se pudo cargar el catálogo.</p>}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {data.data.map((p) => <ProductoCard key={p.id} producto={p} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay productos que coincidan con los filtros.</p>
          )}
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests + build**

Run: `npm test` → filter tests pass. Run: `npm run build` → clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/catalogo
git commit -m "feat(frontend): catalog page with filters (TDD on filter params)"
```

---

## Task 8: Product detail page

**Files:**
- Modify: `frontend/src/features/catalogo/hooks.ts`
- Replace stub: `frontend/src/features/catalogo/ProductoDetallePage.tsx`

- [ ] **Step 1: Add the detail hook** — append to `src/features/catalogo/hooks.ts`:
```ts
import type { Producto as ProductoT } from '@/types';

export function useProducto(id: string) {
  return useQuery({
    queryKey: ['producto', id],
    queryFn: async () => (await api.get<ProductoT>(`/productos/${id}`)).data,
    enabled: Boolean(id),
  });
}
```

- [ ] **Step 2: Detail page with add-to-cart** — `src/features/catalogo/ProductoDetallePage.tsx`:
```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProducto } from './hooks';
import { useAuth } from '@/context/AuthContext';
import { api, mensajeError } from '@/lib/api';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductoDetallePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const { data: producto, isLoading, isError } = useProducto(id);

  const agregar = useMutation({
    mutationFn: () => api.post('/carrito/items', { productoId: id, cantidad: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['carrito'] }); toast.success('Añadido al carrito'); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (isLoading) return <Skeleton className="h-80" />;
  if (isError || !producto) return <p className="text-sm text-destructive">Producto no encontrado.</p>;

  const atributos = Object.entries(producto.atributos ?? {});

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="flex h-80 items-center justify-center rounded-lg bg-muted text-muted-foreground">{producto.categoria}</div>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
        <p className="text-2xl">{formatoMoneda(producto.precio)}</p>
        {producto.descripcion && <p className="text-muted-foreground">{producto.descripcion}</p>}

        {atributos.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium uppercase text-muted-foreground">Especificaciones</h2>
            <dl className="grid grid-cols-2 gap-1 text-sm">
              {atributos.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1"><dt className="capitalize text-muted-foreground">{k}</dt><dd>{String(v)}</dd></div>
              ))}
            </dl>
          </div>
        )}

        {producto.variantes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {producto.variantes.map((v, i) => <Badge key={i} variant="outline">{v.nombre}: {v.valor}</Badge>)}
          </div>
        )}

        {usuario?.rol === 'CLIENTE' ? (
          <Button onClick={() => agregar.mutate()} disabled={agregar.isPending}>Añadir al carrito</Button>
        ) : (
          <Button variant="outline" onClick={() => navigate('/login')}>Inicia sesión para comprar</Button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run build` → clean. With backend up + seed, open a product, confirm dynamic `atributos` render and "Añadir al carrito" updates the navbar badge.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/features/catalogo
git commit -m "feat(frontend): product detail with dynamic attributes and add-to-cart"
```

---

## Task 9: Cart — totals (TDD), hooks, cart page

**Files:**
- Create: `frontend/src/features/carrito/totales.ts`, `totales.test.ts`, `hooks.ts`
- Replace stub: `frontend/src/features/carrito/CarritoPage.tsx`

- [ ] **Step 1: Write the failing test (totals)**

`src/features/carrito/totales.test.ts`:
```ts
import { test, expect } from 'vitest';
import { calcularTotales } from './totales';
import type { CarritoItem } from '@/types';

const items: CarritoItem[] = [
  { productoId: '1', sku: 'A', nombre: 'A', cantidad: 2, precio: 100 },
  { productoId: '2', sku: 'B', nombre: 'B', cantidad: 1, precio: 50 },
];

test('calcula subtotal, IVA (19%) y total', () => {
  expect(calcularTotales(items)).toEqual({ subtotal: 250, impuestos: 47.5, total: 297.5, unidades: 3 });
});

test('carrito vacío da ceros', () => {
  expect(calcularTotales([])).toEqual({ subtotal: 0, impuestos: 0, total: 0, unidades: 0 });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `./totales` not found.

- [ ] **Step 3a: totales.ts**:
```ts
import type { CarritoItem } from '@/types';

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcularTotales(items: CarritoItem[]) {
  const subtotal = r2(items.reduce((a, i) => a + i.precio * i.cantidad, 0));
  const impuestos = r2(subtotal * 0.19);
  const total = r2(subtotal + impuestos);
  const unidades = items.reduce((a, i) => a + i.cantidad, 0);
  return { subtotal, impuestos, total, unidades };
}
```

- [ ] **Step 3b: hooks.ts**:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Carrito } from '@/types';

export function useCarrito() {
  return useQuery({ queryKey: ['carrito'], queryFn: async () => (await api.get<Carrito>('/carrito')).data });
}

export function useMutacionesCarrito() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['carrito'] });
  return {
    cambiar: useMutation({ mutationFn: ({ productoId, cantidad }: { productoId: string; cantidad: number }) => api.patch(`/carrito/items/${productoId}`, { cantidad }), onSuccess: invalidar }),
    quitar: useMutation({ mutationFn: (productoId: string) => api.delete(`/carrito/items/${productoId}`), onSuccess: invalidar }),
    vaciar: useMutation({ mutationFn: () => api.delete('/carrito'), onSuccess: invalidar }),
  };
}
```

- [ ] **Step 3c: CarritoPage.tsx**:
```tsx
import { Link } from 'react-router-dom';
import { useCarrito, useMutacionesCarrito } from './hooks';
import { calcularTotales } from './totales';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function CarritoPage() {
  const { data: carrito, isLoading } = useCarrito();
  const { cambiar, quitar } = useMutacionesCarrito();

  if (isLoading) return <Skeleton className="h-64" />;
  const items = carrito?.items ?? [];
  const { subtotal, impuestos, total } = calcularTotales(items);

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground"><p>Tu carrito está vacío.</p><Link to="/" className="underline">Ver catálogo</Link></div>;
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Carrito</h1>
        {items.map((i) => (
          <div key={i.productoId} className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-sm">{i.nombre}</p>
              <p className="text-sm text-muted-foreground">{formatoMoneda(i.precio)} c/u</p>
            </div>
            <div className="flex items-center gap-3">
              <Input type="number" min={1} className="w-16" defaultValue={i.cantidad}
                onBlur={(e) => cambiar.mutate({ productoId: i.productoId, cantidad: Number(e.target.value) })} />
              <Button variant="ghost" size="sm" onClick={() => quitar.mutate(i.productoId)}>Quitar</Button>
            </div>
          </div>
        ))}
      </div>
      <aside className="h-fit space-y-3 rounded-lg border p-6">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoMoneda(subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>IVA (19%)</span><span>{formatoMoneda(impuestos)}</span></div>
        <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatoMoneda(total)}</span></div>
        <Button asChild className="w-full"><Link to="/checkout">Ir a pagar</Link></Button>
      </aside>
    </div>
  );
}
```

- [ ] **Step 4: Run tests + build**

Run: `npm test` → totals tests pass. Run: `npm run build` → clean.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/carrito
git commit -m "feat(frontend): cart page with totals (TDD on totals)"
```

---

## Task 10: Checkout + payment methods

**Files:**
- Create: `frontend/src/features/pagos/hooks.ts`
- Replace stubs: `frontend/src/features/carrito/CheckoutPage.tsx`, `frontend/src/features/pagos/MetodosPagoPage.tsx`

- [ ] **Step 1: Payment-method hooks** — `src/features/pagos/hooks.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MetodoPago } from '@/types';

export function useMetodosPago() {
  return useQuery({ queryKey: ['metodos-pago'], queryFn: async () => (await api.get<MetodoPago[]>('/metodos-pago')).data });
}

export function useAgregarTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { titular: string; numero: string; marca: string; expMes: number; expAnio: number }) => api.post('/metodos-pago', datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metodos-pago'] }),
  });
}
```

- [ ] **Step 2: MetodosPagoPage** — `src/features/pagos/MetodosPagoPage.tsx`:
```tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { useMetodosPago, useAgregarTarjeta } from './hooks';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function MetodosPagoPage() {
  const { data: metodos } = useMetodosPago();
  const agregar = useAgregarTarjeta();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titular: '', numero: '', marca: 'VISA', expMes: 12, expAnio: 2030 });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agregar.mutateAsync({ ...form, expMes: Number(form.expMes), expAnio: Number(form.expAnio) });
      toast.success('Tarjeta guardada (cifrada en el servidor)');
      setOpen(false);
      setForm({ titular: '', numero: '', marca: 'VISA', expMes: 12, expAnio: 2030 });
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Métodos de pago</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Añadir tarjeta</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva tarjeta</DialogTitle></DialogHeader>
            <form onSubmit={guardar} className="space-y-4">
              <div className="space-y-2"><Label>Titular</Label><Input value={form.titular} onChange={(e) => setForm({ ...form, titular: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>Marca</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
                <div className="space-y-2"><Label>Mes</Label><Input type="number" value={form.expMes} onChange={(e) => setForm({ ...form, expMes: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Año</Label><Input type="number" value={form.expAnio} onChange={(e) => setForm({ ...form, expAnio: Number(e.target.value) })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={agregar.isPending}>Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {metodos?.map((m) => (
          <Card key={m.id} className="p-5">
            <p className="text-sm text-muted-foreground">{m.marca}</p>
            <p className="font-mono text-lg">•••• •••• •••• {m.ultimos4}</p>
            <p className="text-sm text-muted-foreground">{m.titular} · {String(m.expMes).padStart(2, '0')}/{m.expAnio}</p>
          </Card>
        ))}
        {metodos?.length === 0 && <p className="text-sm text-muted-foreground">No tienes tarjetas guardadas.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: CheckoutPage** — `src/features/carrito/CheckoutPage.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCarrito } from './hooks';
import { calcularTotales } from './totales';
import { useMetodosPago } from '@/features/pagos/hooks';
import { api, mensajeError } from '@/lib/api';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: carrito } = useCarrito();
  const { data: metodos } = useMetodosPago();
  const [metodoPagoId, setMetodoPagoId] = useState<string>('');

  const totales = calcularTotales(carrito?.items ?? []);

  const pagar = useMutation({
    mutationFn: () => api.post('/checkout', metodoPagoId ? { metodoPagoId } : {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['carrito'] });
      qc.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Compra realizada');
      navigate(`/pedidos/${res.data.id}`);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (!carrito || carrito.items.length === 0) {
    return <p className="text-center text-muted-foreground">No hay nada que pagar.</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <div className="space-y-2 rounded-lg border p-6">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoMoneda(totales.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>IVA (19%)</span><span>{formatoMoneda(totales.impuestos)}</span></div>
        <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatoMoneda(totales.total)}</span></div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Método de pago</label>
        <Select value={metodoPagoId} onValueChange={setMetodoPagoId}>
          <SelectTrigger><SelectValue placeholder="Selecciona una tarjeta (opcional)" /></SelectTrigger>
          <SelectContent>
            {metodos?.map((m) => <SelectItem key={m.id} value={m.id}>{m.marca} •••• {m.ultimos4}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={() => pagar.mutate()} disabled={pagar.isPending}>{pagar.isPending ? 'Procesando…' : 'Confirmar compra'}</Button>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build` → clean. End-to-end (backend up): add a card, add items, checkout → redirects to the invoice and the cart empties.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/pagos frontend/src/features/carrito/CheckoutPage.tsx
git commit -m "feat(frontend): payment methods and checkout"
```

---

## Task 11: Orders (pedidos)

**Files:**
- Create: `frontend/src/features/pedidos/hooks.ts`
- Replace stubs: `frontend/src/features/pedidos/PedidosPage.tsx`, `PedidoDetallePage.tsx`

- [ ] **Step 1: hooks.ts**:
```ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Factura } from '@/types';

export function useFacturas() {
  return useQuery({ queryKey: ['facturas'], queryFn: async () => (await api.get<Factura[]>('/facturas')).data });
}

export function useFactura(id: string) {
  return useQuery({ queryKey: ['factura', id], queryFn: async () => (await api.get<Factura>(`/facturas/${id}`)).data, enabled: Boolean(id) });
}
```

- [ ] **Step 2: PedidosPage** — `src/features/pedidos/PedidosPage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useFacturas } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function PedidosPage() {
  const { data: facturas, isLoading } = useFacturas();
  if (isLoading) return <Skeleton className="h-64" />;
  if (!facturas || facturas.length === 0) return <p className="text-center text-muted-foreground">Aún no tienes compras.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mis compras</h1>
      <Table>
        <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
        <TableBody>
          {facturas.map((f) => (
            <TableRow key={f.id}>
              <TableCell><Link to={`/pedidos/${f.id}`} className="underline">{f.numero}</Link></TableCell>
              <TableCell>{new Date(f.emitidaEn).toLocaleDateString('es-CO')}</TableCell>
              <TableCell><Badge variant="secondary">{f.estado}</Badge></TableCell>
              <TableCell className="text-right">{formatoMoneda(f.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

- [ ] **Step 3: PedidoDetallePage** — `src/features/pedidos/PedidoDetallePage.tsx`:
```tsx
import { useParams } from 'react-router-dom';
import { useFactura } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PedidoDetallePage() {
  const { id = '' } = useParams();
  const { data: factura, isLoading, isError } = useFactura(id);
  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !factura) return <p className="text-sm text-destructive">Factura no encontrada.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Factura {factura.numero}</h1>
        <p className="text-sm text-muted-foreground">{new Date(factura.emitidaEn).toLocaleString('es-CO')} · {factura.estado}</p>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Cant.</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
        <TableBody>
          {factura.items.map((it) => (
            <TableRow key={it.id}><TableCell>{it.descripcion}</TableCell><TableCell>{it.cantidad}</TableCell><TableCell className="text-right">{formatoMoneda(it.precioUnit)}</TableCell><TableCell className="text-right">{formatoMoneda(it.subtotal)}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="ml-auto w-64 space-y-2">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoMoneda(factura.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Impuestos</span><span>{formatoMoneda(factura.impuestos)}</span></div>
        <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatoMoneda(factura.total)}</span></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify + commit**

Run: `npm run build` → clean.
```bash
git add frontend/src/features/pedidos
git commit -m "feat(frontend): order history and invoice detail"
```

---

## Task 12: Vendor panel + product form (dynamic attributes)

**Files:**
- Create: `frontend/src/features/vendedor/hooks.ts`
- Replace stubs: `frontend/src/features/vendedor/PanelPage.tsx`, `ProductoFormPage.tsx`

- [ ] **Step 1: hooks.ts**:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Producto } from '@/types';

export function useMisProductos() {
  return useQuery({ queryKey: ['mis-productos'], queryFn: async () => (await api.get<Producto[]>('/productos/mios')).data });
}

type CrearInput = Partial<Producto> & { sku: string; nombre: string; categoria: string; precio: number };

export function useGuardarProducto() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['mis-productos'] });
  return {
    crear: useMutation({ mutationFn: (datos: CrearInput) => api.post('/productos', datos), onSuccess: invalidar }),
    actualizar: useMutation({ mutationFn: ({ id, datos }: { id: string; datos: Partial<Producto> }) => api.put(`/productos/${id}`, datos), onSuccess: invalidar }),
    eliminar: useMutation({ mutationFn: (id: string) => api.delete(`/productos/${id}`), onSuccess: invalidar }),
  };
}
```

- [ ] **Step 2: PanelPage** — `src/features/vendedor/PanelPage.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useMisProductos, useGuardarProducto } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PanelPage() {
  const { data: productos, isLoading } = useMisProductos();
  const { eliminar } = useGuardarProducto();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel vendedor</h1>
          <p className="text-sm text-muted-foreground">{productos?.length ?? 0} producto(s)</p>
        </div>
        <Button asChild><Link to="/vendedor/productos/nuevo">Nuevo producto</Link></Button>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Precio</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {productos?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell>{p.nombre}</TableCell>
                <TableCell>{p.categoria}</TableCell>
                <TableCell className="text-right">{formatoMoneda(p.precio)}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button asChild variant="ghost" size="sm"><Link to={`/vendedor/productos/${p.id}/editar`}>Editar</Link></Button>
                  <Button variant="ghost" size="sm" onClick={() => eliminar.mutate(p.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: ProductoFormPage (dynamic attributes per category)** — `src/features/vendedor/ProductoFormPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGuardarProducto } from './hooks';
import { useProducto } from '@/features/catalogo/hooks';
import { CATEGORIAS } from '@/features/catalogo/filtros';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Atributos sugeridos por categoría (esquema dinámico BSON).
const ATRIBUTOS: Record<string, string[]> = {
  electronica: ['voltaje', 'procesador', 'ram'],
  ropa: ['talla', 'material', 'color'],
  muebles: ['material', 'dimensiones'],
  adornos: ['material', 'estilo'],
  cocina: ['material', 'capacidad'],
};

export function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);
  const { crear, actualizar } = useGuardarProducto();
  const { data: existente } = useProducto(id ?? '');

  const [base, setBase] = useState({ sku: '', nombre: '', descripcion: '', categoria: 'electronica', precio: 0, stock: 0 });
  const [atributos, setAtributos] = useState<Record<string, string>>({});
  const [etiquetas, setEtiquetas] = useState('');
  const [marcas, setMarcas] = useState('');

  useEffect(() => {
    if (existente) {
      setBase({ sku: existente.sku, nombre: existente.nombre, descripcion: existente.descripcion ?? '', categoria: existente.categoria, precio: existente.precio, stock: existente.stock });
      setAtributos(Object.fromEntries(Object.entries(existente.atributos ?? {}).map(([k, v]) => [k, String(v)])));
      setEtiquetas(existente.etiquetas.join(', '));
      setMarcas(existente.marcas.join(', '));
    }
  }, [existente]);

  const claves = ATRIBUTOS[base.categoria] ?? [];

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const lista = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const atributosLimpios = Object.fromEntries(claves.map((k) => [k, atributos[k] ?? '']).filter(([, v]) => v !== ''));
    const datos = { ...base, precio: Number(base.precio), stock: Number(base.stock), atributos: atributosLimpios, etiquetas: lista(etiquetas), marcas: lista(marcas), industria: [], variantes: [] };
    try {
      if (editando && id) await actualizar.mutateAsync({ id, datos });
      else await crear.mutateAsync(datos);
      toast.success(editando ? 'Producto actualizado' : 'Producto creado');
      navigate('/vendedor');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{editando ? 'Editar' : 'Nuevo'} producto</h1>
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-2"><Label>SKU</Label><Input value={base.sku} onChange={(e) => setBase({ ...base, sku: e.target.value })} required disabled={editando} /></div>
        <div className="space-y-2"><Label>Nombre</Label><Input value={base.nombre} onChange={(e) => setBase({ ...base, nombre: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Descripción</Label><Textarea value={base.descripcion} onChange={(e) => setBase({ ...base, descripcion: e.target.value })} /></div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <select className="w-full rounded-md border px-2 py-2" value={base.categoria} onChange={(e) => setBase({ ...base, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Precio</Label><Input type="number" step="0.01" value={base.precio} onChange={(e) => setBase({ ...base, precio: Number(e.target.value) })} required /></div>
          <div className="space-y-2"><Label>Stock</Label><Input type="number" value={base.stock} onChange={(e) => setBase({ ...base, stock: Number(e.target.value) })} /></div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium">Atributos de {base.categoria}</p>
          <div className="grid grid-cols-2 gap-3">
            {claves.map((k) => (
              <div key={k} className="space-y-2">
                <Label className="capitalize">{k}</Label>
                <Input value={atributos[k] ?? ''} onChange={(e) => setAtributos({ ...atributos, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2"><Label>Etiquetas (separadas por coma)</Label><Input value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="oferta, gamer" /></div>
        <div className="space-y-2"><Label>Marcas (separadas por coma)</Label><Input value={marcas} onChange={(e) => setMarcas(e.target.value)} placeholder="Asus" /></div>

        <Button type="submit" className="w-full" disabled={crear.isPending || actualizar.isPending}>{editando ? 'Guardar cambios' : 'Crear producto'}</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run build` → clean. As a vendor: create a product (atributos change with category), see it in the panel and in the public catalog; edit it; delete it.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/vendedor
git commit -m "feat(frontend): vendor panel and product form with dynamic attributes"
```

---

## Task 13: Final verification (build, tests, end-to-end)

- [ ] **Step 1: Full test suite**

Run (in `frontend/`): `npm test`
Expected: all unit tests pass (AuthContext, RoleRoute, filtros, totales, sanity).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Manual end-to-end (all services up)**

With repo root `npm run db:up`, `npm run dev`, seed `npm run demo`, and `frontend/ npm run dev`:
1. Register a **cliente** → browse catalog → use filters (categoria, price range, etiquetas, search) → open a product (dynamic attributes show) → add to cart → cart totals correct → add a card → checkout → redirected to invoice → appears in "Mis compras".
2. Register a **vendedor** → create a product with category-specific attributes → see it in the panel and in the public catalog → edit → delete.
3. Confirm RBAC UX: cliente cannot reach `/vendedor` (redirected); logged-out user is sent to `/login` for protected routes.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore(frontend): final verification fixes"
```

---

## Self-review (completed by author)

- **Spec coverage:** scaffold + Tailwind + shadcn (Task 1); test tooling (Task 2); types/api/query (Task 3); AuthContext (Task 4); router/layout/navbar/guards (Task 5); login+registro with tipo (Task 6); catalog list+filters showing Mongo queries (Task 7); detail with dynamic BSON attributes (Task 8); cart + totals (Task 9); checkout + payment methods (Task 10); orders history+detail (Task 11); vendor panel + dynamic-attribute form (Task 12); verification (Task 13). Minimalist editorial style applied via Tailwind/shadcn. Error/loading handled via Skeleton + sonner toasts + 401 interceptor. Out of scope per spec: admin UI, real payment gateway, image uploads.
- **Placeholder scan:** stubs in Task 5 are explicitly temporary and each is replaced in its own later task (auth→6, catalogo→7/8, carrito→9/10, pagos→10, pedidos→11, vendedor→12); no TBD/TODO; all components have complete code.
- **Type/consistency:** hook query keys consistent (`['carrito']`, `['productos']`, `['metodos-pago']`, `['facturas']`, `['mis-productos']`); `construirParams`/`FiltrosCatalogo` shared by filters and hook; `calcularTotales` shared by cart and checkout; types in `@/types` match the API (Decimals as strings, parsed via `formatoMoneda`); routes in `App.tsx` match the page component export names.

---

## Execution handoff

This is **Plan 2 of 2** and depends on Plan 1 (backend endpoints) being implemented first.
