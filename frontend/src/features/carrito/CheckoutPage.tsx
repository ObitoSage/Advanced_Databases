import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    return <p className="text-center text-muted-foreground">No hay nada que pagar.</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <div className="space-y-2 rounded-lg border p-6">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoMoneda(totales.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>IVA (19%)</span><span>{formatoMoneda(totales.impuestos)}</span></div>
        <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatoMoneda(totales.total)}</span></div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Método de pago</label>
        <Select value={metodoPagoId} onValueChange={(v) => setMetodoPagoId(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Selecciona una tarjeta (opcional)" /></SelectTrigger>
          <SelectContent>
            {metodos?.map((m) => <SelectItem key={m.id} value={m.id}>{m.marca} •••• {m.ultimos4}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={() => pagar.mutate()} disabled={pagar.isPending}>{pagar.isPending ? 'Procesando…' : 'Confirmar compra'}</Button>
    </div>
  );
}
