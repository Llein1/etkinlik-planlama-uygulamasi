import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

export const notAuthGuard: CanActivateFn = (route, state) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  return http.get('http://localhost:8090/event/control', { withCredentials: true }).pipe(
    map(() => {
      router.navigate(['/events']);
      return false;
    }),
    catchError(() => {
      return of(true);
    })
  );
};
