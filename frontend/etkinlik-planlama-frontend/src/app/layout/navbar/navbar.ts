import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterModule, Router } from '@angular/router';
import { apiUrl } from '../../shared/api-url';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnDestroy {

  private http = inject(HttpClient);
  private router = inject(Router);
  searchQuery = '';
  globalName = 'Kullanıcı';
  showLogoutModal = false;
  private _scrollHandler?: (e: Event) => void;

  constructor() {
    const name = localStorage.getItem('name');
    if (name) {
      this.globalName = name;
    }
    // initialize navbar appearance based on scroll position after view paints
    requestAnimationFrame(() => this.updateNavbarState());
    this._scrollHandler = () => this.updateNavbarState();
    window.addEventListener('scroll', this._scrollHandler, { passive: true });
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
        alert('Çıkış yaparken hata oluştu. Lütfen tekrar deneyin.');
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
        nav.classList.add('app-navbar--at-top');
        nav.classList.remove('app-navbar--scrolled');
        document.body.classList.add('navbar--at-top');
        document.body.classList.remove('navbar--scrolled');
      }
    } catch (err) {
      // ignore
    }
  }

  search() {
    const query = this.searchQuery.trim();
    this.router.navigate(['/event-search'], {
      queryParams: query ? { q: query } : {},
    });
  }
}
