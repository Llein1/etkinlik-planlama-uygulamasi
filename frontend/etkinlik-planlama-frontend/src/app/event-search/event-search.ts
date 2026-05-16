import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Event, IEvents } from '../../models/IEvents';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../shared/api-url';

@Component({
  selector: 'app-event-search',
  imports: [RouterModule],
  templateUrl: './event-search.html',
  styleUrl: './event-search.css',
})
export class EventSearch {

  searchQuery = signal('');
  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  loading = signal<boolean>(false);
  totalElements = signal<number>(0);

  constructor( private router: ActivatedRoute, private http: HttpClient) {
    this.router.queryParams.subscribe(params => {
      const query = (params['q'] ?? '').toString();
      this.searchQuery.set(query);
      console.log('Search query from URL:', query);
    });
  }

  ngOnInit() {
    this.searchEvents(0);
  }

  searchEvents(page: number = 0) {
    const query = this.searchQuery();
    this.activePage.set(page);
    this.loading.set(true);
    const url = apiUrl(`/event/search?page=${page}&q=${query}`);
    this.http.get<IEvents>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);
        const pagesArray = Array.from({ length: response.page.totalPages }, (_, i) => i);
        this.pages.set(pagesArray);
        this.totalElements.set(response.page.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        this.loading.set(false);
      }
    });
  }

}
