import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { productoController } from '../controllers/producto.controller.js';

const router = Router();

router.get('/', productoController.listar);
router.get('/mios', autenticar, autorizar('VENDEDOR'), productoController.mios);
router.post('/', autenticar, autorizar('VENDEDOR'), productoController.crear);
router.get('/:id', productoController.detalle);
router.put('/:id', autenticar, autorizar('VENDEDOR'), productoController.actualizar);
router.delete('/:id', autenticar, autorizar('VENDEDOR'), productoController.eliminar);

export default router;
