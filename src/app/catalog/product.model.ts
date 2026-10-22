export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  price: number;
  stock: number;
  active: boolean;
}

export type NewProduct = Omit<Product, 'id'>;

export const CATEGORIES = [
  'Camisas',
  'Pantalones',
  'Vestidos',
  'Chaquetas',
  'Zapatos',
  'Accesorios',
] as const;
