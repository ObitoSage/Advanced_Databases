import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Carrito } from '@/types';

export function useCarrito() {
  return useQuery({ queryKey: ['carrito'], queryFn: async () => (await api.get<Carrito>('/carrito')).data });
}

export function useMutacionesCarrito() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['carrito'] });
  return {
    cambiar: useMutation({ mutationFn: ({ productoId, cantidad }: { productoId: string; cantidad: number }) => api.patch(`/carrito/items/${productoId}`, { cantidad }), onSuccess: invalidar }),
    quitar: useMutation({ mutationFn: (productoId: string) => api.delete(`/carrito/items/${productoId}`), onSuccess: invalidar }),
    vaciar: useMutation({ mutationFn: () => api.delete('/carrito'), onSuccess: invalidar }),
  };
}
