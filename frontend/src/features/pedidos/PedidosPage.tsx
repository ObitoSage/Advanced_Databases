import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { useFacturas } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const estadoClase: Record<string, string> = {
  PAGADA: 'bg-green-50 text-green-700',
  PENDIENTE: 'bg-amber-50 text-amber-700',
  ANULADA: 'bg-red-50 text-[#c0202e]',
};

export function PedidosPage() {
  const { data: facturas, isLoading } = useFacturas();
  if (isLoading) return <Skeleton className="h-64" />;

  if (!facturas || facturas.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Package className="mx-auto size-8 text-neutral-300" strokeWidth={1.25} />
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Aún no tienes pedidos</h1>
        <p className="mt-1 text-sm text-neutral-500">Tus compras aparecerán aquí.</p>
        <Link to="/" className={cn(buttonVariants(), 'mt-6 h-10 px-5 transition-transform duration-150 active:scale-[0.99]')}>Empezar a comprar</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Mis pedidos</h1>
      <p className="mt-1 text-sm text-neutral-500">{facturas.length} {facturas.length === 1 ? 'pedido' : 'pedidos'}</p>

      <ul className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {facturas.map((f) => (
          <li key={f.id}>
            <Link to={`/pedidos/${f.id}`} className="group flex items-center justify-between gap-4 py-5 transition-colors duration-150 hover:bg-neutral-50">
              <div>
                <p className="text-sm font-medium">{f.numero}</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {new Date(f.emitidaEn).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · {f.items.length} {f.items.length === 1 ? 'artículo' : 'artículos'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', estadoClase[f.estado] ?? 'bg-neutral-100 text-neutral-600')}>{f.estado}</span>
                <span className="text-sm font-medium">{formatoMoneda(f.total)}</span>
                <ChevronRight className="size-4 text-neutral-400 transition-transform duration-150 group-hover:translate-x-0.5" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
