# Diseño — Frontend del E-commerce Multitienda (NOVAmarket)

- **Fecha:** 2026-06-15
- **Estado:** Aprobado (pendiente de plan de implementación)
- **Autor:** Brainstorming colaborativo (skill `superpowers:brainstorming`)

## 1. Contexto y objetivo

El backend ya existe: API Express (ESM) con Persistencia Políglota — **PostgreSQL** (usuarios/RBAC, facturación 3NF, métodos de pago cifrados) y **MongoDB** (catálogo con atributos dinámicos BSON, carrito vinculado por UUID). Hoy la API solo expone por HTTP: `auth` (registro/login), `usuarios` (admin) y `metodos-pago`.

**Objetivo:** construir el frontend de un **marketplace completo** y añadir los endpoints de backend que faltan para soportarlo (catálogo, carrito, checkout/facturas). El frontend debe, además, "demostrar" visualmente el trabajo de bases de datos políglotas.

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Alcance | Marketplace completo (frontend + nuevos endpoints de catálogo, carrito y checkout/factura) |
| Stack frontend | **React + Vite + TypeScript** |
| Estilos | **Tailwind CSS + shadcn/ui** |
| Dirección visual | **Minimalista editorial** (blanco/negro/gris, tipografía protagonista, mucho espacio) |
| Roles soportados | **Cliente** (comprador) y **Vendedor** (no se construye panel ADMIN) |
| Datos de servidor | **TanStack Query** (caché, loading/error, refetch) |
| Sesión | **React Context** (`AuthContext`) + JWT en `localStorage` |
| Routing | React Router v6 |
| Formularios | react-hook-form + zod |

## 3. Arquitectura general

- El backend permanece en la raíz del repo. El frontend nuevo vive en `frontend/`. Se comunican por HTTP REST.
- **Dev:** Vite proxy redirige `/api` → `http://localhost:3000` (sin CORS en dev). En producción se añadiría middleware `cors` al backend.
- **Cliente HTTP** (`src/lib/api.ts`, axios): interceptor de petición inyecta `Authorization: Bearer <token>`; interceptor de respuesta, ante **401**, limpia sesión y redirige a `/login`.
- El **backend sigue siendo la fuente de verdad** del RBAC. El RBAC del frontend es solo UX (mostrar/ocultar); cada ruta del API valida el rol.

## 4. Backend — Nuevos endpoints

Se siguen las capas existentes: Rutas → Controladores → Servicios → Repositorios. Se reutiliza `auth` y `metodos-pago`.

**Cambio en registro:** `POST /api/auth/registro` acepta `tipo: "cliente" | "vendedor"` → asigna rol CLIENTE o VENDEDOR (nunca ADMIN).

### Catálogo — MongoDB (`Producto`)
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | `/api/productos` | público | Filtros: `q` (nombre), `categoria`, `precioMin`, `precioMax`, `etiquetas`, `marca`, `page`, `limit`. Usa `$and/$gte/$lte`, `contains`, y filtros de arreglos |
| GET | `/api/productos/:id` | público | Detalle |
| GET | `/api/productos/mios` | VENDEDOR | Productos cuya `tiendaId` = UUID del vendedor |
| POST | `/api/productos` | VENDEDOR | Crea producto; `tiendaId` = `req.usuario.sub`; incluye `atributos` (Json), `variantes`, `etiquetas`, `marcas` |
| PUT | `/api/productos/:id` | VENDEDOR (dueño) | Verifica `producto.tiendaId === req.usuario.sub` |
| DELETE | `/api/productos/:id` | VENDEDOR (dueño) | Verifica propiedad |

### Carrito — MongoDB (`Carrito`, vinculado por UUID)
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| GET | `/api/carrito` | CLIENTE | Devuelve el carrito del usuario; lo crea vacío si no existe |
| POST | `/api/carrito/items` | CLIENTE | `{ productoId, cantidad }`; toma snapshot de sku/nombre/precio del producto |
| PATCH | `/api/carrito/items/:productoId` | CLIENTE | Cambia cantidad |
| DELETE | `/api/carrito/items/:productoId` | CLIENTE | Quita ítem |
| DELETE | `/api/carrito` | CLIENTE | Vacía el carrito |

