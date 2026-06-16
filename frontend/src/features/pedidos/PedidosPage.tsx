import { Link } from 'react-router-dom';
import { useFacturas } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function PedidosPage() {
  const { data: facturas, isLoading } = useFacturas();
  if (isLoading) return <Skeleton className="h-64" />;
  if (!facturas || facturas.length === 0) return <p className="text-center text-muted-foreground">Aún no tienes compras.</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Mis compras</h1>
      <Table>
        <TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
        <TableBody>
          {facturas.map((f) => (
            <TableRow key={f.id}>
              <TableCell><Link to={`/pedidos/${f.id}`} className="underline">{f.numero}</Link></TableCell>
              <TableCell>{new Date(f.emitidaEn).toLocaleDateString('es-CO')}</TableCell>
              <TableCell><Badge variant="secondary">{f.estado}</Badge></TableCell>
              <TableCell className="text-right">{formatoMoneda(f.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
