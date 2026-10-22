-- Crear producto con tallas
WITH p AS (
  INSERT INTO products (name, description, category, image_url, price, active)
  VALUES ('Playera basica', 'Playera de algodon', 'Camisas', '', 99.90, TRUE)
  RETURNING id
)
INSERT INTO product_variants (product_id, size, stock)
SELECT p.id, v.size, v.stock FROM p, (VALUES ('S', 10), ('M', 15), ('L', 0)) AS v(size, stock);

-- Mostrar catalogo con sus tallas
SELECT p.id, p.name, p.category, p.price, p.active, v.size, v.stock
FROM products p
LEFT JOIN product_variants v ON v.product_id = p.id
ORDER BY p.id, v.id;
