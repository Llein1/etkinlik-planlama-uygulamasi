import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
	message: string;
	type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
	private hideTimer: number | null = null;
	readonly notification = signal<NotificationState | null>(null);

	show(message: string, type: NotificationType = 'info', duration = 3500) {
		this.notification.set({ message, type });

		if (this.hideTimer !== null) {
			window.clearTimeout(this.hideTimer);
		}

		this.hideTimer = window.setTimeout(() => {
			this.notification.set(null);
			this.hideTimer = null;
		}, duration);
	}

	success(message: string, duration = 3500) {
		this.show(message, 'success', duration);
	}

	error(message: string, duration = 4500) {
		this.show(message, 'error', duration);
	}

	info(message: string, duration = 3500) {
		this.show(message, 'info', duration);
	}

	hide() {
		if (this.hideTimer !== null) {
			window.clearTimeout(this.hideTimer);
			this.hideTimer = null;
		}

		this.notification.set(null);
	}
}