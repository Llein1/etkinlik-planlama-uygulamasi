import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, inject, OnDestroy, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IEvents, Event } from '../../models/IEvents';
import { apiUrl } from '../shared/api-url';
import { TrDatePipe } from '../shared/tr-date.pipe';
import { TrTimePipe } from '../shared/tr-time.pipe';
import { FavoriteComponent } from '../shared/favorite/favorite';

declare const Swiper: any;

@Component({
  selector: 'app-events',
  imports: [RouterModule, TrDatePipe, TrTimePipe, FavoriteComponent],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events implements AfterViewInit, OnDestroy {

  private http = inject(HttpClient);
  private _swiper: any;
  eventArray = signal<Event[]>([]);
  featuredEvents = signal<Event[]>([]);
  selectedFeaturedIndex = signal<number>(0);
  pages = signal<number[]>([]);
  activePage = signal<number>(0);
  
  // YENİ EKLENEN KISIM: Başlangıç yüklemeleri
  loading = signal<boolean>(true);
  initialLoad = signal<boolean>(true);

  constructor() {
    console.log('Events component initialized');
  }

  ngOnInit() {
    this.fetchEvents(0);
  }

  ngAfterViewInit(): void {
    this.initHeroSwiper();
  }

  ngOnDestroy(): void {
    if ((this as any)._swiper && typeof (this as any)._swiper.destroy === 'function') {
      (this as any)._swiper.destroy(true, true);
    }
  }

  fetchEvents(page: number = 0) {
    this.activePage.set(page);
    this.loading.set(true);
    this.http.get<IEvents>(apiUrl(`/event/list?page=${page}`), { withCredentials: true }).subscribe({
      next: (response) => {
        this.eventArray.set(response.content);

        // İlk sayfa yüklendiğinde ve henüz vitrin seçilmemişse rastgele 4 etkinlik seç
        if (page === 0 && this.featuredEvents().length === 0) {
          const randomFeatured = this.getRandomEvents(response.content, 4);
          this.featuredEvents.set(randomFeatured);
          this.selectedFeaturedIndex.set(0);
        }

        const eventsArray = Array.from({ length: response.page.totalPages }, (_, i) => i);
        this.pages.set(eventsArray);
        
        // YENİ EKLENEN KISIM: Yüklemeleri sonlandır
        this.loading.set(false);
        this.initialLoad.set(false);

        this.scheduleHeroRefresh();
      },
      error: (error) => {
        alert('Etkinlikler yüklenirken hata oluştu: ' + (error.error?.message || 'Bilinmeyen hata'));
        this.loading.set(false);
        this.initialLoad.set(false);
      }
    });
  }

  // ... (Geri Kalan Tüm Fonksiyonlar Aynı Kalacak) ...
  selectFeaturedSlide(index: number) {
    this.selectedFeaturedIndex.set(index);
    if (this._swiper?.slideTo) {
      this._swiper.slideTo(index);
    }
  }

  onFavoriteToggled(item: Event, newState: boolean) {
    const updated = this.eventArray().map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev);
    this.eventArray.set(updated);
    const updatedFeatured = this.featuredEvents().map(ev => ev.id === item.id ? { ...ev, isFavorite: newState } : ev);
    this.featuredEvents.set(updatedFeatured);
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

  getThemeClass(index: number): string {
    return `events-hero-slide--theme-${index % 4}`;
  }

  private getRandomEvents(events: Event[], count: number): Event[] {
    const shuffled = [...events].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, events.length));
  }

  private initHeroSwiper(): void {
    try {
      const SwiperCtor = (window as any).Swiper || (globalThis as any).Swiper || Swiper;
      if (!SwiperCtor || !document.querySelector('.events-hero-swiper')) {
        return;
      }

      if (this._swiper) {
        this._swiper.destroy(true, true);
      }

      this._swiper = new SwiperCtor('.events-hero-swiper', {
        effect: 'coverflow',
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 40,
        speed: 800,
        watchOverflow: true,
        loop: false,
        grabCursor: true,
        slideToClickedSlide: true,
        navigation: {
          nextEl: '.events-hero__next',
          prevEl: '.events-hero__prev',
        },
        pagination: {
          el: '.events-hero__pagination',
          clickable: true,
        },
        coverflowEffect: {
          rotate: 22,
          stretch: 0,
          depth: 120,
          modifier: 1,
          slideShadows: false,
        },
        on: {
          slideChange: (swiper: any) => {
            const activeIndex = swiper.activeIndex ?? 0;
            this.selectedFeaturedIndex.set(activeIndex);
          }
        }
      });

      this._swiper.on?.('slideChange', () => {
        const activeIndex = this._swiper?.activeIndex ?? 0;
        this.selectedFeaturedIndex.set(activeIndex);
      });

      this.scheduleHeroRefresh();
    } catch (error) {
      console.warn('Hero swiper init failed:', error);
    }
  }

  private scheduleHeroRefresh(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.refreshHeroSwiper());
    });
  }

  private refreshHeroSwiper(): void {
    if (!this._swiper) {
      this.initHeroSwiper();
      return;
    }

    this._swiper.update?.();
    this._swiper.updateSize?.();
    this._swiper.updateSlides?.();
    this._swiper.updateProgress?.();
    this._swiper.pagination?.update?.();
    this._swiper.navigation?.update?.();
    this._swiper.slideTo?.(this.selectedFeaturedIndex(), 0, false);
  }
}