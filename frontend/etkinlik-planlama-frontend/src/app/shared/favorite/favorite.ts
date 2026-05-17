import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FavoriteService } from '../favorite.service';
import { NotificationService } from '../notification.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-favorite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorite.html',
  styleUrls: ['./favorite.css'],
})
export class FavoriteComponent {
  @Input() eventId!: number;
  @Input() isFavorite = false;
  @Output() toggled = new EventEmitter<boolean>();

  private fav = inject(FavoriteService);
  private notify = inject(NotificationService);

  loading = false;
  popping = false;

  toggle() {
    if (this.loading || !this.eventId) return;

    // visual pop feedback (stronger and slightly longer)
    this.popping = true;
    setTimeout(() => (this.popping = false), 320);

    const shouldAdd = !this.isFavorite;
    this.loading = true;

    if (shouldAdd) {
      this.fav.add(this.eventId)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            this.isFavorite = true;
            this.toggled.emit(true);
            this.notify.success('Etkinlik favorilere eklendi.');
          },
          error: () => {
            this.notify.error('Favorilere eklenemedi.');
          },
        });
    } else {
      this.fav.remove(this.eventId)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: () => {
            this.isFavorite = false;
            this.toggled.emit(false);
            this.notify.success('Etkinlik favorilerden kaldırıldı.');
          },
          error: () => {
            this.notify.error('Favoriden kaldırılamadı.');
          },
        });
    }
  }
}
