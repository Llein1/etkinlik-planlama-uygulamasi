import { Component, signal, OnDestroy, inject, ElementRef, Renderer2, HostListener, viewChild } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FavoriteComponent } from '../shared/favorite/favorite';
import { Event, IEvents } from '../../models/IEvents';
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
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private renderer = inject(Renderer2);

  searchQuery = signal('');
  sort = signal('');
  statusFilter = signal('');
  
  sortOpen = signal(false);
  statusOpen = signal(false);

  // HTML'den referans aldığımız DOM elemanları
  statusControlRef = viewChild<ElementRef<HTMLElement>>('statusControl');
  statusMenuRef = viewChild<ElementRef<HTMLElement>>('statusMenu');
  sortControlRef = viewChild<ElementRef<HTMLElement>>('sortControl');
  sortMenuRef = viewChild<ElementRef<HTMLElement>>('sortMenu');

  // Menüleri eski yerine koymak için yer tutucular
  private statusPlaceholder: Comment;
  private sortPlaceholder: Comment;

  eventArray = signal<Event[]>([]);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  loading = signal<boolean>(false);
  totalElements = signal<number>(0);

  constructor() {
    // DOM'da görünmeyen yer tutucu yorum satırları oluşturuyoruz
    this.statusPlaceholder = this.renderer.createComment('status-menu-placeholder');
    this.sortPlaceholder = this.renderer.createComment('sort-menu-placeholder');

    this.route.queryParams.subscribe(params => {
      const query = (params['q'] ?? '').toString();
      const sortParam = (params['sort'] ?? '').toString();
      const statusParam = this.normalizeStatusValue((params['status'] ?? '').toString());
      
      this.searchQuery.set(query);
      this.sort.set(sortParam);
      this.statusFilter.set(statusParam || 'default');
      this.searchEvents(0);
    });
  }

  // Dışarı tıklamayı yakalayan Angular dinleyicisi
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const statusCtrl = this.statusControlRef()?.nativeElement;
    const statusMenu = this.statusMenuRef()?.nativeElement;
    if (this.statusOpen() && statusCtrl && statusMenu && !statusCtrl.contains(target) && !statusMenu.contains(target)) {
      this.statusOpen.set(false);
      this.closeMenuFromBody(statusCtrl, statusMenu, this.statusPlaceholder);
    }

    const sortCtrl = this.sortControlRef()?.nativeElement;
    const sortMenu = this.sortMenuRef()?.nativeElement;
    if (this.sortOpen() && sortCtrl && sortMenu && !sortCtrl.contains(target) && !sortMenu.contains(target)) {
      this.sortOpen.set(false);
      this.closeMenuFromBody(sortCtrl, sortMenu, this.sortPlaceholder);
    }
  }

  searchEvents(page: number = 0) {
    const query = encodeURIComponent(this.searchQuery());
    const sortParam = this.sort();
    const statusParam = this.getStatusApiValue(this.statusFilter());
    this.activePage.set(page);
    this.loading.set(true);
    
    const url = apiUrl(`/event/search?page=${page}&q=${query}${sortParam ? '&sort=' + sortParam : ''}${statusParam ? '&status=' + statusParam : ''}`);
    
    this.http.get<IEvents>(url, { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);
        this.pages.set(Array.from({ length: response.page.totalPages }, (_, i) => i));
        this.totalElements.set(response.page.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error fetching events:', error);
        this.loading.set(false);
      }
    });
  }

  toggleStatusMenu() {
    const willOpen = !this.statusOpen();
    this.statusOpen.set(willOpen);
    
    const controlEl = this.statusControlRef()?.nativeElement;
    const menuEl = this.statusMenuRef()?.nativeElement;
    
    if (controlEl && menuEl) {
      if (willOpen) {
        if (this.sortOpen()) this.toggleSortMenu();
        this.openMenuInBody(controlEl, menuEl, this.statusPlaceholder);
      } else {
        this.closeMenuFromBody(controlEl, menuEl, this.statusPlaceholder);
      }
    }
  }

  toggleSortMenu() {
    const willOpen = !this.sortOpen();
    this.sortOpen.set(willOpen);

    const controlEl = this.sortControlRef()?.nativeElement;
    const menuEl = this.sortMenuRef()?.nativeElement;

    if (controlEl && menuEl) {
      if (willOpen) {
        if (this.statusOpen()) this.toggleStatusMenu();
        this.openMenuInBody(controlEl, menuEl, this.sortPlaceholder);
      } else {
        this.closeMenuFromBody(controlEl, menuEl, this.sortPlaceholder);
      }
    }
  }

  private openMenuInBody(controlEl: HTMLElement, menuEl: HTMLElement, placeholder: Comment) {
    // DÜZELTME: Sadece direct parent document.body ise durdur.
    if (menuEl.parentNode === document.body) return;

    const rect = controlEl.getBoundingClientRect();
    
    this.renderer.insertBefore(controlEl, placeholder, menuEl);
    this.renderer.appendChild(document.body, menuEl);

    this.renderer.setStyle(menuEl, 'position', 'absolute');
    this.renderer.setStyle(menuEl, 'top', `${rect.bottom + 8 + window.scrollY}px`);
    this.renderer.setStyle(menuEl, 'left', `${rect.left + window.scrollX}px`);
    this.renderer.setStyle(menuEl, 'min-width', `${rect.width}px`);
    
    // Menü body'e başarıyla taşınacağı için 1050 fazlasıyla yetecektir
    this.renderer.setStyle(menuEl, 'z-index', '1050'); 
  }

  private closeMenuFromBody(controlEl: HTMLElement, menuEl: HTMLElement, placeholder: Comment) {
    // DÜZELTME: Sadece direct parent document.body ise geri al.
    if (menuEl.parentNode === document.body) {
      this.renderer.insertBefore(controlEl, menuEl, placeholder);
      this.renderer.removeChild(controlEl, placeholder);
      
      this.renderer.removeStyle(menuEl, 'position');
      this.renderer.removeStyle(menuEl, 'top');
      this.renderer.removeStyle(menuEl, 'left');
      this.renderer.removeStyle(menuEl, 'min-width');
      this.renderer.removeStyle(menuEl, 'z-index');
    }
  }

  selectStatus(value: string) {
    this.statusFilter.set(this.normalizeStatusValue(value));
    this.updateRouteAndSearch();
    this.toggleStatusMenu();
  }

  selectSort(value: string) {
    this.sort.set(value);
    this.updateRouteAndSearch();
    this.toggleSortMenu();
  }

  private updateRouteAndSearch() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { 
        q: this.searchQuery() || null, 
        sort: this.sort() || null, 
        status: this.getStatusApiValue(this.statusFilter()) || null 
      },
      queryParamsHandling: 'merge'
    });
    this.searchEvents(0);
  }

  onFavoriteToggled(item: Event, newState: boolean) {
    this.eventArray.update(events => events.map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev));
  }

  ngOnDestroy() {
    const statusCtrl = this.statusControlRef()?.nativeElement;
    const statusMenu = this.statusMenuRef()?.nativeElement;
    if (statusCtrl && statusMenu) this.closeMenuFromBody(statusCtrl, statusMenu, this.statusPlaceholder);

    const sortCtrl = this.sortControlRef()?.nativeElement;
    const sortMenu = this.sortMenuRef()?.nativeElement;
    if (sortCtrl && sortMenu) this.closeMenuFromBody(sortCtrl, sortMenu, this.sortPlaceholder);
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = { 'PUBLISHED': 'Yayında', 'STOPPED': 'Yayın Durduruldu', 'ARCHIVED': 'Arşivlendi' };
    return statusMap[status] || status;
  }

  getStatusVariant(status: string): string {
    const variantMap: Record<string, string> = { 'PUBLISHED': 'published', 'STOPPED': 'paused', 'PAUSED': 'paused', 'ARCHIVED': 'archived' };
    return variantMap[status.toUpperCase()] || 'published';
  }

  getStatusFilterLabel(status: string): string {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'default') return 'Varsayılan';
    if (normalized === 'published') return 'Yayında';
    if (normalized === 'paused' || normalized === 'stopped') return 'Yayın Durduruldu';
    if (normalized === 'archived') return 'Arşivlendi';
    return 'Tümü';
  }

  private normalizeStatusValue(value: string): string {
    const normalized = (value || '').toLowerCase();
    if (normalized === 'stopped') return 'paused';
    if (normalized === 'default') return 'default';
    if (['published', 'paused', 'archived'].includes(normalized)) return normalized;
    return '';
  }

  private getStatusApiValue(value: string): string {
    const normalized = this.normalizeStatusValue(value);
    return normalized === 'default' ? 'published' : normalized;
  }
}