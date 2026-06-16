// Rutas de métodos de pago — requieren sesión; rol CLIENTE o ADMIN.
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { metodoPagoController } from '../controllers/metodoPago.controller.js';

const router = Router();

router.post('/', autenticar, autorizar('CLIENTE', 'ADMIN'), metodoPagoController.crear);
router.get('/', autenticar, autorizar('CLIENTE', 'ADMIN'), metodoPagoController.listar);

export default router;
