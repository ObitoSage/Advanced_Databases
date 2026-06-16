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
