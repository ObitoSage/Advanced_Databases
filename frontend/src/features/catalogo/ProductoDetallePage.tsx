import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, Heart } from 'lucide-react';
import { useProducto } from './hooks';
import { tituloCategoria } from './filtros';
import { useAuth } from '@/context/AuthContext';
import { api, mensajeError } from '@/lib/api';
import { formatoMoneda } from '@/lib/money';
import { imagenProducto } from '@/lib/img';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ProductoDetallePage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const { data: producto, isLoading, isError } = useProducto(id);

  const [variante, setVariante] = useState('');
  const [fav, setFav] = useState(false);
  const [roto, setRoto] = useState(false);
  const [detalleAbierto, setDetalleAbierto] = useState(true);
  const [envioAbierto, setEnvioAbierto] = useState(false);

  const agregar = useMutation({
    mutationFn: () => api.post('/carrito/items', { productoId: id, cantidad: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['carrito'] }); toast.success('Añadido a la bolsa'); },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (isLoading) {
    return (
      <div className="grid gap-10 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (isError || !producto) return <p className="text-sm text-[#c0202e]">Producto no encontrado.</p>;

  const img = imagenProducto(producto);
  const marca = producto.marcas[0] ?? producto.categoria;
  const oferta = producto.etiquetas.includes('oferta');
  const atributos = Object.entries(producto.atributos ?? {});
  const tieneVariantes = producto.variantes.length > 0;

  const onAdd = () => {
    if (tieneVariantes && !variante) { toast.error('Selecciona una opción primero'); return; }
    agregar.mutate();
  };

  return (
    <div className="space-y-12">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Galería */}
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-[#f4f3f1]">
          {img && !roto ? (
            <img src={img} alt={producto.nombre} onError={() => setRoto(true)} className="size-full object-cover" />
          ) : (
            <span className="text-xs uppercase tracking-widest text-neutral-400">{producto.categoria}</span>
          )}
        </div>

        {/* Panel de compra */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold tracking-tight">{marca}</p>
              <p className="text-neutral-600">{producto.nombre}</p>
            </div>
            <button onClick={() => setFav((v) => !v)} aria-label="Favorito" className="shrink-0 text-neutral-700 hover:text-black">
              <Heart className={cn('size-6', fav && 'fill-black text-black')} strokeWidth={1.5} />
            </button>
          </div>

          <p className={cn('mt-4 text-xl', oferta ? 'font-medium text-[#c0202e]' : 'text-black')}>
            {formatoMoneda(producto.precio)}
          </p>

          {tieneVariantes && (
            <div className="mt-6">
              <Select value={variante} onValueChange={(v) => setVariante(v ?? '')}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar opción" /></SelectTrigger>
                <SelectContent>
                  {producto.variantes.map((v, i) => (
                    <SelectItem key={i} value={`${v.nombre}:${v.valor}`}>{v.nombre}: {v.valor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="mt-4">
            {usuario?.rol === 'CLIENTE' ? (
              <Button className="h-12 w-full text-sm" onClick={onAdd} disabled={agregar.isPending}>
                {agregar.isPending ? 'Añadiendo…' : 'Añadir a la bolsa'}
              </Button>
            ) : (
              <Button variant="outline" className="h-12 w-full text-sm" onClick={() => navigate('/login')}>
                Inicia sesión para comprar
              </Button>
            )}
          </div>

          <p className="mt-5 text-sm text-neutral-500">Entrega estimada: 3–6 días laborables</p>
          <div className="mt-3 bg-[#f4f3f1] p-4 text-sm text-neutral-600">
            Envío gratis en pedidos superiores a 300 € · Devoluciones gratuitas durante 30 días · Recogida a domicilio
          </div>

          {/* Acordeón de detalles */}
          <div className="mt-8 border-t border-neutral-200">
            <button
              onClick={() => setDetalleAbierto((v) => !v)}
              className="flex w-full items-center justify-between py-4 text-sm font-medium uppercase tracking-wide"
            >
              Detalles del producto
              <ChevronDown className={cn('size-4 transition-transform', detalleAbierto && 'rotate-180')} />
            </button>
            {detalleAbierto && (
              <div className="grid gap-6 pb-6 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Características</p>
                  {producto.descripcion && <p className="mb-2 text-sm text-neutral-600">{producto.descripcion}</p>}
                  <ul className="space-y-1 text-sm text-neutral-600">
                    {atributos.map(([k, v]) => (
                      <li key={k} className="capitalize">{k}: <span className="text-black">{String(v)}</span></li>
                    ))}
                    {producto.etiquetas.map((t) => <li key={t} className="capitalize">{t}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Información</p>
                  <ul className="space-y-1 text-sm text-neutral-600">
                    <li>Marca: <span className="text-black">{marca}</span></li>
                    <li>Categoría: <span className="text-black capitalize">{producto.categoria}</span></li>
                    <li>SKU: <span className="text-black">{producto.sku}</span></li>
                    <li>Stock: <span className="text-black">{producto.stock}</span></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200">
            <button
              onClick={() => setEnvioAbierto((v) => !v)}
              className="flex w-full items-center justify-between py-4 text-sm font-medium uppercase tracking-wide"
            >
              Envíos y devoluciones
              <ChevronDown className={cn('size-4 transition-transform', envioAbierto && 'rotate-180')} />
            </button>
            {envioAbierto && (
              <p className="pb-6 text-sm text-neutral-600">
                Envíos a toda España. Devoluciones gratuitas durante 30 días desde la recepción del pedido.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Migas de pan */}
      <nav className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
        <Link to="/" className="hover:text-black">Inicio</Link>
        <span>/</span>
        <Link to={`/?categoria=${producto.categoria}`} className="capitalize hover:text-black">{tituloCategoria(producto.categoria)}</Link>
        <span>/</span>
        <span className="text-neutral-800">{producto.nombre}</span>
      </nav>
    </div>
  );
}
