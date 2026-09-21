using backend.Models.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (context.Database.ProviderName?.Contains("Oracle", StringComparison.OrdinalIgnoreCase) == true)
        {
            try
            {
                await context.Database.EnsureCreatedAsync();
            }
            catch (Exception ex) when (ex.Message.Contains("ORA-00955") || ex.Message.Contains("already used"))
            {
                var tables = new[] {
                    "StockMovements", "StockItems", "StockCategories",
                    "UserPermissions", "UserRoles", "RolePermissions",
                    "Permissions", "Pages", "Roles", "Users"
                };

                foreach (var table in tables)
                {
                    try
                    {
                        await context.Database.ExecuteSqlRawAsync($"BEGIN EXECUTE IMMEDIATE 'DROP TABLE \"{table}\" CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;");
                    }
                    catch { }
                }

                await context.Database.EnsureCreatedAsync();
            }
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // Ensure UserPermissions and Stock tables exist in SQLite DB if upgraded from older schema
        if (context.Database.ProviderName?.Contains("Sqlite", StringComparison.OrdinalIgnoreCase) == true)
        {
            await context.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""UserPermissions"" (
                    ""UserId"" INTEGER NOT NULL,
                    ""PermissionId"" INTEGER NOT NULL,
                    ""AssignedAtUtc"" TEXT NOT NULL,
                    ""AssignedBy"" INTEGER NULL,
                    PRIMARY KEY (""UserId"", ""PermissionId""),
                    CONSTRAINT ""FK_UserPermissions_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users"" (""Id"") ON DELETE CASCADE,
                    CONSTRAINT ""FK_UserPermissions_Permissions_PermissionId"" FOREIGN KEY (""PermissionId"") REFERENCES ""Permissions"" (""Id"") ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ""StockCategories"" (
                    ""Id"" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    ""Name"" TEXT NOT NULL,
                    ""Description"" TEXT NULL,
                    ""IsActive"" INTEGER NOT NULL DEFAULT 1,
                    ""CreatedAtUtc"" TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS ""StockItems"" (
                    ""Id"" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    ""Sku"" TEXT NOT NULL,
                    ""Barcode"" TEXT NULL,
                    ""Name"" TEXT NOT NULL,
                    ""Description"" TEXT NULL,
                    ""CategoryId"" INTEGER NULL,
                    ""Unit"" TEXT NOT NULL DEFAULT 'PCS',
                    ""CostPrice"" TEXT NOT NULL DEFAULT '0',
                    ""SellingPrice"" TEXT NOT NULL DEFAULT '0',
                    ""QuantityOnHand"" INTEGER NOT NULL DEFAULT 0,
                    ""MinStockLevel"" INTEGER NOT NULL DEFAULT 10,
                    ""Location"" TEXT NULL,
                    ""IsActive"" INTEGER NOT NULL DEFAULT 1,
                    ""CreatedAtUtc"" TEXT NOT NULL,
                    ""UpdatedAtUtc"" TEXT NULL,
                    CONSTRAINT ""FK_StockItems_StockCategories_CategoryId"" FOREIGN KEY (""CategoryId"") REFERENCES ""StockCategories"" (""Id"") ON DELETE SET NULL
                );
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_StockItems_Sku"" ON ""StockItems"" (""Sku"");

                CREATE TABLE IF NOT EXISTS ""StockMovements"" (
                    ""Id"" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    ""ReferenceNo"" TEXT NOT NULL,
                    ""MovementType"" TEXT NOT NULL,
                    ""ItemId"" INTEGER NOT NULL,
                    ""Quantity"" INTEGER NOT NULL,
                    ""UnitPrice"" TEXT NOT NULL DEFAULT '0',
                    ""BalanceBefore"" INTEGER NOT NULL,
                    ""BalanceAfter"" INTEGER NOT NULL,
                    ""Reason"" TEXT NULL,
                    ""SupplierOrRecipient"" TEXT NULL,
                    ""Notes"" TEXT NULL,
                    ""CreatedByUserId"" INTEGER NULL,
                    ""CreatedByUsername"" TEXT NULL,
                    ""CreatedAtUtc"" TEXT NOT NULL,
                    CONSTRAINT ""FK_StockMovements_StockItems_ItemId"" FOREIGN KEY (""ItemId"") REFERENCES ""StockItems"" (""Id"") ON DELETE CASCADE
                );
            ");
        }

        var passwordHasher = new PasswordHasher<AppUser>();

        // 1. Seed Roles if missing
        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "ADMIN");
        if (adminRole == null)
        {
            adminRole = new AppRole
            {
                Code = "ADMIN",
                Name = "Administrator",
                Description = "Full system access",
                IsActive = true,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedBy = 1
            };
            context.Roles.Add(adminRole);
            await context.SaveChangesAsync();
        }

        var managerRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "MANAGER");
        if (managerRole == null)
        {
            managerRole = new AppRole
            {
                Code = "MANAGER",
                Name = "Manager",
                Description = "Manager access",
                IsActive = true,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedBy = 1
            };
            context.Roles.Add(managerRole);
            await context.SaveChangesAsync();
        }

        var supportRole = await context.Roles.FirstOrDefaultAsync(r => r.Code == "SUPPORT");
        if (supportRole == null)
        {
            supportRole = new AppRole
            {
                Code = "SUPPORT",
                Name = "Senior Support Agent",
                Description = "Support and read-only access",
                IsActive = true,
                CreatedAtUtc = DateTimeOffset.UtcNow,
                CreatedBy = 1
            };
            context.Roles.Add(supportRole);
            await context.SaveChangesAsync();
        }

        // 2. Seed Admin User if missing
        var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Username == "admin");
        if (adminUser == null)
        {
            adminUser = new AppUser
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

            context.UserRoles.Add(new AppUserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id,
                AssignedAtUtc = DateTimeOffset.UtcNow,
                AssignedBy = adminUser.Id
            });
            await context.SaveChangesAsync();
        }

        // 3. Seed Pages if missing
        var pageDefinitions = new List<(string Code, string Name, string Route, string Icon, int SortOrder, string? ParentCode)>
        {
            ("dashboard", "Dashboard", "/dashboard", "layout-dashboard", 1, null),
            ("stock", "Stock Management", "/stock/items", "package", 2, null),
            ("stock-items", "Items Catalogue", "/stock/items", "package", 1, "stock"),
            ("stock-in", "Stock In", "/stock/in", "arrow-down-left", 2, "stock"),
            ("stock-out", "Stock Out", "/stock/out", "arrow-up-right", 3, "stock"),
            ("stock-adjustments", "Adjustments", "/stock/adjustments", "scale", 4, "stock"),
            ("stock-movements", "Movements Ledger", "/stock/movements", "history", 5, "stock"),
            ("stock-alerts", "Low Stock Alerts", "/stock/alerts", "alert-triangle", 6, "stock"),
            ("settings", "Settings", "/settings", "settings", 3, null),
            ("users", "Users & Permissions", "/users", "users", 1, "settings"),
            ("units", "Units of Measure", "/units", "box", 2, "settings"),
            ("roles", "System Roles", "/roles", "shield", 3, "settings"),
            ("permissions", "System Permissions", "/permissions", "key", 4, "settings")
        };

        var pageMap = new Dictionary<string, AppPage>();
        foreach (var def in pageDefinitions)
        {
            var page = await context.Pages.FirstOrDefaultAsync(p => p.Code == def.Code);
            if (page == null)
            {
                page = new AppPage
                {
                    Code = def.Code,
                    Name = def.Name,
                    Route = def.Route,
                    Icon = def.Icon,
                    SortOrder = def.SortOrder,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    CreatedBy = adminUser?.Id ?? 1
                };
                context.Pages.Add(page);
                await context.SaveChangesAsync();
            }
            pageMap[def.Code] = page;
        }

        // Link parent relationships if needed
        foreach (var def in pageDefinitions)
        {
            if (def.ParentCode != null && pageMap.TryGetValue(def.ParentCode, out var parentPage))
            {
                var currentPage = pageMap[def.Code];
                if (currentPage.ParentId != parentPage.Id)
                {
                    currentPage.ParentId = parentPage.Id;
                    await context.SaveChangesAsync();
                }
            }
        }

        // 4. Seed Permissions if missing
        var permDefinitions = new List<(string PageCode, string Action, string Description)>
        {
            ("dashboard", "view", "View dashboard metrics"),
            ("stock", "view", "View stock overview"),
            ("stock-items", "view", "View stock item catalogue"),
            ("stock-items", "create", "Create new stock items"),
            ("stock-items", "edit", "Edit stock items"),
            ("stock-items", "delete", "Deactivate stock items"),
            ("stock-in", "view", "View stock in receiving"),
            ("stock-in", "create", "Record inward stock receipts"),
            ("stock-out", "view", "View stock out dispatch"),
            ("stock-out", "create", "Record outward stock dispatch"),
            ("stock-adjustments", "view", "View stock adjustments"),
            ("stock-adjustments", "create", "Record stock physical count adjustments"),
            ("stock-movements", "view", "View stock transaction movement ledger"),
            ("stock-alerts", "view", "View low stock and restock alerts"),
            ("users", "view", "View user accounts and permissions"),
            ("users", "create", "Create new user accounts"),
            ("users", "edit", "Edit user accounts and roles"),
            ("users", "delete", "Disable or remove user accounts"),
            ("units", "view", "View units of measurement"),
            ("units", "create", "Create new units of measurement"),
            ("units", "edit", "Edit existing units"),
            ("units", "delete", "Delete units of measurement"),
            ("roles", "view", "View system authorization roles"),
            ("roles", "create", "Create new system roles"),
            ("roles", "edit", "Edit system roles and role permissions"),
            ("roles", "delete", "Delete system roles"),
            ("permissions", "view", "View system action permissions"),
            ("permissions", "create", "Create system action permissions"),
            ("permissions", "edit", "Edit system permissions"),
            ("settings", "view", "View settings workspace")
        };

        var seededPerms = new List<AppPermission>();
        foreach (var def in permDefinitions)
        {
            if (!pageMap.TryGetValue(def.PageCode, out var page)) continue;

            var permCode = $"{def.PageCode}.{def.Action}";
            var perm = await context.Permissions.FirstOrDefaultAsync(p => p.Code == permCode);
            if (perm == null)
            {
                perm = new AppPermission
                {
                    PageId = page.Id,
                    Code = permCode,
                    Action = def.Action,
                    Description = def.Description,
                    IsActive = true,
                    CreatedAtUtc = DateTimeOffset.UtcNow,
                    CreatedBy = adminUser?.Id ?? 1
                };
                context.Permissions.Add(perm);
                await context.SaveChangesAsync();
            }
            seededPerms.Add(perm);
        }

        // 5. Seed RolePermissions for ADMIN & MANAGER & SUPPORT
        foreach (var perm in seededPerms)
        {
            // ADMIN gets all permissions
            if (await context.RolePermissions.FirstOrDefaultAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == perm.Id) == null)
            {
                context.RolePermissions.Add(new AppRolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = perm.Id,
                    AssignedAtUtc = DateTimeOffset.UtcNow,
                    AssignedBy = adminUser?.Id ?? 1
                });
            }

            // MANAGER gets dashboard, units view/create, settings view, and stock management
            if (perm.Code is "dashboard.view" or "units.view" or "units.create" or "settings.view"
                || perm.Code.StartsWith("stock"))
            {
                if (await context.RolePermissions.FirstOrDefaultAsync(rp => rp.RoleId == managerRole.Id && rp.PermissionId == perm.Id) == null)
                {
                    context.RolePermissions.Add(new AppRolePermission
                    {
                        RoleId = managerRole.Id,
                        PermissionId = perm.Id,
                        AssignedAtUtc = DateTimeOffset.UtcNow,
                        AssignedBy = adminUser?.Id ?? 1
                    });
                }
            }

            // SUPPORT gets dashboard view, units view, and stock read-only views
            if (perm.Code is "dashboard.view" or "units.view" or "stock.view" or "stock-items.view" or "stock-movements.view" or "stock-alerts.view")
            {
                if (await context.RolePermissions.FirstOrDefaultAsync(rp => rp.RoleId == supportRole.Id && rp.PermissionId == perm.Id) == null)
                {
                    context.RolePermissions.Add(new AppRolePermission
                    {
                        RoleId = supportRole.Id,
                        PermissionId = perm.Id,
                        AssignedAtUtc = DateTimeOffset.UtcNow,
                        AssignedBy = adminUser?.Id ?? 1
                    });
                }
            }
        }
        await context.SaveChangesAsync();

        // 6. Seed Sample Categories and Stock Items if empty
        if (await context.StockCategories.FirstOrDefaultAsync() == null)
        {
            var categories = new List<StockCategory>
            {
                new() { Name = "Beverages & Liquids", Description = "Bottled drinks, cold brew, syrups" },
                new() { Name = "Packaging & Boxes", Description = "Cartons, labels, tape, bubble wrap" },
                new() { Name = "Electronics & Tech", Description = "Scanners, printers, hardware tools" },
                new() { Name = "Raw Materials", Description = "Grains, beans, bulk ingredients" },
                new() { Name = "Office Supplies", Description = "Safety gear, clipboards, markers" }
            };
            context.StockCategories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        if (await context.StockItems.FirstOrDefaultAsync() == null)
        {
            var catBeverage = await context.StockCategories.FirstOrDefaultAsync(c => c.Name == "Beverages & Liquids");
            var catPackaging = await context.StockCategories.FirstOrDefaultAsync(c => c.Name == "Packaging & Boxes");
            var catElectronics = await context.StockCategories.FirstOrDefaultAsync(c => c.Name == "Electronics & Tech");
            var catRaw = await context.StockCategories.FirstOrDefaultAsync(c => c.Name == "Raw Materials");
            var catOffice = await context.StockCategories.FirstOrDefaultAsync(c => c.Name == "Office Supplies");

            var sampleItems = new List<StockItem>
            {
                new()
                {
                    Sku = "BV-MK-001",
                    Barcode = "885123456701",
                    Name = "Mekong Cold Brew 250ml",
                    Description = "Ready-to-drink organic cold brew glass bottle",
                    CategoryId = catBeverage?.Id,
                    Unit = "LTR",
                    CostPrice = 1.20m,
                    SellingPrice = 2.50m,
                    QuantityOnHand = 85,
                    MinStockLevel = 20,
                    Location = "Zone A-12",
                    IsActive = true
                },
                new()
                {
                    Sku = "PK-BX-100",
                    Barcode = "885123456702",
                    Name = "Cardboard Shipping Box L",
                    Description = "Corrugated heavy-duty packing box 40x30x25cm",
                    CategoryId = catPackaging?.Id,
                    Unit = "BOX",
                    CostPrice = 0.85m,
                    SellingPrice = 1.60m,
                    QuantityOnHand = 450,
                    MinStockLevel = 100,
                    Location = "Zone B-04",
                    IsActive = true
                },
                new()
                {
                    Sku = "EL-SC-502",
                    Barcode = "885123456703",
                    Name = "Wireless Barcode Scanner 2D",
                    Description = "Handheld Bluetooth & 2.4G warehouse scanner",
                    CategoryId = catElectronics?.Id,
                    Unit = "PCS",
                    CostPrice = 45.00m,
                    SellingPrice = 75.00m,
                    QuantityOnHand = 8,
                    MinStockLevel = 15,
                    Location = "Tech Cage 01",
                    IsActive = true
                },
                new()
                {
                    Sku = "PK-LB-204",
                    Barcode = "885123456704",
                    Name = "Thermal Label Roll 4x6",
                    Description = "Direct thermal courier shipping label rolls (500 labels/roll)",
                    CategoryId = catPackaging?.Id,
                    Unit = "PCS",
                    CostPrice = 3.50m,
                    SellingPrice = 6.00m,
                    QuantityOnHand = 24,
                    MinStockLevel = 50,
                    Location = "Zone B-08",
                    IsActive = true
                },
                new()
                {
                    Sku = "EL-CB-009",
                    Barcode = "885123456705",
                    Name = "USB-C Heavy Duty Cable 2m",
                    Description = "Braided fast-charging sync cables",
                    CategoryId = catElectronics?.Id,
                    Unit = "PCS",
                    CostPrice = 2.10m,
                    SellingPrice = 5.50m,
                    QuantityOnHand = 0,
                    MinStockLevel = 15,
                    Location = "Tech Cage 02",
                    IsActive = true
                },
                new()
                {
                    Sku = "RM-CF-011",
                    Barcode = "885123456706",
                    Name = "Premium Robusta Beans 1kg",
                    Description = "Mondulkiri highland roasted coffee beans",
                    CategoryId = catRaw?.Id,
                    Unit = "KG",
                    CostPrice = 7.20m,
                    SellingPrice = 14.00m,
                    QuantityOnHand = 120,
                    MinStockLevel = 30,
                    Location = "Dry Vault D-02",
                    IsActive = true
                },
                new()
                {
                    Sku = "SF-GL-301",
                    Barcode = "885123456707",
                    Name = "Warehouse Safety Gloves XL",
                    Description = "Cut-resistant polyurethane coated grip gloves",
                    CategoryId = catOffice?.Id,
                    Unit = "PCS",
                    CostPrice = 1.80m,
                    SellingPrice = 3.50m,
                    QuantityOnHand = 65,
                    MinStockLevel = 20,
                    Location = "Zone C-01",
                    IsActive = true
                },
                new()
                {
                    Sku = "PK-BW-400",
                    Barcode = "885123456708",
                    Name = "Packaging Bubble Wrap 50m",
                    Description = "Roll 50cm x 50m protective packing wrap",
                    CategoryId = catPackaging?.Id,
                    Unit = "MTR",
                    CostPrice = 12.00m,
                    SellingPrice = 22.00m,
                    QuantityOnHand = 18,
                    MinStockLevel = 10,
                    Location = "Zone B-10",
                    IsActive = true
                }
            };

            context.StockItems.AddRange(sampleItems);
            await context.SaveChangesAsync();

            // Seed initial sample movements
            var movements = new List<StockMovement>
            {
                new()
                {
                    ReferenceNo = "IN-20260918-001",
                    MovementType = "IN",
                    ItemId = sampleItems[0].Id,
                    Quantity = 100,
                    UnitPrice = 1.20m,
                    BalanceBefore = 0,
                    BalanceAfter = 100,
                    Reason = "Supplier Purchase Delivery",
                    SupplierOrRecipient = "Mekong Beverage Co., Ltd",
                    Notes = "Initial batch delivery received in good condition.",
                    CreatedByUserId = adminUser?.Id ?? 1,
                    CreatedByUsername = "admin",
                    CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-3)
                },
                new()
                {
                    ReferenceNo = "OUT-20260919-002",
                    MovementType = "OUT",
                    ItemId = sampleItems[0].Id,
                    Quantity = 15,
                    UnitPrice = 2.50m,
                    BalanceBefore = 100,
                    BalanceAfter = 85,
                    Reason = "Retail Store Dispatch",
                    SupplierOrRecipient = "Phnom Penh Central Outlet",
                    Notes = "Dispatched via van delivery.",
                    CreatedByUserId = adminUser?.Id ?? 1,
                    CreatedByUsername = "admin",
                    CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-2)
                },
                new()
                {
                    ReferenceNo = "IN-20260919-003",
                    MovementType = "IN",
                    ItemId = sampleItems[1].Id,
                    Quantity = 500,
                    UnitPrice = 0.85m,
                    BalanceBefore = 0,
                    BalanceAfter = 500,
                    Reason = "Bulk Packaging Receipt",
                    SupplierOrRecipient = "Khmer Carton Packaging Ltd",
                    Notes = "Pallet 1 & 2 stored in Zone B.",
                    CreatedByUserId = adminUser?.Id ?? 1,
                    CreatedByUsername = "admin",
                    CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-2)
                },
                new()
                {
                    ReferenceNo = "OUT-20260920-004",
                    MovementType = "OUT",
                    ItemId = sampleItems[1].Id,
                    Quantity = 50,
                    UnitPrice = 1.60m,
                    BalanceBefore = 500,
                    BalanceAfter = 450,
                    Reason = "Order Fulfillment Packing",
                    SupplierOrRecipient = "Fulfillment Hub #1",
                    Notes = "Used for weekend dispatch orders.",
                    CreatedByUserId = adminUser?.Id ?? 1,
                    CreatedByUsername = "admin",
                    CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-1)
                },
                new()
                {
                    ReferenceNo = "ADJ-20260920-005",
                    MovementType = "ADJUSTMENT",
                    ItemId = sampleItems[2].Id,
                    Quantity = 2,
                    UnitPrice = 45.00m,
                    BalanceBefore = 10,
                    BalanceAfter = 8,
                    Reason = "Damaged during testing",
                    SupplierOrRecipient = "Inventory Audit (Shrinkage)",
                    Notes = "Defective optical reader sent for RMA replacement.",
                    CreatedByUserId = adminUser?.Id ?? 1,
                    CreatedByUsername = "admin",
                    CreatedAtUtc = DateTimeOffset.UtcNow.AddHours(-14)
                }
            };

            context.StockMovements.AddRange(movements);
            await context.SaveChangesAsync();
        }
    }
}
