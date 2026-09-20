# Frontend Login Setup and Navigation

This document confirms the current Angular login implementation and how it connects to the ASP.NET backend authentication, tenant, and navigation APIs.

## Confirmed Local Setup

| Area | Current code |
| --- | --- |
| Angular auth service | `frontend/src/app/login/auth.service.ts` |
| Login screen logic | `frontend/src/app/login/login.ts` |
| 2FA setup screen | `frontend/src/app/two-factor-setup/two-factor-setup.ts` |
| JWT interceptor | `frontend/src/app/login/auth.interceptor.ts` |
| Auth-only route guard | `frontend/src/app/login/auth.guard.ts` |
| Permission/page route guard | `frontend/src/app/login/page-access.guard.ts` |
| Angular routes | `frontend/src/app/app-routing-module.ts` |
| Sidebar navigation API client | `frontend/src/app/layout/app-sidebar/navigation.service.ts` |
| Sidebar rendering logic | `frontend/src/app/layout/app-sidebar/app-sidebar.ts` |
| Tenant selection API client | `frontend/src/app/tenancy/tenant.service.ts` |
| Header tenant/logout logic | `frontend/src/app/layout/app-header/app-header.ts` |
| Backend auth controller | `backend/backend/Controllers/AuthController.cs` |
| Backend navigation controller | `backend/backend/Controllers/NavigationController.cs` |
| Backend tenant controller | `backend/backend/Controllers/TenantsController.cs` |

The frontend currently calls the backend at:

```ts
http://localhost:5246
```

This matches the backend `http` launch profile in `backend/backend/Properties/launchSettings.json`. The `https` launch profile also exposes `http://localhost:5246` and `https://localhost:7230`.

This value appears in `AuthService`, `NavigationService`, `TenantService`, and the auth interceptor. If the backend port changes, update all of those locations or introduce a shared environment value.

Angular is expected to run at:

```ts
http://localhost:4200
```

That origin is allowed by CORS in `backend/backend/Program.cs`.

## Login Flow

The login page uses `Login.signIn()` in `frontend/src/app/login/login.ts`.

1. User opens `/login`.
2. User enters associate ID and password.
3. Frontend posts credentials to:

```http
POST http://localhost:5246/api/auth/login
```

Request body:

```json
{
  "username": "cashier01",
  "password": "Password123!"
}
```

The frontend maps `credentials.associateId` to backend field `username`.

## Login Response Cases

### User Has Not Enabled 2FA

Backend response:

```json
{
  "requiresTwoFactor": false,
  "accessToken": "jwt-access-token",
  "challengeToken": null,
  "expiresAtUtc": "2026-09-14T10:30:00Z"
}
```

Frontend behavior:

1. Saves `accessToken` in `sessionStorage` as `access_token`.
2. Redirects to `/2fa-setup`.
3. Calls protected 2FA setup endpoints using the saved token.

This is implemented in:

```ts
AuthService.saveAccessToken(response.accessToken);
router.navigate(['/2fa-setup']);
```

### User Already Enabled 2FA

Backend response:

```json
{
  "requiresTwoFactor": true,
  "accessToken": null,
  "challengeToken": "jwt-2fa-challenge-token",
  "expiresAtUtc": "2026-09-14T10:20:00Z"
}
```

Frontend behavior:

1. Does not save an access token yet.
2. Stores the temporary `challengeToken` inside the login component.
3. Shows the six-digit OTP form.
4. Posts the OTP to:

```http
POST http://localhost:5246/api/auth/2fa/verify-login
```

Request body:

```json
{
  "challengeToken": "jwt-2fa-challenge-token",
  "twoFactorCode": "123456"
}
```

On success, the frontend saves the final `accessToken` and redirects to `/dashboard`.

## First-Time 2FA Setup

The setup page is served at:

```text
/2fa-setup
```

`TwoFactorSetup.ngOnInit()` calls:

```http
POST http://localhost:5246/api/auth/2fa/setup
Authorization: Bearer <access-token>
```

The auth interceptor adds the authorization header automatically.

Success response:

