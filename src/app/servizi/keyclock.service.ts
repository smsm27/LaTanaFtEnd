import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { ADDRESS_AUTHENTICATION_SERVER, REQUEST_LOGIN, CLIENT_ID } from '../servizi/costanti';

interface KeycloakResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class Keyclock{
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private jwtHelper = new JwtHelperService();

  constructor(private http: HttpClient) {
    this.checkToken();
  }

  private checkToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      this.currentUserSubject.next(decodedToken);
    }
  }

  login(username: string, password: string): Observable<boolean> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', CLIENT_ID)
      .set('username', username)
      .set('password', password);

    return this.http.post<KeycloakResponse>(ADDRESS_AUTHENTICATION_SERVER + REQUEST_LOGIN, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).pipe(
      map(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error('Login failed'));
      })
    );
  }

  refreshToken(): Observable<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.error('No refresh token found');
      return throwError(() => new Error('Refresh token not available'));
    }

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', CLIENT_ID)
      .set('refresh_token', refreshToken);

    return this.http.post<KeycloakResponse>(ADDRESS_AUTHENTICATION_SERVER + REQUEST_LOGIN, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    }).pipe(
      map(response => this.handleAuthResponse(response)),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.logout();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  private handleAuthResponse(response: KeycloakResponse): boolean {
    const { access_token, refresh_token } = response;
    const decodedToken = this.jwtHelper.decodeToken(access_token);
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    this.currentUserSubject.next(decodedToken);
    return true;
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUsernameFromToken(): string | null {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken.preferred_username || decodedToken.username;
    }
    return null;
  }

  checkAndRefreshToken(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    } else {
      return this.refreshToken();
    }
  }
}
