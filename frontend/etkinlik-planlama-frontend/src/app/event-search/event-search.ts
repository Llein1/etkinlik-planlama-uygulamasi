import { Component, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FavoriteComponent } from '../shared/favorite/favorite';
import { Event, IEvents } from '../../models/IEvents';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../shared/api-url';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';

@Component({
  selector: 'app-event-search',
  imports: [CommonModule, RouterModule, FavoriteComponent, TrDatePipe, TrTimePipe],
  templateUrl: './event-search.html',
  styleUrl: './event-search.css',
})
export class EventSearch implements OnDestroy {

  searchQuery = signal('');
  sort = signal('');
  statusFilter = signal('');
  sortOpen = signal(false);
  statusOpen = signal(false);
  menuTop = signal<number | null>(null);
  menuLeft = signal<number | null>(null);
  menuWidth = signal<number | null>(null);
  statusMenuTop = signal<number | null>(null);
  statusMenuLeft = signal<number | null>(null);
  statusMenuWidth = signal<number | null>(null);
  private _menuHostParent?: Node | null;
  private _menuHostNextSibling?: Node | null;
  private _statusMenuHostParent?: Node | null;
  private _statusMenuHostNextSibling?: Node | null;
  private _docClickHandler?: EventListener;
  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  loading = signal<boolean>(false);
  totalElements = signal<number>(0);

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {
    this.route.queryParams.subscribe(params => {
      const query = (params['q'] ?? '').toString();
      const sortParam = (params['sort'] ?? '').toString();
      const statusParam = (params['status'] ?? '').toString();
      this.searchQuery.set(query);
      this.sort.set(sortParam);
      this.statusFilter.set(statusParam);
      console.log('Search query from URL:', query, 'sort:', sortParam, 'status:', statusParam);
      this.searchEvents(0);
    });
    this._docClickHandler = ((e: Event) => {
      try {
        const path = (e as any).composedPath ? (e as any).composedPath() : (e as any).path || [];
        const clickedInside = path.some((el: any) =>
          el && el.classList && el.classList.contains && (
            el.classList.contains('event-search-sort__control') ||
            el.classList.contains('event-search-filter__control')
          )
        );
        if (!clickedInside) {
          this.sortOpen.set(false);
          this.statusOpen.set(false);
        }
      } catch (err) {
        this.sortOpen.set(false);
        this.statusOpen.set(false);
      }
    }) as unknown as EventListener;
    if (this._docClickHandler) {
      window.addEventListener('click', this._docClickHandler);
    }
  }

