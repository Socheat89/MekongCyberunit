using backend.Models.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<AppRole> Roles => Set<AppRole>();
    public DbSet<AppPermission> Permissions => Set<AppPermission>();
    public DbSet<AppRolePermission> RolePermissions => Set<AppRolePermission>();
    public DbSet<AppUserRole> UserRoles => Set<AppUserRole>();
    public DbSet<AppPage> Pages => Set<AppPage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // AppUser
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Username).IsUnique();
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Username).HasMaxLength(100);
            entity.Property(u => u.Email).HasMaxLength(256);
        });

        // AppRole
        modelBuilder.Entity<AppRole>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.HasIndex(r => r.Code).IsUnique();
            entity.Property(r => r.Code).HasMaxLength(50);
            entity.Property(r => r.Name).HasMaxLength(100);
            entity.Property(r => r.Description).HasMaxLength(500);
        });

        // AppPage
        modelBuilder.Entity<AppPage>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Code).IsUnique();
            entity.Property(p => p.Code).HasMaxLength(50);
            entity.Property(p => p.Name).HasMaxLength(100);
            entity.Property(p => p.Route).HasMaxLength(200);
            entity.Property(p => p.Icon).HasMaxLength(50);

            entity.HasOne(p => p.Parent)
                  .WithMany(p => p.Children)
                  .HasForeignKey(p => p.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // AppPermission
        modelBuilder.Entity<AppPermission>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasIndex(p => p.Code).IsUnique();
            entity.HasIndex(p => new { p.PageId, p.Action }).IsUnique();
            entity.Property(p => p.Code).HasMaxLength(100);
            entity.Property(p => p.Action).HasMaxLength(30);
            entity.Property(p => p.Description).HasMaxLength(500);

            entity.HasOne(p => p.Page)
                  .WithMany(page => page.Permissions)
                  .HasForeignKey(p => p.PageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AppRolePermission
        modelBuilder.Entity<AppRolePermission>(entity =>
        {
            entity.HasKey(rp => new { rp.RoleId, rp.PermissionId });

            entity.HasOne(rp => rp.Role)
                  .WithMany(r => r.RolePermissions)
                  .HasForeignKey(rp => rp.RoleId);

            entity.HasOne(rp => rp.Permission)
                  .WithMany(p => p.RolePermissions)
                  .HasForeignKey(rp => rp.PermissionId);
        });

        // AppUserRole
        modelBuilder.Entity<AppUserRole>(entity =>
        {
            entity.HasKey(ur => new { ur.UserId, ur.RoleId });

            entity.HasOne(ur => ur.User)
                  .WithMany(u => u.UserRoles)
                  .HasForeignKey(ur => ur.UserId);

            entity.HasOne(ur => ur.Role)
                  .WithMany(r => r.UserRoles)
                  .HasForeignKey(ur => ur.RoleId);
        });
    }
}
