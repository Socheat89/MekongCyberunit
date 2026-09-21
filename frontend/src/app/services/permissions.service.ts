import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PermissionResponse,
  CreatePermissionRequest,
  UpdatePermissionRequest
} from '../models/role-permission.models';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {
  private readonly apiUrl = `${environment.apiUrl}/permissions`;

  readonly myPermissionCodes = signal<string[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<PermissionResponse[]> {
    return this.http.get<PermissionResponse[]>(this.apiUrl);
  }

  getMyPermissions(forceRefresh = false): Observable<string[]> {
    if (!forceRefresh && this.myPermissionCodes().length > 0) {
      return of(this.myPermissionCodes());
    }

    return this.http.get<string[]>(`${this.apiUrl}/me`).pipe(
      tap(codes => this.myPermissionCodes.set(codes || [])),
      catchError(() => {
        this.myPermissionCodes.set([]);
        return of([]);
      })
    );
  }

  getById(id: number): Observable<PermissionResponse> {
    return this.http.get<PermissionResponse>(`${this.apiUrl}/${id}`);
  }

  create(req: CreatePermissionRequest): Observable<PermissionResponse> {
    return this.http.post<PermissionResponse>(this.apiUrl, req);
  }

  update(id: number, req: UpdatePermissionRequest): Observable<PermissionResponse> {
    return this.http.put<PermissionResponse>(`${this.apiUrl}/${id}`, req);
  }
}
