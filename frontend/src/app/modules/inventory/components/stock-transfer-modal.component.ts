import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseStockDto, WarehouseDto, CreateTransferRequest } from '../../../models/inventory.models';

@Component({
  selector: 'app-stock-transfer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen() && stockItem()) {
      <div
        class="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        (click)="close()"
      >
        <div
          class="w-full max-w-lg bg-[#0c1222]/95 backdrop-blur-3xl rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] border border-white/10 overflow-hidden transform animate-scale-up"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="px-6 py-4.5 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border-b border-white/[0.08] text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.3)]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold leading-tight text-white">Inter-Warehouse Stock Transfer</h3>
                <p class="text-[11px] text-teal-300/80 mt-0.5">Move physical inventory between connected locations</p>
              </div>
            </div>
            <button
              type="button"
              (click)="close()"
              class="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body Form -->
          <form (ngSubmit)="onSubmit()" class="p-6 space-y-4">

            <!-- Item Overview -->
            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
              <div class="min-w-0">
                <span class="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/15 px-2.5 py-0.5 rounded-md border border-teal-500/30">
                  {{ stockItem()!.productSku }}
                </span>
                <h4 class="text-sm font-bold text-white mt-1.5 truncate">
                  {{ stockItem()!.productName }}
                </h4>
                <p class="text-xs text-slate-400 mt-0.5">
                  Origin: <strong class="text-emerald-300 font-semibold">{{ stockItem()!.warehouseName }}</strong>
                </p>
              </div>

              <div class="text-right flex-shrink-0">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available</span>
                <span class="text-2xl font-black text-emerald-400 font-mono">{{ stockItem()!.availableQuantity }}</span>
                <span class="text-[11px] text-slate-400 block font-medium">units</span>
              </div>
            </div>

            <!-- Origin & Destination Facility -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">From Facility (Origin)</label>
                <div class="px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-bold text-slate-300 truncate">
                  {{ stockItem()!.warehouseName }}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">To Facility (Destination) *</label>
                <select
                  [(ngModel)]="targetWarehouseId"
                  name="targetWarehouseId"
                  required
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-bold text-white focus:bg-slate-900 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                >
                  <option [ngValue]="null" disabled class="bg-slate-900">Select target warehouse...</option>
                  @for (w of eligibleWarehouses(); track w.id) {
                    <option [ngValue]="w.id" class="bg-slate-900">{{ w.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Transfer Quantity -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-bold text-slate-300">Quantity to Transfer *</label>
                <span class="text-[11px] text-emerald-400 font-mono">Max: {{ stockItem()!.availableQuantity }} units</span>
              </div>
              <div class="flex items-center rounded-xl bg-slate-900/90 border border-white/10 overflow-hidden focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
                <button
                  type="button"
                  (click)="stepQty(-1)"
                  class="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.1] text-white flex items-center justify-center font-bold text-base cursor-pointer transition border-r border-white/10 flex-shrink-0"
                >-</button>
                <input
                  type="number"
                  min="1"
                  [max]="stockItem()!.availableQuantity"
                  [(ngModel)]="quantity"
                  name="quantity"
                  required
                  class="w-full min-w-0 px-2 py-2 bg-transparent text-base font-bold text-white text-center font-mono outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  (click)="stepQty(1)"
                  class="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.1] text-white flex items-center justify-center font-bold text-base cursor-pointer transition border-l border-white/10 flex-shrink-0"
                >+</button>
              </div>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Transfer Notes & Dispatch Reference</label>
              <textarea
                [(ngModel)]="notes"
                name="notes"
                rows="2"
                placeholder="Reason or transport reference..."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              ></textarea>
            </div>

            <!-- Modal Actions -->
            <div class="pt-3 flex items-center justify-end gap-2.5 border-t border-white/[0.08]">
              <button
                type="button"
                (click)="close()"
                class="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!isValid() || isSubmitting()"
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(20,184,166,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
              >
                @if (isSubmitting()) {
                  <span class="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                }
                <span>Initiate Transfer</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    }
  `
})
export class StockTransferModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly stockItem = input<WarehouseStockDto | null>(null);
  readonly warehouses = input<WarehouseDto[]>([]);
  readonly isSubmitting = input<boolean>(false);

  readonly closed = output<void>();
  readonly submitted = output<CreateTransferRequest>();

  targetWarehouseId: number | null = null;
  quantity = 1;
  notes = '';

  constructor() {
    effect(() => {
      const item = this.stockItem();
      if (item) {
        this.quantity = Math.min(1, item.availableQuantity);
        this.notes = '';
        const eligible = this.eligibleWarehouses();
        this.targetWarehouseId = eligible.length > 0 ? eligible[0].id : null;
      }
    });
  }

  eligibleWarehouses(): WarehouseDto[] {
    const curId = this.stockItem()?.warehouseId;
    return this.warehouses().filter(w => w.id !== curId);
  }

  stepQty(delta: number): void {
    const item = this.stockItem();
    if (!item) return;
    const next = this.quantity + delta;
    if (next >= 1 && next <= item.availableQuantity) {
      this.quantity = next;
    }
  }

  isValid(): boolean {
    const item = this.stockItem();
    return (
      !!item &&
      this.targetWarehouseId !== null &&
      this.quantity > 0 &&
      this.quantity <= item.availableQuantity
    );
  }

  close(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (!this.isValid()) return;
    const item = this.stockItem()!;
    const payload: CreateTransferRequest = {
      fromWarehouseId: item.warehouseId,
      toWarehouseId: this.targetWarehouseId!,
      notes: this.notes.trim() || null,
      items: [
        {
          productId: item.productId,
          quantity: this.quantity
        }
      ]
    };
    this.submitted.emit(payload);
  }
}
