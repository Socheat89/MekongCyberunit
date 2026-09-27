using backend.Modules.Audit.Models;
using backend.Modules.Audit.Services;
using backend.Modules.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Audit.Controllers;

[ApiController]
[Route("api/audit")]
[Authorize("FullAuth")]
public class AuditController : ControllerBase
{
    private readonly IAuditService _auditService;

    public AuditController(IAuditService auditService)
    {
        _auditService = auditService;
    }

    [HttpGet("logs")]
    [ProducesResponseType(typeof(PagedResult<AuditLog>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? entityName,
        [FromQuery] DateTimeOffset? fromDate,
        [FromQuery] DateTimeOffset? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var logs = await _auditService.GetLogsAsync(search, action, entityName, fromDate, toDate, page, pageSize, cancellationToken);
        return Ok(logs);
    }
}
