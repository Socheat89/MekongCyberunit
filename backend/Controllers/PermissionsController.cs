using System.Security.Claims;
using backend.Data;
using backend.Models.Request;
using backend.Services.Permission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/permissions")]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly AppDbContext _context;

    public PermissionsController(IPermissionService permissionService, AppDbContext context)
    {
        _permissionService = permissionService;
        _context = context;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PermissionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var permissions = await _permissionService.GetAllAsync(cancellationToken);
        return Ok(permissions);
    }

    [HttpGet("me")]
    [Authorize("FullAuth")]
    [ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyPermissions(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
        {
            return Unauthorized(new { message = "Missing or invalid access token" });
        }

        var userRoles = await _context.UserRoles
            .Where(ur => ur.UserId == userId.Value)
            .Include(ur => ur.Role)
            .ToListAsync(cancellationToken);

        var isAdmin = userRoles.Any(ur => ur.Role != null && ur.Role.IsActive && ur.Role.Code.Equals("ADMIN", StringComparison.OrdinalIgnoreCase));
        if (isAdmin)
        {
            var allPermCodes = await _context.Permissions
                .Where(p => p.IsActive)
                .Select(p => p.Code)
                .Distinct()
                .ToListAsync(cancellationToken);
            return Ok(allPermCodes);
        }

        var roleIds = userRoles
            .Where(ur => ur.Role != null && ur.Role.IsActive)
            .Select(ur => ur.RoleId)
            .ToList();

        var permCodesFromRoles = await _context.RolePermissions
            .Where(rp => roleIds.Contains(rp.RoleId) && rp.Permission != null && rp.Permission.IsActive)
            .Select(rp => rp.Permission.Code)
            .ToListAsync(cancellationToken);

        var permCodesFromDirect = await _context.UserPermissions
            .Where(up => up.UserId == userId.Value && up.Permission != null && up.Permission.IsActive)
            .Select(up => up.Permission.Code)
            .ToListAsync(cancellationToken);

        var myPermCodes = permCodesFromRoles.Concat(permCodesFromDirect).Distinct().ToList();
        return Ok(myPermCodes);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PermissionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var permission = await _permissionService.GetByIdAsync(id, cancellationToken);
        if (permission == null)
        {
            return NotFound(new { message = "Permission was not found" });
        }

        return Ok(permission);
    }

    [HttpPost]
    [Authorize("FullAuth")]
    [ProducesResponseType(typeof(PermissionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePermissionRequest request,
        CancellationToken cancellationToken)
    {
        var actorUserId = GetCurrentUserId();
        if (actorUserId == null)
        {
            return Unauthorized(new { message = "Missing or invalid access token" });
        }

        var result = await _permissionService.CreateAsync(request, actorUserId.Value, cancellationToken);

        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{id:int}")]
    [Authorize("FullAuth")]
    [ProducesResponseType(typeof(PermissionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdatePermissionRequest request,
        CancellationToken cancellationToken)
    {
        var actorUserId = GetCurrentUserId();
        if (actorUserId == null)
        {
            return Unauthorized(new { message = "Missing or invalid access token" });
        }

        var result = await _permissionService.UpdateAsync(id, request, actorUserId.Value, cancellationToken);

        if (!result.Succeeded)
        {
            return StatusCode(result.StatusCode, new { message = result.Message });
        }

        return Ok(result.Value);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }
}
