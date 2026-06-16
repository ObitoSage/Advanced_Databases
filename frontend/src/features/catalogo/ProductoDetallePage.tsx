import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProducto } from './hooks';
import { useAuth } from '@/context/AuthContext';
import { api, mensajeError } from '@/lib/api';
import { formatoMoneda } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductoDetallePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const { data: producto, isLoading, isError } = useProducto(id);

  const agregar = useMutation({
    mutationFn: () => api.post('/carrito/items', { productoId: id, cantidad: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['carrito'] }); toast.success('Añadido al carrito'); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (isLoading) return <Skeleton className="h-80" />;
  if (isError || !producto) return <p className="text-sm text-destructive">Producto no encontrado.</p>;

  const atributos = Object.entries(producto.atributos ?? {});

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="flex h-80 items-center justify-center rounded-lg bg-muted text-muted-foreground">{producto.categoria}</div>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
        <p className="text-2xl">{formatoMoneda(producto.precio)}</p>
        {producto.descripcion && <p className="text-muted-foreground">{producto.descripcion}</p>}

        {atributos.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium uppercase text-muted-foreground">Especificaciones</h2>
            <dl className="grid grid-cols-2 gap-1 text-sm">
              {atributos.map(([k, v]) => (
                <div key={k} className="flex justify-between border-b py-1"><dt className="capitalize text-muted-foreground">{k}</dt><dd>{String(v)}</dd></div>
              ))}
            </dl>
          </div>
        )}

        {producto.variantes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {producto.variantes.map((v, i) => <Badge key={i} variant="outline">{v.nombre}: {v.valor}</Badge>)}
          </div>
        )}

        {usuario?.rol === 'CLIENTE' ? (
          <Button onClick={() => agregar.mutate()} disabled={agregar.isPending}>Añadir al carrito</Button>
        ) : (
          <Button variant="outline" onClick={() => navigate('/login')}>Inicia sesión para comprar</Button>
        )}
      </div>
    </div>
  );
}
