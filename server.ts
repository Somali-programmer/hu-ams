import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'success', 
      message: 'Haramaya University Attendance System API is online',
      timestamp: new Date().toISOString()
    });
  });

  // Auth Routes (Placeholder - logic to be implemented in Step 3)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    // Mock login logic for now
    res.json({ message: 'Login endpoint active. Backend migration in progress.' });
  });

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ================================================
       HARAMAYA UNIVERSITY ATTENDANCE SYSTEM
    ================================================
       Server is running on http://0.0.0.0:${PORT}
       Backend: Node.js / Express.js
       Database: Supabase / PostgreSQL (Active)
    ================================================
    `);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
