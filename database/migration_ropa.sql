-- Solo si ya creaste la tabla products con la version anterior
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'General';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0 CONSTRAINT products_stock_not_negative CHECK (stock >= 0);

-- Quitar los productos de ejemplo anteriores (opcional)
DELETE FROM products;
ALTER SEQUENCE products_id_seq RESTART WITH 1;
