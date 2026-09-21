using System.Security.Claims;
using backend.Data;
using backend.Models.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    private readonly PasswordHasher<AppUser> _passwordHasher = new();

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
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
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserWithRolesRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username, email, and password are required." });
        }

        var cleanUsername = request.Username.Trim();
        var cleanEmail = request.Email.Trim().ToLowerInvariant();

        var exists = await _context.Users.AnyAsync(
            u => u.Username.ToLower() == cleanUsername.ToLower() || u.Email.ToLower() == cleanEmail,
            cancellationToken);

        if (exists)
        {
            return Conflict(new { message = "Username or email is already in use." });
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

        var createdUser = await GetUserByIdWithDetailsAsync(user.Id, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, createdUser);
    }

    [HttpPut("{id:int}/roles")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRoles(
        int id,
        [FromBody] UpdateUserRolesRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .Include(u => u.UserPermissions)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var actorUserId = GetCurrentUserId() ?? 1;

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

        var updatedUser = await GetUserByIdWithDetailsAsync(id, cancellationToken);
        return Ok(updatedUser);
    }

    [HttpPut("{id:int}/status")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleStatus(int id, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync([id], cancellationToken);
        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

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
            user.CreatedAtUtc);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }
}
