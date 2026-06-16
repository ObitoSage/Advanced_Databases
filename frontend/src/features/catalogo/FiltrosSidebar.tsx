import type { FiltrosCatalogo } from './filtros';
import { CATEGORIAS, ETIQUETAS, tituloCategoria } from './filtros';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props { filtros: FiltrosCatalogo; onChange: (f: FiltrosCatalogo) => void; }

export function FiltrosSidebar({ filtros, onChange }: Props) {
  const activos = filtros.categoria || filtros.etiquetas?.length || filtros.precioMin != null || filtros.precioMax != null;

  const toggleEtiqueta = (t: string) => {
    const set = new Set(filtros.etiquetas ?? []);
    set.has(t) ? set.delete(t) : set.add(t);
    onChange({ ...filtros, etiquetas: [...set], page: 1 });
  };

  return (
    <aside className="hidden w-52 shrink-0 md:block">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Filtrar</p>
        {activos && (
          <button onClick={() => onChange({ page: 1 })} className="text-xs text-neutral-500 underline hover:text-black">
            Limpiar
          </button>
        )}
      </div>

      <div className="mt-5 space-y-7">
        <div>
          <p className="mb-2 text-sm font-medium">Categoría</p>
          <ul className="space-y-1.5 text-sm">
            <li>
              <button
                onClick={() => onChange({ ...filtros, categoria: undefined, page: 1 })}
                className={cn('text-neutral-600 hover:text-black', !filtros.categoria && 'font-medium text-black')}
              >
                Todas
              </button>
            </li>
            {CATEGORIAS.map((c) => (
              <li key={c}>
                <button
                  onClick={() => onChange({ ...filtros, categoria: c, page: 1 })}
                  className={cn('text-neutral-600 hover:text-black', filtros.categoria === c && 'font-medium text-black')}
                >
                  {tituloCategoria(c)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Precio (€)</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="mín"
              value={filtros.precioMin ?? ''}
              onChange={(e) => onChange({ ...filtros, precioMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="h-8"
            />
            <span className="text-neutral-400">—</span>
            <Input
              type="number"
              placeholder="máx"
              value={filtros.precioMax ?? ''}
              onChange={(e) => onChange({ ...filtros, precioMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              className="h-8"
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Etiquetas</p>
          <div className="flex flex-wrap gap-2">
            {ETIQUETAS.map((t) => {
              const on = filtros.etiquetas?.includes(t) ?? false;
              return (
                <button
                  key={t}
                  onClick={() => toggleEtiqueta(t)}
                  className={cn(
                    'border px-3 py-1 text-xs capitalize transition-colors',
                    on ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-700 hover:border-black',
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
