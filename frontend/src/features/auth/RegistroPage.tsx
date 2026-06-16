import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from './AuthShell';
import { cn } from '@/lib/utils';

const opciones = [
  { value: 'cliente', titulo: 'Quiero comprar', desc: 'Explora y compra piezas' },
  { value: 'vendedor', titulo: 'Quiero vender', desc: 'Publica tus productos' },
] as const;

export function RegistroPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', tipo: 'cliente' as 'cliente' | 'vendedor' });
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    try {
      await registrar(form);
      toast.success('Cuenta creada');
      navigate(form.tipo === 'vendedor' ? '/vendedor' : '/');
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo crear la cuenta'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <AuthShell
      titulo="Crear cuenta"
      subtitulo="Compra o vende en NOVAmarket."
      pie={<p className="text-center md:text-left">¿Ya tienes cuenta? <Link to="/login" className="font-medium text-black underline-offset-4 hover:underline">Inicia sesión</Link></p>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Selector de tipo de cuenta */}
        <div className="grid grid-cols-2 gap-3">
          {opciones.map((o) => {
            const activo = form.tipo === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setForm({ ...form, tipo: o.value })}
                className={cn(
                  'rounded-lg border p-3 text-left transition-all duration-150 active:scale-[0.99]',
                  activo ? 'border-black bg-neutral-50 ring-1 ring-black' : 'border-neutral-200 hover:border-neutral-400',
                )}
              >
                <span className="block text-sm font-medium">{o.titulo}</span>
                <span className="mt-0.5 block text-xs text-neutral-500">{o.desc}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" autoComplete="name" placeholder="Tu nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="tu@correo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" minLength={6} placeholder="Mínimo 6 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="h-11" />
        </div>
        <Button type="submit" className="h-11 w-full text-sm transition-transform duration-150 active:scale-[0.99]" disabled={cargando}>
          {cargando ? 'Creando…' : 'Crear cuenta'}
        </Button>
      </form>
    </AuthShell>
  );
}
