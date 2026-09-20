using System.Net.Mail;
using backend.Data;
using backend.Models.Data;
using backend.Models.Request;
using backend.Services.Common;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OtpNet;
using QRCoder;

namespace backend.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<AppUser> _passwordHasher;

    public UserService(
        AppDbContext context,
        ITokenService tokenService,
        IConfiguration configuration)
    {
        _context = context;
        _tokenService = tokenService;
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
            .AnyAsync(u => u.Username.ToLower() == usernameTrimmed.ToLower(), cancellationToken);

        if (usernameExists)
        {
            return UserServiceResult<UserResponse>.Conflict("Username or email already exists");
        }

        var emailExists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == emailTrimmed, cancellationToken);

        if (emailExists)
        {
            return UserServiceResult<UserResponse>.Conflict("Username or email already exists");
        }

        // 3. Create User
        var user = new AppUser
        {
            Username = usernameTrimmed,
            Email = emailTrimmed,
            PasswordHash = string.Empty,
            IsActive = true,
            TwoFactorEnabled = false,
            CreatedAtUtc = DateTimeOffset.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

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
                return UserServiceResult<LoginResponse>.Locked("Account is locked.", user.LockoutEndUtc.Value);
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
            if (user.FailedLoginCount >= 5)
            {
                user.LockoutEndUtc = DateTimeOffset.UtcNow.AddMinutes(15);
                await _context.SaveChangesAsync(cancellationToken);
                return UserServiceResult<LoginResponse>.Locked("Account is locked.", user.LockoutEndUtc.Value);
            }

            await _context.SaveChangesAsync(cancellationToken);
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid username or password");
        }

        // Password succeeded - reset failed count
        user.FailedLoginCount = 0;
        user.LockoutEndUtc = null;
        await _context.SaveChangesAsync(cancellationToken);

        // Check if 2FA is required
        if (user.TwoFactorEnabled)
        {
            var (challengeToken, challengeExpiresAt) = _tokenService.GenerateChallengeToken(user);
            return UserServiceResult<LoginResponse>.Success(
                new LoginResponse(
                    RequiresTwoFactor: true,
                    AccessToken: null,
                    ChallengeToken: challengeToken,
                    ExpiresAtUtc: challengeExpiresAt));
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, roles);

        return UserServiceResult<LoginResponse>.Success(
            new LoginResponse(
                RequiresTwoFactor: false,
                AccessToken: accessToken,
                ChallengeToken: null,
                ExpiresAtUtc: expiresAt));
    }

    public async Task<UserServiceResult<TwoFactorSetupResponse>> SetupTwoFactorAsync(
        int userId,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync([userId], cancellationToken);
        if (user == null || !user.IsActive)
        {
            return UserServiceResult<TwoFactorSetupResponse>.Unauthorized("Missing or invalid access token");
        }

        // Generate TOTP Secret (20 bytes Base32)
        var secretBytes = KeyGeneration.GenerateRandomKey(20);
        var secret = Base32Encoding.ToString(secretBytes);

        user.TwoFactorSecret = secret;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var issuer = _configuration["Jwt:Issuer"] ?? "IS405_Auth";
        var otpAuthUri = $"otpauth://totp/{Uri.EscapeDataString(issuer)}:{Uri.EscapeDataString(user.Email)}?secret={secret}&issuer={Uri.EscapeDataString(issuer)}&digits=6";

        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(otpAuthUri, QRCodeGenerator.ECCLevel.Q);
        var pngByteQrCode = new PngByteQRCode(qrCodeData);
        var qrCodeBytes = pngByteQrCode.GetGraphic(20);
        var qrCodeDataUrl = $"data:image/png;base64,{Convert.ToBase64String(qrCodeBytes)}";

        return UserServiceResult<TwoFactorSetupResponse>.Success(
            new TwoFactorSetupResponse(secret, otpAuthUri, qrCodeDataUrl));
    }

    public async Task<UserServiceResult<MessageResponse>> EnableTwoFactorAsync(
        int userId,
        EnableTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TwoFactorCode) ||
            request.TwoFactorCode.Length != 6 ||
            !request.TwoFactorCode.All(char.IsDigit))
        {
            return UserServiceResult<MessageResponse>.BadRequest("Invalid two-factor code or setup is required");
        }

        var user = await _context.Users.FindAsync([userId], cancellationToken);
        if (user == null || !user.IsActive)
        {
            return UserServiceResult<MessageResponse>.Unauthorized("Missing or invalid access token");
        }

        if (user.TwoFactorEnabled)
        {
            return UserServiceResult<MessageResponse>.Conflict("Two-factor authentication is already enabled");
        }

        if (string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return UserServiceResult<MessageResponse>.BadRequest("Invalid two-factor code or setup is required");
        }

        try
        {
            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
            var totp = new Totp(secretBytes);
            var isValid = totp.VerifyTotp(request.TwoFactorCode, out _, VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
            {
                return UserServiceResult<MessageResponse>.BadRequest("Invalid two-factor code or setup is required");
            }
        }
        catch
        {
            return UserServiceResult<MessageResponse>.BadRequest("Invalid two-factor code or setup is required");
        }

        user.TwoFactorEnabled = true;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return UserServiceResult<MessageResponse>.Success(
            new MessageResponse("Two-factor authentication enabled."));
    }

    public async Task<UserServiceResult<LoginResponse>> VerifyTwoFactorLoginAsync(
        VerifyTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ChallengeToken) ||
            string.IsNullOrWhiteSpace(request.TwoFactorCode) ||
            request.TwoFactorCode.Length != 6 ||
            !request.TwoFactorCode.All(char.IsDigit))
        {
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid challenge token or two-factor code");
        }

        var userId = _tokenService.ValidateChallengeToken(request.ChallengeToken);
        if (userId == null)
        {
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid challenge token or two-factor code");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);

        if (user == null || !user.IsActive || string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid challenge token or two-factor code");
        }

        if (user.LockoutEndUtc.HasValue && user.LockoutEndUtc.Value > DateTimeOffset.UtcNow)
        {
            return UserServiceResult<LoginResponse>.Locked("Account is locked.", user.LockoutEndUtc.Value);
        }

        try
        {
            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
            var totp = new Totp(secretBytes);
            var isValid = totp.VerifyTotp(request.TwoFactorCode, out _, VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
            {
                user.FailedLoginCount++;
                if (user.FailedLoginCount >= 5)
                {
                    user.LockoutEndUtc = DateTimeOffset.UtcNow.AddMinutes(15);
                    await _context.SaveChangesAsync(cancellationToken);
                    return UserServiceResult<LoginResponse>.Locked("Account is locked.", user.LockoutEndUtc.Value);
                }

                await _context.SaveChangesAsync(cancellationToken);
                return UserServiceResult<LoginResponse>.Unauthorized("Invalid challenge token or two-factor code");
            }
        }
        catch
        {
            return UserServiceResult<LoginResponse>.Unauthorized("Invalid challenge token or two-factor code");
        }

        // Success
        user.FailedLoginCount = 0;
        user.LockoutEndUtc = null;
        await _context.SaveChangesAsync(cancellationToken);

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        var (accessToken, expiresAt) = _tokenService.GenerateAccessToken(user, roles);

        return UserServiceResult<LoginResponse>.Success(
            new LoginResponse(
                RequiresTwoFactor: false,
                AccessToken: accessToken,
                ChallengeToken: null,
                ExpiresAtUtc: expiresAt));
    }

    public async Task<UserServiceResult<MessageResponse>> DisableTwoFactorAsync(
        int userId,
        EnableTwoFactorRequest request,
        string? ipAddress,
        CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync([userId], cancellationToken);
        if (user == null || !user.IsActive)
        {
            return UserServiceResult<MessageResponse>.Unauthorized("Missing token, invalid token, or invalid two-factor code");
        }

        if (!user.TwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return UserServiceResult<MessageResponse>.Unauthorized("Missing token, invalid token, or invalid two-factor code");
        }

        if (string.IsNullOrWhiteSpace(request.TwoFactorCode) ||
            request.TwoFactorCode.Length != 6 ||
            !request.TwoFactorCode.All(char.IsDigit))
        {
            return UserServiceResult<MessageResponse>.Unauthorized("Missing token, invalid token, or invalid two-factor code");
        }

        try
        {
            var secretBytes = Base32Encoding.ToBytes(user.TwoFactorSecret);
            var totp = new Totp(secretBytes);
            var isValid = totp.VerifyTotp(request.TwoFactorCode, out _, VerificationWindow.RfcSpecifiedNetworkDelay);

            if (!isValid)
            {
                return UserServiceResult<MessageResponse>.Unauthorized("Missing token, invalid token, or invalid two-factor code");
            }
        }
        catch
        {
            return UserServiceResult<MessageResponse>.Unauthorized("Missing token, invalid token, or invalid two-factor code");
        }

        user.TwoFactorEnabled = false;
        user.TwoFactorSecret = null;
        user.UpdatedAtUtc = DateTimeOffset.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return UserServiceResult<MessageResponse>.Success(
            new MessageResponse("Two-factor authentication disabled."));
    }

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
