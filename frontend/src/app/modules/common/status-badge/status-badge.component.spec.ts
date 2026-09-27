import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  let component: StatusBadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should render InStock with emerald styles', () => {
    fixture.componentRef.setInput('status', 'InStock');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('In Stock');
    expect(badge?.classList.contains('text-emerald-700')).toBe(true);
  });

  it('should render LowStock with amber warning styles', () => {
    fixture.componentRef.setInput('status', 'LowStock');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Low Stock');
    expect(badge?.classList.contains('text-amber-700')).toBe(true);
  });

  it('should render OutOfStock with rose danger styles', () => {
    fixture.componentRef.setInput('status', 'OutOfStock');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector('span');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Out Of Stock');
    expect(badge?.classList.contains('text-rose-700')).toBe(true);
  });

  it('should render custom label when provided', () => {
    fixture.componentRef.setInput('status', 'InStock');
    fixture.componentRef.setInput('label', 'Available Now');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector('span');
    expect(badge?.textContent).toContain('Available Now');
  });
});
