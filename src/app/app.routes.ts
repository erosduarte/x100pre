import { Routes } from '@angular/router';
import { Catalog } from './catalog/catalog';
import { ProductCreate } from './product-create/product-create';
import { ProductDetail } from './product-detail/product-detail';

export const routes: Routes = [
  { path: '', component: Catalog },
  { path: 'productos/nuevo', component: ProductCreate },
  { path: 'producto/:id', component: ProductDetail },
  { path: '**', redirectTo: '' },
];
