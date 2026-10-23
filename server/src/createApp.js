import express from 'express';
import { ProductController } from './ProductController.js';

export function createApp(repository) {
  const app = express();
  const products = new ProductController(repository);

  app.use(express.json());
  app.get('/api/products', products.list);
  app.get('/api/products/:id', products.get);
  app.post('/api/products', products.create);
  app.put('/api/products/:id', products.update);
  app.delete('/api/products/:id', products.remove);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ errors: ['Error interno del servidor'] });
  });

  return app;
}
