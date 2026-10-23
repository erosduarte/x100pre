import { Routes } from '@angular/router';
import { Catalog } from './catalog/catalog';
import { ProductDetail } from './product-detail/product-detail';

export const routes: Routes = [
  { path: '', component: Catalog },
  { path: 'producto/:id', component: ProductDetail },
  { path: '**', redirectTo: '' },
];
