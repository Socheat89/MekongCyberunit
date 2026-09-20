import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  getAll(): Observable<PermissionResponse[]> {
    return this.http.get<PermissionResponse[]>(this.apiUrl);
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
