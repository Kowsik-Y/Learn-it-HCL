$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Learn-it HCL Development Environment..." -ForegroundColor Cyan

$nextProcess = $null
$pythonProcess = $null

try {
    # 1. Start Database
    Write-Host "Starting PostgreSQL Database via Docker..." -ForegroundColor Green
    docker-compose up -d db

    # Wait a few seconds for DB to be ready
    Start-Sleep -Seconds 2

    # 2. Push Schema
    Write-Host "Syncing database schema..." -ForegroundColor Green
    Set-Location apps\web
    npx prisma db push
    Set-Location ..\..

    # 3. Start Next.js (Background)
    Write-Host "Starting Next.js Web App..." -ForegroundColor Green
    # Using pnpm command resolution
    $nextProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c pnpm dev" -WorkingDirectory "apps\web" -PassThru -NoNewWindow

    # 4. Start Python ML Service (Background)
    Write-Host "Starting Python ML Service..." -ForegroundColor Green
    # Need to run uvicorn inside the activated venv context directly via the venv scripts
    $pythonCmd = ".\venv\Scripts\uvicorn.exe"
    $pythonArgs = "app.main:app", "--port", "8001", "--reload"
    $pythonProcess = Start-Process -FilePath $pythonCmd -ArgumentList $pythonArgs -WorkingDirectory "backend" -PassThru -NoNewWindow

    Write-Host "`n✨ All services are running!" -ForegroundColor Cyan
    Write-Host "Web App: http://localhost:3000"
    Write-Host "ML Service: http://localhost:8001"
    Write-Host "Press Ctrl+C to stop all services and exit safely.`n" -ForegroundColor Red

    # Wait indefinitely until interrupted (Ctrl+C)
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`n🛑 Shutting down all services..." -ForegroundColor Red

    if ($null -ne $nextProcess -and -not $nextProcess.HasExited) {
        Write-Host "Stopping Next.js..." -ForegroundColor Cyan
        Stop-Process -Id $nextProcess.Id -Force -ErrorAction SilentlyContinue
    }

    if ($null -ne $pythonProcess -and -not $pythonProcess.HasExited) {
        Write-Host "Stopping Python ML Service..." -ForegroundColor Cyan
        Stop-Process -Id $pythonProcess.Id -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Stopping database container..." -ForegroundColor Cyan
    docker-compose stop db

    Write-Host "✅ All services stopped." -ForegroundColor Green
}
