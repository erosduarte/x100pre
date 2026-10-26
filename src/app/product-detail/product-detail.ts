import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { MAX_IMAGES, Product, SIZES_BY_CATEGORY } from '../catalog/product.model';
import { ProductService } from '../catalog/product.service';

// stock null = la talla no se maneja para este producto; 0 = agotada
interface SizeRow {
  size: string;
  stock: number | null;
}

@Component({
  selector: 'app-product-detail',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ProductService);
  private readonly fb = inject(FormBuilder);

  protected readonly maxImages = MAX_IMAGES;

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);

  // Estado editable
  protected readonly images = signal<string[]>([]);
  protected readonly rows = signal<SizeRow[]>([]);
  protected readonly imageError = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(150)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    active: [true],
  });

  protected readonly newImage = new FormControl('', { nonNullable: true });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  private readonly original = signal('');

  private readonly current = computed(() =>
    JSON.stringify({
      form: this.formValue(),
      images: this.images(),
      rows: this.rows(),
    }),
  );

  protected readonly dirty = computed(() => this.current() !== this.original());

  protected readonly reference = computed(() => {
    const p = this.product();
    return p ? `X100-${String(p.id).padStart(4, '0')}` : '';
  });

  protected readonly totalStock = computed(() =>
    this.rows().reduce((sum, r) => sum + (r.stock ?? 0), 0),
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => Number(params.get('id'))),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.product.set(null);
        }),
        switchMap((id) =>
          this.service.get(id).pipe(
            catchError((err: HttpErrorResponse) => {
              this.error.set(
                err.status === 404 || err.status === 400
                  ? 'Producto no encontrado'
                  : 'No se pudo cargar el producto',
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((product) => {
        if (product) this.populate(product);
        this.loading.set(false);
      });
  }

  // Carga el producto en el formulario y guarda la "foto" para detectar cambios
  private populate(product: Product): void {
    const options = SIZES_BY_CATEGORY[product.category] ?? [];
    const extras = product.sizes.map((s) => s.size).filter((s) => !options.includes(s));
    this.rows.set(
      [...options, ...extras].map((size) => ({
        size,
        stock: product.sizes.find((s) => s.size === size)?.stock ?? null,
      })),
    );
    this.images.set([...product.images]);
    this.form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      active: product.active,
    });
    this.newImage.reset('');
    this.imageError.set(null);
    this.product.set(product);
    this.original.set(this.current());
  }

  // ---------- Stock por talla ----------
  protected stepStock(size: string, delta: number): void {
    this.rows.update((rows) =>
      rows.map((r) =>
        r.size === size && r.stock !== null ? { ...r, stock: Math.max(0, r.stock + delta) } : r,
      ),
    );
    this.notice.set(null);
  }

  protected setStock(size: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = Math.floor(Number(input.value));
    const stock = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    input.value = String(stock);
    this.rows.update((rows) => rows.map((r) => (r.size === size ? { ...r, stock } : r)));
    this.notice.set(null);
  }

  protected addSize(size: string): void {
    this.rows.update((rows) => rows.map((r) => (r.size === size ? { ...r, stock: 0 } : r)));
  }

  protected removeSize(size: string): void {
    this.rows.update((rows) => rows.map((r) => (r.size === size ? { ...r, stock: null } : r)));
  }

  // ---------- Imágenes ----------
  protected addImage(): void {
    const url = this.newImage.value.trim();
    if (!url) return;
    if (!/^https?:\/\/\S+$/i.test(url)) {
      this.imageError.set('Debe ser una URL http o https');
      return;
    }
    if (this.images().includes(url)) {
      this.imageError.set('Esa imagen ya está en la lista');
      return;
    }
    if (this.images().length >= MAX_IMAGES) {
      this.imageError.set(`Máximo ${MAX_IMAGES} imágenes`);
      return;
    }
    this.images.update((list) => [...list, url]);
    this.newImage.reset('');
    this.imageError.set(null);
    this.notice.set(null);
  }

  protected removeImage(index: number): void {
    this.images.update((list) => list.filter((_, i) => i !== index));
    this.notice.set(null);
  }

  protected makeCover(index: number): void {
    this.images.update((list) => [list[index], ...list.filter((_, i) => i !== index)]);
    this.notice.set(null);
  }

  // ---------- Guardar / descartar ----------
  protected save(): void {
    const product = this.product();
    if (!product) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError.set('Revisa los campos marcados');
      return;
    }

    const sizes = this.rows()
      .filter((r) => r.stock !== null)
      .map((r) => ({ size: r.size, stock: r.stock as number }));
    if (sizes.length === 0) {
      this.saveError.set('Deja al menos una talla con su stock');
      return;
    }

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.saveError.set(null);
    this.notice.set(null);
    this.service
      .update(product.id, {
        name: v.name.trim(),
        description: v.description.trim(),
        category: product.category,
        price: Number(v.price),
        active: v.active,
        sizes,
        images: this.images(),
      })
      .subscribe({
        next: (updated) => {
          this.populate(updated);
          this.notice.set('Cambios guardados');
          this.saving.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.saveError.set(err.error?.errors?.join(', ') ?? 'No se pudo guardar el producto');
          this.saving.set(false);
        },
      });
  }

  protected discard(): void {
    const product = this.product();
    if (product) this.populate(product);
    this.saveError.set(null);
    this.notice.set(null);
  }

  // ---------- Eliminar ----------
  protected remove(): void {
    const product = this.product();
    if (!product) return;
    this.deleting.set(true);
    this.saveError.set(null);
    this.service.remove(product.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: HttpErrorResponse) => {
        this.saveError.set(err.error?.errors?.join(', ') ?? 'No se pudo eliminar el producto');
        this.deleting.set(false);
        this.confirmingDelete.set(false);
      },
    });
  }
}
