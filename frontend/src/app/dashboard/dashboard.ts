import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../login/auth.service';
import { RolesService } from '../services/roles.service';
import { PermissionsService } from '../services/permissions.service';
import { UsersService } from '../services/users.service';
import { StockService, StockSummary, StockItem, StockMovement } from '../services/stock.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="mekong-dashboard space-y-6 animate-fade-in">
      <section class="mekong-hero">
        <div class="mekong-hero__copy">
          <div class="mekong-eyebrow"><span class="mekong-live-dot"></span> Warehouse operations live</div>
          <p class="mekong-kicker">Mekong Stock / Command centre</p>
          <h1>Good {{ dayPeriod() }}, {{ username() }}.</h1>
          <p class="mekong-hero__description">Here is the pulse of your inventory today. Keep fast-moving items available and resolve low-stock risks before they become missed sales.</p>
          <div class="flex flex-wrap gap-3 pt-1">
            <a routerLink="/stock/items" class="mekong-action mekong-action--light">Stock catalogue <span aria-hidden="true">→</span></a>
            <a routerLink="/stock/in" class="mekong-quiet-action">Stock In (Receive)</a>
            <a routerLink="/stock/out" class="mekong-quiet-action">Stock Out (Dispatch)</a>
          </div>
        </div>
        <div class="mekong-hero__summary" aria-label="Inventory health summary">
          <div class="mekong-summary-ring"><span>{{ inventoryHealth() }}<small>%</small></span></div>
          <div>
            <p class="mekong-summary-label">Inventory health</p>
            <p class="mekong-summary-value">{{ healthStatus() }}</p>
            <p class="mekong-summary-note">{{ stockSummary()?.lowStockCount || 0 }} items need attention</p>
          </div>
        </div>
        <svg class="mekong-hero__river" viewBox="0 0 520 210" fill="none" aria-hidden="true">
          <path d="M-20 145C79 57 157 211 259 129C363 45 416 75 546 1" stroke="currentColor" stroke-width="2" stroke-dasharray="7 9"/>
          <path d="M-6 170C83 79 167 236 281 150C372 80 441 123 540 46" stroke="currentColor" stroke-width="38" stroke-linecap="round" opacity=".08"/>
          <circle cx="281" cy="150" r="7" fill="currentColor"/>
        </svg>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-stagger">
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4m9-14v10l-9 4m0-10v10" stroke-width="1.8" stroke-linejoin="round"/></svg></div>
          <div>
            <p>Items in catalogue</p>
            <strong>{{ stockSummary()?.totalItems || 0 }}</strong>
            <span class="mekong-positive">{{ stockSummary()?.totalQuantity || 0 }} <em>units on hand</em></span>
          </div>
        </article>
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10h18M7 15h.01M11 15h2m7-9H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div>
            <p>Inventory value</p>
            <strong>$ {{ (stockSummary()?.totalInventoryValue || 0) | number:'1.2-2' }}</strong>
            <span class="mekong-positive">Active stock value</span>
          </div>
        </article>
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--coral"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17.1A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div>
            <p>Low stock alerts</p>
            <strong>{{ (stockSummary()?.lowStockCount || 0) + (stockSummary()?.outOfStockCount || 0) }}</strong>
            <span class="mekong-attention">{{ stockSummary()?.outOfStockCount || 0 }} out of stock</span>
          </div>
        </article>
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h13m-4-3 4 3-4 3M20 17H7m4 3-4-3 4-3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div>
            <p>Today’s movements</p>
            <strong>{{ stockSummary()?.todayMovementsCount || 0 }}</strong>
            <span class="mekong-neutral">{{ stockSummary()?.todayInCount || 0 }} in · {{ stockSummary()?.todayOutCount || 0 }} out</span>
          </div>
        </article>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article class="mekong-panel xl:col-span-2">
          <div class="mekong-panel__head">
            <div><p class="mekong-kicker">Inventory flow</p><h2>Stock movement overview</h2><p>Inward and outward movements over the last 7 days.</p></div>
            <button type="button" class="mekong-period">This week <span>⌄</span></button>
          </div>
          <div class="mekong-chart-wrap">
            <div class="mekong-chart-y"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
            <div class="mekong-chart" aria-label="Stock movement line chart">
              <div class="mekong-grid-line" style="top:0"></div><div class="mekong-grid-line" style="top:25%"></div><div class="mekong-grid-line" style="top:50%"></div><div class="mekong-grid-line" style="top:75%"></div><div class="mekong-grid-line" style="bottom:0"></div>
              <svg viewBox="0 0 600 210" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <defs><linearGradient id="stock-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#16a394" stop-opacity=".26"/><stop offset="1" stop-color="#16a394" stop-opacity="0"/></linearGradient></defs>
                <path d="M0 164C29 149 51 133 83 138C114 142 127 108 166 116C204 124 217 71 251 82C283 93 306 123 340 105C373 87 396 47 429 59C466 73 479 42 513 54C548 66 565 31 600 20V210H0Z" fill="url(#stock-fill)"/>
                <path d="M0 164C29 149 51 133 83 138C114 142 127 108 166 116C204 124 217 71 251 82C283 93 306 123 340 105C373 87 396 47 429 59C466 73 479 42 513 54C548 66 565 31 600 20" stroke="#0f766e" stroke-width="3" vector-effect="non-scaling-stroke"/>
                <circle cx="429" cy="59" r="5" fill="#fff" stroke="#0f766e" stroke-width="3" vector-effect="non-scaling-stroke"/>
              </svg>
              <div class="mekong-chart-x"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
            </div>
          </div>
          <div class="mekong-chart-key"><span><i class="mekong-key-dot"></i>Total movement</span><span><i class="mekong-key-dash"></i>Daily target</span></div>
        </article>

        <article class="mekong-panel mekong-alert-panel">
          <div class="mekong-panel__head">
            <div>
              <p class="mekong-kicker">Priority queue</p>
              <h2>Restock attention</h2>
            </div>
            <span class="mekong-count-pill">{{ alertItems().length }} items</span>
          </div>
          <div class="space-y-4 mt-5">
            @for (item of alertItems().slice(0, 4); track item.sku) {
              <div class="mekong-alert-item">
                <div class="mekong-product-mark" [class.mekong-product-mark--coral]="item.quantityOnHand === 0">
                  {{ item.sku.substring(0, 2) }}
                </div>
                <div class="min-w-0 flex-1">
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.sku }} · {{ item.location || 'Warehouse' }}</p>
                </div>
                <div class="text-right">
                  <strong [class.mekong-stock-low]="item.quantityOnHand <= item.minStockLevel">
                    {{ item.quantityOnHand }}
                  </strong>
                  <span>{{ item.unit }} left</span>
                </div>
              </div>
            } @empty {
              <div class="py-6 text-center text-xs text-slate-400">
                All items well stocked.
              </div>
            }
          </div>
          <a routerLink="/stock/alerts" class="mekong-list-link">View all alerts <span>→</span></a>
        </article>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article class="mekong-panel xl:col-span-2 overflow-hidden p-0">
          <div class="mekong-table-head">
            <div>
              <p class="mekong-kicker">Latest activity</p>
              <h2>Recent stock movements</h2>
            </div>
            <a routerLink="/stock/movements" class="text-xs font-bold text-teal-600 hover:text-teal-800">
              View all movements →
            </a>
          </div>
          <div class="overflow-x-auto">
            <table class="mekong-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                @for (m of recentMovements(); track m.id) {
                  <tr>
                    <td class="font-mono">{{ m.referenceNo }}</td>
                    <td>
                      <strong>{{ m.itemName }}</strong>
                      <span>{{ m.itemSku }}</span>
                    </td>
                    <td>
                      <span class="mekong-movement-tag" [class.mekong-movement-tag--out]="m.movementType === 'OUT'">
                        {{ m.movementType }}
                      </span>
                    </td>
                    <td [class.mekong-quantity-out]="m.movementType === 'OUT'">
                      {{ m.movementType === 'IN' ? '+' : (m.movementType === 'OUT' ? '-' : '') }}{{ m.quantity }}
                    </td>
                    <td class="font-mono text-slate-700 font-bold">
                      {{ m.balanceAfter }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-6 text-center text-slate-400">No recent movements recorded.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </article>
        <article class="mekong-panel mekong-operations-card">
          <p class="mekong-kicker">Workspace</p>
          <h2>Operations at a glance</h2>
          <div class="mekong-operation-row">
            <span class="mekong-operation-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </span>
            <div><strong>{{ totalUsers() }} active team members</strong><p>Access and approvals stay current.</p></div>
          </div>
          <div class="mekong-operation-row">
            <span class="mekong-operation-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </span>
            <div><strong>{{ totalRoles() }} permission roles</strong><p>Role-based controls configured.</p></div>
          </div>
          <div class="mekong-operation-row">
            <span class="mekong-operation-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </span>
            <div><strong>{{ stockSummary()?.totalItems || 0 }} products registered</strong><p>Full tracking &amp; movement ledger.</p></div>
          </div>
          <a routerLink="/stock/items" class="mekong-action w-full justify-center mt-5">Open stock catalogue <span>→</span></a>
        </article>
      </section>
    </div>
  `
})
export class Dashboard implements OnInit {
  readonly authService = inject(AuthService);
  private readonly rolesService = inject(RolesService);
  private readonly permissionsService = inject(PermissionsService);
  private readonly usersService = inject(UsersService);
  private readonly stockService = inject(StockService);

  readonly totalRoles = signal<number>(0);
  readonly totalPermissions = signal<number>(0);
  readonly totalUsers = signal<number>(1);
  readonly stockSummary = signal<StockSummary | null>(null);
  readonly alertItems = signal<StockItem[]>([]);
  readonly recentMovements = signal<StockMovement[]>([]);

  inventoryHealth = computed(() => {
    const s = this.stockSummary();
    if (!s || s.totalItems === 0) return 100;
    const unhealthy = (s.lowStockCount || 0) + (s.outOfStockCount || 0);
    const health = Math.round(((s.totalItems - unhealthy) / s.totalItems) * 100);
    return Math.max(0, Math.min(100, health));
  });

  healthStatus = computed(() => {
    const h = this.inventoryHealth();
    if (h >= 85) return 'Looking good';
    if (h >= 60) return 'Needs attention';
    return 'Critical restock';
  });

  username(): string { return this.authService.currentUser()?.username || 'Manager'; }

  dayPeriod(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  }

  ngOnInit(): void {
    this.rolesService.getRoles({ pageSize: 1 }).subscribe({
      next: res => this.totalRoles.set(res.totalRoles || res.totalCount || 0),
      error: () => {}
    });
    this.permissionsService.getAll().subscribe({
      next: list => this.totalPermissions.set(list.length),
      error: () => {}
    });
    this.usersService.getUsers().subscribe({
      next: list => this.totalUsers.set(list.length),
      error: () => {}
    });

    this.stockService.getSummary().subscribe({
      next: sum => this.stockSummary.set(sum),
      error: () => {}
    });
    this.stockService.getAlerts().subscribe({
      next: items => this.alertItems.set(items),
      error: () => {}
    });
    this.stockService.getMovements({ limit: 5 }).subscribe({
      next: m => this.recentMovements.set(m),
      error: () => {}
    });
  }
}
