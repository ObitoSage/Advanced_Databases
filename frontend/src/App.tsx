import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
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
