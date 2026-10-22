import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { NewProduct, Product } from './product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/products';

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.url);
  }

  create(product: NewProduct): Observable<Product> {
    return this.http.post<Product>(this.url, product);
  }
}
