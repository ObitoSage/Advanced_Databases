import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CATEGORIAS, tituloCategoria } from '@/features/catalogo/filtros';

export function Footer() {
  const [email, setEmail] = useState('');
  const suscribir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('¡Gracias! Te avisaremos de las novedades.');
    setEmail('');
  };

  return (
    <footer className="mt-20 border-t border-neutral-200 bg-white">
      <div className="mx-auto grid max-w-screen-2xl gap-12 px-5 py-14 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        {/* Marca + newsletter */}
        <div>
          <p className="text-lg font-semibold tracking-[0.28em]">NOVAMARKET</p>
          <h3 className="mt-5 text-xl font-semibold tracking-tight">No te pierdas nada</h3>
          <p className="mt-2 max-w-sm text-sm text-neutral-600">
            Recibe novedades, lanzamientos y selecciones de nuestros vendedores.
          </p>
          <form onSubmit={suscribir} className="mt-4 flex max-w-sm items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="flex-1 border-b border-neutral-300 bg-transparent py-2 text-sm outline-none transition-colors duration-150 focus:border-black"
              required
            />
            <button
              type="submit"
              className="h-10 bg-black px-6 text-sm font-medium text-white transition-transform duration-150 hover:opacity-90 active:scale-[0.98]"
            >
              Suscribirme
            </button>
          </form>
        </div>

        {/* Enlaces */}
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-wide text-neutral-500">Comprar</p>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li><Link to="/?etiquetas=novedad" className="transition-colors duration-150 hover:text-black">Novedades</Link></li>
              <li><Link to="/?etiquetas=oferta" className="transition-colors duration-150 hover:text-black">Rebajas</Link></li>
              {CATEGORIAS.slice(0, 4).map((c) => (
                <li key={c}><Link to={`/?categoria=${c}`} className="transition-colors duration-150 hover:text-black">{tituloCategoria(c)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-wide text-neutral-500">Ayuda</p>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li>Envíos y entregas</li>
              <li>Devoluciones gratis 30 días</li>
              <li>Guía de tallas</li>
              <li>Contacto</li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-wide text-neutral-500">NOVAmarket</p>
            <ul className="space-y-2 text-sm text-neutral-700">
              <li><Link to="/registro" className="transition-colors duration-150 hover:text-black">Vender con nosotros</Link></li>
              <li>Sobre nosotros</li>
              <li>Trabaja con nosotros</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-neutral-500 sm:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} NOVAmarket · Proyecto Bases de Datos Avanzadas</p>
          <p>España · EUR €</p>
        </div>
      </div>
    </footer>
  );
}
