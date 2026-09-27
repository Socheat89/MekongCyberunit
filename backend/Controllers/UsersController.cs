using System.Security.Claims;
using backend.Data;
using backend.Models.Data;
using backend.Modules.Audit.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OtpNet;

namespace backend.Controllers;

public record UserDto(
    int Id,
    string Username,
    string Email,
    IReadOnlyList<string> Roles,
    IReadOnlyList<int> RoleIds,
    IReadOnlyList<int> DirectPermissionIds,
    IReadOnlyList<string> EffectivePermissions,
    bool IsActive,
    bool TwoFactorEnabled,
    DateTimeOffset CreatedAtUtc);

public class CreateUserWithRolesRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public List<int> RoleIds { get; set; } = [];
    public List<int> DirectPermissionIds { get; set; } = [];
}

public class UpdateUserRolesRequest
{
    public List<int> RoleIds { get; set; } = [];
    public List<int> DirectPermissionIds { get; set; } = [];
}

[ApiController]
[Route("api/users")]
[Authorize("FullAuth")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditService _auditService;
    private readonly PasswordHasher<AppUser> _passwordHasher = new();

    public UsersController(AppDbContext context, IAuditService auditService)
    {
        _context = context;
        _auditService = auditService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        if (!await IsAdminOrHasPermissionAsync("users.view", cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to view users." });
        }

        var users = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.UserPermissions)
            .ThenInclude(up => up.Permission)
            .OrderBy(u => u.Id)
            .ToListAsync(cancellationToken);

        var allPermissions = await _context.Permissions
            .Where(p => p.IsActive)
            .ToListAsync(cancellationToken);

        var allRolePermissions = await _context.RolePermissions
            .Include(rp => rp.Permission)
            .ToListAsync(cancellationToken);

        var result = new List<UserDto>();
        foreach (var user in users)
        {
            var dto = MapToUserDto(user, allPermissions, allRolePermissions);
            result.Add(dto);
        }

        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserWithRolesRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsAdminOrHasPermissionAsync("users.create", cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to create users." });
        }

        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Trim().Length < 3 || request.Username.Trim().Length > 100)
        {
            return BadRequest(new { message = "Username must be between 3 and 100 characters." });
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !IsValidEmail(request.Email.Trim()))
        {
            return BadRequest(new { message = "A valid email address is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8 || request.Password.Length > 128)
        {
            return BadRequest(new { message = "Password must be between 8 and 128 characters." });
        }

        var cleanUsername = request.Username.Trim();
        var cleanEmail = request.Email.Trim().ToLowerInvariant();

        var exists = await _context.Users
            .Where(u => u.Username.ToLower() == cleanUsername.ToLower() || u.Email.ToLower() == cleanEmail)
            .Select(u => u.Id)
            .FirstOrDefaultAsync(cancellationToken) > 0;

        if (exists)
        {
            return Conflict(new { message = "Username or email is already in use." });
        }

        // Security check: Only an ADMIN can assign the ADMIN role to a new user
        var adminRoleId = await _context.Roles
            .Where(r => r.Code == "ADMIN" && r.IsActive)
            .Select(r => r.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (!User.IsInRole("ADMIN") && request.RoleIds.Contains(adminRoleId))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only administrators can assign the Administrator role." });
        }

        var actorUserId = GetCurrentUserId() ?? 1;

        var user = new AppUser
        {
            Username = cleanUsername,
            Email = cleanEmail,
            PasswordHash = string.Empty,
            IsActive = true,
            TwoFactorEnabled = false,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // Assign roles
        if (request.RoleIds.Count > 0)
        {
            var validRoleIds = await _context.Roles
                .Where(r => request.RoleIds.Contains(r.Id) && r.IsActive)
                .Select(r => r.Id)
                .ToListAsync(cancellationToken);

            foreach (var roleId in validRoleIds)
            {
                _context.UserRoles.Add(new AppUserRole
                {
                    UserId = user.Id,
                    RoleId = roleId,
                    AssignedAtUtc = DateTimeOffset.UtcNow,
                    AssignedBy = actorUserId
                });
            }
        }

        // Assign direct permissions
        if (request.DirectPermissionIds.Count > 0)
        {
            var validPermIds = await _context.Permissions
                .Where(p => request.DirectPermissionIds.Contains(p.Id) && p.IsActive)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            foreach (var permId in validPermIds)
            {
                _context.UserPermissions.Add(new AppUserPermission
                {
                    UserId = user.Id,
                    PermissionId = permId,
                    AssignedAtUtc = DateTimeOffset.UtcNow,
                    AssignedBy = actorUserId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            action: "CREATE_USER",
            entityName: "AppUser",
            entityId: user.Id.ToString(),
            description: $"User account '{user.Username}' was created by '{GetCurrentUsername()}'",
            userId: actorUserId,
            username: GetCurrentUsername(),
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken);

        var createdUser = await GetUserByIdWithDetailsAsync(user.Id, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, createdUser);
    }

    [HttpPut("{id:int}/roles")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRoles(
        int id,
        [FromBody] UpdateUserRolesRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsAdminOrHasPermissionAsync("users.edit", cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to edit user roles." });
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .Include(u => u.UserPermissions)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var actorUserId = GetCurrentUserId() ?? 1;

        // Security check: Last Admin protection (cannot remove ADMIN role from the only active administrator)
        var adminRoleId = await _context.Roles
            .Where(r => r.Code == "ADMIN" && r.IsActive)
            .Select(r => r.Id)
            .FirstOrDefaultAsync(cancellationToken);

        var isCurrentlyAdmin = user.UserRoles.Any(ur => ur.RoleId == adminRoleId);
        var willBeAdmin = request.RoleIds.Contains(adminRoleId);

        if (isCurrentlyAdmin && !willBeAdmin)
        {
            var otherActiveAdminsCount = await _context.UserRoles
                .Where(ur => ur.RoleId == adminRoleId && ur.UserId != id && ur.User.IsActive)
                .CountAsync(cancellationToken);

            if (otherActiveAdminsCount == 0)
            {
                return BadRequest(new { message = "Cannot remove the Administrator role from the last active administrator." });
            }
        }

        // Security check: Only an ADMIN can grant the ADMIN role
        if (!User.IsInRole("ADMIN") && willBeAdmin && !isCurrentlyAdmin)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Only administrators can grant the Administrator role." });
        }

        // Update roles
        _context.UserRoles.RemoveRange(user.UserRoles);

        var validRoleIds = await _context.Roles
            .Where(r => request.RoleIds.Contains(r.Id) && r.IsActive)
            .Select(r => r.Id)
            .ToListAsync(cancellationToken);

        foreach (var roleId in validRoleIds)
        {
            _context.UserRoles.Add(new AppUserRole
            {
                UserId = user.Id,
                RoleId = roleId,
                AssignedAtUtc = DateTimeOffset.UtcNow,
                AssignedBy = actorUserId
            });
        }

        // Update direct permissions
        _context.UserPermissions.RemoveRange(user.UserPermissions);

        if (request.DirectPermissionIds.Count > 0)
        {
            var validPermIds = await _context.Permissions
                .Where(p => request.DirectPermissionIds.Contains(p.Id) && p.IsActive)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);

            foreach (var permId in validPermIds)
            {
                _context.UserPermissions.Add(new AppUserPermission
                {
                    UserId = user.Id,
                    PermissionId = permId,
                    AssignedAtUtc = DateTimeOffset.UtcNow,
                    AssignedBy = actorUserId
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            action: "UPDATE_USER_ROLES",
            entityName: "AppUser",
            entityId: id.ToString(),
            description: $"Updated roles and permissions for user '{user.Username}'",
            userId: actorUserId,
            username: GetCurrentUsername(),
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken);

        var updatedUser = await GetUserByIdWithDetailsAsync(id, cancellationToken);
        return Ok(updatedUser);
    }

    [HttpPut("{id:int}/status")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleStatus(int id, CancellationToken cancellationToken)
    {
        if (!await IsAdminOrHasPermissionAsync("users.delete", cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to modify user status." });
        }

        var user = await _context.Users.FindAsync([id], cancellationToken);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var actorUserId = GetCurrentUserId() ?? 1;

        // Security check: Last Admin protection (cannot deactivate the only active administrator)
        if (user.IsActive)
        {
            var adminRoleId = await _context.Roles
                .Where(r => r.Code == "ADMIN" && r.IsActive)
                .Select(r => r.Id)
                .FirstOrDefaultAsync(cancellationToken);

            var isAdmin = await _context.UserRoles.AnyAsync(ur => ur.UserId == id && ur.RoleId == adminRoleId, cancellationToken);
            if (isAdmin)
            {
                var activeAdminsCount = await _context.UserRoles
                    .Where(ur => ur.RoleId == adminRoleId && ur.User.IsActive)
                    .CountAsync(cancellationToken);

                if (activeAdminsCount <= 1)
                {
                    return BadRequest(new { message = "Cannot deactivate the last active administrator account." });
                }
            }
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            action: user.IsActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
            entityName: "AppUser",
            entityId: id.ToString(),
            description: $"User account '{user.Username}' status changed to {(user.IsActive ? "Active" : "Disabled")}",
            userId: actorUserId,
            username: GetCurrentUsername(),
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken);

        var dto = await GetUserByIdWithDetailsAsync(id, cancellationToken);
        return Ok(dto);
    }

    [HttpPut("{id:int}/2fa")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleTwoFactor(int id, CancellationToken cancellationToken)
    {
        if (!await IsAdminOrHasPermissionAsync("users.edit", cancellationToken))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to manage two-factor authentication." });
        }

        var user = await _context.Users.FindAsync([id], cancellationToken);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var actorUserId = GetCurrentUserId() ?? 1;

        user.TwoFactorEnabled = !user.TwoFactorEnabled;
        if (!user.TwoFactorEnabled)
        {
            user.TwoFactorSecret = null;
        }
        else if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            // Cryptographically secure unique TOTP secret (Base32) instead of static hardcoded secret
            var secretBytes = KeyGeneration.GenerateRandomKey(20);
            user.TwoFactorSecret = Base32Encoding.ToString(secretBytes);
        }

        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        await _auditService.LogAsync(
            action: user.TwoFactorEnabled ? "ENABLE_2FA" : "DISABLE_2FA",
            entityName: "AppUser",
            entityId: id.ToString(),
            description: $"Two-factor authentication {(user.TwoFactorEnabled ? "enabled" : "disabled")} for user '{user.Username}'",
            userId: actorUserId,
            username: GetCurrentUsername(),
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            cancellationToken: cancellationToken);

        var dto = await GetUserByIdWithDetailsAsync(id, cancellationToken);
        return Ok(dto);
    }

    private async Task<UserDto> GetUserByIdWithDetailsAsync(int userId, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Include(u => u.UserPermissions)
            .ThenInclude(up => up.Permission)
            .FirstAsync(u => u.Id == userId, cancellationToken);

        var allPermissions = await _context.Permissions
            .Where(p => p.IsActive)
            .ToListAsync(cancellationToken);

        var allRolePermissions = await _context.RolePermissions
            .Include(rp => rp.Permission)
            .ToListAsync(cancellationToken);

        return MapToUserDto(user, allPermissions, allRolePermissions);
    }

    private static UserDto MapToUserDto(
        AppUser user,
        List<AppPermission> allPermissions,
        List<AppRolePermission> allRolePermissions)
    {
        var activeUserRoles = user.UserRoles?
            .Where(ur => ur.Role != null && ur.Role.IsActive)
            .ToList() ?? [];

        var roles = activeUserRoles
            .Select(ur => ur.Role.Name)
            .ToList();

        var roleIds = activeUserRoles
            .Select(ur => ur.RoleId)
            .ToList();

        var activeUserPermissions = user.UserPermissions?
            .Where(up => up.Permission != null && up.Permission.IsActive)
            .ToList() ?? [];

        var directPermIds = activeUserPermissions
            .Select(up => up.PermissionId)
            .ToList();

        var isAdmin = activeUserRoles.Any(ur => ur.Role.Code.Equals("ADMIN", StringComparison.OrdinalIgnoreCase));

        List<string> effectivePermCodes;
        if (isAdmin)
        {
            effectivePermCodes = allPermissions
                .Where(p => p != null && p.IsActive)
                .Select(p => p.Code)
                .Distinct()
                .ToList();
        }
        else
        {
            var permCodesFromRoles = allRolePermissions
                .Where(rp => roleIds.Contains(rp.RoleId) && rp.Permission != null && rp.Permission.IsActive)
                .Select(rp => rp.Permission.Code);

            var permCodesFromDirect = activeUserPermissions
                .Select(up => up.Permission.Code);

            effectivePermCodes = permCodesFromRoles.Concat(permCodesFromDirect).Distinct().ToList();
        }

        return new UserDto(
            user.Id,
            user.Username,
            user.Email,
            roles,
            roleIds,
            directPermIds,
            effectivePermCodes,
            user.IsActive,
            user.TwoFactorEnabled,
            user.CreatedAtUtc);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    private string? GetCurrentUsername() =>
        User.FindFirst(ClaimTypes.Name)?.Value
        ?? User.FindFirst("name")?.Value
        ?? User.Identity?.Name;

    private static bool IsValidEmail(string email)
    {
        try
        {
            var mailAddress = new System.Net.Mail.MailAddress(email);
            return mailAddress.Address == email && email.Contains('.');
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> IsAdminOrHasPermissionAsync(string permissionCode, CancellationToken cancellationToken)
    {
        if (User.IsInRole("ADMIN"))
        {
            return true;
        }

        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return false;
        }

        // Check direct user permissions
        var hasDirect = await _context.UserPermissions
            .AnyAsync(up => up.UserId == userId.Value && up.Permission != null && up.Permission.IsActive && up.Permission.Code == permissionCode, cancellationToken);
        if (hasDirect)
        {
            return true;
        }

        // Check role permissions
        var userRoleIds = await _context.UserRoles
            .Where(ur => ur.UserId == userId.Value && ur.Role != null && ur.Role.IsActive)
            .Select(ur => ur.RoleId)
            .ToListAsync(cancellationToken);

        if (userRoleIds.Count == 0)
        {
            return false;
        }

        var hasRolePerm = await _context.RolePermissions
            .AnyAsync(rp => userRoleIds.Contains(rp.RoleId) && rp.Permission != null && rp.Permission.IsActive && rp.Permission.Code == permissionCode, cancellationToken);

        return hasRolePerm;
    }
}
