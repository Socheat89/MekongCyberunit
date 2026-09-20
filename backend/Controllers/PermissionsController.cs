using System.Security.Claims;
using backend.Models.Request;
using backend.Services.Permission;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/permissions")]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;

    public PermissionsController(IPermissionService permissionService)
    {
        _permissionService = permissionService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PermissionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var permissions = await _permissionService.GetAllAsync(cancellationToken);
        return Ok(permissions);
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
