import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { apiUrl } from './api-url';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
  private http = inject(HttpClient);

  add(eventId: number) {
    return this.http.post(apiUrl('/favorite/add'), { eventId }, { withCredentials: true });
  }

  remove(eventId: number) {
    return this.http.delete(apiUrl(`/favorite/remove/${eventId}`), { withCredentials: true });
  }
}
