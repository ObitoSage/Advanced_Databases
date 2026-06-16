import { useState } from 'react';
import { toast } from 'sonner';
import { useMetodosPago, useAgregarTarjeta } from './hooks';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function MetodosPagoPage() {
  const { data: metodos } = useMetodosPago();
  const agregar = useAgregarTarjeta();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titular: '', numero: '', marca: 'VISA', expMes: 12, expAnio: 2030 });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agregar.mutateAsync({ ...form, expMes: Number(form.expMes), expAnio: Number(form.expAnio) });
      toast.success('Tarjeta guardada (cifrada en el servidor)');
      setOpen(false);
      setForm({ titular: '', numero: '', marca: 'VISA', expMes: 12, expAnio: 2030 });
    } catch (err) {
      toast.error(mensajeError(err));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Métodos de pago</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button>Añadir tarjeta</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva tarjeta</DialogTitle></DialogHeader>
            <form onSubmit={guardar} className="space-y-4">
              <div className="space-y-2"><Label>Titular</Label><Input value={form.titular} onChange={(e) => setForm({ ...form, titular: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} required /></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2"><Label>Marca</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
                <div className="space-y-2"><Label>Mes</Label><Input type="number" value={form.expMes} onChange={(e) => setForm({ ...form, expMes: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Año</Label><Input type="number" value={form.expAnio} onChange={(e) => setForm({ ...form, expAnio: Number(e.target.value) })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={agregar.isPending}>Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {metodos?.map((m) => (
          <Card key={m.id} className="p-5">
            <p className="text-sm text-muted-foreground">{m.marca}</p>
            <p className="font-mono text-lg">•••• •••• •••• {m.ultimos4}</p>
            <p className="text-sm text-muted-foreground">{m.titular} · {String(m.expMes).padStart(2, '0')}/{m.expAnio}</p>
          </Card>
        ))}
        {metodos?.length === 0 && <p className="text-sm text-muted-foreground">No tienes tarjetas guardadas.</p>}
      </div>
    </div>
  );
}
