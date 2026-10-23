export class ProductValidator {
  static validate(body) {
    const errors = [];
    const text = (v) => (typeof v === 'string' ? v.trim() : '');

    const name = text(body?.name);
    const description = text(body?.description);
    const category = text(body?.category) || 'General';
    const price = typeof body?.price === 'number' ? body.price : Number(body?.price);
    const active = body?.active ?? true;

    if (!name) errors.push('El nombre no puede estar vacío');
    if (name.length > 150) errors.push('El nombre no puede superar 150 caracteres');
    if (category.length > 50) errors.push('La categoría no puede superar 50 caracteres');
    if (body?.price === undefined || body?.price === null || body?.price === '' || !Number.isFinite(price)) {
      errors.push('El precio debe ser un número');
    } else if (price < 0) {
      errors.push('El precio no puede ser negativo');
    }
    if (typeof active !== 'boolean') errors.push('El estado activo debe ser true o false');

    const images = [];
    if (body?.images !== undefined) {
      if (!Array.isArray(body.images)) {
        errors.push('Las imágenes deben ser una lista de URLs');
      } else {
        for (const item of body.images) {
          const url = text(item);
          if (!url) continue;
          if (!/^https?:\/\/\S+$/i.test(url)) {
            errors.push(`La imagen "${url.slice(0, 40)}" debe ser una URL http o https`);
          } else if (!images.includes(url)) {
            images.push(url);
          }
        }
        if (images.length > 10) errors.push('Máximo 10 imágenes por producto');
      }
    }

    const sizes = [];
    if (!Array.isArray(body?.sizes) || body.sizes.length === 0) {
      errors.push('Agrega al menos una talla');
    } else {
      const seen = new Set();
      for (const item of body.sizes) {
        const size = text(item?.size);
        const stock = typeof item?.stock === 'number' ? item.stock : Number(item?.stock);
        if (!size || size.length > 10) {
          errors.push('Cada talla debe tener un nombre de 1 a 10 caracteres');
        } else if (seen.has(size.toLowerCase())) {
          errors.push(`La talla ${size} está repetida`);
        } else {
          seen.add(size.toLowerCase());
        }
        if (!Number.isInteger(stock) || stock < 0) {
          errors.push(`El stock de la talla ${size || '?'} debe ser un entero mayor o igual a 0`);
        }
        sizes.push({ size, stock });
      }
    }

    return { errors, value: { name, description, category, price, active, sizes, images } };
  }
}