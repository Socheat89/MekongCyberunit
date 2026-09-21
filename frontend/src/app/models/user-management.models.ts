export interface UserDto {
  id: number;
  username: string;
  email: string;
  roles: string[];
  roleIds: number[];
  directPermissionIds: number[];
  effectivePermissions: string[];
  isActive: boolean;
  createdAtUtc: string;
}

export interface CreateUserWithRolesRequest {
  username: string;
  email: string;
  password: string;
  roleIds: number[];
  directPermissionIds?: number[];
}

export interface UpdateUserRolesRequest {
  roleIds: number[];
  directPermissionIds?: number[];
}
