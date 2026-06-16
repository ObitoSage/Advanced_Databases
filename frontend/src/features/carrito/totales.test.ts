import { test, expect } from 'vitest';
import { calcularTotales } from './totales';
import type { CarritoItem } from '@/types';

const items: CarritoItem[] = [
  { productoId: '1', sku: 'A', nombre: 'A', cantidad: 2, precio: 100 },
  { productoId: '2', sku: 'B', nombre: 'B', cantidad: 1, precio: 50 },
];

test('calcula subtotal, IVA (19%) y total', () => {
  expect(calcularTotales(items)).toEqual({ subtotal: 250, impuestos: 47.5, total: 297.5, unidades: 3 });
});

test('carrito vacío da ceros', () => {
  expect(calcularTotales([])).toEqual({ subtotal: 0, impuestos: 0, total: 0, unidades: 0 });
});
