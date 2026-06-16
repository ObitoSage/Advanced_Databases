// Rutas de usuarios — protegidas por RBAC.
import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware.js';
import { usuarioController } from '../controllers/usuario.controller.js';

const router = Router();

// Listar todos los usuarios: SOLO ADMIN.
router.get('/', autenticar, autorizar('ADMIN'), usuarioController.listar);

export default router;
