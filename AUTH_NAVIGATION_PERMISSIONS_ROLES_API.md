# Auth, Navigation, Permissions, and Roles API

This document describes the API endpoints in:

- `backend/backend/Controllers/AuthController.cs`
- `backend/backend/Controllers/NavigationController.cs`
- `backend/backend/Controllers/PermissionsController.cs`
- `backend/backend/Controllers/RolesController.cs`

## Common conventions

Base URL during local development:

```text
https://localhost:7230
```

JSON is used for request and response bodies.

Protected endpoints require a bearer access token:

```http
Authorization: Bearer <access-token>
```

Error responses generally use this shape:

```json
{
  "message": "Error message"
}
```

## Code structure

The backend follows a simple Controller-Service-DTO-Entity structure:

```text
backend/backend/
├── Controllers/
│   ├── AuthController.cs
│   ├── NavigationController.cs
│   ├── PermissionsController.cs
│   └── RolesController.cs
├── Services/
│   ├── IUserService.cs
│   ├── UserService.cs
│   ├── IRoleService.cs
│   ├── RoleService.cs
│   ├── Navigation/
│   │   ├── INavigationService.cs
│   │   └── NavigationService.cs
│   └── Permission/
│       ├── IPermissionService.cs
│       └── PermissionService.cs
├── Models/
│   ├── Data/
│   │   ├── AppUser.cs
│   │   ├── AppRole.cs
│   │   ├── AppPermission.cs
│   │   ├── AppRolePermission.cs
│   │   ├── AppUserRole.cs
│   │   └── AppPage.cs
│   └── Request/
│       ├── AuthDtos.cs
│       ├── NavigationDtos.cs
│       ├── PermissionDtos.cs
│       └── RoleDtos.cs
└── Data/
    └── AppDbContext.cs
```

## Class layer

The class layer contains database entities in `Models/Data` and request or response DTOs in `Models/Request`.

### Auth classes

`AppUser` stores account and authentication data.

```csharp
public class AppUser
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public string? TwoFactorSecret { get; set; }
    public int FailedLoginCount { get; set; }
    public DateTimeOffset? LockoutEndUtc { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public ICollection<AppUserRole> UserRoles { get; set; } = [];
}
```

Auth DTOs:

```csharp
public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class EnableTwoFactorRequest
{
    public string TwoFactorCode { get; set; } = string.Empty;
}

public class VerifyTwoFactorRequest
{
    public string ChallengeToken { get; set; } = string.Empty;
    public string TwoFactorCode { get; set; } = string.Empty;
}

public record LoginResponse(
    bool RequiresTwoFactor,
    string? AccessToken,
    string? ChallengeToken,
    DateTimeOffset? ExpiresAtUtc);

public record UserResponse(
    int Id,
    string Username,
    string Email);

public record MessageResponse(string Message);

public record TwoFactorSetupResponse(
    string Secret,
    string OtpAuthUri,
    string QrCodeDataUrl);
```

### Navigation classes

`AppPage` stores page and menu information.

```csharp
public class AppPage
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Route { get; set; }
    public string? Icon { get; set; }
    public int? ParentId { get; set; }
    public AppPage? Parent { get; set; }
    public ICollection<AppPage> Children { get; set; } = [];
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public int CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public int? UpdatedBy { get; set; }
    public ICollection<AppPermission> Permissions { get; set; } = [];
}
```

Navigation DTO:

```csharp
public record NavigationItemResponse(
    int Id,
    string Code,
    string Label,
    string? Route,
    string? Icon,
    int SortOrder,
    IReadOnlyList<NavigationItemResponse> Children);
```

### Permission classes

`AppPermission` stores permission actions for pages.

```csharp
public class AppPermission
{
    public int Id { get; set; }
    public int PageId { get; set; }
    public AppPage Page { get; set; } = null!;
    public required string Code { get; set; }
    public required string Action { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public int? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public int? UpdatedBy { get; set; }
    public ICollection<AppRolePermission> RolePermissions { get; set; } = [];
}
```

