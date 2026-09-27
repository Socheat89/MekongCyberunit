import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);

  show(type: NotificationType, title: string, message: string, durationMs = 5000): string {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newNotif: AppNotification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      durationMs
    };

    this.notifications.update(list => [newNotif, ...list]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }

    return id;
  }

  success(title: string, message = ''): string {
    return this.show('success', title, message);
  }

  error(title: string, message = ''): string {
    return this.show('error', title, message, 7000);
  }

  warning(title: string, message = ''): string {
    return this.show('warning', title, message, 6000);
  }

  info(title: string, message = ''): string {
    return this.show('info', title, message);
  }

  dismiss(id: string): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications.set([]);
  }
}
