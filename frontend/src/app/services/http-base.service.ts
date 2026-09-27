import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PagedResult, ApiResponse } from '../models/common.models';
import { LoadingService } from './loading.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class HttpBaseService {
  protected readonly http = inject(HttpClient);
  protected readonly loadingService = inject(LoadingService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly baseUrl = environment.apiUrl;

  /**
   * Performs an HTTP GET request with typed query params and response
   */
  get<T>(endpoint: string, params?: Record<string, any>, showLoading = false): Observable<T> {
    if (showLoading) this.loadingService.start();
    const httpParams = this.buildParams(params);
    const url = this.resolveUrl(endpoint);

    return this.http.get<T>(url, { params: httpParams }).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => {
        if (showLoading) this.loadingService.complete();
      })
    );
  }

  /**
   * Specialized GET for PagedResult responses
   */
  getPaged<T>(endpoint: string, params?: Record<string, any>, showLoading = false): Observable<PagedResult<T>> {
    return this.get<PagedResult<T>>(endpoint, params, showLoading);
  }

  /**
   * Performs an HTTP POST request
   */
  post<T>(endpoint: string, body: any = {}, showLoading = false): Observable<T> {
    if (showLoading) this.loadingService.start();
    const url = this.resolveUrl(endpoint);

    return this.http.post<T>(url, body).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => {
        if (showLoading) this.loadingService.complete();
      })
    );
  }

  /**
   * Performs an HTTP PUT request
   */
  put<T>(endpoint: string, body: any = {}, showLoading = false): Observable<T> {
    if (showLoading) this.loadingService.start();
    const url = this.resolveUrl(endpoint);

    return this.http.put<T>(url, body).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => {
        if (showLoading) this.loadingService.complete();
      })
    );
  }

  /**
   * Performs an HTTP DELETE request
   */
  delete<T>(endpoint: string, showLoading = false): Observable<T> {
    if (showLoading) this.loadingService.start();
    const url = this.resolveUrl(endpoint);

    return this.http.delete<T>(url).pipe(
      catchError(err => this.handleError(err)),
      finalize(() => {
        if (showLoading) this.loadingService.complete();
      })
    );
  }

  /**
   * Serializes arbitrary parameter objects into clean HttpParams,
   * discarding null, undefined, and empty string values.
   */
  protected buildParams(params?: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();
    if (!params) return httpParams;

    Object.keys(params).forEach(key => {
      const val = params[key];
      if (val !== undefined && val !== null && val !== '') {
        if (val instanceof Date) {
          httpParams = httpParams.set(key, val.toISOString());
        } else if (Array.isArray(val)) {
          val.forEach(item => {
            httpParams = httpParams.append(key, String(item));
          });
        } else {
          httpParams = httpParams.set(key, String(val));
        }
      }
    });

    return httpParams;
  }

  /**
   * Ensures the endpoint is prefixed with the base API url if relative
   */
  protected resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Centralized HTTP error handler extracting readable messages from backend responses
   */
  protected handleError(error: HttpErrorResponse): Observable<never> {
    let errorMsg = 'An unexpected server error occurred. Please try again.';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMsg = error.error;
      } else if (error.error.message) {
        errorMsg = error.error.message;
      } else if (error.error.errors && typeof error.error.errors === 'object') {
        // ASP.NET ModelState validation dictionary
        const messages = Object.values(error.error.errors).flat();
        if (messages.length > 0) {
          errorMsg = messages.join('. ');
        }
      } else if (error.error.title) {
        errorMsg = error.error.title;
      }
    } else if (error.status === 403) {
      errorMsg = 'Access Denied: You do not have permission to perform this action.';
    } else if (error.status === 401) {
      errorMsg = 'Session expired. Please log in again.';
    } else if (error.status === 404) {
      errorMsg = 'Requested resource was not found.';
    } else if (error.status === 0) {
      errorMsg = 'Unable to connect to the backend server. Check your network or server status.';
    }

    // Surface toast notification for 400, 403, and 500 errors
    if (error.status >= 400) {
      this.notificationService.error(
        error.status === 403 ? 'Forbidden' : 'Request Failed',
        errorMsg
      );
    }

    return throwError(() => new Error(errorMsg));
  }
}
