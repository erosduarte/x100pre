import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES, Product } from './product.model';
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
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss',
})
export class Catalog implements OnInit {
  private readonly service = inject(ProductService);
  private readonly router = inject(Router);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // ---------- Búsqueda y filtros ----------
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

  // ---------- Eliminar desde la tarjeta (con confirmación) ----------
  protected readonly confirmingId = signal<number | null>(null);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly deleteError = signal<string | null>(null);

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

  // ---------- Navegación ----------
  protected goToDetail(product: Product): void {
    this.stopPreview();
    this.router.navigate(['/producto', product.id]);
  }

  // ---------- Datos ----------
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
}
