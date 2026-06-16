import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, Plus } from 'lucide-react';
import { useMetodosPago, useAgregarTarjeta } from './hooks';
import { mensajeError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="transition-transform duration-150 active:scale-[0.99]"><Plus className="size-4" /> Añadir tarjeta</Button>} />
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva tarjeta</DialogTitle></DialogHeader>
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-2"><Label>Titular</Label><Input value={form.titular} onChange={(e) => setForm({ ...form, titular: e.target.value })} placeholder="Nombre en la tarjeta" required /></div>
          <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="4111 1111 1111 1111" required /></div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2"><Label>Marca</Label><Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mes</Label><Input type="number" min={1} max={12} value={form.expMes} onChange={(e) => setForm({ ...form, expMes: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Año</Label><Input type="number" value={form.expAnio} onChange={(e) => setForm({ ...form, expAnio: Number(e.target.value) })} /></div>
          </div>
          <Button type="submit" className="h-11 w-full transition-transform duration-150 active:scale-[0.99]" disabled={agregar.isPending}>
            {agregar.isPending ? 'Guardando…' : 'Guardar tarjeta'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Métodos de pago</h1>
          <p className="mt-1 text-sm text-neutral-500">Tus tarjetas se guardan cifradas (AES-256).</p>
        </div>
        {metodos && metodos.length > 0 && dialog}
      </div>

      {!metodos || metodos.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-neutral-300 py-20 text-center">
          <CreditCard className="size-8 text-neutral-300" strokeWidth={1.25} />
          <h2 className="mt-4 text-lg font-medium">No tienes tarjetas guardadas</h2>
          <p className="mt-1 text-sm text-neutral-500">Añade una para pagar más rápido.</p>
          <div className="mt-6">{dialog}</div>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {metodos.map((m) => (
            <div key={m.id} className="flex aspect-[1.6/1] flex-col justify-between rounded-xl bg-neutral-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <CreditCard className="size-6" strokeWidth={1.5} />
                <span className="text-sm uppercase tracking-wide text-white/70">{m.marca}</span>
              </div>
              <p className="font-mono text-lg tracking-widest">•••• •••• •••• {m.ultimos4}</p>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span className="uppercase">{m.titular}</span>
                <span>{String(m.expMes).padStart(2, '0')}/{String(m.expAnio).slice(-2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
