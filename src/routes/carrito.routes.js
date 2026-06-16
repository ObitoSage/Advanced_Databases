import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { carritoController } from '../controllers/carrito.controller.js';

const router = Router();
const soloCliente = [autenticar, autorizar('CLIENTE')];

router.get('/', ...soloCliente, carritoController.obtener);
router.post('/items', ...soloCliente, carritoController.agregar);
router.patch('/items/:productoId', ...soloCliente, carritoController.cambiar);
router.delete('/items/:productoId', ...soloCliente, carritoController.quitar);
router.delete('/', ...soloCliente, carritoController.vaciar);

export default router;
