import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { carritoController } from '../controllers/carrito.controller.js';

const router = Router();

router.get('/', autenticar, autorizar('CLIENTE'), carritoController.obtener);

export default router;
