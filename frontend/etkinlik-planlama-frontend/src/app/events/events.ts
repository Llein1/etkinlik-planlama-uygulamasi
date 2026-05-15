import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IEvents, Event } from '../../models/IEvents';

@Component({
  selector: 'app-events',
  imports: [RouterModule],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {

  private http = inject(HttpClient);
  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  loading = signal<boolean>(false);

  constructor() {
    console.log('Products component initialized');
  }

  ngOnInit() {
    this.fetchEvents(0);
  }

  fetchEvents(page: number = 0) {
    this.activePage.set(page);
    this.loading.set(true);
    this.http.get<IEvents>(`http://localhost:8090/event/list?page=${page}`, { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);
        const eventsArray = Array.from({ length: response.page.totalPages }, (_, i) => i);
        this.pages.set(eventsArray);
        this.loading.set(false);
      },
      error: (error) => {
        alert('Etkinlikler yüklenirken hata oluştu: ' + (error.error?.message || 'Bilinmeyen hata'));
        this.loading.set(false);
      }
    });
  }
}
