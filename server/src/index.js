import { Database } from './Database.js';
import { ProductRepository } from './ProductRepository.js';
import { createApp } from './createApp.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp(new ProductRepository(new Database()));
app.listen(port, () => console.log(`API en http://localhost:${port}`));
