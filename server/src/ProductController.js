import { ProductValidator } from './ProductValidator.js';

const MAX_ID = 2147483647;

// Devuelve el id como número, o null si no es un entero positivo válido
function parseId(raw) {
  const id = Number(raw);
  return /^\d+$/.test(raw) && id >= 1 && id <= MAX_ID ? id : null;
}

export class ProductController {
  constructor(repository) {
    this.repository = repository;
  }

  list = async (_req, res, next) => {
    try {
      res.json(await this.repository.findAll());
    } catch (err) {
      next(err);
    }
  };

  get = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ errors: ['El id debe ser un entero positivo'] });
      }
      const product = await this.repository.findById(id);
      if (!product) {
        return res.status(404).json({ errors: ['Producto no encontrado'] });
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { errors, value } = ProductValidator.validate(req.body);
      if (errors.length) {
        return res.status(400).json({ errors });
      }
      res.status(201).json(await this.repository.create(value));
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ errors: ['El id debe ser un entero positivo'] });
      }
      const { errors, value } = ProductValidator.validate(req.body);
      if (errors.length) {
        return res.status(400).json({ errors });
      }
      const product = await this.repository.update(id, value);
      if (!product) {
        return res.status(404).json({ errors: ['Producto no encontrado'] });
      }
      res.json(product);
    } catch (err) {
      next(err);
    }
  };

  remove = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ errors: ['El id debe ser un entero positivo'] });
      }
      if (!(await this.repository.delete(id))) {
        return res.status(404).json({ errors: ['Producto no encontrado'] });
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}