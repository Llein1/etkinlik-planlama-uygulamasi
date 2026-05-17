import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IEvents, Event } from '../../models/IEvents';
import { apiUrl } from '../shared/api-url';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';
import { FavoriteComponent } from '../shared/favorite/favorite';

@Component({
  selector: 'app-participant-my',
  imports: [RouterModule, TrDatePipe, TrTimePipe, FavoriteComponent],
  templateUrl: '../participant-my/participant-my.html',
  styleUrls: ['../participant-my/participant-my.css'],
})
export class ParticipantMy {
  private http = inject(HttpClient);
  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  loading = signal<boolean>(false);
  totalElements = signal<number>(0);

  ngOnInit() {
    this.fetchParticipantEvents(0);
  }

  fetchParticipantEvents(page: number = 0) {
    this.activePage.set(page);
    this.loading.set(true);
    this.http.get<IEvents>(apiUrl(`/participant/my?page=${page}`), { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);
        this.totalElements.set(response.page.totalElements);
        this.pages.set(Array.from({ length: response.page.totalPages }, (_, index) => index));
        this.loading.set(false);
      },
      error: (error) => {
        alert('Katıldıklarınız yüklenirken hata oluştu: ' + (error.error?.message || 'Bilinmeyen hata'));
        this.loading.set(false);
      }
    });
  }

  onFavoriteToggled(item: Event, newState: boolean) {
    const updated = this.eventArray().map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev);
    this.eventArray.set(updated);
  }

  // Template compatibility helpers (copied from EventMy)
  fetchEvents(page: number = 0) {
    this.fetchParticipantEvents(page);
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
}
