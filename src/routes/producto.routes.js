import { Router } from 'express';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);

export default router;
