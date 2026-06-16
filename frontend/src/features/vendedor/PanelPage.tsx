import { Link } from 'react-router-dom';
import { useMisProductos, useGuardarProducto } from './hooks';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PanelPage() {
  const { data: productos, isLoading } = useMisProductos();
  const { eliminar } = useGuardarProducto();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel vendedor</h1>
          <p className="text-sm text-muted-foreground">{productos?.length ?? 0} producto(s)</p>
        </div>
        <Button render={<Link to="/vendedor/productos/nuevo">Nuevo producto</Link>} />
      </div>
      {isLoading ? <Skeleton className="h-64" /> : (
        <Table>
          <TableHeader><TableRow><TableHead>SKU</TableHead><TableHead>Nombre</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Precio</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {productos?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell>{p.nombre}</TableCell>
                <TableCell>{p.categoria}</TableCell>
                <TableCell className="text-right">{formatoMoneda(p.precio)}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button variant="ghost" size="sm" render={<Link to={`/vendedor/productos/${p.id}/editar`}>Editar</Link>} />
                  <Button variant="ghost" size="sm" onClick={() => eliminar.mutate(p.id)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
