import { test, expect } from 'vitest';
import { construirParams, type FiltrosCatalogo } from './filtros';

test('omite campos vacíos y serializa etiquetas como CSV', () => {
  const filtros: FiltrosCatalogo = { q: 'laptop', categoria: '', precioMin: 100, precioMax: undefined, etiquetas: ['oferta', 'gamer'], marca: '', page: 1 };
  const params = construirParams(filtros);
  expect(params).toEqual({ q: 'laptop', precioMin: 100, etiquetas: 'oferta,gamer', page: 1 });
});

test('carrito de filtros vacío produce objeto vacío salvo page', () => {
  expect(construirParams({ page: 2 })).toEqual({ page: 2 });
});