Permission DTOs:

```csharp
public class CreatePermissionRequest
{
    public int PageId { get; set; }
    public required string Action { get; set; }
    public string? Description { get; set; }
}

public class UpdatePermissionRequest
{
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public record PermissionResponse(
    int Id,
    int PageId,
    string PageCode,
    string PageName,
    string Code,
    string Action,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);
```

### Role classes

`AppRole` stores role information, and relationship classes connect users, roles, and permissions.

```csharp
public class AppRole
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public int CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAtUtc { get; set; }
    public int? UpdatedBy { get; set; }
    public ICollection<AppRolePermission> RolePermissions { get; set; } = [];
    public ICollection<AppUserRole> UserRoles { get; set; } = [];
}

public class AppRolePermission
{
    public int RoleId { get; set; }
    public AppRole Role { get; set; } = null!;
    public int PermissionId { get; set; }
    public AppPermission Permission { get; set; } = null!;
    public DateTimeOffset AssignedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public int? AssignedBy { get; set; }
}

public class AppUserRole
{
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int RoleId { get; set; }
    public AppRole Role { get; set; } = null!;
    public DateTimeOffset AssignedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public int AssignedBy { get; set; }
}
```

Role DTOs:

```csharp
public sealed class RoleQueryRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Status { get; set; }
    public string? Search { get; set; }
}

public class CreateRoleRequest
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
}

public class UpdateRoleRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public record RoleResponse(
    int Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset? UpdatedAtUtc);

public sealed record RolePageResponse(
    IReadOnlyList<RoleResponse> Items,
    int PageNumber,
    int PageSize,
    int TotalCount,
    int TotalPages,
    int TotalRoles,
    int ActiveRoles);
```

## Service layer

Controllers call service interfaces. Services contain business rules, database access, validation that depends on stored data, and response mapping.

### User service

```csharp
public interface IUserService
{
    Task<UserServiceResult<UserResponse>> RegisterAsync(
        RegisterRequest request,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task<UserServiceResult<LoginResponse>> LoginAsync(
        LoginRequest request,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task<UserServiceResult<TwoFactorSetupResponse>> SetupTwoFactorAsync(
        int userId,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task<UserServiceResult<MessageResponse>> EnableTwoFactorAsync(
        int userId,
        EnableTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task<UserServiceResult<LoginResponse>> VerifyTwoFactorLoginAsync(
        VerifyTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken);

    Task<UserServiceResult<MessageResponse>> DisableTwoFactorAsync(
        int userId,
        EnableTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken);
}
```

Implementation file:

```text
backend/backend/Services/UserService.cs
```

Used by:

```text
backend/backend/Controllers/AuthController.cs
```

### Navigation service

```csharp
public interface INavigationService
{
    Task<IReadOnlyList<NavigationItemResponse>>
        GetUserNavigationAsync(
            int userId,
            CancellationToken cancellationToken);
}
```

Implementation file:

```text
backend/backend/Services/Navigation/NavigationService.cs
```

Used by:

```text
backend/backend/Controllers/NavigationController.cs
```

### Permission service

```csharp
public interface IPermissionService
{
    Task<IReadOnlyList<PermissionResponse>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<PermissionResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken);

    Task<PermissionServiceResult<PermissionResponse>> CreateAsync(
        CreatePermissionRequest request,
        int actorUserId,
        CancellationToken cancellationToken);

    Task<PermissionServiceResult<PermissionResponse>> UpdateAsync(
        int id,
        UpdatePermissionRequest request,
        int actorUserId,
        CancellationToken cancellationToken);
}
```

Implementation file:

```text
backend/backend/Services/Permission/PermissionService.cs
```

Used by:

```text
backend/backend/Controllers/PermissionsController.cs
```

### Role service

