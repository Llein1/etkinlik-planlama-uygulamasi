import { Component, signal } from '@angular/core';
import { IEventDetail } from '../../models/IEvents';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../shared/api-url';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';

@Component({
  selector: 'app-event-detail',
  imports: [TrDatePipe, TrTimePipe],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css',
})
export class EventDetail {

  eventItem = signal<IEventDetail | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      this.http.get<IEventDetail>(apiUrl(`/event/detail/${id}`), { withCredentials: true }).subscribe({
        next: (response) => {
          this.eventItem.set(response);
        },
        error: (error) => {
          alert('Etkinlik detayları alınırken bir hata oluştu. Anasayfaya yönlendiriliyorsunuz.');
          this.router.navigate(['/events']);
        }
      });
    })
  }
}
