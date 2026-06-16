import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);
router.get('/:id', productoController.detalle);

export default router;
