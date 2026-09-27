import { Injectable, signal } from '@angular/core';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

export interface HeaderAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  action: () => void;
}

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  active?: boolean;
}

export interface SubHeaderConfig {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: HeaderAction[];
  filterChips?: FilterChip[];
  activeChipId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  showSearch?: boolean;
  showViewToggle?: boolean;
  viewMode?: 'table' | 'kanban';
  groupOptions?: { id: string; label: string }[];
  activeGroupId?: string;
  onChipSelect?: (chipId: string) => void;
  onSearchChange?: (val: string) => void;
  onViewModeChange?: (mode: 'table' | 'kanban') => void;
  onGroupChange?: (groupId: string) => void;
}

@Injectable({
  providedIn: 'root'
})
export class SubHeaderService {
  readonly config = signal<SubHeaderConfig>({
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Mekong Stock', route: '/dashboard' }]
  });

  setConfig(newConfig: SubHeaderConfig): void {
    this.config.set(newConfig);
  }

  updateConfig(partial: Partial<SubHeaderConfig>): void {
    this.config.update(c => ({ ...c, ...partial }));
  }

  updateTitle(title: string, subtitle?: string): void {
    this.config.update(c => ({ ...c, title, subtitle }));
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this.config.update(c => ({ ...c, breadcrumbs }));
  }

  setActions(actions: HeaderAction[]): void {
    this.config.update(c => ({ ...c, actions }));
  }

  setFilterChips(chips: FilterChip[], activeId?: string): void {
    this.config.update(c => ({ ...c, filterChips: chips, activeChipId: activeId }));
  }

  setViewMode(mode: 'table' | 'kanban'): void {
    this.config.update(c => ({ ...c, viewMode: mode }));
    if (this.config().onViewModeChange) {
      this.config().onViewModeChange!(mode);
    }
  }

  setSearchValue(val: string): void {
    this.config.update(c => ({ ...c, searchValue: val }));
    if (this.config().onSearchChange) {
      this.config().onSearchChange!(val);
    }
  }

  selectChip(chipId: string): void {
    this.config.update(c => ({ ...c, activeChipId: chipId }));
    if (this.config().onChipSelect) {
      this.config().onChipSelect!(chipId);
    }
  }

  selectGroup(groupId: string): void {
    this.config.update(c => ({ ...c, activeGroupId: groupId }));
    if (this.config().onGroupChange) {
      this.config().onGroupChange!(groupId);
    }
  }
}
