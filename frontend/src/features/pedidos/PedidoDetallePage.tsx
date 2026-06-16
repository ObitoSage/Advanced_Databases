import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useFactura } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const estadoClase: Record<string, string> = {
  PAGADA: 'bg-green-50 text-green-700',
  PENDIENTE: 'bg-amber-50 text-amber-700',
  ANULADA: 'bg-red-50 text-[#c0202e]',
};

export function PedidoDetallePage() {
  const { id = '' } = useParams();
  const { data: factura, isLoading, isError } = useFactura(id);
  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !factura) return <p className="text-sm text-[#c0202e]">Factura no encontrada.</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/pedidos" className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors duration-150 hover:text-black">
        <ChevronLeft className="size-4" /> Mis pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Factura {factura.numero}</h1>
          <p className="mt-1 text-sm text-neutral-500">{new Date(factura.emitidaEn).toLocaleString('es-ES')}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-medium', estadoClase[factura.estado] ?? 'bg-neutral-100 text-neutral-600')}>{factura.estado}</span>
      </div>

      <div className="mt-8 divide-y divide-neutral-200 border-y border-neutral-200">
        {factura.items.map((it) => (
          <div key={it.id} className="flex items-center justify-between gap-4 py-4 text-sm">
            <div>
              <p className="font-medium">{it.descripcion}</p>
              <p className="mt-0.5 text-neutral-500">{formatoMoneda(it.precioUnit)} × {it.cantidad}</p>
            </div>
            <p className="font-medium">{formatoMoneda(it.subtotal)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 ml-auto w-full max-w-xs space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatoMoneda(factura.subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">Impuestos</span><span>{formatoMoneda(factura.impuestos)}</span></div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold"><span>Total</span><span>{formatoMoneda(factura.total)}</span></div>
      </div>
    </div>
  );
}
