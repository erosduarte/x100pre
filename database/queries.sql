-- Crear producto
INSERT INTO products (name, description, category, image_url, price, stock, active)
VALUES ('Playera basica', 'Playera de algodon', 'Camisas', '', 99.90, 40, TRUE) RETURNING *;

-- Mostrar catalogo
SELECT id, name, description, category, image_url, price, stock, active FROM products ORDER BY id;
