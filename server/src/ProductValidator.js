export class ProductValidator {
  static validate(body) {
    const errors = [];
    const text = (v) => (typeof v === 'string' ? v.trim() : '');

    const name = text(body?.name);
    const description = text(body?.description);
    const category = text(body?.category) || 'General';
    const imageUrl = text(body?.imageUrl);
    const price = typeof body?.price === 'number' ? body.price : Number(body?.price);
    const stock = typeof body?.stock === 'number' ? body.stock : Number(body?.stock ?? 0);
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
    if (!Number.isInteger(stock)) {
      errors.push('El stock debe ser un número entero');
    } else if (stock < 0) {
      errors.push('El stock no puede ser negativo');
    }
    if (typeof active !== 'boolean') errors.push('El estado activo debe ser true o false');

    return { errors, value: { name, description, category, imageUrl, price, stock, active } };
  }
}
