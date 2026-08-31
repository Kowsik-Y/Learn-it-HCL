$ErrorActionPreference = "Stop"

Write-Host "Starting Learn-it HCL Development Environment..." -ForegroundColor Cyan

$root        = $PSScriptRoot
$nextProcess = $null
$pythonProcess = $null

try {
    # 1. Start Database
    Write-Host "Starting PostgreSQL Database via Docker..." -ForegroundColor Green
    Set-Location $root
    docker-compose up -d db

    # Wait for DB healthy (up to 30s)
    Write-Host "Waiting for database to be ready..." -ForegroundColor Cyan
    $waited = 0
    while ($waited -lt 30) {
        $status = docker inspect --format="{{.State.Health.Status}}" learn-it-hcl-db-1 2>$null
        if ($status -eq "healthy") { break }
        Start-Sleep -Seconds 3; $waited += 3
        Write-Host "  ... ${waited}s ($status)"
    }
    Write-Host "Database ready!" -ForegroundColor Green

    # 2. Push Schema
    Write-Host "Syncing database schema..." -ForegroundColor Green
    Set-Location "$root\apps\web"
    npx prisma db push
    Set-Location $root

    # 3. Start Next.js (background window)
    Write-Host "Starting Next.js Web App on http://localhost:3000 ..." -ForegroundColor Green
    $nextProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c pnpm dev" `
        -WorkingDirectory "$root\apps\web" `
        -PassThru -NoNewWindow

    # 4. Start Python ML Service using absolute path to venv uvicorn
    Write-Host "Starting Python ML Service on http://localhost:8001 ..." -ForegroundColor Green
    $uvicorn     = "$root\backend\venv\Scripts\uvicorn.exe"
    $pythonProcess = Start-Process -FilePath $uvicorn `
        -ArgumentList "app.main:app", "--port", "8001", "--reload" `
        -WorkingDirectory "$root\backend" `
        -PassThru -NoNewWindow

    Write-Host "`nAll services are running!" -ForegroundColor Cyan
    Write-Host "  Web App   : http://localhost:3000"
    Write-Host "  ML Service: http://localhost:8001"
    Write-Host "  Press Ctrl+C to stop everything.`n" -ForegroundColor Red

    while ($true) { Start-Sleep -Seconds 2 }
}
finally {
    Write-Host "`nShutting down all services..." -ForegroundColor Red

    if ($null -ne $nextProcess -and -not $nextProcess.HasExited) {
        Write-Host "Stopping Next.js..." -ForegroundColor Cyan
        Stop-Process -Id $nextProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($null -ne $pythonProcess -and -not $pythonProcess.HasExited) {
        Write-Host "Stopping ML Service..." -ForegroundColor Cyan
        Stop-Process -Id $pythonProcess.Id -Force -ErrorAction SilentlyContinue
    }

    Set-Location $root
    Write-Host "Stopping database container..." -ForegroundColor Cyan
    docker-compose stop db
    Write-Host "All services stopped." -ForegroundColor Green
}
