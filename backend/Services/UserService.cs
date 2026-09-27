using System.Net.Mail;
using backend.Data;
using backend.Models.Data;
using backend.Models.Request;
using backend.Services.Common;
using backend.Services.TwoFactor;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OtpNet;
using QRCoder;

namespace backend.Services;

public class UserService : IUserService
{
    private const int MaxFailedAttempts = 5;
    private const int LockoutDurationMinutes = 30;

    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly ITwoFactorService _twoFactorService;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<AppUser> _passwordHasher;

    public UserService(
        AppDbContext context,
        ITokenService tokenService,
        ITwoFactorService twoFactorService,
        IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
        _twoFactorService = twoFactorService;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<AppUser>();
    }

    public async Task<UserServiceResult<UserResponse>> RegisterAsync(
        RegisterRequest request,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        // 1. Validation
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length < 3 || request.Username.Length > 100)
        {
            return UserServiceResult<UserResponse>.BadRequest("Username must be between 3 and 100 characters.");
        }

        if (string.IsNullOrWhiteSpace(request.Email) || !IsValidEmail(request.Email))
        {
            return UserServiceResult<UserResponse>.BadRequest("A valid email address is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8 || request.Password.Length > 128)
        {
            return UserServiceResult<UserResponse>.BadRequest("Password must be between 8 and 128 characters.");
        }

        // 2. Conflict checks
        var usernameTrimmed = request.Username.Trim();
        var emailTrimmed = request.Email.Trim().ToLowerInvariant();

        var usernameExists = await _context.Users
            .Where(u => u.Username.ToLower() == usernameTrimmed.ToLower())
            .Select(u => u.Id)
            .FirstOrDefaultAsync(cancellationToken) > 0;

        if (usernameExists)
        {
            return UserServiceResult<UserResponse>.Conflict("Username or email already exists");
        }

        var emailExists = await _context.Users
            .Where(u => u.Email.ToLower() == emailTrimmed)
            .Select(u => u.Id)
            .FirstOrDefaultAsync(cancellationToken) > 0;

        if (emailExists)
        {
            return UserServiceResult<UserResponse>.Conflict("Username or email already exists");
        }

        // 3. Create user
        var user = new AppUser
        {
            Username = usernameTrimmed,
            Email = emailTrimmed,
            PasswordHash = string.Empty,
            TwoFactorEnabled = false,
            IsActive = true,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        // Assign default Staff/Support role if exists
        var defaultRole = await _context.Roles.FirstOrDefaultAsync(
            r => r.IsActive && (r.Code == "STAFF" || r.Code == "Staff" || r.Code == "SUPPORT"),
            cancellationToken);
        if (defaultRole != null)
        {
            _context.UserRoles.Add(new AppUserRole
            {
                UserId = user.Id,
                RoleId = defaultRole.Id,
                AssignedAtUtc = DateTimeOffset.UtcNow,
                AssignedBy = user.Id
            });
            await _context.SaveChangesAsync(cancellationToken);
        }

        return UserServiceResult<UserResponse>.Success(
            new UserResponse(user.Id, user.Username, user.Email),
            statusCode: 201);
    }

    public async Task<UserServiceResult<LoginResponse>> LoginAsync(
        LoginRequest request,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid username or password");
        }

        var usernameTrimmed = request.Username.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == usernameTrimmed, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid username or password");
        }

        // Check Lockout
        if (user.LockoutEndUtc.HasValue)
        {
            if (user.LockoutEndUtc.Value > DateTimeOffset.UtcNow)
            {
                return UserServiceResult<LoginResponse>.Locked(
                    "Account is locked.",
                    user.LockoutEndUtc.Value);
            }

            // Lockout expired
            user.LockoutEndUtc = null;
            user.FailedLoginCount = 0;
        }

        // Verify password
        var verifyResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verifyResult == PasswordVerificationResult.Failed)
        {
            user.FailedLoginCount++;
            if (user.FailedLoginCount >= MaxFailedAttempts)
            {
                user.LockoutEndUtc = DateTimeOffset.UtcNow.AddMinutes(LockoutDurationMinutes);
                await _context.SaveChangesAsync(cancellationToken);
                return UserServiceResult<LoginResponse>.Locked(
                    "Account is locked.",
                    user.LockoutEndUtc.Value);
            }

            await _context.SaveChangesAsync(cancellationToken);
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid username or password");
        }

