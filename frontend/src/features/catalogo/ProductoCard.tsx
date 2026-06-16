import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Producto } from '@/types';
import { formatoMoneda } from '@/lib/money';
import { imagenProducto } from '@/lib/img';
import { cn } from '@/lib/utils';

export function ProductoCard({ producto }: { producto: Producto }) {
  const [fav, setFav] = useState(false);
  const [roto, setRoto] = useState(false);
  const img = imagenProducto(producto);
  const marca = producto.marcas[0] ?? producto.categoria;
  const oferta = producto.etiquetas.includes('oferta');

  return (
    <Link to={`/producto/${producto.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f4f3f1]">
        {img && !roto ? (
          <img
            src={img}
            alt={producto.nombre}
            loading="lazy"
            onError={() => setRoto(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
            {producto.categoria}
          </div>
        )}

        {oferta && (
          <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[11px] font-medium text-black shadow-sm">
            Oferta especial
          </span>
        )}

        <button
          type="button"
          aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          onClick={(e) => { e.preventDefault(); setFav((v) => !v); }}
          className="absolute right-3 top-3 text-neutral-700 transition-colors hover:text-black"
        >
          <Heart className={cn('size-5', fav && 'fill-black text-black')} strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-3 space-y-0.5">
        <p className="truncate text-[13px] font-semibold tracking-tight text-black">{marca}</p>
        <p className="truncate text-[13px] text-neutral-600">{producto.nombre}</p>
        <p className={cn('pt-1 text-sm', oferta ? 'font-medium text-[#c0202e]' : 'text-black')}>
          {formatoMoneda(producto.precio)}
        </p>
      </div>
    </Link>
  );
}