```json
{
  "secret": "BASE32SECRET",
  "otpAuthUri": "otpauth://totp/...",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

The page displays `qrCodeDataUrl` for scanning in an authenticator app. After the user enters a valid six-digit code, the page calls:

```http
POST http://localhost:5246/api/auth/2fa/enable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "twoFactorCode": "123456"
}
```

On success, the frontend redirects to `/dashboard`.

## Token Storage and Authorization Header

`AuthService` stores the JWT access token in session storage:

```ts
sessionStorage.setItem('access_token', token);
```

`authInterceptor` reads this token and only attaches it to requests whose URL starts with:

```ts
http://localhost:5246/api/
```

For authenticated backend API calls, it sends:

```http
Authorization: Bearer <access-token>
```

If a tenant has been selected, it also sends:

```http
X-Tenant-Id: <tenant-id>
```

The selected tenant is stored in session storage as:

```text
active_tenant_id
```

Logout clears:

- `access_token`
- `active_tenant_id`
- cached navigation
- tenant signals

The logout flow is implemented in `AppHeader.logout()`.

## Route Setup

Current routes are declared in `frontend/src/app/app-routing-module.ts`.

Public routes:

| Route | Component |
| --- | --- |
| `/login` | `Login` |
| `/2fa-setup` | `TwoFactorSetup` |
| `/forbidden` | `Forbidden` |

Layout routes:

| Route | Guard | Page code | Component |
| --- | --- | --- | --- |
| `/dashboard` | none | none | `Dashboard` |
| `/profile` | `authGuard` | none | `Profile` |
| `/units` | `pageAccessGuard` | `UNIT` | `UnitList` |
| `/categories` | `pageAccessGuard` | `CATEGORY` | `CategoryList` |
| `/ingredients` | `pageAccessGuard` | `INGREDIENT` | `IngredientList` |
| `/tenants` | `pageAccessGuard` | `TENANT` | `TenantList` |

Default redirects:

```text
empty path -> /login
unknown path -> /login
```

## Auth Guard

`authGuard` checks only whether an access token exists:

```ts
authService.isAuthenticated()
```

If no token exists, the user is redirected to `/login`.

Use this guard for pages that require login but do not require a backend navigation permission check.

## Page Access Guard

`pageAccessGuard` is used for permission-protected pages.

It performs this sequence:

1. Checks that `access_token` exists.
2. Reads `data.pageCode` from the Angular route.
3. Calls `NavigationService.getNavigation()`.
4. `NavigationService` first ensures a tenant is selected through `TenantService.ensureSelected()`.
5. `TenantService.ensureSelected()` calls:

```http
GET http://localhost:5246/api/tenants/me
Authorization: Bearer <access-token>
```

6. After tenant selection, `NavigationService` calls:

```http
GET http://localhost:5246/api/navigation/me
Authorization: Bearer <access-token>
X-Tenant-Id: <tenant-id>
```

7. The guard checks whether the returned navigation tree contains the requested `pageCode`.
8. If the page code exists, the route is allowed.
9. If it does not exist, the user is redirected to `/forbidden`.
10. If the API returns `401`, the user is redirected to `/login`.

## Sidebar Navigation

`AppSidebar` loads the current user's backend navigation through `NavigationService.getNavigation()`.

Backend endpoint:

```http
GET /api/navigation/me
```

Backend controller:

```csharp
[Route("api/navigation")]
[Authorize]
public sealed class NavigationController : ControllerBase
```

Response model:

```ts
export interface NavigationItem {
  id: number;
  code: string;
  label: string;
  route: string | null;
  icon: string | null;
  sortOrder: number;
  children: NavigationItem[];
}
```

The sidebar treats a top-level navigation item with code `SETTINGS` as a special expandable group. Other top-level items render as primary sidebar links.

## Adding a New Protected Frontend Page

To add a new permission-protected page:

1. Create the Angular page component.
2. Add a route in `app-routing-module.ts`.
3. Use `AppLayout` as the route component.
4. Add `canActivate: [pageAccessGuard]`.
5. Add `data: { pageCode: 'YOUR_PAGE_CODE' }`.
6. Make sure the backend has an active `AppPage` with the same code.
7. Make sure the user has a role with `VIEW` permission for that page.

Example:

```ts
{
  path: 'reports',
  component: AppLayout,
  canActivate: [pageAccessGuard],
  data: { pageCode: 'REPORT' },
  children: [
    {
      path: '',
      component: ReportList
    }
  ]
}
```

Backend navigation must return a matching item:

```json
{
  "id": 10,
  "code": "REPORT",
  "label": "Reports",
  "route": "/reports",
  "icon": "bar_chart",
  "sortOrder": 40,
  "children": []
}
```

If `REPORT` is not returned by `/api/navigation/me`, direct navigation to `/reports` will redirect to `/forbidden`.

## Implementation Checklist

- Confirm backend is running on `http://localhost:5246`.
- Confirm Angular is running on the port allowed by backend CORS, usually `http://localhost:4200`.
- Confirm `AuthService.apiUrl`, `NavigationService.apiUrl`, `TenantService.apiUrl`, and `authInterceptor.API_URL` use the same backend base URL.
- Confirm login sends `{ username, password }`.
- Confirm first-time users receive `requiresTwoFactor: false` and an `accessToken`.
- Confirm first-time users are redirected to `/2fa-setup`.
- Confirm 2FA-enabled users receive `requiresTwoFactor: true` and a `challengeToken`.
- Confirm OTP login calls `/api/auth/2fa/verify-login`.
- Confirm `access_token` exists in `sessionStorage` after successful login.
- Confirm protected API requests include `Authorization`.
- Confirm tenant-aware requests include `X-Tenant-Id`.
- Confirm protected routes use the correct `data.pageCode`.
- Confirm backend navigation returns the same page code used by the route.
- Confirm logout clears auth, tenant, and navigation state.
