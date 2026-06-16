import { Link } from 'react-router-dom';
import type { Producto } from '@/types';
import { formatoMoneda } from '@/lib/money';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProductoCard({ producto }: { producto: Producto }) {
  return (
    <Link to={`/producto/${producto.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex h-40 items-center justify-center bg-muted text-xs text-muted-foreground">{producto.categoria}</div>
        <div className="space-y-1 p-4">
          <p className="line-clamp-1 text-sm">{producto.nombre}</p>
          <p className="font-semibold">{formatoMoneda(producto.precio)}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            {producto.etiquetas.slice(0, 2).map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
        </div>
      </Card>
    </Link>
  );
}
