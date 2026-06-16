import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Producto } from '@/types';

export function useMisProductos() {
  return useQuery({ queryKey: ['mis-productos'], queryFn: async () => (await api.get<Producto[]>('/productos/mios')).data });
}

type CrearInput = Partial<Producto> & { sku: string; nombre: string; categoria: string; precio: number };

export function useGuardarProducto() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['mis-productos'] });
  return {
    crear: useMutation({ mutationFn: (datos: CrearInput) => api.post('/productos', datos), onSuccess: invalidar }),
    actualizar: useMutation({ mutationFn: ({ id, datos }: { id: string; datos: Partial<Producto> }) => api.put(`/productos/${id}`, datos), onSuccess: invalidar }),
    eliminar: useMutation({ mutationFn: (id: string) => api.delete(`/productos/${id}`), onSuccess: invalidar }),
  };
}
