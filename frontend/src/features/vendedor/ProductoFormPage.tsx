import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGuardarProducto } from './hooks';
import { useProducto } from '@/features/catalogo/hooks';
import { CATEGORIAS } from '@/features/catalogo/filtros';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Atributos sugeridos por categoría (esquema dinámico BSON).
const ATRIBUTOS: Record<string, string[]> = {
  electronica: ['voltaje', 'procesador', 'ram'],
  ropa: ['talla', 'material', 'color'],
  muebles: ['material', 'dimensiones'],
  adornos: ['material', 'estilo'],
  cocina: ['material', 'capacidad'],
};

export function ProductoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);
  const { crear, actualizar } = useGuardarProducto();
  const { data: existente } = useProducto(id ?? '');

  const [base, setBase] = useState({ sku: '', nombre: '', descripcion: '', categoria: 'electronica', precio: 0, stock: 0, imagen: '' });
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

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{editando ? 'Editar' : 'Nuevo'} producto</h1>
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-2"><Label>SKU</Label><Input value={base.sku} onChange={(e) => setBase({ ...base, sku: e.target.value })} required disabled={editando} /></div>
        <div className="space-y-2"><Label>Nombre</Label><Input value={base.nombre} onChange={(e) => setBase({ ...base, nombre: e.target.value })} required /></div>
        <div className="space-y-2"><Label>Descripción</Label><Textarea value={base.descripcion} onChange={(e) => setBase({ ...base, descripcion: e.target.value })} /></div>
        <div className="space-y-2">
          <Label>Imagen (URL)</Label>
          <div className="flex gap-3">
            <Input value={base.imagen} onChange={(e) => setBase({ ...base, imagen: e.target.value })} placeholder="https://…" className="flex-1" />
            <div className="size-16 shrink-0 overflow-hidden bg-[#f4f3f1]">
              {base.imagen && <img src={base.imagen} alt="" className="size-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <select className="w-full rounded-md border px-2 py-2" value={base.categoria} onChange={(e) => setBase({ ...base, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2"><Label>Precio</Label><Input type="number" step="0.01" value={base.precio} onChange={(e) => setBase({ ...base, precio: Number(e.target.value) })} required /></div>
          <div className="space-y-2"><Label>Stock</Label><Input type="number" value={base.stock} onChange={(e) => setBase({ ...base, stock: Number(e.target.value) })} /></div>
        </div>

        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm font-medium">Atributos de {base.categoria}</p>
          <div className="grid grid-cols-2 gap-3">
            {claves.map((k) => (
              <div key={k} className="space-y-2">
                <Label className="capitalize">{k}</Label>
                <Input value={atributos[k] ?? ''} onChange={(e) => setAtributos({ ...atributos, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2"><Label>Etiquetas (separadas por coma)</Label><Input value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="oferta, gamer" /></div>
        <div className="space-y-2"><Label>Marcas (separadas por coma)</Label><Input value={marcas} onChange={(e) => setMarcas(e.target.value)} placeholder="Asus" /></div>

        <Button type="submit" className="w-full" disabled={crear.isPending || actualizar.isPending}>{editando ? 'Guardar cambios' : 'Crear producto'}</Button>
      </form>
    </div>
  );
}
