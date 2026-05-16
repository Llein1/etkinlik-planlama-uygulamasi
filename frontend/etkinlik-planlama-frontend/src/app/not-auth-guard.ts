import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { apiUrl } from './shared/api-url';

export const notAuthGuard: CanActivateFn = (route, state) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get(apiUrl('/event/control'), { withCredentials: true }).pipe(
    map(() => {
      router.navigate(['/events']);
      return false;
    }),
    catchError(() => {
      return of(true);
    })
  );
};
