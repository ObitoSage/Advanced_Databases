import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, ShoppingBag, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Carrito } from '@/types';
import { tituloCategoria } from '@/features/catalogo/filtros';

// Subconjunto destacado para la barra (el resto vive en el filtro y el pie).
const NAV_CATEGORIAS = ['ropa', 'zapatos', 'accesorios', 'electronica', 'muebles'];

const enlace = 'transition-colors duration-150 hover:text-black';
const icono = 'text-neutral-800 transition-transform duration-150 hover:text-black active:scale-90';

export function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [buscando, setBuscando] = useState(false);

  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => (await api.get<Carrito>('/carrito')).data,
    enabled: usuario?.rol === 'CLIENTE',
  });
  const numItems = carrito?.items.reduce((a, i) => a + i.cantidad, 0) ?? 0;

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    setBuscando(false);
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  const cuentaTo = !usuario ? '/login' : usuario.rol === 'VENDEDOR' ? '/vendedor' : '/pedidos';

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
      {/* Una sola fila: navegación · logotipo · acciones */}
      <div className="mx-auto grid h-16 max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 lg:px-8">
        {/* Izquierda: categorías (desktop) */}
        <nav className="hidden items-center gap-5 overflow-x-auto whitespace-nowrap pr-4 text-[13px] text-neutral-600 lg:flex [scrollbar-width:none]">
          <Link to="/?etiquetas=novedad" className={enlace}>Novedades</Link>
          <Link to="/?etiquetas=oferta" className="font-medium text-[#c0202e] transition-opacity duration-150 hover:opacity-75">Rebajas</Link>
          {NAV_CATEGORIAS.map((c) => (
            <Link key={c} to={`/?categoria=${c}`} className={enlace}>{tituloCategoria(c)}</Link>
          ))}
        </nav>

        {/* Centro: logotipo */}
        <Link
          to="/"
          className="col-start-2 justify-self-center text-xl font-semibold tracking-[0.3em] text-black transition-opacity duration-150 hover:opacity-80 md:text-2xl"
        >
          NOVAMARKET
        </Link>

        {/* Derecha: acciones */}
        <div className="col-start-3 flex items-center justify-end gap-5">
          {usuario?.rol === 'VENDEDOR' && (
            <Link to="/vendedor" className="hidden text-[13px] font-medium lg:block">Panel</Link>
          )}
          <button onClick={() => setBuscando((v) => !v)} aria-label="Buscar" className={icono}>
            <Search className="size-5" strokeWidth={1.5} />
          </button>
          <Link to={cuentaTo} aria-label="Mi cuenta" className={icono}>
            <User className="size-5" strokeWidth={1.5} />
          </Link>
          {usuario?.rol === 'CLIENTE' && (
            <Link to="/carrito" aria-label="Bolsa" className={`relative ${icono}`}>
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              {numItems > 0 && (
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
                  {numItems}
                </span>
              )}
            </Link>
          )}
          {usuario ? (
            <button onClick={() => { logout(); navigate('/'); }} className={`hidden text-[13px] text-neutral-600 sm:block ${enlace}`}>Salir</button>
          ) : (
            <Link to="/login" className={`hidden text-[13px] text-neutral-600 sm:block ${enlace}`}>Entrar</Link>
          )}
        </div>
      </div>

      {/* Buscador desplegable (capa efímera, no una segunda barra) */}
      {buscando && (
        <div className="absolute inset-x-0 top-full border-b border-neutral-200 bg-white motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200">
          <form onSubmit={buscar} className="mx-auto flex max-w-screen-2xl items-center gap-3 px-5 py-4 lg:px-8">
            <Search className="size-5 shrink-0 text-neutral-400" strokeWidth={1.5} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setBuscando(false)}
              placeholder="Buscar piezas y marcas"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-neutral-400"
            />
            <button type="button" onClick={() => setBuscando(false)} aria-label="Cerrar" className={icono}>
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
