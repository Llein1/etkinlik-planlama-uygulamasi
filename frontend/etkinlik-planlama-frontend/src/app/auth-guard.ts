import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get('http://localhost:8090/event/control', { withCredentials: true }).pipe(
    map(() => true),
    catchError(() => {
      localStorage.clear();
      router.navigate(['/']);
      return of(false);
    })
  );
};
