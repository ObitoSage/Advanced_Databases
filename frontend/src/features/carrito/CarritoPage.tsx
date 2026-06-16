import { Link } from 'react-router-dom';
import { useCarrito, useMutacionesCarrito } from './hooks';
import { calcularTotales } from './totales';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function CarritoPage() {
  const { data: carrito, isLoading } = useCarrito();
  const { cambiar, quitar } = useMutacionesCarrito();

  if (isLoading) return <Skeleton className="h-64" />;
  const items = carrito?.items ?? [];
  const { subtotal, impuestos, total } = calcularTotales(items);

  if (items.length === 0) {
    return <div className="text-center text-muted-foreground"><p>Tu carrito está vacío.</p><Link to="/" className="underline">Ver catálogo</Link></div>;
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Carrito</h1>
        {items.map((i) => (
          <div key={i.productoId} className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="text-sm">{i.nombre}</p>
              <p className="text-sm text-muted-foreground">{formatoMoneda(i.precio)} c/u</p>
            </div>
            <div className="flex items-center gap-3">
              <Input type="number" min={1} className="w-16" defaultValue={i.cantidad}
                onBlur={(e) => cambiar.mutate({ productoId: i.productoId, cantidad: Number(e.target.value) })} />
              <Button variant="ghost" size="sm" onClick={() => quitar.mutate(i.productoId)}>Quitar</Button>
            </div>
          </div>
        ))}
      </div>
      <aside className="h-fit space-y-3 rounded-lg border p-6">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoMoneda(subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>IVA (19%)</span><span>{formatoMoneda(impuestos)}</span></div>
        <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatoMoneda(total)}</span></div>
        <Button className="w-full" render={<Link to="/checkout">Ir a pagar</Link>} />
      </aside>
    </div>
  );
}
