import { readFile } from 'node:fs/promises';
import { Database } from './Database.js';

const db = new Database();
const schema = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
await db.query(schema);
console.log('Tabla products lista');
await db.close();
