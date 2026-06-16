import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MetodoPago } from '@/types';

export function useMetodosPago() {
  return useQuery({ queryKey: ['metodos-pago'], queryFn: async () => (await api.get<MetodoPago[]>('/metodos-pago')).data });
}

export function useAgregarTarjeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: { titular: string; numero: string; marca: string; expMes: number; expAnio: number }) => api.post('/metodos-pago', datos),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metodos-pago'] }),
  });
}
