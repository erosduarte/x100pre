CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150)   NOT NULL,
  description TEXT           NOT NULL DEFAULT '',
  category    VARCHAR(50)    NOT NULL DEFAULT 'General',
  image_url   TEXT           NOT NULL DEFAULT '',
  price       NUMERIC(10, 2) NOT NULL,
  stock       INTEGER        NOT NULL DEFAULT 0,
  active      BOOLEAN        NOT NULL DEFAULT TRUE,
  CONSTRAINT products_name_not_empty CHECK (char_length(btrim(name)) > 0),
  CONSTRAINT products_price_not_negative CHECK (price >= 0),
  CONSTRAINT products_stock_not_negative CHECK (stock >= 0)
);
