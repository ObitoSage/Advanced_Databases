import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginado, Producto } from '@/types';
import { construirParams, type FiltrosCatalogo } from './filtros';

export function useProductos(filtros: FiltrosCatalogo) {
  return useQuery({
    queryKey: ['productos', filtros],
    queryFn: async () => {
      const { data } = await api.get<Paginado<Producto>>('/productos', { params: construirParams(filtros) });
      return data;
    },
  });
}

export function useProducto(id: string) {
  return useQuery({
    queryKey: ['producto', id],
    queryFn: async () => (await api.get<Producto>(`/productos/${id}`)).data,
    enabled: Boolean(id),
  });
}
