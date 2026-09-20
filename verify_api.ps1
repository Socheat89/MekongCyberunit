$baseUrl = "http://localhost:5230"
$ErrorActionPreference = "Stop"

# Terminate any lingering dotnet processes on port 5230
Get-Process -Name "dotnet", "backend" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
if (Test-Path "backend/is405.db") {
    Remove-Item "backend/is405.db" -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting ASP.NET Core API process..." -ForegroundColor Cyan
$process = Start-Process -FilePath "dotnet" -ArgumentList "run --project backend/backend.csproj --launch-profile http" -PassThru -NoNewWindow


try {
    # Wait for API to be responsive
    $maxAttempts = 30
    $ready = $false
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        Start-Sleep -Seconds 1
        try {
            $req = [System.Net.HttpWebRequest]::Create("$baseUrl/api/permissions")
            $req.Timeout = 2000
            $res = $req.GetResponse()
            $res.Close()
            $ready = $true
            break
        } catch {
            Write-Host "Waiting for server ($($i+1)/$maxAttempts)..." -ForegroundColor DarkGray
        }
    }

    if (-not $ready) {
        throw "Server failed to start within timeout."
    }

    Write-Host "`n=== Server is live at $baseUrl! Running Verification Tests ===`n" -ForegroundColor Green

    $script:testsPassed = 0
    $script:totalTests = 0

    function Assert-Test([string]$name, [scriptblock]$action) {
        $script:totalTests++
        try {
            & $action
            Write-Host "  [PASS] $name" -ForegroundColor Green
            $script:testsPassed++
        } catch {
            Write-Host "  [FAIL] ${name}: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    function Invoke-Api([string]$uri, [string]$method = "GET", $body = $null, [string]$token = $null) {
        $jsonBody = if ($body -is [string]) { $body } elseif ($body) { $body | ConvertTo-Json -Depth 5 } else { $null }

        $request = [System.Net.HttpWebRequest]::Create($uri)
        $request.Method = $method
        if ($token) { $request.Headers["Authorization"] = "Bearer $token" }
        if ($jsonBody) {
            $request.ContentType = "application/json"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
            $request.ContentLength = $bytes.Length
            $stream = $request.GetRequestStream()
            $stream.Write($bytes, 0, $bytes.Length)
            $stream.Close()
        } elseif ($method -eq "POST" -or $method -eq "PUT") {
            $request.ContentLength = 0
        }

        try {
            $response = $request.GetResponse()
            $statusCode = [int]$response.StatusCode
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $content = $reader.ReadToEnd()
            $reader.Close()
            $response.Close()
            $data = $null
            if (-not [string]::IsNullOrWhiteSpace($content)) {
                $trimmed = $content.Trim()
                if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
                    $data = $content | ConvertFrom-Json
                }
            }
            return [PSCustomObject]@{ StatusCode = $statusCode; Content = $content; Data = $data }
        } catch [System.Net.WebException] {
            $resp = $_.Exception.Response
            if ($resp) {
                $statusCode = [int]$resp.StatusCode
                $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
                $content = $reader.ReadToEnd()
                $reader.Close()
                $resp.Close()
                $data = $null
                if (-not [string]::IsNullOrWhiteSpace($content)) {
                    $trimmed = $content.Trim()
                    if ($trimmed.StartsWith("{") -or $trimmed.StartsWith("[")) {
                        $data = $content | ConvertFrom-Json
                    }
                }
                return [PSCustomObject]@{ StatusCode = $statusCode; Content = $content; Data = $data }
            }
            throw
        }
    }

    # Load Otp.Net for TOTP generation in tests
    $otpDll = (Get-Item ~\.nuget\packages\otp.net\1.4.1\lib\net461\Otp.NET.dll).FullName
    Add-Type -Path $otpDll

    $script:adminToken = $null
    $script:aliceToken = $null
    $script:aliceSecret = $null
    $script:challengeToken = $null
    $script:newPermId = 0
    $script:newRoleId = 0

    Write-Host "--- TEST GROUP 1: AUTH - REGISTER ---" -ForegroundColor Yellow

    Assert-Test "Register new user returns 201 Created with UserResponse" {
        $body = @{ username = "alice"; email = "alice@example.com"; password = "Password123!" }
        $res = Invoke-Api "$baseUrl/api/auth/register" "POST" $body
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created but got $($res.StatusCode)" }
        if ($res.Data.username -ne "alice") { throw "Expected username 'alice' but got '$($res.Data.username)'" }
        if ($res.Data.email -ne "alice@example.com") { throw "Expected email 'alice@example.com'" }
    }

    Assert-Test "Register duplicate username returns 409 Conflict" {
        $body = @{ username = "alice"; email = "another@example.com"; password = "Password123!" }
        $res = Invoke-Api "$baseUrl/api/auth/register" "POST" $body
        if ($res.StatusCode -ne 409) { throw "Expected 409 Conflict but got $($res.StatusCode)" }
        if ($res.Data.message -ne "Username or email already exists") { throw "Unexpected message: $($res.Data.message)" }
    }

    Assert-Test "Register duplicate email returns 409 Conflict" {
        $body = @{ username = "alice_new"; email = "alice@example.com"; password = "Password123!" }
        $res = Invoke-Api "$baseUrl/api/auth/register" "POST" $body
        if ($res.StatusCode -ne 409) { throw "Expected 409 Conflict but got $($res.StatusCode)" }
    }

    Assert-Test "Register with short password returns 400 Bad Request" {
        $body = @{ username = "baduser"; email = "bad@example.com"; password = "123" }
        $res = Invoke-Api "$baseUrl/api/auth/register" "POST" $body
        if ($res.StatusCode -ne 400) { throw "Expected 400 Bad Request but got $($res.StatusCode)" }
    }

    Write-Host "`n--- TEST GROUP 2: AUTH - LOGIN & LOCKOUT ---" -ForegroundColor Yellow

    Assert-Test "Login with seeded admin returns 200 OK and JWT access token" {
        $body = @{ username = "admin"; password = "Password123!" }
        $res = Invoke-Api "$baseUrl/api/auth/login" "POST" $body
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.requiresTwoFactor -ne $false) { throw "Expected requiresTwoFactor=false" }
        if ([string]::IsNullOrWhiteSpace($res.Data.accessToken)) { throw "Expected non-empty accessToken" }
        $script:adminToken = $res.Data.accessToken
    }

    Assert-Test "Login with invalid password returns 401 Unauthorized" {
        $body = @{ username = "admin"; password = "WrongPassword!" }
        $res = Invoke-Api "$baseUrl/api/auth/login" "POST" $body
        if ($res.StatusCode -ne 401) { throw "Expected 401 Unauthorized but got $($res.StatusCode)" }
    }

    Assert-Test "5 consecutive failed logins trigger 423 Locked with LockoutEndUtc" {
        $reg = Invoke-Api "$baseUrl/api/auth/register" "POST" @{ username = "lockme"; email = "lockme@example.com"; password = "Password123!" }
        if ($reg.StatusCode -ne 201) { throw "Setup failed: could not register lockme" }

        for ($k = 1; $k -le 4; $k++) {
            $f = Invoke-Api "$baseUrl/api/auth/login" "POST" @{ username = "lockme"; password = "WrongPassword!" }
            if ($f.StatusCode -ne 401) { throw "Attempt ${k}: Expected 401 Unauthorized but got $($f.StatusCode)" }
        }

        # 5th attempt must return 423 Locked
        $res5 = Invoke-Api "$baseUrl/api/auth/login" "POST" @{ username = "lockme"; password = "WrongPassword!" }
        if ($res5.StatusCode -ne 423) { throw "5th attempt: Expected 423 Locked but got $($res5.StatusCode)" }
        if (-not $res5.Data.lockoutEndUtc) { throw "Expected lockoutEndUtc in response" }
        if ($res5.Data.message -ne "Account is locked.") { throw "Expected 'Account is locked.' message" }

        # Subsequent attempt (even with correct password) returns 423 Locked
        $res6 = Invoke-Api "$baseUrl/api/auth/login" "POST" @{ username = "lockme"; password = "Password123!" }
        if ($res6.StatusCode -ne 423) { throw "Subsequent attempt: Expected 423 Locked but got $($res6.StatusCode)" }
    }

    Write-Host "`n--- TEST GROUP 3: AUTH - 2FA FULL LIFECYCLE ---" -ForegroundColor Yellow

    Assert-Test "Alice logs in and gets access token" {
        $res = Invoke-Api "$baseUrl/api/auth/login" "POST" @{ username = "alice"; password = "Password123!" }
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        $script:aliceToken = $res.Data.accessToken
    }

    Assert-Test "POST /api/auth/2fa/setup returns secret, otpAuthUri, and qrCodeDataUrl" {
        $res = Invoke-Api "$baseUrl/api/auth/2fa/setup" "POST" $null $script:aliceToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ([string]::IsNullOrWhiteSpace($res.Data.secret)) { throw "Expected secret" }
        if (-not $res.Data.otpAuthUri.StartsWith("otpauth://totp/")) { throw "Expected otpAuthUri format" }
        if (-not $res.Data.qrCodeDataUrl.StartsWith("data:image/png;base64,")) { throw "Expected qrCodeDataUrl format" }
        $script:aliceSecret = $res.Data.secret
    }

    Assert-Test "POST /api/auth/2fa/enable with invalid code returns 400 Bad Request" {
        $res = Invoke-Api "$baseUrl/api/auth/2fa/enable" "POST" @{ twoFactorCode = "000000" } $script:aliceToken
        if ($res.StatusCode -ne 400) { throw "Expected 400 Bad Request but got $($res.StatusCode)" }
    }

    Assert-Test "POST /api/auth/2fa/enable with valid TOTP enables 2FA" {
        $secretBytes = [OtpNet.Base32Encoding]::ToBytes($script:aliceSecret)
        $totp = [OtpNet.Totp]::new($secretBytes)
        $code = $totp.ComputeTotp()

        $res = Invoke-Api "$baseUrl/api/auth/2fa/enable" "POST" @{ twoFactorCode = $code } $script:aliceToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.message -ne "Two-factor authentication enabled.") { throw "Unexpected message: $($res.Data.message)" }
    }

    Assert-Test "Login as Alice now requires 2FA and returns ChallengeToken" {
        $res = Invoke-Api "$baseUrl/api/auth/login" "POST" @{ username = "alice"; password = "Password123!" }
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.requiresTwoFactor -ne $true) { throw "Expected requiresTwoFactor=true" }
        if ([string]::IsNullOrWhiteSpace($res.Data.challengeToken)) { throw "Expected challengeToken" }
        if ($res.Data.accessToken -ne $null) { throw "Expected accessToken to be null" }
        $script:challengeToken = $res.Data.challengeToken
    }

    Assert-Test "POST /api/auth/2fa/verify-login completes login and returns access token" {
        $secretBytes = [OtpNet.Base32Encoding]::ToBytes($script:aliceSecret)
        $totp = [OtpNet.Totp]::new($secretBytes)
        $code = $totp.ComputeTotp()

        $res = Invoke-Api "$baseUrl/api/auth/2fa/verify-login" "POST" @{ challengeToken = $script:challengeToken; twoFactorCode = $code }
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.requiresTwoFactor -ne $false) { throw "Expected requiresTwoFactor=false" }
        if ([string]::IsNullOrWhiteSpace($res.Data.accessToken)) { throw "Expected accessToken" }
        $script:aliceToken = $res.Data.accessToken
    }

    Assert-Test "POST /api/auth/2fa/disable with valid code disables 2FA" {
        $secretBytes = [OtpNet.Base32Encoding]::ToBytes($script:aliceSecret)
        $totp = [OtpNet.Totp]::new($secretBytes)
        $code = $totp.ComputeTotp()

        $res = Invoke-Api "$baseUrl/api/auth/2fa/disable" "POST" @{ twoFactorCode = $code } $script:aliceToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.message -ne "Two-factor authentication disabled.") { throw "Unexpected message: $($res.Data.message)" }
    }

    Write-Host "`n--- TEST GROUP 4: NAVIGATION API ---" -ForegroundColor Yellow

    Assert-Test "GET /api/navigation/me returns hierarchical tree for Admin" {
        $res = Invoke-Api "$baseUrl/api/navigation/me" "GET" $null $script:adminToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        $items = @($res.Data)
        if ($items.Count -lt 1) { throw "Expected at least 1 navigation item" }
        $codes = $items | ForEach-Object { $_.code }
        if ($codes -notcontains "dashboard") { throw "Expected dashboard in navigation" }
        if ($codes -notcontains "units") { throw "Expected units in navigation" }
    }

    Assert-Test "GET /api/navigation/me without token returns 401 Unauthorized" {
        $res = Invoke-Api "$baseUrl/api/navigation/me" "GET"
        if ($res.StatusCode -ne 401) { throw "Expected 401 Unauthorized but got $($res.StatusCode)" }
    }

    Write-Host "`n--- TEST GROUP 5: PERMISSIONS API ---" -ForegroundColor Yellow

    Assert-Test "GET /api/permissions returns all permissions" {
        $res = Invoke-Api "$baseUrl/api/permissions" "GET"
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        $items = @($res.Data)
        if ($items.Count -lt 3) { throw "Expected at least 3 permissions" }
        $unitPerm = $items | Where-Object { $_.code -eq "units.view" }
        if (-not $unitPerm) { throw "Expected 'units.view' permission" }
    }

    Assert-Test "GET /api/permissions/1 returns permission by ID" {
        $res = Invoke-Api "$baseUrl/api/permissions/1" "GET"
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.id -ne 1) { throw "Expected ID 1" }
    }

    Assert-Test "GET /api/permissions/9999 returns 404 Not Found" {
        $res = Invoke-Api "$baseUrl/api/permissions/9999" "GET"
        if ($res.StatusCode -ne 404) { throw "Expected 404 Not Found but got $($res.StatusCode)" }
    }

    Assert-Test "POST /api/permissions creates a new permission" {
        $body = @{ pageId = 2; action = "create"; description = "Create units" }
        $res = Invoke-Api "$baseUrl/api/permissions" "POST" $body $script:adminToken
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created but got $($res.StatusCode)" }
        if ($res.Data.code -ne "units.create") { throw "Expected code 'units.create' but got '$($res.Data.code)'" }
        $script:newPermId = $res.Data.id
    }

    Assert-Test "POST /api/permissions with duplicate code returns 409 Conflict" {
        $body = @{ pageId = 2; action = "create"; description = "Create units duplicate" }
        $res = Invoke-Api "$baseUrl/api/permissions" "POST" $body $script:adminToken
        if ($res.StatusCode -ne 409) { throw "Expected 409 Conflict but got $($res.StatusCode)" }
    }

    Assert-Test "PUT /api/permissions/{id} updates permission" {
        $body = @{ description = "Updated description"; isActive = $true }
        $res = Invoke-Api "$baseUrl/api/permissions/$($script:newPermId)" "PUT" $body $script:adminToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.description -ne "Updated description") { throw "Expected updated description" }
    }

    Write-Host "`n--- TEST GROUP 6: ROLES API ---" -ForegroundColor Yellow

    Assert-Test "GET /api/roles returns paginated roles with counts" {
        $res = Invoke-Api "$baseUrl/api/roles?pageNumber=1&pageSize=10&status=active" "GET" $null $script:adminToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.pageNumber -ne 1) { throw "Expected pageNumber=1" }
        if ($res.Data.totalRoles -lt 2) { throw "Expected at least 2 total roles" }
        if ($res.Data.activeRoles -lt 2) { throw "Expected at least 2 active roles" }
    }

    Assert-Test "GET /api/roles/1 returns ADMIN role" {
        $res = Invoke-Api "$baseUrl/api/roles/1" "GET" $null $script:adminToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.code -ne "ADMIN") { throw "Expected code ADMIN" }
    }

    Assert-Test "GET /api/roles/9999 returns 404 Not Found" {
        $res = Invoke-Api "$baseUrl/api/roles/9999" "GET" $null $script:adminToken
        if ($res.StatusCode -ne 404) { throw "Expected 404 Not Found but got $($res.StatusCode)" }
    }

    Assert-Test "POST /api/roles creates new role" {
        $body = @{ code = "SUPPORT"; name = "Support Agent"; description = "Customer support" }
        $res = Invoke-Api "$baseUrl/api/roles" "POST" $body $script:adminToken
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created but got $($res.StatusCode)" }
        if ($res.Data.code -ne "SUPPORT") { throw "Expected code 'SUPPORT'" }
        $script:newRoleId = $res.Data.id
    }

    Assert-Test "POST /api/roles with existing code returns 409 Conflict" {
        $body = @{ code = "ADMIN"; name = "Administrator Duplicate"; description = "Duplicate" }
        $res = Invoke-Api "$baseUrl/api/roles" "POST" $body $script:adminToken
        if ($res.StatusCode -ne 409) { throw "Expected 409 Conflict but got $($res.StatusCode)" }
    }

    Assert-Test "PUT /api/roles/{id} updates role" {
        $body = @{ name = "Senior Support Agent"; description = "Tier 2 support"; isActive = $true }
        $res = Invoke-Api "$baseUrl/api/roles/$($script:newRoleId)" "PUT" $body $script:adminToken
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK but got $($res.StatusCode)" }
        if ($res.Data.name -ne "Senior Support Agent") { throw "Expected name 'Senior Support Agent'" }
    }

    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "TEST SUMMARY: $script:testsPassed / $script:totalTests passed." -ForegroundColor $(if ($script:testsPassed -eq $script:totalTests) { "Green" } else { "Red" })
    Write-Host "========================================================`n" -ForegroundColor Cyan

    if ($script:testsPassed -ne $script:totalTests) {
        exit 1
    }
} finally {
    Write-Host "Stopping ASP.NET Core API process..." -ForegroundColor Cyan
    if ($process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
    }
}