### Checkout y Facturas — PostgreSQL (ACID)
| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/api/checkout` | CLIENTE | Convierte el carrito en factura; selecciona `metodoPagoId` |
| GET | `/api/facturas` | CLIENTE | Historial del usuario |
| GET | `/api/facturas/:id` | CLIENTE (dueño) | Detalle |

**Checkout (consistencia entre motores):** la **factura + ítems se crean en una transacción ACID real de PostgreSQL** (`postgres.$transaction`). El **descuento de stock y el vaciado del carrito en MongoDB** se ejecutan *después* del commit, con manejo de error y acción compensatoria. No existe atomicidad distribuida Postgres↔Mongo; el servicio lo documenta explícitamente.

**Archivos backend nuevos/modificados:** `producto.{service,controller,routes}.js`; `carrito.{repository,service,controller,routes}.js`; `factura.repository.js` + `checkout.service.js` + `factura.controller.js` (+ rutas); se extienden `auth.service.js` (registro con `tipo`), `producto.repository.js` (búsqueda/edición/propiedad) y `routes/index.js`. Seed: extender `demo.js` para sembrar productos de ejemplo.

## 5. Frontend — Estructura de carpetas

```
frontend/
├── index.html
├── vite.config.ts            # proxy /api -> :3000
├── tailwind.config.js · postcss.config.js
├── components.json           # shadcn/ui
├── .env                      # VITE_API_URL (opcional; en dev se usa el proxy)
└── src/
    ├── main.tsx · App.tsx                 # arranque + rutas
    ├── lib/  api.ts (axios) · queryClient.ts · utils.ts
    ├── context/AuthContext.tsx
    ├── components/
    │   ├── ui/               # shadcn (button, input, card, dialog, select, badge, table, skeleton, sonner)
    │   ├── layout/           # Navbar, Footer, Layout
    │   ├── ProtectedRoute.tsx · RoleRoute.tsx
    │   └── ErrorBoundary.tsx
    ├── features/
    │   ├── auth/             # LoginPage, RegistroPage (cliente/vendedor)
    │   ├── catalogo/         # CatalogoPage (filtros + grid), ProductoDetallePage, FiltrosSidebar, ProductoCard
    │   ├── carrito/          # CarritoPage, CheckoutPage
    │   ├── pagos/            # MetodosPagoPage, NuevaTarjetaDialog
    │   ├── pedidos/          # PedidosPage, PedidoDetallePage
    │   └── vendedor/         # PanelPage, ProductoFormPage (crear/editar)
    ├── hooks/                # useProductos, useProducto, useCarrito, useCheckout, useFacturas, useMetodosPago, useMisProductos
    └── types/                # Producto, Carrito, Factura, Usuario, MetodoPago
