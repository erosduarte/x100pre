export interface ProductSize {
  size: string;
  stock: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  active: boolean;
  sizes: ProductSize[];
  stock: number;
}

export type NewProduct = Omit<Product, 'id' | 'stock'>;

export const CATEGORIES = [
  'Camisas',
  'Pantalones',
  'Vestidos',
  'Chaquetas',
  'Zapatos',
  'Accesorios',
] as const;

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SIZES_BY_CATEGORY: Record<string, string[]> = {
  Camisas: LETTER_SIZES,
  Chaquetas: LETTER_SIZES,
  Vestidos: ['XS', 'S', 'M', 'L', 'XL'],
  Pantalones: ['28', '30', '32', '34', '36', '38'],
  Zapatos: ['38', '39', '40', '41', '41.5', '42', '42.5', '43', '44', '45'],
  Accesorios: ['Única'],
};

export const ALL_SIZES = [...new Set(Object.values(SIZES_BY_CATEGORY).flat())];
