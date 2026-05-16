import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterModule, Router } from '@angular/router';
import { apiUrl } from '../../shared/api-url';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  private http = inject(HttpClient);
  private router = inject(Router);
  searchQuery = '';
  globalName = 'Kullanıcı';

  constructor() {
    const name = localStorage.getItem('name');
    if (name) {
      this.globalName = name;
    }
  }

  logout() {
    const answer = confirm('Çıkış yapmak istediğinize emin misiniz?');
    if (answer) {
      this.http.get(apiUrl('/user/logout'), { withCredentials: true }).subscribe({
        next: (response) => {
          localStorage.clear();
          this.globalName = 'Kullanıcı';
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Logout error:', error);
          alert('Çıkış yaparken hata oluştu. Lütfen tekrar deneyin.');
        }
      })
    }
  }  

  search() {
    const query = this.searchQuery.trim();
    this.router.navigate(['/event-search'], {
      queryParams: query ? { q: query } : {},
    });
  }
}
