import type { Producto } from '@/types';

/** Imagen principal de un producto, o null si no tiene (la tarjeta muestra un marcador). */
export function imagenProducto(p: Pick<Producto, 'imagenes'>): string | null {
  return p.imagenes?.[0] ?? null;
}

/** Imágenes de portada para los mosaicos de categoría de la home. */
export const PORTADAS: Record<string, string> = {
  ropa: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=80',
  zapatos: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1100&q=80',
  accesorios: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1100&q=80',
  electronica: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1100&q=80',
  muebles: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1100&q=80',
  cocina: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1100&q=80',
  adornos: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1100&q=80',
};

/** Imagen ancha para el banner principal. */
export const HERO_IMG =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80';