  searchEvents(page: number = 0) {
    const query = encodeURIComponent(this.searchQuery());
    const sortParam = this.sort();
    const statusParam = this.statusFilter();
    this.activePage.set(page);
    this.loading.set(true);
    const url = apiUrl(`/event/search?page=${page}&q=${query}${sortParam ? '&sort=' + sortParam : ''}${statusParam ? '&status=' + statusParam : ''}`);
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

  onSortChange(value: string) {
    this.sort.set(value);
    const q = this.searchQuery() || null;
    const sortVal = value || null;
    const statusVal = this.statusFilter() || null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q, sort: sortVal, status: statusVal },
      queryParamsHandling: 'merge'
    });
    this.searchEvents(0);
  }

  onStatusChange(value: string) {
    this.statusFilter.set(value);
    const q = this.searchQuery() || null;
    const sortVal = this.sort() || null;
    const statusVal = value || null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: q, sort: sortVal, status: statusVal },
      queryParamsHandling: 'merge'
    });
    this.searchEvents(0);
  }

  toggleStatusMenu() {
    const willOpen = !this.statusOpen();
    this.statusOpen.set(willOpen);
    if (willOpen) {
      try {
        const el = document.querySelector('.event-search-filter__control') as HTMLElement | null;
        if (el) {
          const rect = el.getBoundingClientRect();
          this.statusMenuTop.set(rect.bottom + 8);
          this.statusMenuLeft.set(rect.left);
          this.statusMenuWidth.set(rect.width);

          const menuEl = document.querySelector('.event-search-filter__menu') as HTMLElement | null;
          if (menuEl && menuEl.parentNode !== document.body) {
            this._statusMenuHostParent = menuEl.parentNode;
            this._statusMenuHostNextSibling = menuEl.nextSibling;
            document.body.appendChild(menuEl);
            menuEl.style.top = (rect.bottom + 8) + 'px';
            menuEl.style.left = rect.left + 'px';
            menuEl.style.minWidth = rect.width + 'px';
          } else if (menuEl) {
            menuEl.style.top = (rect.bottom + 8) + 'px';
            menuEl.style.left = rect.left + 'px';
            menuEl.style.minWidth = rect.width + 'px';
          }
        } else {
          this.statusMenuTop.set(null);
          this.statusMenuLeft.set(null);
          this.statusMenuWidth.set(null);
        }
      } catch (err) {
        this.statusMenuTop.set(null);
        this.statusMenuLeft.set(null);
        this.statusMenuWidth.set(null);
      }
    } else {
      const menuEl = document.querySelector('.event-search-filter__menu') as HTMLElement | null;
      if (menuEl && this._statusMenuHostParent) {
        try {
          if (this._statusMenuHostNextSibling && this._statusMenuHostNextSibling.parentNode === this._statusMenuHostParent) {
            this._statusMenuHostParent.insertBefore(menuEl, this._statusMenuHostNextSibling);
          } else {
            this._statusMenuHostParent.appendChild(menuEl);
          }
        } catch (_) {}
        this._statusMenuHostParent = undefined;
        this._statusMenuHostNextSibling = undefined;
      }
    }
  }

  selectStatus(value: string) {
    this.onStatusChange(value);
    this.statusOpen.set(false);
  }

  toggleSortMenu() {
    const willOpen = !this.sortOpen();
    this.sortOpen.set(willOpen);
    if (willOpen) {
          // compute menu position relative to viewport so it can be fixed and not clipped 
      try {
        const el = document.querySelector('.event-search-sort__control') as HTMLElement | null;
        if (el) {
          const rect = el.getBoundingClientRect();
          this.menuTop.set(rect.bottom + 8); // 8px gap
          this.menuLeft.set(rect.left);
          this.menuWidth.set(rect.width);
              // move menu element to body so it's not clipped by parents
              const menuEl = document.querySelector('.event-search-sort__menu') as HTMLElement | null;
              if (menuEl && menuEl.parentNode !== document.body) {
                this._menuHostParent = menuEl.parentNode;
                this._menuHostNextSibling = menuEl.nextSibling;
                document.body.appendChild(menuEl);
                menuEl.style.top = (rect.bottom + 8) + 'px';
                menuEl.style.left = rect.left + 'px';
                menuEl.style.minWidth = rect.width + 'px';
              } else if (menuEl) {
                menuEl.style.top = (rect.bottom + 8) + 'px';
                menuEl.style.left = rect.left + 'px';
                menuEl.style.minWidth = rect.width + 'px';
              }
        } else {
          this.menuTop.set(null);
          this.menuLeft.set(null);
          this.menuWidth.set(null);
        }
      } catch (err) {
        this.menuTop.set(null);
        this.menuLeft.set(null);
        this.menuWidth.set(null);
      }
        } else {
          // closing: if we moved menu into body, restore it back to original place
          const menuEl = document.querySelector('.event-search-sort__menu') as HTMLElement | null;
          if (menuEl && this._menuHostParent) {
            try {
              if (this._menuHostNextSibling && this._menuHostNextSibling.parentNode === this._menuHostParent) {
                this._menuHostParent.insertBefore(menuEl, this._menuHostNextSibling);
              } else {
                this._menuHostParent.appendChild(menuEl);
              }
            } catch (_) {}
            this._menuHostParent = undefined;
            this._menuHostNextSibling = undefined;
          }
    }
  }

  selectSort(value: string) {
    this.onSortChange(value);
    this.sortOpen.set(false);
  }

  ngOnDestroy() {
    try {
      if (this._docClickHandler) {
        window.removeEventListener('click', this._docClickHandler);
      }
    } catch(_) {}
  }

  onFavoriteToggled(item: Event, newState: boolean) {
    const updated = this.eventArray().map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev);
    this.eventArray.set(updated);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'PUBLISHED': 'Yayında',
      'STOPPED': 'Yayın Durduruldu',
      'ARCHIVED': 'Arşivlendi'
    };
    return statusMap[status] || status;
  }

  getStatusVariant(status: string): string {
    const variantMap: Record<string, string> = {
      'PUBLISHED': 'published',
      'STOPPED': 'stopped',
      'ARCHIVED': 'archived'
    };
    return variantMap[status] || 'published';
  }
}
