import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  RoleQueryRequest,
  RolePageResponse,
  RoleResponse,
  CreateRoleRequest,
  UpdateRoleRequest
} from '../models/role-permission.models';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly apiUrl = `${environment.apiUrl}/roles`;

  constructor(private http: HttpClient) {}

  getRoles(query?: RoleQueryRequest): Observable<RolePageResponse> {
    let params = new HttpParams();
    if (query?.pageNumber) params = params.set('pageNumber', query.pageNumber);
    if (query?.pageSize) params = params.set('pageSize', query.pageSize);
    if (query?.status) params = params.set('status', query.status);
    if (query?.search) params = params.set('search', query.search);

    return this.http.get<RolePageResponse>(this.apiUrl, { params });
  }

  getRoleById(id: number): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.apiUrl}/${id}`);
  }

  createRole(req: CreateRoleRequest): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.apiUrl, req);
  }

  updateRole(id: number, req: UpdateRoleRequest): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/${id}`, req);
  }
}
