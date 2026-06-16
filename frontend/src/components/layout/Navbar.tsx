import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, User, ShoppingBag, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Carrito } from '@/types';
import { CATEGORIAS, tituloCategoria } from '@/features/catalogo/filtros';

const departamentos = [
  { label: 'Moda', to: '/?categoria=ropa' },
  { label: 'Tecnología', to: '/?categoria=electronica' },
  { label: 'Hogar', to: '/?categoria=muebles' },
];

export function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const { data: carrito } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => (await api.get<Carrito>('/carrito')).data,
    enabled: usuario?.rol === 'CLIENTE',
  });
  const numItems = carrito?.items.reduce((a, i) => a + i.cantidad, 0) ?? 0;

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  const cuentaTo = !usuario ? '/login' : usuario.rol === 'VENDEDOR' ? '/vendedor' : '/pedidos';

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Fila 1: departamentos · logotipo · cuenta */}
      <div className="border-b border-neutral-200">
        <div className="mx-auto grid h-16 max-w-screen-2xl grid-cols-2 items-center px-5 md:grid-cols-3 lg:px-8">
          <nav className="hidden items-center gap-7 text-[13px] text-neutral-700 md:flex">
            {departamentos.map((d) => (
              <Link key={d.label} to={d.to} className="transition-colors hover:text-black">{d.label}</Link>
            ))}
          </nav>
          <Link
            to="/"
            className="justify-self-start text-xl font-semibold tracking-[0.32em] text-black md:justify-self-center md:text-2xl"
          >
            NOVAMARKET
          </Link>
          <div className="flex items-center justify-end gap-5 text-neutral-800">
            {usuario?.rol === 'CLIENTE' && (
              <Link to="/pedidos" aria-label="Favoritos y pedidos" className="hidden hover:text-black sm:block">
                <Heart className="size-5" strokeWidth={1.5} />
              </Link>
            )}
            <Link to={cuentaTo} aria-label="Mi cuenta" className="hover:text-black">
              <User className="size-5" strokeWidth={1.5} />
            </Link>
            {usuario?.rol === 'CLIENTE' && (
              <Link to="/carrito" aria-label="Bolsa" className="relative hover:text-black">
                <ShoppingBag className="size-5" strokeWidth={1.5} />
                {numItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-black text-[10px] font-medium text-white">
                    {numItems}
                  </span>
                )}
              </Link>
            )}
            {usuario ? (
              <button onClick={() => { logout(); navigate('/'); }} className="hidden text-[13px] text-neutral-600 hover:text-black sm:block">
                Salir
              </button>
            ) : (
              <Link to="/login" className="hidden text-[13px] text-neutral-600 hover:text-black sm:block">Entrar</Link>
            )}
          </div>
        </div>
      </div>

      {/* Fila 2: categorías · búsqueda */}
      <div className="border-b border-neutral-200">
        <div className="mx-auto flex h-12 max-w-screen-2xl items-center gap-6 px-5 lg:px-8">
          <nav className="flex flex-1 items-center gap-5 overflow-x-auto whitespace-nowrap text-[13px] text-neutral-700 [scrollbar-width:none]">
            <Link to="/?etiquetas=novedad" className="hover:text-black">Novedades</Link>
            <Link to="/?etiquetas=oferta" className="font-medium text-[#c0202e] hover:opacity-80">Rebajas</Link>
            {CATEGORIAS.map((c) => (
              <Link key={c} to={`/?categoria=${c}`} className="hover:text-black">{tituloCategoria(c)}</Link>
            ))}
            {usuario?.rol === 'VENDEDOR' && (
              <Link to="/vendedor" className="ml-auto font-medium text-black">Panel vendedor</Link>
            )}
          </nav>
          <form onSubmit={buscar} className="relative hidden w-72 shrink-0 md:block">
            <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-neutral-400" strokeWidth={1.5} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar piezas y marcas"
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 pl-6 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
