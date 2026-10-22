-- Ejecutar sobre la tabla products que ya tienes (version con description, category, image_url y stock)
CREATE TABLE IF NOT EXISTS product_variants (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       VARCHAR(10) NOT NULL,
  stock      INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT variants_size_not_empty CHECK (char_length(btrim(size)) > 0),
  CONSTRAINT variants_stock_not_negative CHECK (stock >= 0),
  CONSTRAINT variants_unique_size UNIQUE (product_id, size)
);

-- El stock ahora vive en cada talla
ALTER TABLE products DROP COLUMN IF EXISTS stock;

-- Limpiar productos de ejemplo para cargar los nuevos con tallas
DELETE FROM products;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
