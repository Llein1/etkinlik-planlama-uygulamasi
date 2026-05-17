import { Component, inject } from '@angular/core';
import { NotificationService } from '../notification.service';

@Component({
	selector: 'app-notification',
	templateUrl: './notification.html',
	styleUrl: './notification.css',
})
export class Notification {
	readonly notificationService = inject(NotificationService);

	close() {
		this.notificationService.hide();
	}

	get toneClass() {
		const notification = this.notificationService.notification();
		return notification ? `notification--${notification.type}` : '';
	}
}