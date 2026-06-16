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
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      {/* Newsletter */}
      <div className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-screen-2xl gap-8 px-5 py-12 md:grid-cols-2 lg:px-8">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">No te pierdas nada</h3>
            <p className="mt-2 max-w-md text-sm text-neutral-600">
              Regístrate para recibir novedades, lanzamientos y selecciones de nuestros vendedores.
            </p>
          </div>
          <form onSubmit={suscribir} className="flex max-w-md items-end gap-3 md:justify-self-end md:self-center">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] uppercase tracking-wide text-neutral-500">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm outline-none focus:border-black"
                required
              />
            </div>
            <button type="submit" className="h-10 bg-black px-6 text-sm font-medium text-white transition-opacity hover:opacity-85">
              Suscribirme
            </button>
          </form>
        </div>
      </div>

      {/* Enlaces */}
      <div className="mx-auto grid max-w-screen-2xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-xl font-semibold tracking-[0.28em]">NOVAMARKET</p>
          <p className="mt-3 max-w-xs text-sm text-neutral-600">Marketplace multitienda de moda, tecnología y hogar.</p>
        </div>
        <div>
          <p className="mb-3 text-[11px] uppercase tracking-wide text-neutral-500">Comprar</p>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li><Link to="/?etiquetas=novedad" className="hover:text-black">Novedades</Link></li>
            <li><Link to="/?etiquetas=oferta" className="hover:text-black">Rebajas</Link></li>
            {CATEGORIAS.slice(0, 4).map((c) => (
              <li key={c}><Link to={`/?categoria=${c}`} className="hover:text-black">{tituloCategoria(c)}</Link></li>
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
            <li><Link to="/registro" className="hover:text-black">Vender con nosotros</Link></li>
            <li>Sobre nosotros</li>
            <li>Trabaja con nosotros</li>
          </ul>
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
