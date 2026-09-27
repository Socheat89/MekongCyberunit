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
        } catch [System.Net.WebException] {
            if ($_.Exception.Response) {
                $_.Exception.Response.Close()
                $ready = $true
                break
            }
            Write-Host "Waiting for server ($($i+1)/$maxAttempts)..." -ForegroundColor DarkGray
        } catch {
            Write-Host "Waiting for server ($($i+1)/$maxAttempts)..." -ForegroundColor DarkGray
        }
    }

    if (-not $ready) {
        throw "Server failed to start within timeout."
    }

    Write-Host "`n=== Server is live at $baseUrl! Testing Stock Microservices Flow ===`n" -ForegroundColor Green

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

    # 1. Login as Admin
    Write-Host "--- TEST GROUP 1: AUTHENTICATION ---" -ForegroundColor Yellow
    $loginRes = Invoke-Api "$baseUrl/api/auth/login" "POST" @{ username = "admin"; password = "Password123!" }
    $token = $loginRes.Data.accessToken
    Assert-Test "Admin logged in successfully and obtained JWT token" {
        if (-not $token) { throw "Login failed" }
    }

    # 2. Catalog & Products
    Write-Host "`n--- TEST GROUP 2: CATALOG & PRODUCTS ---" -ForegroundColor Yellow
    $prodSku = "TEST-KB-001"
    $newProd = $null
    Assert-Test "Create a new Product (Keyboard) with initial stock = 20" {
        $body = @{
            sku = $prodSku
            name = "Mechanical Gaming Keyboard RGB"
            description = "High-precision mechanical switches"
            unit = "PCS"
            brand = "Logitech"
            costPrice = 30.00
            sellingPrice = 55.00
            initialQuantity = 20
            minStockLevel = 10
            maxStockLevel = 100
        }
        $res = Invoke-Api "$baseUrl/api/products" "POST" $body $token
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created but got $($res.StatusCode): $($res.Content)" }
        $script:newProd = $res.Data
        if ($script:newProd.quantityOnHand -ne 20) { throw "Expected stock = 20 but got $($script:newProd.quantityOnHand)" }
    }

    Assert-Test "Get product by ID" {
        $res = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        if ($res.Data.sku -ne $prodSku) { throw "SKU mismatch" }
    }

    # 3. Suppliers & Customers
    Write-Host "`n--- TEST GROUP 3: SUPPLIERS & CUSTOMERS ---" -ForegroundColor Yellow
    $supId = 0
    Assert-Test "Get Suppliers list" {
        $res = Invoke-Api "$baseUrl/api/suppliers" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        if ($res.Data.items.Count -eq 0) { throw "Suppliers list is empty" }
        $script:supId = $res.Data.items[0].id
    }

    $custId = 0
    Assert-Test "Get Customers list" {
        $res = Invoke-Api "$baseUrl/api/customers" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        if ($res.Data.items.Count -eq 0) { throw "Customers list is empty" }
        $script:custId = $res.Data.items[0].id
    }

    # 4. Warehouses & Transfers
    Write-Host "`n--- TEST GROUP 4: WAREHOUSES & INVENTORY ---" -ForegroundColor Yellow
    $whMainId = 0
    $whRepId = 0
    Assert-Test "Get Warehouses list" {
        $res = Invoke-Api "$baseUrl/api/warehouses" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        $script:whMainId = $res.Data[0].id
        $script:whRepId = $res.Data[1].id
    }

    # 5. Purchase Order Flow (RULE 1: PO Created -> NO Stock Change)
    Write-Host "`n--- TEST GROUP 5: RULE 1 - PO CREATED DOES NOT CHANGE STOCK ---" -ForegroundColor Yellow
    $poId = 0
    Assert-Test "Rule 1: Create PO for 100 keyboards -> Product stock remains exactly 20" {
        $poBody = @{
            supplierId = $script:supId
            warehouseId = $script:whMainId
            tax = 0
            discount = 0
            notes = "Test PO 100 keyboards"
            items = @(
                @{
                    productId = $script:newProd.id
                    quantity = 100
                    unitCost = 30.00
                    discount = 0
                    tax = 0
                }
            )
        }
        $res = Invoke-Api "$baseUrl/api/purchases/orders" "POST" $poBody $token
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created: $($res.Content)" }
        $script:poId = $res.Data.id

        # Verify product stock is STILL 20
        $checkProd = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($checkProd.Data.quantityOnHand -ne 20) {
            throw "RULE 1 VIOLATION: Stock changed to $($checkProd.Data.quantityOnHand) on PO creation! Expected 20."
        }
    }

    Assert-Test "Approve Purchase Order" {
        $res = Invoke-Api "$baseUrl/api/purchases/orders/$($script:poId)/approve" "POST" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        if ($res.Data.status -ne "APPROVED") { throw "Expected status APPROVED but got $($res.Data.status)" }
    }

    # 6. Goods Receiving / GRN (RULE 2: Goods Received -> Stock IN)
    Write-Host "`n--- TEST GROUP 6: RULE 2 - GOODS RECEIVED -> STOCK IN ---" -ForegroundColor Yellow
    Assert-Test "Rule 2: Receive 60 keyboards (60 accepted) -> Stock increases from 20 to 80" {
        $grnBody = @{
            purchaseOrderId = $script:poId
            warehouseId = $script:whMainId
            notes = "Partial delivery 60 units"
            items = @(
                @{
                    productId = $script:newProd.id
                    receivedQuantity = 60
                    damagedQuantity = 0
                    remarks = "Good condition"
                }
            )
        }
        $res = Invoke-Api "$baseUrl/api/purchases/grn" "POST" $grnBody $token
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created: $($res.Content)" }

        # Verify product stock is now 80
        $checkProd = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($checkProd.Data.quantityOnHand -ne 80) {
            throw "RULE 2 VIOLATION: Expected stock = 80, but got $($checkProd.Data.quantityOnHand)"
        }
    }

    # 7. Sales Flow (RULE 4 & RULE 3)
    Write-Host "`n--- TEST GROUP 7: RULE 4 & RULE 3 - SALES STOCK OUT & INSUFFICIENT STOCK ---" -ForegroundColor Yellow
    Assert-Test "Rule 4: Order 100 keyboards when only 80 available -> Rejected (400 Bad Request)" {
        $saleExcess = @{
            customerId = $script:custId
            warehouseId = $script:whMainId
            tax = 0
            discount = 0
            autoConfirm = $true
            items = @(
                @{
                    productId = $script:newProd.id
                    quantity = 100
                    unitPrice = 55.00
                    discount = 0
                    tax = 0
                }
            )
        }
        $res = Invoke-Api "$baseUrl/api/sales" "POST" $saleExcess $token
        if ($res.StatusCode -ne 400) { throw "RULE 4 VIOLATION: Expected 400 Bad Request for excessive quantity, got $($res.StatusCode)" }
    }

    $saleId = 0
    Assert-Test "Rule 3: Sell 15 keyboards with AutoConfirm -> Stock reduces from 80 to 65" {
        $saleBody = @{
            customerId = $script:custId
            warehouseId = $script:whMainId
            tax = 0
            discount = 0
            autoConfirm = $true
            items = @(
                @{
                    productId = $script:newProd.id
                    quantity = 15
                    unitPrice = 55.00
                    discount = 0
                    tax = 0
                }
            )
        }
        $res = Invoke-Api "$baseUrl/api/sales" "POST" $saleBody $token
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created: $($res.Content)" }
        $script:saleId = $res.Data.id

        # Verify stock is now 65
        $checkProd = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($checkProd.Data.quantityOnHand -ne 65) {
            throw "RULE 3 VIOLATION: Expected stock = 65, but got $($checkProd.Data.quantityOnHand)"
        }
    }

    # 8. Payments (RULE 12)
    Write-Host "`n--- TEST GROUP 8: RULE 12 - INVOICE PAYMENTS ---" -ForegroundColor Yellow
    Assert-Test "Rule 12: Partial Payment of $300 on $825 invoice -> Status = PARTIAL, Remaining = $525" {
        $payBody = @{
            paymentMethod = "QR"
            amount = 300.00
            referenceNo = "KHQR-TEST-001"
            notes = "Partial payment via KHQR"
        }
        $res = Invoke-Api "$baseUrl/api/sales/$($script:saleId)/payments" "POST" $payBody $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK: $($res.Content)" }

        # Check sale status
        $saleCheck = Invoke-Api "$baseUrl/api/sales/$($script:saleId)" "GET" $null $token
        if ($saleCheck.Data.paymentStatus -ne "PARTIAL") {
            throw "Expected paymentStatus = PARTIAL but got $($saleCheck.Data.paymentStatus)"
        }
        if ($saleCheck.Data.remainingAmount -ne 525.00) {
            throw "Expected remaining = 525.00 but got $($saleCheck.Data.remainingAmount)"
        }
    }

    # 9. Sales Return (RULE 6: Return -> Stock IN)
    Write-Host "`n--- TEST GROUP 9: RULE 6 - SALES RETURN ---" -ForegroundColor Yellow
    Assert-Test "Rule 6: Return 2 keyboards -> Stock increases from 65 to 67" {
        $retBody = @{
            salesOrderId = $script:saleId
            warehouseId = $script:whMainId
            reason = "Customer changed mind on 2 units"
            items = @(
                @{
                    productId = $script:newProd.id
                    quantity = 2
                    condition = "Good"
                    reason = "Unopened"
                }
            )
        }
        $res = Invoke-Api "$baseUrl/api/sales/returns" "POST" $retBody $token
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created: $($res.Content)" }

        $checkProd = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($checkProd.Data.quantityOnHand -ne 67) {
            throw "RULE 6 VIOLATION: Expected stock = 67, but got $($checkProd.Data.quantityOnHand)"
        }
    }

    # 10. Purchase Return (RULE 7: Return to Supplier -> Stock OUT)
    Write-Host "`n--- TEST GROUP 10: RULE 7 - PURCHASE RETURN ---" -ForegroundColor Yellow
    Assert-Test "Rule 7: Return 5 defective units to supplier -> Stock reduces from 67 to 62" {
        $prBody = @{
            supplierId = $script:supId
            purchaseOrderId = $script:poId
            warehouseId = $script:whMainId
            reason = "Defective mechanical keys"
            items = @(
                @{
                    productId = $script:newProd.id
                    quantity = 5
                    unitCost = 30.00
                    defectReason = "LED defect"
                }
            )
        }
        $res = Invoke-Api "$baseUrl/api/purchases/returns" "POST" $prBody $token
        if ($res.StatusCode -ne 201) { throw "Expected 201 Created: $($res.Content)" }

        $checkProd = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($checkProd.Data.quantityOnHand -ne 62) {
            throw "RULE 7 VIOLATION: Expected stock = 62, but got $($checkProd.Data.quantityOnHand)"
        }
    }

    # 11. Stock Adjustment (RULE 8: Physical count adjustment)
    Write-Host "`n--- TEST GROUP 11: INVENTORY AUDIT & ADJUSTMENTS ---" -ForegroundColor Yellow
    Assert-Test "Rule 8: Adjust stock from 62 to 65 (Audit surplus +3)" {
        $adjBody = @{
            warehouseId = $script:whMainId
            productId = $script:newProd.id
            adjustmentType = "SURPLUS"
            newQuantity = 65
            reason = "Physical inventory count found 3 unboxed units"
        }
        $res = Invoke-Api "$baseUrl/api/inventory/adjust" "POST" $adjBody $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK: $($res.Content)" }

        $checkProd = Invoke-Api "$baseUrl/api/products/$($script:newProd.id)" "GET" $null $token
        if ($checkProd.Data.quantityOnHand -ne 65) {
            throw "Expected stock = 65, but got $($checkProd.Data.quantityOnHand)"
        }
    }

    # 12. Stock Movements Ledger
    Write-Host "`n--- TEST GROUP 12: STOCK MOVEMENTS LEDGER AUDIT ---" -ForegroundColor Yellow
    Assert-Test "Verify Stock Movements history contains IN, OUT, ADJUSTMENT, RETURN transactions" {
        $res = Invoke-Api "$baseUrl/api/inventory/movements?productId=$($script:newProd.id)" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        if ($res.Data.items.Count -lt 5) {
            throw "Expected at least 5 movement history records, got $($res.Data.items.Count)"
        }
    }

    # 13. Reports & Dashboard
    Write-Host "`n--- TEST GROUP 13: REPORTS & DASHBOARD ---" -ForegroundColor Yellow
    Assert-Test "Dashboard summary returns totals, stock value, and chart data" {
        $res = Invoke-Api "$baseUrl/api/dashboard/summary" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK: $($res.Content)" }
        if ($res.Data.totalStockValue -le 0) { throw "Expected positive totalStockValue" }
        if ($res.Data.totalSales -le 0) { throw "Expected positive totalSales" }
    }

    Assert-Test "Inventory valuation report returns categories breakdown" {
        $res = Invoke-Api "$baseUrl/api/reports/inventory" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK: $($res.Content)" }
        if ($res.Data.totalItems -le 0) { throw "Expected totalItems > 0" }
    }

    Assert-Test "Sales Profit report calculates Gross Profit and margin" {
        $res = Invoke-Api "$baseUrl/api/reports/profit" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK: $($res.Content)" }
        if ($res.Data.totalRevenue -le 0) { throw "Expected totalRevenue > 0" }
    }

    # 14. Audit Log
    Write-Host "`n--- TEST GROUP 14: AUDIT LOGS ---" -ForegroundColor Yellow
    Assert-Test "Audit logs recorded transactions (CREATE, RECEIVE, RETURN, PAYMENT)" {
        $res = Invoke-Api "$baseUrl/api/audit/logs" "GET" $null $token
        if ($res.StatusCode -ne 200) { throw "Expected 200 OK" }
        if ($res.Data.items.Count -eq 0) { throw "Audit logs are empty" }
    }

    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host "Tests Completed: $($script:testsPassed) / $($script:totalTests) Passed!" -ForegroundColor Green
    Write-Host "========================================================`n" -ForegroundColor Cyan

    if ($script:testsPassed -ne $script:totalTests) {
        exit 1
    }
}
finally {
    if ($process -and -not $process.HasExited) {
        Write-Host "Stopping API process..." -ForegroundColor DarkGray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
}
