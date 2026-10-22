const SELECT_PRODUCTS = `
  SELECT p.id, p.name, p.description, p.category,
         p.image_url AS "imageUrl", p.price::float AS price, p.active,
         COALESCE(
           json_agg(json_build_object('size', v.size, 'stock', v.stock) ORDER BY v.id)
             FILTER (WHERE v.id IS NOT NULL),
           '[]'
         ) AS sizes,
         COALESCE(SUM(v.stock), 0)::int AS stock
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id`;

export class ProductRepository {
  constructor(database) {
    this.db = database;
  }

  async create({
    name,
    description = '',
    category = 'General',
    imageUrl = '',
    price,
    active = true,
    sizes = [],
  }) {
    const id = await this.db.transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO products (name, description, category, image_url, price, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [name, description, category, imageUrl, price, active],
      );
      for (const { size, stock } of sizes) {
        await client.query(
          'INSERT INTO product_variants (product_id, size, stock) VALUES ($1, $2, $3)',
          [rows[0].id, size, stock],
        );
      }
      return rows[0].id;
    });
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} WHERE p.id = $1 GROUP BY p.id`, [id]);
    return rows[0] ?? null;
  }

  async findAll() {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} GROUP BY p.id ORDER BY p.id`);
    return rows;
  }
}