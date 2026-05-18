import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IEvents, Event } from '../../models/IEvents';
import { apiUrl } from '../shared/api-url';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';
import { FavoriteComponent } from '../shared/favorite/favorite';

@Component({
  selector: 'app-event-my',
  imports: [RouterModule, TrDatePipe, TrTimePipe, FavoriteComponent],
  templateUrl: './event-my.html',
  styleUrl: './event-my.css',
})
export class EventMy {
  private http = inject(HttpClient);
  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  loading = signal<boolean>(false);
  totalElements = signal<number>(0);

  ngOnInit() {
    this.fetchEvents(0);
  }

  fetchEvents(page: number = 0) {
    this.activePage.set(page);
    this.loading.set(true);
    this.http.get<IEvents>(apiUrl(`/event/my?page=${page}`), { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);
        this.totalElements.set(response.page.totalElements);
        this.pages.set(Array.from({ length: response.page.totalPages }, (_, index) => index));
        this.loading.set(false);
      },
      error: (error) => {
        alert('Etkinlikler yüklenirken hata oluştu: ' + (error.error?.message || 'Bilinmeyen hata'));
        this.loading.set(false);
      }
    });
  }

  onFavoriteToggled(item: Event, newState: boolean) {
    const updated = this.eventArray().map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev);
    this.eventArray.set(updated);
  }

  getStatusVariant(status: string): string {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes('published')) {
      return 'published';
    }

    if (normalizedStatus.includes('paused')) {
      return 'paused';
    }

    if (normalizedStatus.includes('archived')) {
      return 'archived';
    }

    return 'published';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus.includes('published')) {
      return 'Yayında';
    }

    if (normalizedStatus.includes('paused')) {
      return 'Duraklatıldı';
    }

    if (normalizedStatus.includes('archived')) {
      return 'Arşivlendi';
    }

    return 'Yayında';
  }

  isArchivedStatus(status: string): boolean {
    return status.toLowerCase().includes('archived');
  }
}
