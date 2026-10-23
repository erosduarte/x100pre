import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ALL_SIZES,
  CATEGORIES,
  MAX_IMAGES,
  Product,
  ProductSize,
  SIZES_BY_CATEGORY,
} from './product.model';
import { ProductService } from './product.service';

// Minúsculas y sin acentos, para que "camisa" encuentre "Camisa" y "vestído"
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-catalog',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.scss', './catalog-filters.scss'],
  host: { '(document:keydown)': 'onKey($event)' },
})
export class Catalog implements OnInit {
  private readonly service = inject(ProductService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly categories = CATEGORIES;
  protected readonly maxImages = MAX_IMAGES;
  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  // Búsqueda y filtros
  protected readonly query = signal('');
  protected readonly categoryFilter = signal<string | null>(null);

  // Categorías de CATEGORIES más cualquier otra que ya exista en los productos
  protected readonly filterCategories = computed(() => {
    const extras = this.products()
      .map((p) => p.category)
      .filter((c) => !(CATEGORIES as readonly string[]).includes(c));
    return [...CATEGORIES, ...new Set(extras)] as string[];
  });

  protected readonly categoryCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const p of this.products()) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return counts;
  });

  protected readonly filtered = computed(() => {
    const text = normalize(this.query());
    const category = this.categoryFilter();
    // Acepta "6", "#6" o "X100-0006" como búsqueda por id
    const idMatch = text.match(/^(?:#|x100-?)?(\d+)$/);
    const id = idMatch ? Number(idMatch[1]) : null;

    return this.products().filter((p) => {
      if (category && p.category !== category) return false;
      if (!text) return true;
      return p.id === id || normalize(p.name).includes(text);
    });
  });

  protected readonly filtersActive = computed(
    () => this.query().trim() !== '' || this.categoryFilter() !== null,
  );

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected setCategory(category: string | null): void {
    this.categoryFilter.set(category);
  }

  protected clearFilters(): void {
    this.query.set('');
    this.categoryFilter.set(null);
  }

  // Eliminar desde la tarjeta: primero se pide confirmación
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  // Galería: producto abierto y foto que se está mostrando
  protected readonly selected = signal<Product | null>(null);
  protected readonly activeIndex = signal(0);

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

  ngOnInit(): void {
    this.load();
  }

  private newImageControl() {
    return this.fb.nonNullable.control('', [Validators.pattern(/^(https?:\/\/\S+)?$/)]);
  }

  protected stockControl(size: string): FormControl<number | null> {
    return this.stockControls.get(size)!;
  }

  // ---------- Imágenes del formulario ----------
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

  // ---------- Vista previa al pasar el mouse ----------
  private readonly hover = signal<{ id: number; index: number } | null>(null);
  private previewTimer: ReturnType<typeof setInterval> | null = null;

  protected previewIndex(product: Product): number {
    const h = this.hover();
    return h && h.id === product.id ? h.index : 0;
  }

  protected startPreview(product: Product): void {
    this.stopPreview();
    if (product.images.length < 2) return;
    this.hover.set({ id: product.id, index: 1 });
    this.previewTimer = setInterval(() => {
      this.hover.update((h) =>
        h ? { id: h.id, index: (h.index + 1) % product.images.length } : h,
      );
    }, 900);
  }

  protected stopPreview(): void {
    if (this.previewTimer) clearInterval(this.previewTimer);
    this.previewTimer = null;
    this.hover.set(null);
  }

  // ---------- Eliminar ----------
  protected askDelete(product: Product): void {
    this.deleteError.set(null);
    this.confirmingId.set(product.id);
  }

  protected cancelDelete(): void {
    this.confirmingId.set(null);
  }

  protected confirmDelete(product: Product): void {
    this.deletingId.set(product.id);
    this.service.remove(product.id).subscribe({
      next: () => this.afterDelete(product.id),
      error: (err: { status?: number; error?: { errors?: string[] } }) => {
        if (err.status === 404) {
          // Ya no existe en el servidor: lo quitamos también de la lista
          this.afterDelete(product.id);
          return;
        }
        this.deleteError.set(err.error?.errors?.join(', ') ?? 'No se pudo eliminar el producto');
        this.deletingId.set(null);
        this.confirmingId.set(null);
      },
    });
  }

  private afterDelete(id: number): void {
    this.products.update((list) => list.filter((p) => p.id !== id));
    this.deletingId.set(null);
    this.confirmingId.set(null);
  }

  // ---------- Detalle ----------
  protected goToDetail(product: Product): void {
    this.stopPreview();
    this.router.navigate(['/producto', product.id]);
  }

  // ---------- Galería ----------
  protected open(product: Product, index = 0): void {
    this.selected.set(product);
    this.activeIndex.set(index);
  }

  protected close(): void {
    this.selected.set(null);
  }

  protected next(): void {
    const total = this.selected()?.images.length ?? 0;
    if (total > 1) this.activeIndex.update((i) => (i + 1) % total);
  }

  protected prev(): void {
    const total = this.selected()?.images.length ?? 0;
    if (total > 1) this.activeIndex.update((i) => (i - 1 + total) % total);
  }

  protected onKey(event: Event): void {
    if (!this.selected()) return;
    const key = (event as KeyboardEvent).key;
    if (key === 'Escape') this.close();
    else if (key === 'ArrowRight') this.next();
    else if (key === 'ArrowLeft') this.prev();
  }

  // ---------- Datos ----------
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

    const { images: rawImages, ...rest } = this.form.getRawValue();
    const images = rawImages.map((url) => url.trim()).filter((url) => url !== '');

    this.saving.set(true);
    this.formError.set(null);
    this.service.create({ ...rest, sizes, images }).subscribe({
      next: (product) => {
        this.products.update((list) => [...list, product]);
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