// Agregador de rutas de la API.
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usuarioRoutes from './usuario.routes.js';
import metodoPagoRoutes from './metodoPago.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/metodos-pago', metodoPagoRoutes);

export default router;
