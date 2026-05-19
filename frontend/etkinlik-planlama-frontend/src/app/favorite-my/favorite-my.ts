import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IEvents, Event } from '../../models/IEvents';
import { apiUrl } from '../shared/api-url';
import { NotificationService } from '../shared/notification.service';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';
import { FavoriteComponent } from '../shared/favorite/favorite';

@Component({
  selector: 'app-favorite-my',
  imports: [RouterModule, TrDatePipe, TrTimePipe, FavoriteComponent],
  templateUrl: '../favorite-my/favorite-my.html',
  styleUrl: '../favorite-my/favorite-my.css',
})
export class FavoriteMy {
  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  
  // YENİ EKLENEN KISIM: Başlangıç yüklemeleri
  loading = signal<boolean>(true);
  initialLoad = signal<boolean>(true);
  
  totalElements = signal<number>(0);

  ngOnInit() {
    this.fetchFavorites(0);
  }

  fetchFavorites(page: number = 0) {
    this.activePage.set(page);
    this.loading.set(true);
    this.http.get<IEvents>(apiUrl(`/favorite/my?page=${page}`), { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);
        this.totalElements.set(response.page.totalElements);
        this.pages.set(Array.from({ length: response.page.totalPages }, (_, index) => index));
        this.loading.set(false);
        this.initialLoad.set(false); // İlk yükleme tamamlandı
      },
      error: (error) => {
        this.notification.error('Favoriler yüklenirken hata oluştu: ' + (error.error?.message || 'Bilinmeyen hata'));
        this.loading.set(false);
        this.initialLoad.set(false);
      }
    });
  }

  onFavoriteToggled(item: Event, newState: boolean) {
    const updated = this.eventArray().map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev);
    this.eventArray.set(updated);
  }

  fetchEvents(page: number = 0) {
    this.fetchFavorites(page);
  }

  getStatusVariant(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('published')) return 'published';
    if (normalizedStatus.includes('paused')) return 'paused';
    if (normalizedStatus.includes('archived')) return 'archived';
    return 'published';
  }

  getStatusLabel(status: string): string {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('published')) return 'Yayında';
    if (normalizedStatus.includes('paused')) return 'Duraklatıldı';
    if (normalizedStatus.includes('archived')) return 'Arşivlendi';
    return 'Yayında';
  }
}