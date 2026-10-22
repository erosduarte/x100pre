import pg from 'pg';

export class Database {
  constructor() {
    this.pool = new pg.Pool({
      host: process.env.PGHOST ?? 'localhost',
      port: Number(process.env.PGPORT ?? 5432),
      user: process.env.PGUSER ?? 'postgres',
      password: process.env.PGPASSWORD ?? 'postgres',
      database: process.env.PGDATABASE ?? 'x100pre',
    });
  }

  query(text, params = []) {
    return this.pool.query(text, params);
  }

  close() {
    return this.pool.end();
  }
}
