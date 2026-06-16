import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCarrito } from './hooks';
import { calcularTotales } from './totales';
import { useMetodosPago } from '@/features/pagos/hooks';
import { api, mensajeError } from '@/lib/api';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: carrito } = useCarrito();
  const { data: metodos } = useMetodosPago();
  const [metodoPagoId, setMetodoPagoId] = useState<string>('');

  const totales = calcularTotales(carrito?.items ?? []);

  const pagar = useMutation({
    mutationFn: () => api.post('/checkout', metodoPagoId ? { metodoPagoId } : {}),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['carrito'] });
      qc.invalidateQueries({ queryKey: ['facturas'] });
      toast.success('Compra realizada');
      navigate(`/pedidos/${res.data.id}`);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (!carrito || carrito.items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-sm text-neutral-600">No hay nada que pagar.</p>
        <Link to="/" className="mt-2 inline-block text-sm underline">Ver catálogo</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Pago</h1>
      <p className="mt-1 text-sm text-neutral-500">Revisa tu pedido y confirma la compra.</p>

      <div className="mt-8 space-y-6">
        {/* Resumen de artículos */}
        <section className="border border-neutral-200 p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide">Tu pedido</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {carrito.items.map((i) => (
              <li key={i.productoId} className="flex justify-between gap-4">
                <span className="text-neutral-600">{i.nombre} <span className="text-neutral-400">× {i.cantidad}</span></span>
                <span>{formatoMoneda(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-neutral-200 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatoMoneda(totales.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">IVA (19%)</dt><dd>{formatoMoneda(totales.impuestos)}</dd></div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatoMoneda(totales.total)}</dd></div>
          </dl>
        </section>

        {/* Método de pago */}
        <section className="border border-neutral-200 p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide">Método de pago</h2>
          <div className="mt-4">
            <Select value={metodoPagoId} onValueChange={(v) => setMetodoPagoId(v ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Selecciona una tarjeta (opcional)" /></SelectTrigger>
              <SelectContent>
                {metodos?.map((m) => <SelectItem key={m.id} value={m.id}>{m.marca} •••• {m.ultimos4}</SelectItem>)}
              </SelectContent>
            </Select>
            {(!metodos || metodos.length === 0) && (
              <p className="mt-2 text-xs text-neutral-500">
                No tienes tarjetas. <Link to="/pagos" className="underline">Añade una</Link> o paga sin guardar método.
              </p>
            )}
          </div>
        </section>

        <Button className="h-12 w-full text-sm transition-transform duration-150 active:scale-[0.99]" onClick={() => pagar.mutate()} disabled={pagar.isPending}>
          {pagar.isPending ? 'Procesando…' : `Confirmar compra · ${formatoMoneda(totales.total)}`}
        </Button>
      </div>
    </div>
  );
}
