import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Keyclock } from './servizi/keyclock.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private keycloakService: Keyclock,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {

    // Se l'utente è già autenticato con un token valido
    if (this.keycloakService.isAuthenticated()) {
      return true;
    }

    // Prova a fare refresh del token se esiste
    return this.keycloakService.checkAndRefreshToken().pipe(
      map(success => {
        if (success) {
          return true;
        } else {
          this.redirectToLogin(state);
          return false;
        }
      }),
      catchError(error => {
        this.redirectToLogin(state);
        return of(false);
      })
    );
  }

  private redirectToLogin(state: RouterStateSnapshot): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