        // Password succeeded - reset failed count
        user.FailedLoginCount = 0;
        user.LockoutEndUtc = null;
        await _context.SaveChangesAsync(cancellationToken);

        // If 2FA is not enabled for this user, issue full access token directly
        if (!user.TwoFactorEnabled)
        {
            var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
            var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, roles);

            return UserServiceResult<LoginResponse>.Success(
                new LoginResponse(
                    RequiresTwoFactor: false,
                    AccessToken: accessToken,
                    ChallengeToken: null,
                    ExpiresAtUtc: expiresAt));
        }

        var (challengeToken, challengeExpiresAt) = _tokenService.GenerateChallengeToken(user);

        // If user already enabled 2FA, prompt for 6-digit TOTP code
        if (user.TwoFactorEnabled && !string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return UserServiceResult<LoginResponse>.Success(
                new LoginResponse(
                    RequiresTwoFactor: true,
                    AccessToken: null,
                    ChallengeToken: challengeToken,
                    ExpiresAtUtc: challengeExpiresAt,
                    RequiresSetup: false));
        }

        // Otherwise (first-time login or 2FA not enabled yet), prompt user to Setup 2FA
        if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            var secretBytes = KeyGeneration.GenerateRandomKey(20);
            user.TwoFactorSecret = Base32Encoding.ToString(secretBytes);
            user.UpdatedAtUtc = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }

        var issuer = _configuration["TwoFactor:Issuer"] ?? "Mekong Stock";
        var otpAuthUri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(user.Email)}?secret={user.TwoFactorSecret}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(otpAuthUri, QRCodeGenerator.ECCLevel.Q);
        var pngByteQrCode = new PngByteQRCode(qrCodeData);
        var qrCodeBytes = pngByteQrCode.GetGraphic(20);
        var qrCodeDataUrl = $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";

        return UserServiceResult<LoginResponse>.Success(
            new LoginResponse(
                RequiresTwoFactor: true,
                AccessToken: null,
                ChallengeToken: challengeToken,
                ExpiresAtUtc: challengeExpiresAt,
                RequiresSetup: true,
                QrCodeDataUrl: qrCodeDataUrl,
                Secret: user.TwoFactorSecret));
    }

    public Task<UserServiceResult<TwoFactorSetupResponse>> SetupTwoFactorAsync(
        int userId,
        string? ipAddress,
        CancellationToken cancellationToken) =>
        _twoFactorService.SetupTwoFactorAsync(userId, ipAddress, cancellationToken);

    public Task<UserServiceResult<MessageResponse>> EnableTwoFactorAsync(
        int userId,
        EnableTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken) =>
        _twoFactorService.EnableTwoFactorAsync(userId, request, ipAddress, cancellationToken);

    public Task<UserServiceResult<LoginResponse>> VerifyTwoFactorLoginAsync(
        VerifyTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken) =>
        _twoFactorService.VerifyTwoFactorLoginAsync(request, ipAddress, cancellationToken);

    public Task<UserServiceResult<MessageResponse>> DisableTwoFactorAsync(
        int userId,
        EnableTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken) =>
        _twoFactorService.DisableTwoFactorAsync(userId, request, ipAddress, cancellationToken);

    private static bool IsValidEmail(string email)
    {
        try
        {
            var mailAddress = new MailAddress(email);
            return mailAddress.Address == email && email.Contains('.');
        }
        catch
        {
            return false;
        }
    }
}
