import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../login/auth.service';
import { RolesService } from '../services/roles.service';
import { PermissionsService } from '../services/permissions.service';
import { UsersService } from '../services/users.service';

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
            <a routerLink="/units" class="mekong-action mekong-action--light">Manage stock units <span aria-hidden="true">→</span></a>
            <a routerLink="/users" class="mekong-quiet-action">Manage warehouse team</a>
          </div>
        </div>
        <div class="mekong-hero__summary" aria-label="Inventory health summary">
          <div class="mekong-summary-ring"><span>86<small>%</small></span></div>
          <div><p class="mekong-summary-label">Inventory health</p><p class="mekong-summary-value">Looking good</p><p class="mekong-summary-note">12 items need attention</p></div>
        </div>
        <svg class="mekong-hero__river" viewBox="0 0 520 210" fill="none" aria-hidden="true">
          <path d="M-20 145C79 57 157 211 259 129C363 45 416 75 546 1" stroke="currentColor" stroke-width="2" stroke-dasharray="7 9"/>
          <path d="M-6 170C83 79 167 236 281 150C372 80 441 123 540 46" stroke="currentColor" stroke-width="38" stroke-linecap="round" opacity=".08"/>
          <circle cx="281" cy="150" r="7" fill="currentColor"/>
        </svg>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4m9-14v10l-9 4m0-10v10" stroke-width="1.8" stroke-linejoin="round"/></svg></div>
          <div><p>Items in catalogue</p><strong>1,284</strong><span class="mekong-positive">↑ 8.4% <em>this month</em></span></div>
        </article>
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10h18M7 15h.01M11 15h2m7-9H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div><p>Inventory value</p><strong>$48,820</strong><span class="mekong-positive">↑ 3.1% <em>this month</em></span></div>
        </article>
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--coral"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 9v4m0 4h.01M10.3 3.9 2.5 17.1A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke-width="1.8" stroke-linecap="round"/></svg></div>
          <div><p>Low stock alerts</p><strong>12</strong><span class="mekong-attention">4 urgent <em>restock today</em></span></div>
        </article>
        <article class="mekong-metric-card">
          <div class="mekong-metric-icon mekong-metric-icon--blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h13m-4-3 4 3-4 3M20 17H7m4 3-4-3 4-3" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          <div><p>Today’s movements</p><strong>68</strong><span class="mekong-neutral">34 in · 34 out <em>balanced</em></span></div>
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
          <div class="mekong-panel__head"><div><p class="mekong-kicker">Priority queue</p><h2>Restock attention</h2></div><span class="mekong-count-pill">12 items</span></div>
          <div class="space-y-4 mt-5">
            @for (item of attentionItems; track item.sku) {
              <div class="mekong-alert-item">
                <div class="mekong-product-mark" [class.mekong-product-mark--coral]="item.urgent">{{ item.initials }}</div>
                <div class="min-w-0 flex-1"><h3>{{ item.name }}</h3><p>{{ item.sku }} · {{ item.location }}</p></div>
                <div class="text-right"><strong [class.mekong-stock-low]="item.urgent">{{ item.stock }}</strong><span>left</span></div>
              </div>
            }
          </div>
          <a routerLink="/units" class="mekong-list-link">Review stock settings <span>→</span></a>
        </article>
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article class="mekong-panel xl:col-span-2 overflow-hidden p-0">
          <div class="mekong-table-head"><div><p class="mekong-kicker">Latest activity</p><h2>Recent stock movements</h2></div><span class="mekong-sync-status"><i></i>Synced just now</span></div>
          <div class="overflow-x-auto">
            <table class="mekong-table">
              <thead><tr><th>Reference</th><th>Item</th><th>Type</th><th>Quantity</th><th>Time</th></tr></thead>
              <tbody>
                @for (movement of recentMovements; track movement.reference) {
                  <tr><td class="font-mono">{{ movement.reference }}</td><td><strong>{{ movement.item }}</strong><span>{{ movement.sku }}</span></td><td><span class="mekong-movement-tag" [class.mekong-movement-tag--out]="movement.type === 'Stock out'">{{ movement.type }}</span></td><td [class.mekong-quantity-out]="movement.type === 'Stock out'">{{ movement.quantity }}</td><td class="mekong-muted">{{ movement.time }}</td></tr>
                }
              </tbody>
            </table>
          </div>
        </article>
        <article class="mekong-panel mekong-operations-card">
          <p class="mekong-kicker">Workspace</p><h2>Operations at a glance</h2>
          <div class="mekong-operation-row"><span class="mekong-operation-icon">⌘</span><div><strong>{{ totalUsers() }} active team members</strong><p>Access and approvals stay current.</p></div></div>
          <div class="mekong-operation-row"><span class="mekong-operation-icon">✓</span><div><strong>{{ totalRoles() }} permission roles</strong><p>Role-based controls configured.</p></div></div>
          <a routerLink="/users" class="mekong-action w-full justify-center mt-5">Open team controls <span>→</span></a>
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

  readonly totalRoles = signal<number>(0);
  readonly totalPermissions = signal<number>(0);
  readonly totalUsers = signal<number>(1);

  readonly attentionItems = [
    { initials: 'CB', name: 'Cold brew concentrate', sku: 'CB-240', location: 'Aisle A · 03', stock: 6, urgent: true },
    { initials: 'PK', name: 'Packing tape, clear', sku: 'PK-118', location: 'Supply · 01', stock: 9, urgent: false },
    { initials: 'MR', name: 'Mekong rice, 5 kg', sku: 'MR-005', location: 'Aisle C · 08', stock: 11, urgent: false }
  ];

  readonly recentMovements = [
    { reference: 'MOV-1048', item: 'Arabica coffee beans', sku: 'CF-240', type: 'Stock in', quantity: '+ 32 bags', time: '09:42' },
    { reference: 'MOV-1047', item: 'Mekong rice, 5 kg', sku: 'MR-005', type: 'Stock out', quantity: '− 14 bags', time: '09:18' },
    { reference: 'MOV-1046', item: 'Organic green tea', sku: 'GT-081', type: 'Stock in', quantity: '+ 48 boxes', time: '08:55' }
  ];

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
  }
}
