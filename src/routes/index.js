import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuarioRoutes from './usuario.routes.js';
import metodoPagoRoutes from './metodoPago.routes.js';
import productoRoutes from './producto.routes.js';
import carritoRoutes from './carrito.routes.js';
import facturaRoutes, { checkoutRouter } from './factura.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/metodos-pago', metodoPagoRoutes);
router.use('/productos', productoRoutes);
router.use('/carrito', carritoRoutes);
router.use('/checkout', checkoutRouter);
router.use('/facturas', facturaRoutes);

export default router;
