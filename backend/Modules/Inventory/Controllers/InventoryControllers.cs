using System.Security.Claims;
using backend.Modules.Common;
using backend.Modules.Inventory.DTOs;
using backend.Modules.Inventory.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Modules.Inventory.Controllers;

[ApiController]
[Route("api/warehouses")]
[Authorize("FullAuth")]
public class WarehousesController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public WarehousesController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WarehouseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWarehouses([FromQuery] bool onlyActive = true, CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetWarehousesAsync(onlyActive, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(WarehouseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetWarehouse(int id, CancellationToken cancellationToken)
    {
        var w = await _inventoryService.GetWarehouseByIdAsync(id, cancellationToken);
        if (w == null) return NotFound(new { message = $"Warehouse with ID {id} not found." });
        return Ok(w);
    }

    [HttpPost]
    [ProducesResponseType(typeof(WarehouseDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateWarehouse([FromBody] CreateWarehouseRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Warehouse code and name are required." });

        try
        {
            var created = await _inventoryService.CreateWarehouseAsync(request, GetCurrentUserId(), GetCurrentUsername(), cancellationToken);
            return CreatedAtAction(nameof(GetWarehouse), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(WarehouseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateWarehouse(int id, [FromBody] UpdateWarehouseRequest request, CancellationToken cancellationToken)
    {
        var updated = await _inventoryService.UpdateWarehouseAsync(id, request, GetCurrentUserId(), GetCurrentUsername(), cancellationToken);
        if (updated == null) return NotFound(new { message = $"Warehouse with ID {id} not found." });
        return Ok(updated);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    private string? GetCurrentUsername() =>
        User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value ?? User.Identity?.Name;
}

[ApiController]
[Route("api/inventory")]
[Authorize("FullAuth")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("stocks")]
    [ProducesResponseType(typeof(PagedResult<WarehouseStockDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWarehouseStocks(
        [FromQuery] int? warehouseId,
        [FromQuery] int? productId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetWarehouseStocksAsync(warehouseId, productId, search, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpGet("alerts")]
    [ProducesResponseType(typeof(IReadOnlyList<StockAlertDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStockAlerts([FromQuery] int? warehouseId, CancellationToken cancellationToken = default)
    {
        var alerts = await _inventoryService.GetStockAlertsAsync(warehouseId, cancellationToken);
        return Ok(alerts);
    }

    [HttpGet("movements")]
    [ProducesResponseType(typeof(PagedResult<StockMovementDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMovements(
        [FromQuery] int? productId,
        [FromQuery] int? warehouseId,
        [FromQuery] string? movementType,
        [FromQuery] string? referenceType,
        [FromQuery] DateTimeOffset? fromDate,
        [FromQuery] DateTimeOffset? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetMovementsAsync(productId, warehouseId, movementType, referenceType, fromDate, toDate, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("adjust")]
    [ProducesResponseType(typeof(StockAdjustmentDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RecordAdjustment([FromBody] CreateAdjustmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var adj = await _inventoryService.RecordAdjustmentAsync(request, GetCurrentUserId(), GetCurrentUsername(), cancellationToken);
            return Ok(adj);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("adjustments")]
    [ProducesResponseType(typeof(PagedResult<StockAdjustmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdjustments(
        [FromQuery] int? warehouseId,
        [FromQuery] int? productId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetAdjustmentsAsync(warehouseId, productId, page, pageSize, cancellationToken);
        return Ok(result);
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    private string? GetCurrentUsername() =>
        User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value ?? User.Identity?.Name;
}

[ApiController]
[Route("api/transfers")]
[Authorize("FullAuth")]
public class TransfersController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public TransfersController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<StockTransferDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTransfers(
        [FromQuery] string? status,
        [FromQuery] int? warehouseId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetTransfersAsync(status, warehouseId, page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateTransfer([FromBody] CreateTransferRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _inventoryService.CreateTransferAsync(request, GetCurrentUserId(), GetCurrentUsername(), cancellationToken);
            return CreatedAtAction(nameof(GetTransfers), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/complete")]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CompleteTransfer(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _inventoryService.CompleteTransferAsync(id, GetCurrentUserId(), GetCurrentUsername(), cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:int}/cancel")]
    [ProducesResponseType(typeof(StockTransferDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CancelTransfer(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _inventoryService.CancelTransferAsync(id, GetCurrentUserId(), GetCurrentUsername(), cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private int? GetCurrentUserId()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        return int.TryParse(idClaim, out var id) ? id : null;
    }

    private string? GetCurrentUsername() =>
        User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("name")?.Value ?? User.Identity?.Name;
}
