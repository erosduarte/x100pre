export class ProductValidator {
  static validate(body) {
    const errors = [];
    const text = (v) => (typeof v === 'string' ? v.trim() : '');

    const name = text(body?.name);
    const description = text(body?.description);
    const category = text(body?.category) || 'General';
    const imageUrl = text(body?.imageUrl);
    const price = typeof body?.price === 'number' ? body.price : Number(body?.price);
    const active = body?.active ?? true;

    if (!name) errors.push('El nombre no puede estar vacío');
    if (name.length > 150) errors.push('El nombre no puede superar 150 caracteres');
    if (category.length > 50) errors.push('La categoría no puede superar 50 caracteres');
    if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) {
      errors.push('La imagen debe ser una URL http o https');
    }
    if (body?.price === undefined || body?.price === null || body?.price === '' || !Number.isFinite(price)) {
      errors.push('El precio debe ser un número');
    } else if (price < 0) {
      errors.push('El precio no puede ser negativo');
    }
    if (typeof active !== 'boolean') errors.push('El estado activo debe ser true o false');

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

    return { errors, value: { name, description, category, imageUrl, price, active, sizes } };
  }
}
