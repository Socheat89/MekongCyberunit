import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  UserDto,
  CreateUserWithRolesRequest,
  UpdateUserRolesRequest
} from '../models/user-management.models';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  createUser(request: CreateUserWithRolesRequest): Observable<UserDto> {
    return this.http.post<UserDto>(this.apiUrl, request);
  }

  updateRoles(userId: number, request: UpdateUserRolesRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${userId}/roles`, request);
  }

  toggleStatus(userId: number): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/${userId}/status`, {});
  }
}