```csharp
public interface IRoleService
{
    Task<RolePageResponse> GetPageAsync(
        RoleQueryRequest request,
        CancellationToken cancellationToken);

    Task<RoleResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken);

    Task<RoleServiceResult<RoleResponse>> CreateAsync(
        CreateRoleRequest request,
        int actorUserId,
        CancellationToken cancellationToken);

    Task<RoleServiceResult<RoleResponse>> UpdateAsync(
        int id,
        UpdateRoleRequest request,
        int actorUserId,
        CancellationToken cancellationToken);
}
```

Implementation file:

```text
backend/backend/Services/RoleService.cs
```

Used by:

```text
backend/backend/Controllers/RolesController.cs
```

## Controller layer

Controllers receive HTTP requests, read route/query/body parameters, call services, and convert service results to HTTP status codes.

Controller responsibilities:

| Controller | Route | Service | Main purpose |
|---|---|---|---|
| `AuthController` | `/api/auth` | `IUserService` | Register, login, and two-factor authentication |
| `NavigationController` | `/api/navigation` | `INavigationService` | Return navigation items for the authenticated user |
| `PermissionsController` | `/api/permissions` | `IPermissionService` | List, create, and update permissions |
| `RolesController` | `/api/roles` | `IRoleService` | List, create, and update roles |

Typical controller pattern:

```csharp
[ApiController]
[Route("api/example")]
public class ExampleController : ControllerBase
{
    private readonly IExampleService _exampleService;

    public ExampleController(IExampleService exampleService)
    {
        _exampleService = exampleService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreateExampleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _exampleService.CreateAsync(
            request,
            cancellationToken);

        return result.Succeeded
            ? Ok(result.Value)
            : BadRequest(new { message = result.Message });
    }
}
```

## Dependency injection

Services are registered in `backend/backend/Program.cs`:

```csharp
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<INavigationService, NavigationService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoleService, RoleService>();
```

## Auth API

Base route:

```text
/api/auth
```

### Register

Creates a new user account.

```http
POST /api/auth/register
```

Request body:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "Password123!"
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `username` | string | Yes | 3-100 characters |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | 8-128 characters |

Success response:

```http
201 Created
```

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com"
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `400 Bad Request` | Validation failed or registration failed |
| `409 Conflict` | Username or email already exists |

### Login

Authenticates a user with username and password.

```http
POST /api/auth/login
```

Request body:

```json
{
  "username": "admin",
  "password": "Password123!"
}
```

Request fields:

| Field | Type | Required |
|---|---|:---:|
| `username` | string | Yes |
| `password` | string | Yes |

Success response when two-factor authentication is not required:

```http
200 OK
```

```json
{
  "requiresTwoFactor": false,
  "accessToken": "<jwt-access-token>",
  "challengeToken": null,
  "expiresAtUtc": "2026-09-07T12:00:00+00:00"
}
```

Success response when two-factor authentication is required:

