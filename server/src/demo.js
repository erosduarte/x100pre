import { Database } from './Database.js';
import { ProductRepository } from './ProductRepository.js';

const db = new Database();
const products = new ProductRepository(db);

await products.create({ name: 'Producto de prueba', price: 25.5 });
console.table(await products.findAll());
await db.close();
