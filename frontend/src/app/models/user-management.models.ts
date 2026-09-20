export interface UserDto {
  id: number;
  username: string;
  email: string;
  roles: string[];
  roleIds: number[];
  isActive: boolean;
  createdAtUtc: string;
}

export interface CreateUserWithRolesRequest {
  username: string;
  email: string;
  password: string;
  roleIds: number[];
}

export interface UpdateUserRolesRequest {
  roleIds: number[];
}