```

Organización por **features** para mantener cada módulo aislado y enfocado.

## 6. Frontend — Páginas y flujos

### Cliente
| Ruta | Página | Destaca |
|---|---|---|
| `/` | Catálogo + filtros | Consultas Mongo: `$gte/$lte`, `$and/$or`, arreglos (etiquetas/marcas) |
| `/producto/:id` | Detalle | Renderiza **atributos dinámicos BSON** (clave/valor) + variantes |
| `/carrito` | Carrito | Ítems, cantidades, subtotal |
| `/checkout` | Checkout | Elige método de pago (tarjetas enmascaradas) → crea factura |
| `/pedidos`, `/pedidos/:id` | Mis compras | Historial de facturas (Postgres) |
| `/pagos` | Métodos de pago | Listar enmascarado + añadir tarjeta (cifrada en backend) |
| `/login`, `/registro` | Auth | Registro permite elegir **Comprar / Vender** |

### Vendedor
| Ruta | Página | Destaca |
|---|---|---|
| `/vendedor` | Panel | Lista "mis productos" + métricas simples |
| `/vendedor/productos/nuevo` | Crear producto | Form con **atributos dinámicos según categoría** (voltaje/talla…) + variantes + etiquetas/marcas |
| `/vendedor/productos/:id/editar` | Editar producto | Mismo form, precargado |

**Layout:** Navbar minimalista (logo, buscador, catálogo, carrito con badge de nº ítems, menú de usuario; "Panel vendedor" solo si rol VENDEDOR). Contenido centrado con `max-width` y espaciado amplio.

**Layout del catálogo (aprobado):** filtros en barra lateral izquierda + grid de productos (3 columnas) a la derecha.

## 7. Auth y RBAC en el frontend

- `AuthContext` guarda `{ token, usuario: { id, email, rol } }` en estado + `localStorage`; se rehidrata al cargar.
- `ProtectedRoute` exige sesión; `RoleRoute roles={[...]}` exige rol. Si no cumple → redirige a `/login` o muestra "no autorizado".
- UI condicional por rol: "Panel vendedor" solo VENDEDOR; "Añadir al carrito" pide login si no hay sesión.
- Seguridad real impuesta por el backend (frontend = solo UX).

## 8. Manejo de errores y estados

- TanStack Query: `isLoading` → **Skeletons**; `isError` → mensaje + reintento.
- Mutaciones (carrito, checkout, crear producto) → **Toast** (sonner) de éxito/error.
- Formularios: react-hook-form + zod; errores del API (400/409) mapeados al formulario.
- `ErrorBoundary` para fallos de render; página **404**.

## 9. Cómo el frontend demuestra el backend políglota

- **Filtros del catálogo** → consultas comparativas y de arreglos en MongoDB.
- **Detalle de producto** → esquema flexible BSON (atributos por categoría) renderizado genéricamente.
- **Carrito** → vínculo por **UUID** entre Postgres (usuario) y Mongo (carrito).
- **Checkout** → **factura ACID** en Postgres + método de pago **cifrado**.
- **Crear producto (vendedor)** → atributos dinámicos por categoría (BSON).

## 10. Testing

- **Frontend:** Vitest + React Testing Library + MSW (mock del API) para unidades clave: `AuthContext`, filtros del catálogo, cálculo del carrito. Opcional: 1 e2e feliz (Playwright) login→añadir→checkout.
- **Backend:** script de humo para los endpoints nuevos (productos/carrito/checkout), al estilo del `test-seguridad.js` existente.

## 11. Cómo ejecutar (dev)

1. `npm run db:up` — contenedores PostgreSQL + MongoDB.
2. Raíz: `npm run dev` — API en `:3000`.
3. `frontend/`: `npm run dev` — Vite en `:5173`, proxy `/api` → `:3000`.
4. Seed: `npm run demo` (extendido) para poblar el catálogo.

## 12. Riesgos y decisiones notables

- **Checkout no es atómico entre motores** (Postgres ACID + Mongo best-effort con compensación). Documentado en el servicio.
- **RBAC en frontend es solo UX**; el backend valida.
- **Registro de vendedor** vía `tipo` en el endpoint público (ADMIN nunca se asigna por registro).

## 13. Fuera de alcance (YAGNI)

- Panel de administración (gestión de usuarios) — el endpoint existe pero no se construye UI.
- Pasarela de pago real, envíos/logística, reseñas, wishlist, búsqueda full-text avanzada, i18n.
- Subida real de imágenes (se usan placeholders/URL).

## 14. Criterios de éxito

- Un Cliente puede: registrarse, iniciar sesión, navegar/filtrar el catálogo, ver detalle, añadir al carrito, añadir una tarjeta (cifrada), hacer checkout y ver su historial de facturas.
- Un Vendedor puede: registrarse como vendedor, crear/editar/eliminar sus productos con atributos dinámicos por categoría, y verlos en el catálogo.
- El RBAC se respeta (rutas y UI por rol) y la seguridad la impone el backend.
- El frontend evidencia las características políglotas (consultas Mongo, BSON dinámico, UUID, factura ACID, cifrado).

## 15. Implementación por fases (sugerida)

El alcance es amplio pero cohesivo. Se recomienda ejecutar en dos fases verificables de forma independiente:

- **Fase 1 — Backend (habilita el frontend):** endpoints de catálogo (`/api/productos*`), carrito (`/api/carrito*`) y checkout/facturas (`/api/checkout`, `/api/facturas*`); registro con `tipo`; seed de productos de ejemplo; script de humo. Se verifica con el script de humo.
- **Fase 2 — Frontend:** andamiaje (Vite + Tailwind + shadcn/ui + router + `AuthContext` + cliente API) → auth/layout → catálogo (filtros + detalle) → carrito + checkout → métodos de pago + pedidos → panel de vendedor. Se verifica contra la API real.
