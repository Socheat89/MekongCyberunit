export interface RoleQueryRequest {
  pageNumber?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  isActive: boolean;
  permissionIds?: number[];
}

export interface UpdateRolePermissionsRequest {
  permissionIds: number[];
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  permissionIds?: number[];
}

export interface RolePageResponse {
  items: RoleResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  totalRoles: number;
  activeRoles: number;
}

export interface CreatePermissionRequest {
  pageId: number;
  action: string;
  description?: string;
}

export interface UpdatePermissionRequest {
  description?: string;
  isActive: boolean;
}

export interface PermissionResponse {
  id: number;
  pageId: number;
  pageCode: string;
  pageName: string;
  code: string;
  action: string;
  description?: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
}
