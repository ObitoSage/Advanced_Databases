import type { CarritoItem } from '@/types';

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcularTotales(items: CarritoItem[]) {
  const subtotal = r2(items.reduce((a, i) => a + i.precio * i.cantidad, 0));
  const impuestos = r2(subtotal * 0.19);
  const total = r2(subtotal + impuestos);
  const unidades = items.reduce((a, i) => a + i.cantidad, 0);
  return { subtotal, impuestos, total, unidades };
}
