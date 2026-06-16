// ============================================================================
//  Punto de entrada: conecta las BDs y arranca el servidor HTTP.
//  Capas: Rutas -> Controladores -> Servicios -> Repositorios (config/database.js)
// ============================================================================
import 'dotenv/config';
import { app } from './app.js';
import { connectDatabases, disconnectDatabases } from './config/database.js';

const PORT = process.env.PORT || 3000;

connectDatabases()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 API escuchando en http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('No se pudo conectar a las bases de datos:', err);
    process.exit(1);
  });

// Apagado ordenado.
for (const señal of ['SIGINT', 'SIGTERM']) {
  process.on(señal, async () => {
    await disconnectDatabases();
    process.exit(0);
  });
}
