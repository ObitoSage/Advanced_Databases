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
