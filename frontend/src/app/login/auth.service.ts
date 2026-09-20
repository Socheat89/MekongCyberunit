import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserResponse,
  TwoFactorSetupResponse,
  VerifyTwoFactorRequest,
  EnableTwoFactorRequest,
  MessageResponse
} from '../models/auth.models';

export interface DecodedUser {
  id?: number;
  username?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = environment.tokenKey;

  readonly accessToken = signal<string | null>(this.getStoredToken());
  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly currentUser = signal<DecodedUser | null>(this.parseTokenUser(this.getStoredToken()));

  constructor(private http: HttpClient) {}

  getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(this.tokenKey);
    }
    return null;
  }

  saveAccessToken(token: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(this.tokenKey, token);
    }
    this.accessToken.set(token);
    this.currentUser.set(this.parseTokenUser(token));
  }

  clearToken(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(this.tokenKey);
    }
    this.accessToken.set(null);
    this.currentUser.set(null);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (!res.requiresTwoFactor && res.accessToken) {
          this.saveAccessToken(res.accessToken);
        }
      })
    );
  }

  verifyTwoFactorLogin(req: VerifyTwoFactorRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/2fa/verify-login`, req).pipe(
      tap(res => {
        if (res.accessToken) {
          this.saveAccessToken(res.accessToken);
        }
      })
    );
  }

  setupTwoFactor(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>(`${this.apiUrl}/2fa/setup`, {});
  }

  enableTwoFactor(req: EnableTwoFactorRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/2fa/enable`, req);
  }

  disableTwoFactor(req: EnableTwoFactorRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/2fa/disable`, req);
  }

  register(req: RegisterRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/register`, req);
  }

  logout(): void {
    this.clearToken();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(environment.tenantKey);
    }
  }

  private parseTokenUser(token: string | null): DecodedUser | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsed = JSON.parse(jsonPayload);
      
      const roles: string[] = [];
      const roleClaim = parsed['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || parsed['role'] || parsed['roles'];
      if (Array.isArray(roleClaim)) {
        roles.push(...roleClaim);
      } else if (typeof roleClaim === 'string') {
        roles.push(roleClaim);
      }

      const id = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || parsed['sub'];
      const username = parsed['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || parsed['name'] || parsed['username'] || 'User';

      return {
        id: id ? parseInt(id, 10) : undefined,
        username: username,
        roles
      };
    } catch {
      return null;
    }
  }
}
