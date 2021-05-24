import { Icon } from '@visurel/iconify-angular';

export interface MenuItem {
  id: string;
  icon: Icon;
  label: string | number | boolean;
  description: string;
  colorClass: string;
  route: string | null;
  click?: any;
}
