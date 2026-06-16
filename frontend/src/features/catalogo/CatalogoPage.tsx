import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProductos } from './hooks';
import type { FiltrosCatalogo } from './filtros';
import { tituloCategoria } from './filtros';
import { FiltrosSidebar } from './FiltrosSidebar';
import { ProductoCard } from './ProductoCard';
import { PORTADAS } from '@/lib/img';
import { Skeleton } from '@/components/ui/skeleton';

const TILES = ['ropa', 'zapatos', 'electronica'];

export function CatalogoPage() {
  const [sp, setSp] = useSearchParams();
  const categoria = sp.get('categoria') ?? '';
  const q = sp.get('q') ?? '';
  const etiquetas = sp.get('etiquetas') ? sp.get('etiquetas')!.split(',') : [];
  const [precio, setPrecio] = useState<{ min?: number; max?: number }>({});

  const filtros: FiltrosCatalogo = {
    categoria: categoria || undefined,
    q: q || undefined,
    etiquetas: etiquetas.length ? etiquetas : undefined,
    precioMin: precio.min,
    precioMax: precio.max,
    page: 1,
    limit: 24,
  };

  const { data, isLoading, isError } = useProductos(filtros);

  const esHome = !categoria && !q && etiquetas.length === 0 && precio.min == null && precio.max == null;

  const aplicar = (f: FiltrosCatalogo) => {
    const next = new URLSearchParams(sp);
    f.categoria ? next.set('categoria', f.categoria) : next.delete('categoria');
    f.etiquetas?.length ? next.set('etiquetas', f.etiquetas.join(',')) : next.delete('etiquetas');
    f.q ? next.set('q', f.q) : next.delete('q');
    setSp(next, { replace: true });
    setPrecio({ min: f.precioMin, max: f.precioMax });
  };

  const titulo = q
    ? `Resultados para "${q}"`
    : categoria
      ? tituloCategoria(categoria)
      : etiquetas.includes('oferta')
        ? 'Rebajas'
        : etiquetas.includes('novedad')
          ? 'Novedades'
          : 'Destacados';

  return (
    <div className="space-y-12">
      {/* Banner de campaña */}
      <p className="text-center text-sm text-neutral-700">
        Rebajas SS26: hasta <span className="font-medium text-[#c0202e]">-60%</span> en moda, tecnología y hogar
      </p>

      {/* Mosaicos de categoría (solo en la portada) */}
      {esHome && (
        <section className="grid gap-4 md:grid-cols-3">
          {TILES.map((c) => (
            <Link key={c} to={`/?categoria=${c}`} className="group relative aspect-[4/5] overflow-hidden bg-[#f4f3f1] md:aspect-[3/4]">
              <img
                src={PORTADAS[c]}
                alt={tituloCategoria(c)}
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => ((e.currentTarget.style.display = 'none'))}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="text-2xl font-semibold uppercase tracking-[0.18em] text-white drop-shadow-sm">
                  {tituloCategoria(c)}
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Listado */}
      <section>
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          {data && <span className="text-sm text-neutral-500">{data.total} {data.total === 1 ? 'artículo' : 'artículos'}</span>}
        </div>

        <div className="flex gap-10">
          <FiltrosSidebar filtros={filtros} onChange={aplicar} />
          <div className="flex-1">
            {isError && <p className="text-sm text-[#c0202e]">No se pudo cargar el catálogo.</p>}
            {isLoading ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
              </div>
            ) : data && data.data.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
                {data.data.map((p) => <ProductoCard key={p.id} producto={p} />)}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-sm text-neutral-600">No hay artículos que coincidan con tu búsqueda.</p>
                <Link to="/" className="mt-2 inline-block text-sm underline">Ver todo el catálogo</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
