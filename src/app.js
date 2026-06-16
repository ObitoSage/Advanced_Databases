// ============================================================================
//  Construcción de la aplicación Express (sin escuchar puerto).
//  Separar app de server permite probar las rutas de forma autónoma.
// ============================================================================
import express from 'express';
import { postgres, mongo } from './config/database.js';
import apiRoutes from './routes/index.js';

export const app = express();
app.use(express.json());

// Health check: confirma que ambas conexiones responden.
app.get('/health', async (_req, res) => {
  try {
    const [usuarios, productos] = await Promise.all([
      postgres.usuario.count(),
      mongo.producto.count(),
    ]);
    res.json({ status: 'ok', postgres: { usuarios }, mongo: { productos } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Rutas de la API (capa "Rutas")
app.use('/api', apiRoutes);

// Manejador de errores centralizado (debe llevar 4 argumentos)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});
