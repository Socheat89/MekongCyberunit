import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WarehouseStockDto, CreateAdjustmentRequest, AdjustmentType } from '../../../models/inventory.models';

@Component({
  selector: 'app-stock-adjustment-modal',
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
              <div class="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold leading-tight text-white">Stock Level Adjustment</h3>
                <p class="text-[11px] text-emerald-300/80 mt-0.5">Physical audit, cycle reconciliation, or variance log</p>
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

            <!-- Item Overview Badge -->
            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3 shadow-inner">
              <div class="min-w-0">
                <span class="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  {{ stockItem()!.productSku }}
                </span>
                <h4 class="text-sm font-bold text-white mt-1.5 truncate">
                  {{ stockItem()!.productName }}
                </h4>
                <p class="text-xs text-slate-400 mt-0.5">
                  Facility: <strong class="text-emerald-300 font-semibold">{{ stockItem()!.warehouseName }}</strong>
                </p>
              </div>

              <!-- Current Stock Stat -->
              <div class="text-right flex-shrink-0">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current On Hand</span>
                <span class="text-2xl font-black text-white font-mono">{{ stockItem()!.quantityOnHand }}</span>
                <span class="text-[11px] text-slate-400 block font-medium">units</span>
              </div>
            </div>

            <!-- Adjustment Type Selector -->
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1.5">Adjustment Type *</label>
              <div class="grid grid-cols-4 gap-2">
                @for (t of types; track t.id) {
                  <button
                    type="button"
                    (click)="selectedType.set(t.id)"
                    class="py-2.5 px-1.5 text-center rounded-xl text-xs font-semibold border transition cursor-pointer"
                    [ngClass]="selectedType() === t.id
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black border-transparent shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.08]'"
                  >
                    <div>{{ t.label }}</div>
                  </button>
                }
              </div>
            </div>

            <!-- New Quantity & Difference -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">New Physical Count *</label>
                <div class="flex items-center rounded-xl bg-slate-900/90 border border-white/10 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                  <button
                    type="button"
                    (click)="stepCount(-1)"
                    class="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.1] text-white flex items-center justify-center font-bold text-base cursor-pointer transition border-r border-white/10 flex-shrink-0"
                  >-</button>
                  <input
                    type="number"
                    min="0"
                    [(ngModel)]="newCount"
                    name="newCount"
                    required
                    class="w-full min-w-0 px-2 py-2 bg-transparent text-base font-bold text-white text-center font-mono outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    (click)="stepCount(1)"
                    class="w-10 h-10 bg-white/[0.04] hover:bg-white/[0.1] text-white flex items-center justify-center font-bold text-base cursor-pointer transition border-l border-white/10 flex-shrink-0"
                  >+</button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-300 mb-1">Delta Variation</label>
                <div
                  class="h-10 px-3.5 rounded-xl border text-sm font-bold flex items-center justify-between"
                  [ngClass]="delta() > 0 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : delta() < 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-white/[0.03] border-white/10 text-slate-400'"
                >
                  <span class="font-mono text-base">{{ delta() > 0 ? '+' + delta() : delta() }}</span>
                  <span class="text-xs font-bold">{{ delta() > 0 ? 'Surplus' : delta() < 0 ? 'Shortage' : 'Unchanged' }}</span>
                </div>
              </div>
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Reason for Adjustment *</label>
              <input
                type="text"
                [(ngModel)]="reason"
                name="reason"
                required
                placeholder="e.g. End of month physical inventory reconciliation"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Additional Observations / Notes</label>
              <textarea
                [(ngModel)]="notes"
                name="notes"
                rows="2"
                placeholder="Optional notes for auditor review..."
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
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
                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-2"
              >
                @if (isSubmitting()) {
                  <span class="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                }
                <span>Validate & Apply Adjustment</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    }
  `
})
export class StockAdjustmentModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly stockItem = input<WarehouseStockDto | null>(null);
  readonly isSubmitting = input<boolean>(false);

  readonly closed = output<void>();
  readonly submitted = output<CreateAdjustmentRequest>();

  readonly types: { id: AdjustmentType; label: string }[] = [
    { id: 'AUDIT', label: 'Cycle Audit' },
    { id: 'SURPLUS', label: 'Surplus (+)' },
    { id: 'SHRINKAGE', label: 'Shrinkage (-)' },
    { id: 'DAMAGE', label: 'Damaged (-)' }
  ];

  readonly selectedType = signal<AdjustmentType>('AUDIT');
  newCount = 0;
  reason = 'Reconciliation audit';
  notes = '';

  constructor() {
    effect(() => {
      const item = this.stockItem();
      if (item) {
        this.newCount = item.quantityOnHand;
        this.selectedType.set('AUDIT');
        this.reason = 'Reconciliation audit';
        this.notes = '';
      }
    });
  }

  stepCount(delta: number): void {
    const next = this.newCount + delta;
    if (next >= 0) this.newCount = next;
  }

  delta(): number {
    const cur = this.stockItem()?.quantityOnHand ?? 0;
    return this.newCount - cur;
  }

  isValid(): boolean {
    return (
      !!this.stockItem() &&
      this.newCount >= 0 &&
      this.reason.trim().length > 0
    );
  }

  close(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    if (!this.isValid()) return;
    const item = this.stockItem()!;
    const payload: CreateAdjustmentRequest = {
      warehouseId: item.warehouseId,
      productId: item.productId,
      adjustmentType: this.selectedType(),
      newQuantity: this.newCount,
      reason: this.reason.trim(),
      notes: this.notes.trim() || null
    };
    this.submitted.emit(payload);
  }
}
