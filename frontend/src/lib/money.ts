export const formatoMoneda = (valor: number | string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(Number(valor));
