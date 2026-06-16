import type { FiltrosCatalogo } from './filtros';
import { CATEGORIAS, ETIQUETAS } from './filtros';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Props { filtros: FiltrosCatalogo; onChange: (f: FiltrosCatalogo) => void; }

export function FiltrosSidebar({ filtros, onChange }: Props) {
  const toggleEtiqueta = (t: string) => {
    const set = new Set(filtros.etiquetas ?? []);
    set.has(t) ? set.delete(t) : set.add(t);
    onChange({ ...filtros, etiquetas: [...set], page: 1 });
  };

  return (
    <aside className="w-48 shrink-0 space-y-6 text-sm">
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Categoría</Label>
        <select
          className="w-full rounded-md border px-2 py-1"
          value={filtros.categoria ?? ''}
          onChange={(e) => onChange({ ...filtros, categoria: e.target.value, page: 1 })}
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Precio</Label>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="min" value={filtros.precioMin ?? ''} onChange={(e) => onChange({ ...filtros, precioMin: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
          <Input type="number" placeholder="max" value={filtros.precioMax ?? ''} onChange={(e) => onChange({ ...filtros, precioMax: e.target.value ? Number(e.target.value) : undefined, page: 1 })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Etiquetas</Label>
        {ETIQUETAS.map((t) => (
          <label key={t} className="flex items-center gap-2">
            <Checkbox checked={filtros.etiquetas?.includes(t) ?? false} onCheckedChange={() => toggleEtiqueta(t)} />
            <span>{t}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}
