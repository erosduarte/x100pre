import express from 'express';
import { ProductController } from './ProductController.js';

export function createApp(repository) {
  const app = express();
  const products = new ProductController(repository);

  app.use(express.json());
  app.get('/api/products', products.list);
  app.post('/api/products', products.create);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ errors: ['Error interno del servidor'] });
  });

  return app;
}