```json
{
  "requiresTwoFactor": true,
  "accessToken": null,
  "challengeToken": "<temporary-challenge-token>",
  "expiresAtUtc": "2026-09-07T12:00:00+00:00"
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Invalid username, password, or token |
| `423 Locked` | Account is temporarily locked |

Locked account response:

```json
{
  "message": "Account is locked.",
  "lockoutEndUtc": "2026-09-07T12:00:00+00:00"
}
```

### Setup Two-Factor Authentication

Starts two-factor authentication setup for the authenticated user.

```http
POST /api/auth/2fa/setup
Authorization: Bearer <access-token>
```

Success response:

```http
200 OK
```

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpAuthUri": "otpauth://totp/...",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Missing or invalid access token |

### Enable Two-Factor Authentication

Enables two-factor authentication after the user enters a valid authenticator code.

```http
POST /api/auth/2fa/enable
Authorization: Bearer <access-token>
```

Request body:

```json
{
  "twoFactorCode": "123456"
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `twoFactorCode` | string | Yes | Exactly 6 digits |

Success response:

```http
200 OK
```

```json
{
  "message": "Two-factor authentication enabled."
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `400 Bad Request` | Invalid two-factor code or setup is required |
| `401 Unauthorized` | Missing or invalid access token |
| `409 Conflict` | Two-factor authentication is already enabled |

### Verify Two-Factor Login

Completes a login that requires two-factor authentication.

```http
POST /api/auth/2fa/verify-login
```

Request body:

```json
{
  "challengeToken": "<temporary-challenge-token>",
  "twoFactorCode": "123456"
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `challengeToken` | string | Yes | Challenge token returned from login |
| `twoFactorCode` | string | Yes | Exactly 6 digits |

Success response:

```http
200 OK
```

```json
{
  "requiresTwoFactor": false,
  "accessToken": "<jwt-access-token>",
  "challengeToken": null,
  "expiresAtUtc": "2026-09-07T12:00:00+00:00"
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Invalid challenge token or two-factor code |

### Disable Two-Factor Authentication

Disables two-factor authentication for the authenticated user.

```http
POST /api/auth/2fa/disable
Authorization: Bearer <access-token>
```

Request body:

```json
{
  "twoFactorCode": "123456"
}
```

Success response:

```http
200 OK
```

```json
{
  "message": "Two-factor authentication disabled."
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Missing token, invalid token, or invalid two-factor code |

## Navigation API

Base route:

```text
/api/navigation
```

All navigation endpoints require authentication.

### Get My Navigation

Gets the navigation tree for the authenticated user.

```http
GET /api/navigation/me
Authorization: Bearer <access-token>
```

Success response:

```http
200 OK
```

```json
[
  {
    "id": 1,
    "code": "dashboard",
    "label": "Dashboard",
    "route": "/dashboard",
    "icon": "layout-dashboard",
    "sortOrder": 1,
    "children": []
  }
]
```

Response fields:

| Field | Type | Description |
|---|---|---|
| `id` | number | Navigation item ID |
| `code` | string | Unique page or menu code |
| `label` | string | Display label |
| `route` | string or null | Frontend route |
| `icon` | string or null | Icon name |
| `sortOrder` | number | Display order |
| `children` | array | Child navigation items |

Possible errors:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Missing or invalid access token |

## Permissions API

Base route:

```text
/api/permissions
```

### Get All Permissions

Gets all configured permissions.

```http
GET /api/permissions
```

Success response:

```http
200 OK
```

```json
[
  {
    "id": 1,
    "pageId": 10,
    "pageCode": "units",
    "pageName": "Units",
    "code": "units.view",
    "action": "view",
    "description": "View units",
    "isActive": true,
    "createdAtUtc": "2026-09-07T12:00:00+00:00",
    "updatedAtUtc": null
  }
]
```

### Get Permission By ID

Gets one permission by ID.

```http
GET /api/permissions/{id}
```

Route parameters:

| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `id` | number | Yes | Permission ID |

Success response:

```http
200 OK
```

```json
{
  "id": 1,
  "pageId": 10,
  "pageCode": "units",
  "pageName": "Units",
  "code": "units.view",
  "action": "view",
  "description": "View units",
  "isActive": true,
  "createdAtUtc": "2026-09-07T12:00:00+00:00",
  "updatedAtUtc": null
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `404 Not Found` | Permission was not found |

### Create Permission

Creates a permission for a page and action.

```http
POST /api/permissions
Authorization: Bearer <access-token>
```

Request body:

```json
{
  "pageId": 10,
  "action": "view",
  "description": "View units"
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `pageId` | number | Yes | Greater than or equal to 1 |
| `action` | string | Yes | Maximum 30 characters |
| `description` | string or null | No | Maximum 500 characters |

Success response:

```http
201 Created
```

```json
{
  "id": 1,
  "pageId": 10,
  "pageCode": "units",
  "pageName": "Units",
  "code": "units.view",
  "action": "view",
  "description": "View units",
  "isActive": true,
  "createdAtUtc": "2026-09-07T12:00:00+00:00",
  "updatedAtUtc": null
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `400 Bad Request` | Invalid action or inactive page |
| `401 Unauthorized` | Missing or invalid access token |
| `404 Not Found` | Page was not found |
| `409 Conflict` | Permission already exists |

### Update Permission

Updates a permission description and active state.

```http
PUT /api/permissions/{id}
Authorization: Bearer <access-token>
```

Route parameters:

| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `id` | number | Yes | Permission ID |

Request body:

```json
{
  "description": "View active units",
  "isActive": true
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `description` | string or null | No | Maximum 500 characters |
| `isActive` | boolean | Yes | `true` or `false` |

Success response:

```http
200 OK
```

```json
{
  "id": 1,
  "pageId": 10,
  "pageCode": "units",
  "pageName": "Units",
  "code": "units.view",
  "action": "view",
  "description": "View active units",
  "isActive": true,
  "createdAtUtc": "2026-09-07T12:00:00+00:00",
  "updatedAtUtc": "2026-09-07T12:30:00+00:00"
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `400 Bad Request` | Validation failed |
| `401 Unauthorized` | Missing or invalid access token |
| `404 Not Found` | Permission was not found |

## Roles API

Base route:

```text
/api/roles
```

All role endpoints require authentication.

### Get Role Page

Gets a paginated list of roles.

```http
GET /api/roles?pageNumber=1&pageSize=10&status=active&search=admin
Authorization: Bearer <access-token>
```

Query parameters:

| Parameter | Type | Required | Validation |
|---|---|:---:|---|
| `pageNumber` | number | No | Minimum 1, default 1 |
| `pageSize` | number | No | 1-100, default 10 |
| `status` | string or null | No | Status filter |
| `search` | string or null | No | Maximum 100 characters |

Success response:

```http
200 OK
```

```json
{
  "items": [
    {
      "id": 1,
      "code": "ADMIN",
      "name": "Administrator",
      "description": "Full system access",
      "isActive": true,
      "createdAtUtc": "2026-09-07T12:00:00+00:00",
      "updatedAtUtc": null
    }
  ],
  "pageNumber": 1,
  "pageSize": 10,
  "totalCount": 1,
  "totalPages": 1,
  "totalRoles": 1,
  "activeRoles": 1
}
```

### Get Role By ID

Gets one role by ID.

```http
GET /api/roles/{id}
Authorization: Bearer <access-token>
```

Route parameters:

| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `id` | number | Yes | Role ID |

Success response:

```http
200 OK
```

```json
{
  "id": 1,
  "code": "ADMIN",
  "name": "Administrator",
  "description": "Full system access",
  "isActive": true,
  "createdAtUtc": "2026-09-07T12:00:00+00:00",
  "updatedAtUtc": null
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Missing or invalid access token |
| `404 Not Found` | Role was not found |

### Create Role

Creates a role.

```http
POST /api/roles
Authorization: Bearer <access-token>
```

Request body:

```json
{
  "code": "MANAGER",
  "name": "Manager",
  "description": "Manager access"
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `code` | string | Yes | Maximum 50 characters |
| `name` | string | Yes | Maximum 100 characters |
| `description` | string or null | No | Maximum 500 characters |

Success response:

```http
201 Created
```

```json
{
  "id": 2,
  "code": "MANAGER",
  "name": "Manager",
  "description": "Manager access",
  "isActive": true,
  "createdAtUtc": "2026-09-07T12:00:00+00:00",
  "updatedAtUtc": null
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `400 Bad Request` | Validation failed |
| `401 Unauthorized` | Missing or invalid access token |
| `409 Conflict` | Role code already exists |

### Update Role

Updates a role.

```http
PUT /api/roles/{id}
Authorization: Bearer <access-token>
```

Route parameters:

| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `id` | number | Yes | Role ID |

Request body:

```json
{
  "name": "Manager",
  "description": "Updated manager access",
  "isActive": true
}
```

Request fields:

| Field | Type | Required | Validation |
|---|---|:---:|---|
| `name` | string | Yes | Maximum 100 characters |
| `description` | string or null | No | Maximum 500 characters |
| `isActive` | boolean | Yes | `true` or `false` |

Success response:

```http
200 OK
```

```json
{
  "id": 2,
  "code": "MANAGER",
  "name": "Manager",
  "description": "Updated manager access",
  "isActive": true,
  "createdAtUtc": "2026-09-07T12:00:00+00:00",
  "updatedAtUtc": "2026-09-07T12:30:00+00:00"
}
```

Possible errors:

| Status | Meaning |
|---|---|
| `400 Bad Request` | Validation failed |
| `401 Unauthorized` | Missing or invalid access token |
| `404 Not Found` | Role was not found |

## DTO Reference

### Auth DTOs

`RegisterRequest`

| Field | Type |
|---|---|
| `username` | string |
| `email` | string |
| `password` | string |

`LoginRequest`

| Field | Type |
|---|---|
| `username` | string |
| `password` | string |

`LoginResponse`

| Field | Type |
|---|---|
| `requiresTwoFactor` | boolean |
| `accessToken` | string or null |
| `challengeToken` | string or null |
| `expiresAtUtc` | datetime or null |

`EnableTwoFactorRequest`

| Field | Type |
|---|---|
| `twoFactorCode` | string |

`VerifyTwoFactorRequest`

| Field | Type |
|---|---|
| `challengeToken` | string |
| `twoFactorCode` | string |

`TwoFactorSetupResponse`

| Field | Type |
|---|---|
| `secret` | string |
| `otpAuthUri` | string |
| `qrCodeDataUrl` | string |

### Navigation DTOs

`NavigationItemResponse`

| Field | Type |
|---|---|
| `id` | number |
| `code` | string |
| `label` | string |
| `route` | string or null |
| `icon` | string or null |
| `sortOrder` | number |
| `children` | `NavigationItemResponse[]` |

### Permission DTOs

`CreatePermissionRequest`

| Field | Type |
|---|---|
| `pageId` | number |
| `action` | string |
| `description` | string or null |

`UpdatePermissionRequest`

| Field | Type |
|---|---|
| `description` | string or null |
| `isActive` | boolean |

`PermissionResponse`

| Field | Type |
|---|---|
| `id` | number |
| `pageId` | number |
| `pageCode` | string |
| `pageName` | string |
| `code` | string |
| `action` | string |
| `description` | string or null |
| `isActive` | boolean |
| `createdAtUtc` | datetime |
| `updatedAtUtc` | datetime or null |

### Role DTOs

`RoleQueryRequest`

| Field | Type |
|---|---|
| `pageNumber` | number |
| `pageSize` | number |
| `status` | string or null |
| `search` | string or null |

`CreateRoleRequest`

| Field | Type |
|---|---|
| `code` | string |
| `name` | string |
| `description` | string or null |

`UpdateRoleRequest`

| Field | Type |
|---|---|
| `name` | string |
| `description` | string or null |
| `isActive` | boolean |

`RoleResponse`

| Field | Type |
|---|---|
| `id` | number |
| `code` | string |
| `name` | string |
| `description` | string or null |
| `isActive` | boolean |
| `createdAtUtc` | datetime |
| `updatedAtUtc` | datetime or null |

`RolePageResponse`

| Field | Type |
|---|---|
| `items` | `RoleResponse[]` |
| `pageNumber` | number |
| `pageSize` | number |
| `totalCount` | number |
| `totalPages` | number |
| `totalRoles` | number |
| `activeRoles` | number |
