using System.Text;
using Microsoft.AspNetCore.Authorization;
using backend.Data;
using backend.Services;
using backend.Services.Navigation;
using backend.Services.Permission;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "Sqlite";
if (string.Equals(dbProvider, "Oracle", StringComparison.OrdinalIgnoreCase))
{
    var oracleConnection = builder.Configuration.GetConnectionString("OracleConnection")
        ?? throw new InvalidOperationException("OracleConnection string is not configured.");
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseOracle(oracleConnection));
}
else
{
    var sqliteConnection = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=is405.db";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlite(sqliteConnection));
}

// 2. JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "IS405_SuperSecret_Jwt_SigningKey_With_At_Least_256_Bits!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "https://localhost:7230";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "https://localhost:7230";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    };
});

builder.Services.AddAuthorization(options =>
{
    // "FullAuth" policy: requires a fully-authenticated access token.
    // Challenge tokens (issued during 2FA login flow) are rejected here,
    // so navigation, permissions, and roles cannot be accessed until
    // the user completes Two-Factor verification.
    options.AddPolicy("FullAuth", policy =>
        policy.RequireAuthenticatedUser()
              .RequireAssertion(ctx =>
              {
                  var tokenType = ctx.User.FindFirst("token_type")?.Value;
                  return tokenType != "2fa_challenge";
              }));
});

// 3. Application Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<INavigationService, NavigationService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IRoleService, RoleService>();

// 4. Controllers & JSON Options
builder.Services.AddControllers();

// 5. CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 6. Swagger / OpenAPI Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "IS405 Auth, Navigation, Permissions, and Roles API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()
        }
    });
});

var app = builder.Build();

// 7. Seed Database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbSeeder.SeedAsync(db);
}

// 8. HTTP Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

public partial class Program { }
