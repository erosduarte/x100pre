import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CATEGORIES, Product } from './product.model';
import { ProductService } from './product.service';

@Component({
  selector: 'app-catalog',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  private readonly service = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = CATEGORIES;
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    description: [''],
    category: [CATEGORIES[0] as string, [Validators.required]],
    imageUrl: ['', [Validators.pattern(/^(https?:\/\/\S+)?$/)]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    active: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service.list().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo');
        this.loading.set(false);
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.service.create(this.form.getRawValue()).subscribe({
      next: (product) => {
        this.products.update((list) => [...list, product]);
        this.form.reset({
          name: '',
          description: '',
          category: CATEGORIES[0],
          imageUrl: '',
          price: 0,
          stock: 0,
          active: true,
        });
        this.saving.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.errors?.join(', ') ?? 'No se pudo crear el producto');
        this.saving.set(false);
      },
    });
  }
}
