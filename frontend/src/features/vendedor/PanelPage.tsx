import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Store } from 'lucide-react';
import { useMisProductos, useGuardarProducto } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { imagenProducto } from '@/lib/img';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PanelPage() {
  const { data: productos, isLoading } = useMisProductos();
  const { eliminar } = useGuardarProducto();
  const total = productos?.length ?? 0;
  const valor = productos?.reduce((a, p) => a + p.precio * p.stock, 0) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel de vendedor</h1>
          <p className="mt-1 text-sm text-neutral-500">{total} {total === 1 ? 'producto' : 'productos'} · valor de inventario {formatoMoneda(valor)}</p>
        </div>
        <Link to="/vendedor/productos/nuevo" className={cn(buttonVariants(), 'h-10 gap-1.5 px-4 transition-transform duration-150 active:scale-[0.99]')}><Plus className="size-4" /> Nuevo producto</Link>
      </div>

      {isLoading ? (
        <Skeleton className="mt-8 h-64" />
      ) : total === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-neutral-300 py-20 text-center">
          <Store className="size-8 text-neutral-300" strokeWidth={1.25} />
          <h2 className="mt-4 text-lg font-medium">Aún no has publicado productos</h2>
          <p className="mt-1 text-sm text-neutral-500">Crea tu primer producto para empezar a vender.</p>
          <Link to="/vendedor/productos/nuevo" className={cn(buttonVariants(), 'mt-6 h-10 px-5 transition-transform duration-150 active:scale-[0.99]')}>Crear producto</Link>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
          {productos!.map((p) => {
            const img = imagenProducto(p);
            return (
              <li key={p.id} className="flex items-center gap-4 py-4">
                <Link to={`/producto/${p.id}`} className="size-16 shrink-0 overflow-hidden bg-[#f4f3f1]">
                  {img ? <img src={img} alt="" className="size-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} /> : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nombre}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">{p.sku} · <span className="capitalize">{p.categoria}</span> · stock {p.stock}</p>
                </div>
                <p className="shrink-0 text-sm font-medium">{formatoMoneda(p.precio)}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <Link to={`/vendedor/productos/${p.id}/editar`} aria-label="Editar" className="p-2 text-neutral-500 transition-colors duration-150 hover:text-black active:scale-90">
                    <Pencil className="size-4" />
                  </Link>
                  <button onClick={() => eliminar.mutate(p.id)} aria-label="Eliminar" className="p-2 text-neutral-500 transition-colors duration-150 hover:text-[#c0202e] active:scale-90">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
