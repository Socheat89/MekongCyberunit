using backend.Data;
using backend.Models.Data;
using backend.Models.Request;
using Microsoft.EntityFrameworkCore;

namespace backend.Services.Navigation;

public class NavigationService : INavigationService
{
    private readonly AppDbContext _context;

    public NavigationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<NavigationItemResponse>> GetUserNavigationAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        // 1. Get user roles
        var userRoles = await _context.UserRoles
            .Where(ur => ur.UserId == userId)
            .Include(ur => ur.Role)
            .ToListAsync(cancellationToken);

        var roleIds = userRoles
            .Where(ur => ur.Role.IsActive)
            .Select(ur => ur.RoleId)
            .ToList();

        var isAdmin = userRoles.Any(ur => ur.Role.IsActive && ur.Role.Code.Equals("ADMIN", StringComparison.OrdinalIgnoreCase));

        // 2. Get permitted permission IDs (from roles + direct user permissions) if not admin
        var permittedPermissionIds = new HashSet<int>();
        if (!isAdmin)
        {
            if (roleIds.Count > 0)
            {
                var rolePermIds = await _context.RolePermissions
                    .Where(rp => roleIds.Contains(rp.RoleId))
                    .Select(rp => rp.PermissionId)
                    .ToListAsync(cancellationToken);

                foreach (var pId in rolePermIds)
                {
                    permittedPermissionIds.Add(pId);
                }
            }

            var directPermIds = await _context.UserPermissions
                .Where(up => up.UserId == userId)
                .Select(up => up.PermissionId)
                .ToListAsync(cancellationToken);

            foreach (var pId in directPermIds)
            {
                permittedPermissionIds.Add(pId);
            }
        }

        // 3. Fetch all active pages with permissions
        var allPages = await _context.Pages
            .Where(p => p.IsActive)
            .Include(p => p.Permissions)
            .ToListAsync(cancellationToken);

        // 4. Determine allowed page IDs
        var allowedPageIds = new HashSet<int>();
        foreach (var page in allPages)
        {
            if (isAdmin)
            {
                allowedPageIds.Add(page.Id);
            }
            else
            {
                var activePermissions = page.Permissions.Where(p => p.IsActive).ToList();
                // If page has no permissions, it's accessible, or if user has any assigned permission for this page
                if (activePermissions.Count == 0 || activePermissions.Any(p => permittedPermissionIds.Contains(p.Id)))
                {
                    allowedPageIds.Add(page.Id);
                }
            }
        }

        // Also ensure parents of allowed pages are included
        bool addedParent;
        do
        {
            addedParent = false;
            foreach (var page in allPages)
            {
                if (allowedPageIds.Contains(page.Id) && page.ParentId.HasValue && !allowedPageIds.Contains(page.ParentId.Value))
                {
                    allowedPageIds.Add(page.ParentId.Value);
                    addedParent = true;
                }
            }
        } while (addedParent);

        // 5. Build hierarchical tree
        var lookupByParent = allPages
            .Where(p => allowedPageIds.Contains(p.Id))
            .ToLookup(p => p.ParentId);

        List<NavigationItemResponse> BuildTree(int? parentId)
        {
            return lookupByParent[parentId]
                .OrderBy(p => p.SortOrder)
                .ThenBy(p => p.Id)
                .Select(p => new NavigationItemResponse(
                    Id: p.Id,
                    Code: p.Code,
                    Label: p.Name,
                    Route: p.Route,
                    Icon: p.Icon,
                    SortOrder: p.SortOrder,
                    Children: BuildTree(p.Id)))
                .ToList();
        }

        var rootItems = BuildTree(null);
        return rootItems;
    }
}
