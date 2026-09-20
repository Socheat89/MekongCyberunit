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
    bool IsActive,
    DateTimeOffset CreatedAtUtc);

public class CreateUserWithRolesRequest
{
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public List<int> RoleIds { get; set; } = [];
}

public class UpdateUserRolesRequest
{
    public List<int> RoleIds { get; set; } = [];
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
            .OrderBy(u => u.Id)
            .ToListAsync(cancellationToken);

        var result = users.Select(u => new UserDto(
            u.Id,
            u.Username,
            u.Email,
            u.UserRoles.Select(ur => ur.Role.Name).ToList(),
            u.UserRoles.Select(ur => ur.RoleId).ToList(),
            u.IsActive,
            u.CreatedAtUtc)).ToList();

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
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Return user with roles
        var createdUser = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == user.Id, cancellationToken);

        var dto = new UserDto(
            createdUser.Id,
            createdUser.Username,
            createdUser.Email,
            createdUser.UserRoles.Select(ur => ur.Role.Name).ToList(),
            createdUser.UserRoles.Select(ur => ur.RoleId).ToList(),
            createdUser.IsActive,
            createdUser.CreatedAtUtc);

        return StatusCode(StatusCodes.Status201Created, dto);
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
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var actorUserId = GetCurrentUserId() ?? 1;

        // Remove existing roles
        _context.UserRoles.RemoveRange(user.UserRoles);

        // Add new roles
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

        await _context.SaveChangesAsync(cancellationToken);

        var updatedUser = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == id, cancellationToken);

        var dto = new UserDto(
            updatedUser.Id,
            updatedUser.Username,
            updatedUser.Email,
            updatedUser.UserRoles.Select(ur => ur.Role.Name).ToList(),
            updatedUser.UserRoles.Select(ur => ur.RoleId).ToList(),
            updatedUser.IsActive,
            updatedUser.CreatedAtUtc);

        return Ok(dto);
    }

    [HttpPut("{id:int}/status")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleStatus(int id, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.IsActive = !user.IsActive;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new UserDto(
            user.Id,
            user.Username,
            user.Email,
            user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            user.UserRoles.Select(ur => ur.RoleId).ToList(),
            user.IsActive,
            user.CreatedAtUtc);

        return Ok(dto);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }
}
