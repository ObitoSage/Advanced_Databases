import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { facturaController } from '../controllers/factura.controller.js';

const soloCliente = [autenticar, autorizar('CLIENTE')];

// Montado en /api: '/checkout' y '/facturas' (ver index.js)
export const checkoutRouter = Router();
checkoutRouter.post('/', ...soloCliente, facturaController.checkout);

const router = Router();
router.get('/', ...soloCliente, facturaController.listar);
router.get('/:id', ...soloCliente, facturaController.detalle);

export default router; // router de /facturas
