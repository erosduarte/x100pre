INSERT INTO products (name, description, category, image_url, price, active) VALUES
  ('Camisa Oxford azul', 'Camisa de algodon manga larga', 'Camisas', 'https://picsum.photos/seed/camisa/400/500', 249.00, TRUE),
  ('Jeans slim fit', 'Pantalon de mezclilla corte slim', 'Pantalones', 'https://picsum.photos/seed/jeans/400/500', 399.00, TRUE),
  ('Vestido floral', 'Vestido ligero para verano', 'Vestidos', 'https://picsum.photos/seed/vestido/400/500', 459.50, TRUE),
  ('Chaqueta de cuero', 'Chaqueta de cuero sintetico', 'Chaquetas', 'https://picsum.photos/seed/chaqueta/400/500', 899.99, TRUE),
  ('Tenis blancos', 'Tenis casuales unisex', 'Zapatos', 'https://picsum.photos/seed/tenis/400/500', 549.00, FALSE);

INSERT INTO product_variants (product_id, size, stock)
SELECT p.id, v.size, v.stock
FROM (VALUES
  (1, 'Camisa Oxford azul', 'S', 8),
  (2, 'Camisa Oxford azul', 'M', 10),
  (3, 'Camisa Oxford azul', 'L', 5),
  (4, 'Camisa Oxford azul', 'XL', 0),
  (5, 'Jeans slim fit', '28', 4),
  (6, 'Jeans slim fit', '30', 7),
  (7, 'Jeans slim fit', '32', 7),
  (8, 'Vestido floral', 'S', 6),
  (9, 'Vestido floral', 'M', 4),
  (10, 'Chaqueta de cuero', 'M', 0),
  (11, 'Chaqueta de cuero', 'L', 0),
  (12, 'Tenis blancos', '40', 6),
  (13, 'Tenis blancos', '42', 6)
) AS v(ord, name, size, stock)
JOIN products p ON p.name = v.name
ORDER BY v.ord;
