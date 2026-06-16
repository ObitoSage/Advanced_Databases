import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { useGuardarProducto } from './hooks';
import { useProducto } from '@/features/catalogo/hooks';
import { CATEGORIAS, tituloCategoria } from '@/features/catalogo/filtros';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Atributos sugeridos por categoría (esquema dinámico BSON).
const ATRIBUTOS: Record<string, string[]> = {
  ropa: ['talla', 'material', 'color'],
  zapatos: ['talla', 'material', 'color'],
  accesorios: ['material', 'color'],
  electronica: ['voltaje', 'procesador', 'ram'],
  muebles: ['material', 'dimensiones'],
  cocina: ['material', 'capacidad'],
  adornos: ['material', 'estilo'],
};

export function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);
  const { crear, actualizar } = useGuardarProducto();
  const { data: existente } = useProducto(id ?? '');

  const [base, setBase] = useState({ sku: '', nombre: '', descripcion: '', categoria: 'ropa', precio: 0, stock: 0, imagen: '' });
  const [atributos, setAtributos] = useState<Record<string, string>>({});
  const [etiquetas, setEtiquetas] = useState('');
  const [marcas, setMarcas] = useState('');

  useEffect(() => {
    if (existente) {
      setBase({ sku: existente.sku, nombre: existente.nombre, descripcion: existente.descripcion ?? '', categoria: existente.categoria, precio: existente.precio, stock: existente.stock, imagen: existente.imagenes?.[0] ?? '' });
      setAtributos(Object.fromEntries(Object.entries(existente.atributos ?? {}).map(([k, v]) => [k, String(v)])));
      setEtiquetas(existente.etiquetas.join(', '));
      setMarcas(existente.marcas.join(', '));
    }
  }, [existente]);

  const claves = ATRIBUTOS[base.categoria] ?? [];

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const lista = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
    const atributosLimpios = Object.fromEntries(claves.map((k) => [k, atributos[k] ?? '']).filter(([, v]) => v !== ''));
    const { imagen, ...resto } = base;
    const datos = { ...resto, precio: Number(base.precio), stock: Number(base.stock), atributos: atributosLimpios, etiquetas: lista(etiquetas), marcas: lista(marcas), industria: [], imagenes: imagen ? [imagen] : [], variantes: [] };
    try {
      if (editando && id) await actualizar.mutateAsync({ id, datos });
      else await crear.mutateAsync(datos);
      toast.success(editando ? 'Producto actualizado' : 'Producto creado');
      navigate('/vendedor');
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  const campo = 'h-11';

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/vendedor" className="inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors duration-150 hover:text-black">
        <ChevronLeft className="size-4" /> Panel
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{editando ? 'Editar producto' : 'Nuevo producto'}</h1>

      <form onSubmit={guardar} className="mt-8 space-y-5">
        <div className="space-y-2"><Label>SKU</Label><Input value={base.sku} onChange={(e) => setBase({ ...base, sku: e.target.value })} required disabled={editando} className={campo} /></div>
        <div className="space-y-2"><Label>Nombre</Label><Input value={base.nombre} onChange={(e) => setBase({ ...base, nombre: e.target.value })} required className={campo} /></div>
        <div className="space-y-2"><Label>Descripción</Label><Textarea value={base.descripcion} onChange={(e) => setBase({ ...base, descripcion: e.target.value })} rows={3} /></div>

        <div className="space-y-2">
          <Label>Imagen (URL)</Label>
          <div className="flex gap-3">
            <Input value={base.imagen} onChange={(e) => setBase({ ...base, imagen: e.target.value })} placeholder="https://…" className={`flex-1 ${campo}`} />
            <div className="size-16 shrink-0 overflow-hidden bg-[#f4f3f1]">
              {base.imagen && <img src={base.imagen} alt="" className="size-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <select className="h-11 w-full rounded-md border border-neutral-300 bg-transparent px-2 text-sm outline-none focus:border-black" value={base.categoria} onChange={(e) => setBase({ ...base, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{tituloCategoria(c)}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Precio (€)</Label><Input type="number" step="0.01" value={base.precio} onChange={(e) => setBase({ ...base, precio: Number(e.target.value) })} required className={campo} /></div>
          <div className="space-y-2"><Label>Stock</Label><Input type="number" value={base.stock} onChange={(e) => setBase({ ...base, stock: Number(e.target.value) })} className={campo} /></div>
        </div>

        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="mb-3 text-sm font-medium">Atributos de <span className="capitalize">{base.categoria}</span></p>
          <div className="grid grid-cols-2 gap-3">
            {claves.map((k) => (
              <div key={k} className="space-y-2">
                <Label className="capitalize">{k}</Label>
                <Input value={atributos[k] ?? ''} onChange={(e) => setAtributos({ ...atributos, [k]: e.target.value })} className={campo} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2"><Label>Etiquetas (separadas por coma)</Label><Input value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="oferta, novedad" className={campo} /></div>
        <div className="space-y-2"><Label>Marcas (separadas por coma)</Label><Input value={marcas} onChange={(e) => setMarcas(e.target.value)} placeholder="Asus" className={campo} /></div>

        <Button type="submit" className="h-11 w-full text-sm transition-transform duration-150 active:scale-[0.99]" disabled={crear.isPending || actualizar.isPending}>
          {editando ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </form>
    </div>
  );
}
