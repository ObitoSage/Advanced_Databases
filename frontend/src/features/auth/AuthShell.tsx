import type { ReactNode } from 'react';

const AUTH_IMG =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=80';

interface Props {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  pie?: ReactNode;
}

export function AuthShell({ titulo, subtitulo, children, pie }: Props) {
  return (
    <div className="py-6 md:py-12">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-xl border border-neutral-200 shadow-sm md:grid-cols-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
        {/* Panel editorial */}
        <div className="relative hidden min-h-[540px] md:block">
          <img src={AUTH_IMG} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative flex h-full flex-col justify-between p-9 text-white">
            <span className="text-lg font-semibold tracking-[0.28em]">NOVAMARKET</span>
            <div>
              <p className="text-2xl font-medium leading-snug">Moda, tecnología y hogar en un solo lugar.</p>
              <p className="mt-2 text-sm text-white/70">Miles de piezas de vendedores seleccionados, con envío y devoluciones sin complicaciones.</p>
            </div>
          </div>
        </div>

        {/* Panel de formulario */}
        <div className="p-8 sm:p-10">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          {subtitulo && <p className="mt-1.5 text-sm text-neutral-500">{subtitulo}</p>}
          <div className="mt-8">{children}</div>
          {pie && <div className="mt-6 text-sm text-neutral-500">{pie}</div>}
        </div>
      </div>
    </div>
  );
}
