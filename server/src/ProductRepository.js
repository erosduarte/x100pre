const SELECT_PRODUCTS = `
  SELECT p.id, p.name, p.description, p.category,
         p.price::float AS price, p.active,
         COALESCE((
           SELECT json_agg(json_build_object('size', v.size, 'stock', v.stock) ORDER BY v.id)
           FROM product_variants v WHERE v.product_id = p.id
         ), '[]') AS sizes,
         COALESCE((
           SELECT SUM(v.stock) FROM product_variants v WHERE v.product_id = p.id
         ), 0)::int AS stock,
         COALESCE((
           SELECT json_agg(i.url ORDER BY i.position, i.id)
           FROM product_images i WHERE i.product_id = p.id
         ), '[]') AS images
  FROM products p`;

export class ProductRepository {
  constructor(database) {
    this.db = database;
  }

  async create({
    name,
    description = '',
    category = 'General',
    price,
    active = true,
    sizes = [],
    images = [],
  }) {
    const id = await this.db.transaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO products (name, description, category, price, active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [name, description, category, price, active],
      );
      const productId = rows[0].id;
      for (const { size, stock } of sizes) {
        await client.query(
          'INSERT INTO product_variants (product_id, size, stock) VALUES ($1, $2, $3)',
          [productId, size, stock],
        );
      }
      for (const [position, url] of images.entries()) {
        await client.query(
          'INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)',
          [productId, url, position],
        );
      }
      return productId;
    });
    return this.findById(id);
  }

  async findById(id) {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} WHERE p.id = $1`, [id]);
    return rows[0] ?? null;
  }

  async findAll() {
    const { rows } = await this.db.query(`${SELECT_PRODUCTS} ORDER BY p.id`);
    return rows;
  }

  // Reemplaza los datos del producto. Devuelve null si el id no existe.
  async update(
    id,
    { name, description = '', category = 'General', price, active = true, sizes = [], images = [] },
  ) {
    const found = await this.db.transaction(async (client) => {
      const { rowCount } = await client.query(
        `UPDATE products
            SET name = $1, description = $2, category = $3, price = $4, active = $5
          WHERE id = $6`,
        [name, description, category, price, active, id],
      );
      if (rowCount === 0) return false;

      // Las variantes se sincronizan (no se recrean) para conservar sus ids
      await client.query(
        'DELETE FROM product_variants WHERE product_id = $1 AND NOT (size = ANY($2::text[]))',
        [id, sizes.map((s) => s.size)],
      );
      for (const { size, stock } of sizes) {
        await client.query(
          `INSERT INTO product_variants (product_id, size, stock)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, size) DO UPDATE SET stock = EXCLUDED.stock`,
          [id, size, stock],
        );
      }

      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
      for (const [position, url] of images.entries()) {
        await client.query(
          'INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3)',
          [id, url, position],
        );
      }
      return true;
    });
    return found ? this.findById(id) : null;
  }

  // Devuelve true si se borró algo (variantes e imágenes caen por ON DELETE CASCADE)
  async delete(id) {
    const { rowCount } = await this.db.query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
  }
}