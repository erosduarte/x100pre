CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150)   NOT NULL,
  description TEXT           NOT NULL DEFAULT '',
  category    VARCHAR(50)    NOT NULL DEFAULT 'General',
  image_url   TEXT           NOT NULL DEFAULT '',
  price       NUMERIC(10, 2) NOT NULL,
  active      BOOLEAN        NOT NULL DEFAULT TRUE,
  CONSTRAINT products_name_not_empty CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT products_price_not_negative CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS product_variants (
  id         SERIAL PRIMARY KEY,
  product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       VARCHAR(10) NOT NULL,
  stock      INTEGER     NOT NULL DEFAULT 0,
  CONSTRAINT variants_size_not_empty CHECK (char_length(btrim(size)) > 0),
  CONSTRAINT variants_stock_not_negative CHECK (stock >= 0),
  CONSTRAINT variants_unique_size UNIQUE (product_id, size)
);
