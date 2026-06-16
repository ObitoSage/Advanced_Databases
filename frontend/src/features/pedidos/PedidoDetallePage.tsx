import { useParams } from 'react-router-dom';
import { useFactura } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PedidoDetallePage() {
  const { id = '' } = useParams();
  const { data: factura, isLoading, isError } = useFactura(id);
  if (isLoading) return <Skeleton className="h-64" />;
  if (isError || !factura) return <p className="text-sm text-destructive">Factura no encontrada.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Factura {factura.numero}</h1>
        <p className="text-sm text-muted-foreground">{new Date(factura.emitidaEn).toLocaleString('es-CO')} · {factura.estado}</p>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Cant.</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
        <TableBody>
          {factura.items.map((it) => (
            <TableRow key={it.id}><TableCell>{it.descripcion}</TableCell><TableCell>{it.cantidad}</TableCell><TableCell className="text-right">{formatoMoneda(it.precioUnit)}</TableCell><TableCell className="text-right">{formatoMoneda(it.subtotal)}</TableCell></TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="ml-auto w-64 space-y-2">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatoMoneda(factura.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Impuestos</span><span>{formatoMoneda(factura.impuestos)}</span></div>
        <div className="flex justify-between border-t pt-2 font-semibold"><span>Total</span><span>{formatoMoneda(factura.total)}</span></div>
      </div>
    </div>
  );
}
