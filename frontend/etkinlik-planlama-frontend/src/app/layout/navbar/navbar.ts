import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core'; // OnInit eklendi
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterModule, Router, NavigationEnd } from '@angular/router'; // NavigationEnd eklendi
import { filter } from 'rxjs'; // filter eklendi
import { apiUrl } from '../../shared/api-url';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {

  private http = inject(HttpClient);
  private notification = inject(NotificationService);
  public router = inject(Router);
  
  searchQuery = '';
  globalName = 'Kullanıcı';
  showLogoutModal = false;
  private _scrollHandler?: (e: Event) => void;

  constructor() {
    const name = localStorage.getItem('name');
    if (name) {
      this.globalName = name;
    }
  }

  ngOnInit() {
    // 1. DÜZELTME: Sayfa her değiştiğinde beklemeden Navbar'ı tepe moduna al
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.forceNavbarToTop();
    });

    requestAnimationFrame(() => this.updateNavbarState());
    this._scrollHandler = () => this.updateNavbarState();
    window.addEventListener('scroll', this._scrollHandler, { passive: true });
  }

  // Navbar sınıflarını anında sıfırlayan yardımcı metod
  private forceNavbarToTop() {
    try {
      const nav = document.querySelector('.app-navbar');
      if (nav) {
        nav.classList.add('app-navbar--at-top');
        nav.classList.remove('app-navbar--scrolled');
      }
      document.body.classList.add('navbar--at-top');
      document.body.classList.remove('navbar--scrolled');
    } catch (err) {}
  }

  private updateNavbarState() {
    try {
      const nav = document.querySelector('.app-navbar');
      if (!nav) return;
      if (window.scrollY && window.scrollY > 8) {
        nav.classList.remove('app-navbar--at-top');
        nav.classList.add('app-navbar--scrolled');
        document.body.classList.remove('navbar--at-top');
        document.body.classList.add('navbar--scrolled');
      } else {
        this.forceNavbarToTop();
      }
    } catch (err) {}
  }

  // Profil altındaki linklerden biri açıksa ana butonun "yanmasını" sağlayacak metod
  isProfileActive(): boolean {
    const url = this.router.url;
    return url.includes('/favorite-my') || 
           url.includes('/event-my') || 
           url.includes('/participant-my');
  }

  openLogoutModal() {
    this.showLogoutModal = true;
    document.body.classList.add('modal-open');
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
    document.body.classList.remove('modal-open');
  }

  logout() {
    this.closeLogoutModal();
    this.http.get(apiUrl('/user/logout'), { withCredentials: true }).subscribe({
      next: () => {
        localStorage.clear();
        this.globalName = 'Kullanıcı';
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.notification.error('Çıkış yaparken hata oluştu. Lütfen tekrar deneyin.');
      }
    });
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
    if (this._scrollHandler) {
      window.removeEventListener('scroll', this._scrollHandler as EventListener);
      this._scrollHandler = undefined;
    }
  }

  search() {
    const query = this.searchQuery.trim();
    this.router.navigate(['/event-search'], {
      queryParams: query ? { q: query } : {},
    });
  }
}