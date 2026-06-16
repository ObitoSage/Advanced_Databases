import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Crear cuenta</h1>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Quiero…</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as 'cliente' | 'vendedor' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente">Comprar (Cliente)</SelectItem>
                <SelectItem value="vendedor">Vender (Vendedor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={cargando}>{cargando ? 'Creando…' : 'Crear cuenta'}</Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta? <Link to="/login" className="underline">Inicia sesión</Link>
      </p>
    </div>
  );
}
