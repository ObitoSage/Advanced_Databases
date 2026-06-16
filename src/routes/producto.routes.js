import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);
router.post('/', autenticar, autorizar('VENDEDOR'), productoController.crear);
router.get('/:id', productoController.detalle);

export default router;
