// Rutas públicas de autenticación.
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

router.post('/registro', authController.registrar);
router.post('/login', authController.login);

export default router;
