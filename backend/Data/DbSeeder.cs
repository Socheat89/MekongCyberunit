using backend.Models.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Users.AnyAsync())
        {
            return;
        }

        var passwordHasher = new PasswordHasher<AppUser>();

        // 1. Seed Roles
        var adminRole = new AppRole
        {
            Code = "ADMIN",
            Name = "Administrator",
            Description = "Full system access",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = 1
        };

        var managerRole = new AppRole
        {
            Code = "MANAGER",
            Name = "Manager",
            Description = "Manager access",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = 1
        };

        context.Roles.AddRange(adminRole, managerRole);
        await context.SaveChangesAsync();

        // 2. Seed Admin User
        var adminUser = new AppUser
        {
            Username = "admin",
            Email = "admin@example.com",
            PasswordHash = "",
            IsActive = true,
            TwoFactorEnabled = false,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };
        adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "Password123!");

        context.Users.Add(adminUser);
        await context.SaveChangesAsync();

        // 3. Seed UserRole
        context.UserRoles.Add(new AppUserRole
        {
            UserId = adminUser.Id,
            RoleId = adminRole.Id,
            AssignedAtUtc = DateTimeOffset.UtcNow,
            AssignedBy = adminUser.Id
        });
        await context.SaveChangesAsync();

        // 4. Seed Pages
        var dashboardPage = new AppPage
        {
            Code = "dashboard",
            Name = "Dashboard",
            Route = "/dashboard",
            Icon = "layout-dashboard",
            SortOrder = 1,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = adminUser.Id
        };

        var unitsPage = new AppPage
        {
            Code = "units",
            Name = "Units",
            Route = "/units",
            Icon = "box",
            SortOrder = 2,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = adminUser.Id
        };

        var settingsPage = new AppPage
        {
            Code = "settings",
            Name = "Settings",
            Route = "/settings",
            Icon = "settings",
            SortOrder = 3,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = adminUser.Id
        };

        context.Pages.AddRange(dashboardPage, unitsPage, settingsPage);
        await context.SaveChangesAsync();

        // 5. Seed Permissions
        var dashboardView = new AppPermission
        {
            PageId = dashboardPage.Id,
            Code = "dashboard.view",
            Action = "view",
            Description = "View dashboard",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = adminUser.Id
        };

        var unitsView = new AppPermission
        {
            PageId = unitsPage.Id,
            Code = "units.view",
            Action = "view",
            Description = "View units",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = adminUser.Id
        };

        var settingsView = new AppPermission
        {
            PageId = settingsPage.Id,
            Code = "settings.view",
            Action = "view",
            Description = "View settings",
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow,
            CreatedBy = adminUser.Id
        };

        context.Permissions.AddRange(dashboardView, unitsView, settingsView);
        await context.SaveChangesAsync();

        // 6. Seed RolePermissions for ADMIN
        context.RolePermissions.AddRange(
            new AppRolePermission { RoleId = adminRole.Id, PermissionId = dashboardView.Id, AssignedAtUtc = DateTimeOffset.UtcNow, AssignedBy = adminUser.Id },
            new AppRolePermission { RoleId = adminRole.Id, PermissionId = unitsView.Id, AssignedAtUtc = DateTimeOffset.UtcNow, AssignedBy = adminUser.Id },
            new AppRolePermission { RoleId = adminRole.Id, PermissionId = settingsView.Id, AssignedAtUtc = DateTimeOffset.UtcNow, AssignedBy = adminUser.Id }
        );
        await context.SaveChangesAsync();
    }
}
