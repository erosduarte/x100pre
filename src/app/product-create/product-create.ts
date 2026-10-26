import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ALL_SIZES,
  CATEGORIES,
  MAX_IMAGES,
  Product,
  ProductSize,
  SIZES_BY_CATEGORY,
} from '../catalog/product.model';
import { ProductService } from '../catalog/product.service';

@Component({
  selector: 'app-product-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-create.html',
  styleUrl: './product-create.scss',
})
export class ProductCreate {
  private readonly service = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  protected readonly categories = CATEGORIES;
  protected readonly maxImages = MAX_IMAGES;
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly created = signal<Product | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    description: [''],
    category: [CATEGORIES[0] as string, [Validators.required]],
    images: this.fb.array([this.newImageControl()]),
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

  private newImageControl() {
    return this.fb.nonNullable.control('', [Validators.pattern(/^(https?:\/\/\S+)?$/)]);
  }

  protected stockControl(size: string): FormControl<number | null> {
    return this.stockControls.get(size)!;
  }

  protected addImage(): void {
    if (this.form.controls.images.length < MAX_IMAGES) {
      this.form.controls.images.push(this.newImageControl());
    }
  }

  protected removeImage(index: number): void {
    this.form.controls.images.removeAt(index);
  }

  private resetImages(): void {
    this.form.controls.images.clear();
    this.form.controls.images.push(this.newImageControl());
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

    const { images: rawImages, ...rest } = this.form.getRawValue();
    const images = rawImages.map((url) => url.trim()).filter((url) => url !== '');

    this.saving.set(true);
    this.formError.set(null);
    this.created.set(null);
    this.service.create({ ...rest, sizes, images }).subscribe({
      next: (product) => {
        this.created.set(product);
        this.form.reset({
          name: '',
          description: '',
          category: CATEGORIES[0],
          price: 0,
          active: true,
        });
        this.resetImages();
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
