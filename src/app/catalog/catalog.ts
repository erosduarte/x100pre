import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ALL_SIZES, CATEGORIES, Product, ProductSize, SIZES_BY_CATEGORY } from './product.model';
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
    active: [true],
  });

  // Un control de stock por talla; vacío = la talla no se maneja, 0 = agotada
  private readonly stockControls = new Map<string, FormControl<number | null>>(
    ALL_SIZES.map((size) => [
      size,
      new FormControl<number | null>(null, [Validators.min(0), Validators.pattern(/^\d+$/)]),
    ]),
  );

  private readonly category = toSignal(this.form.controls.category.valueChanges, {
    initialValue: this.form.controls.category.value,
  });

  // Las tallas disponibles dependen de la categoría elegida
  protected readonly sizeOptions = computed(() => SIZES_BY_CATEGORY[this.category()] ?? []);

  constructor() {
    this.form.controls.category.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.stockControls.forEach((c) => c.reset(null)));
  }

  ngOnInit(): void {
    this.load();
  }

  protected stockControl(size: string): FormControl<number | null> {
    return this.stockControls.get(size)!;
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
    const options = this.sizeOptions();
    options.forEach((size) => this.stockControl(size).markAsTouched());

    if (this.form.invalid || options.some((size) => this.stockControl(size).invalid)) {
      this.form.markAllAsTouched();
      this.formError.set('Revisa los campos marcados');
      return;
    }

    const sizes: ProductSize[] = options
      .filter((size) => this.stockControl(size).value !== null)
      .map((size) => ({ size, stock: Number(this.stockControl(size).value) }));

    if (sizes.length === 0) {
      this.formError.set('Agrega al menos una talla con su stock');
      return;
    }

    this.saving.set(true);
    this.formError.set(null);
    this.service.create({ ...this.form.getRawValue(), sizes }).subscribe({
      next: (product) => {
        this.products.update((list) => [...list, product]);
        this.form.reset({
          name: '',
          description: '',
          category: CATEGORIES[0],
          imageUrl: '',
          price: 0,
          active: true,
        });
        this.stockControls.forEach((c) => c.reset(null));
        this.saving.set(false);
      },
      error: (err) => {
        this.formError.set(err.error?.errors?.join(', ') ?? 'No se pudo crear el producto');
        this.saving.set(false);
      },
    });
  }
}
