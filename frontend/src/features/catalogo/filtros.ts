export interface FiltrosCatalogo {
  q?: string;
  categoria?: string;
  precioMin?: number;
  precioMax?: number;
  etiquetas?: string[];
  marca?: string;
  page?: number;
  limit?: number;
}

export function construirParams(f: FiltrosCatalogo): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (f.q) params.q = f.q;
  if (f.categoria) params.categoria = f.categoria;
  if (f.precioMin != null) params.precioMin = f.precioMin;
  if (f.precioMax != null) params.precioMax = f.precioMax;
  if (f.etiquetas?.length) params.etiquetas = f.etiquetas.join(',');
  if (f.marca) params.marca = f.marca;
  if (f.page != null) params.page = f.page;
  if (f.limit != null) params.limit = f.limit;
  return params;
}

export const CATEGORIAS = ['ropa', 'zapatos', 'accesorios', 'electronica', 'muebles', 'cocina', 'adornos'];
export const ETIQUETAS = ['oferta', 'novedad', 'gamer', 'verano'];

/** Etiqueta legible para una categoría (capitaliza). */
export const tituloCategoria = (c: string) => c.charAt(0).toUpperCase() + c.slice(1);
