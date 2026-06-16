import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Factura } from '@/types';

export function useFacturas() {
  return useQuery({ queryKey: ['facturas'], queryFn: async () => (await api.get<Factura[]>('/facturas')).data });
}

export function useFactura(id: string) {
  return useQuery({ queryKey: ['factura', id], queryFn: async () => (await api.get<Factura>(`/facturas/${id}`)).data, enabled: Boolean(id) });
}
