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

  get(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${id}`);
  }

  create(product: NewProduct): Observable<Product> {
    return this.http.post<Product>(this.url, product);
  }

  update(id: number, product: NewProduct): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${id}`, product);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
