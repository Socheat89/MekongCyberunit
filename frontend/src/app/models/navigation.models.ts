export interface NavigationItem {
  id: number;
  code: string;
  label: string;
  route: string | null;
  icon: string | null;
  sortOrder: number;
  children: NavigationItem[];
}
