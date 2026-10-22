const COLUMNS = `id, name, description, category, image_url AS "imageUrl",
                 price::float AS price, stock, active`;

export class ProductRepository {
  constructor(database) {
    this.db = database;
  }

  async create({ name, description = '', category, imageUrl = '', price, stock = 0, active = true }) {
    const { rows } = await this.db.query(
      `INSERT INTO products (name, description, category, image_url, price, stock, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUMNS}`,
      [name, description, category, imageUrl, price, stock, active],
    );
    return rows[0];
  }

  async findAll() {
    const { rows } = await this.db.query(`SELECT ${COLUMNS} FROM products ORDER BY id`);
    return rows;
  }
}
