import { Link } from 'react-router-dom';
import { ShoppingBag, X } from 'lucide-react';
import { useCarrito, useMutacionesCarrito } from './hooks';
import { calcularTotales } from './totales';
import { formatoMoneda } from '@/lib/money';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CarritoPage() {
  const { data: carrito, isLoading } = useCarrito();
  const { cambiar, quitar } = useMutacionesCarrito();

  if (isLoading) return <Skeleton className="h-72" />;
  const items = carrito?.items ?? [];
  const { subtotal, impuestos, total, unidades } = calcularTotales(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ShoppingBag className="mx-auto size-8 text-neutral-300" strokeWidth={1.25} />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Tu bolsa está vacía</h1>
        <p className="mt-1 text-sm text-neutral-500">Cuando añadas piezas, aparecerán aquí.</p>
        <Link to="/" className={cn(buttonVariants(), 'mt-6 h-10 px-5 transition-transform duration-150 active:scale-[0.99]')}>Explorar el catálogo</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Bolsa</h1>
      <p className="mt-1 text-sm text-neutral-500">{unidades} {unidades === 1 ? 'artículo' : 'artículos'}</p>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {items.map((i) => (
            <div key={i.productoId} className="flex gap-4 py-5">
              <Link to={`/producto/${i.productoId}`} className="flex size-24 shrink-0 items-center justify-center bg-[#f4f3f1] text-[10px] uppercase tracking-widest text-neutral-400">
                {i.sku}
              </Link>
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/producto/${i.productoId}`} className="text-sm font-medium hover:underline">{i.nombre}</Link>
                    <p className="mt-0.5 text-sm text-neutral-500">{formatoMoneda(i.precio)} c/u</p>
                  </div>
                  <button onClick={() => quitar.mutate(i.productoId)} aria-label="Quitar" className="text-neutral-400 transition-colors duration-150 hover:text-black active:scale-90">
                    <X className="size-4" />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <input
                    type="number"
                    min={1}
                    defaultValue={i.cantidad}
                    onBlur={(e) => cambiar.mutate({ productoId: i.productoId, cantidad: Number(e.target.value) })}
                    className="h-9 w-16 border border-neutral-300 px-2 text-sm outline-none focus:border-black"
                  />
                  <p className="text-sm font-medium">{formatoMoneda(i.precio * i.cantidad)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className="border border-neutral-200 p-6">
            <h2 className="text-sm font-medium uppercase tracking-wide">Resumen</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatoMoneda(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">IVA (19%)</dt><dd>{formatoMoneda(impuestos)}</dd></div>
              <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold"><dt>Total</dt><dd>{formatoMoneda(total)}</dd></div>
            </dl>
            <Link to="/checkout" className={cn(buttonVariants(), 'mt-5 h-12 w-full text-sm transition-transform duration-150 active:scale-[0.99]')}>Tramitar pedido</Link>
            <p className="mt-3 text-center text-xs text-neutral-500">Envío gratis en pedidos superiores a 300 €</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
