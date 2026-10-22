import { ProductValidator } from './ProductValidator.js';

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
}
