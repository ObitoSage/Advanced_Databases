export type Rol = 'CLIENTE' | 'VENDEDOR' | 'ADMIN';
export interface Usuario { id: string; email: string; rol: Rol; }

export interface Variante { nombre: string; valor: string; stock: number; precio?: number; }
export interface Producto {
  id: string; sku: string; nombre: string; descripcion?: string | null;
  categoria: string; precio: number; stock: number; tiendaId: string;
  atributos: Record<string, unknown>;
  etiquetas: string[]; marcas: string[]; industria: string[]; variantes: Variante[];
  activo: boolean; creadoEn: string;
}
export interface Paginado<T> { data: T[]; total: number; page: number; limit: number; }

export interface CarritoItem { productoId: string; sku: string; nombre: string; cantidad: number; precio: number; }
export interface Carrito { id: string; usuarioId: string; items: CarritoItem[]; actualizadoEn: string; }

// Decimales de Postgres llegan como string en JSON.
export interface FacturaItem { id: string; productoId: string; descripcion: string; cantidad: number; precioUnit: string; subtotal: string; }
export interface Factura { id: string; numero: string; usuarioId: string; subtotal: string; impuestos: string; total: string; estado: string; items: FacturaItem[]; emitidaEn: string; }

export interface MetodoPago { id: string; titular: string; marca: string; ultimos4: string; expMes: number; expAnio: number; creadoEn: string; }
