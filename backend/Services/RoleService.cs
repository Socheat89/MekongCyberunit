using backend.Data;
using backend.Models.Data;
using backend.Models.Request;
using backend.Services.Common;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class RoleService : IRoleService
{
    private readonly AppDbContext _context;

    public RoleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RolePageResponse> GetPageAsync(
        RoleQueryRequest request,
        CancellationToken cancellationToken)
    {
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : (request.PageSize > 100 ? 100 : request.PageSize);

        var totalRoles = await _context.Roles.CountAsync(cancellationToken);
        var activeRoles = await _context.Roles.CountAsync(r => r.IsActive, cancellationToken);

        var query = _context.Roles.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (string.Equals(request.Status, "active", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.IsActive);
            }
            else if (string.Equals(request.Status, "inactive", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => !r.IsActive);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            query = query.Where(r =>
                r.Name.ToLower().Contains(search) ||
                r.Code.ToLower().Contains(search) ||
                (r.Description != null && r.Description.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var items = await query
            .OrderBy(r => r.Id)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoleResponse(
                r.Id,
                r.Code,
                r.Name,
                r.Description,
                r.IsActive,
                r.CreatedAtUtc,
                r.UpdatedAtUtc))
            .ToListAsync(cancellationToken);

        return new RolePageResponse(
            Items: items,
            PageNumber: pageNumber,
            PageSize: pageSize,
            TotalCount: totalCount,
            TotalPages: totalPages,
            TotalRoles: totalRoles,
            ActiveRoles: activeRoles);
    }

    public async Task<RoleResponse?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var role = await _context.Roles.FindAsync([id], cancellationToken);
        if (role == null)
        {
            return null;
        }

        return new RoleResponse(
            role.Id,
            role.Code,
            role.Name,
            role.Description,
            role.IsActive,
            role.CreatedAtUtc,
            role.UpdatedAtUtc);
    }

    public async Task<RoleServiceResult<RoleResponse>> CreateAsync(
        CreateRoleRequest request,
        int actorUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Length > 50)
        {
            return RoleServiceResult<RoleResponse>.BadRequest("Validation failed");
        }

        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 100)
        {
            return RoleServiceResult<RoleResponse>.BadRequest("Validation failed");
        }

        if (request.Description != null && request.Description.Length > 500)
        {
            return RoleServiceResult<RoleResponse>.BadRequest("Validation failed");
        }

        var codeUpper = request.Code.Trim().ToUpperInvariant();
        var exists = await _context.Roles.AnyAsync(r => r.Code.ToUpper() == codeUpper, cancellationToken);
        if (exists)
        {
            return RoleServiceResult<RoleResponse>.Conflict("Role code already exists");
        }

        var role = new AppRole
        {
            Code = codeUpper,
            Name = request.Name.Trim(),
            Description = request.Description,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = actorUserId
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync(cancellationToken);

        return RoleServiceResult<RoleResponse>.Success(
            new RoleResponse(
                role.Id,
                role.Code,
                role.Name,
                role.Description,
                role.IsActive,
                role.CreatedAtUtc,
                role.UpdatedAtUtc),
            statusCode: 201);
    }

    public async Task<RoleServiceResult<RoleResponse>> UpdateAsync(
        int id,
        UpdateRoleRequest request,
        int actorUserId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 100)
        {
            return RoleServiceResult<RoleResponse>.BadRequest("Validation failed");
        }

        if (request.Description != null && request.Description.Length > 500)
        {
            return RoleServiceResult<RoleResponse>.BadRequest("Validation failed");
        }

        var role = await _context.Roles.FindAsync([id], cancellationToken);
        if (role == null)
        {
            return RoleServiceResult<RoleResponse>.NotFound("Role was not found");
        }

        role.Name = request.Name.Trim();
        role.Description = request.Description;
        role.IsActive = request.IsActive;
        role.UpdatedAtUtc = DateTimeOffset.UtcNow;
        role.UpdatedBy = actorUserId;

        await _context.SaveChangesAsync(cancellationToken);

        return RoleServiceResult<RoleResponse>.Success(
            new RoleResponse(
                role.Id,
                role.Code,
                role.Name,
                role.Description,
                role.IsActive,
                role.CreatedAtUtc,
                role.UpdatedAtUtc),
            statusCode: 200);
    }
}
