Write-Host "Starting Learn-it HCL project initialization..." -ForegroundColor Cyan
Write-Host ""

$root = $PSScriptRoot

# ============================================================
# 1. Setup Web / Next.js
# ============================================================
Write-Host "Setting up Web (Next.js)..." -ForegroundColor Yellow
Set-Location "$root\apps\web"

# corepack enable pnpm  # Skipped: requires Admin. pnpm is already available.
pnpm install

if (-not (Test-Path .env)) {
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "Created .env for Web" -ForegroundColor Green
    } else {
        Write-Warning ".env.example not found — skipping copy. Please create apps\web\.env manually."
    }
}

# Generate Prisma Client
npx prisma generate
Set-Location $root
Write-Host ""

# ============================================================
# 2. Prisma DB push + Super Admin
# ============================================================
Write-Host "Setting up initial Super Admin Account..." -ForegroundColor Yellow
Write-Host "Starting database container..." -ForegroundColor Cyan
docker-compose up -d db

# Wait for Postgres to be healthy (up to 60 s)
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
$maxWait = 60
$waited  = 0
$ready   = $false
while ($waited -lt $maxWait) {
    $health = docker inspect --format="{{.State.Health.Status}}" learn-it-hcl-db-1 2>$null
    if ($health -eq "healthy") { $ready = $true; break }
    Start-Sleep -Seconds 3
    $waited += 3
    Write-Host "  ... waited ${waited}s (status: $health)"
}

if (-not $ready) {
    Write-Warning "Database did not become healthy within ${maxWait}s. Skipping db push and super-admin creation."
} else {
    Write-Host "Database is ready!" -ForegroundColor Green
    Set-Location "$root\apps\web"
    npx prisma db push
    pnpm run create-super-admin
    Set-Location $root
}

docker-compose stop db
Write-Host "Database stopped.`n" -ForegroundColor Green

# ============================================================
# 3. Setup Python Backend / ML Service
# ============================================================
Write-Host "Setting up ML Service (Python)..." -ForegroundColor Yellow
Set-Location "$root\backend"

if (-not (Test-Path venv)) {
    python -m venv venv
    Write-Host "Created Python virtual environment" -ForegroundColor Green
}

# Activate venv correctly in PowerShell
& ".\venv\Scripts\Activate.ps1"
pip install -e ".[dev]"

if (-not (Test-Path .env)) {
    $envContent = @"
APP_ENV=development
APP_DEBUG=true
APP_HOST=0.0.0.0
APP_PORT=8001
DATABASE_URL=postgresql+asyncpg://learnit:learnit_dev@localhost:5432/learnit
DATABASE_URL_SYNC=postgresql://learnit:learnit_dev@localhost:5432/learnit
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=5
DB_POOL_RECYCLE=3600
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini
LOCAL_MODEL_BASE_URL=http://localhost:11434/v1
FF_AI_TUTOR=true
FF_ADAPTIVE_DIAGNOSTICS=true
"@
    Set-Content -Path .env -Value $envContent
    Write-Host "Created .env for ML Service" -ForegroundColor Green
}

deactivate
Set-Location $root
Write-Host ""

# ============================================================
# 4. Done
# ============================================================
Write-Host "Initialization complete!" -ForegroundColor Cyan
Write-Host "To start development:" -ForegroundColor White
Write-Host "  1. docker-compose up -d db" -ForegroundColor Yellow
Write-Host "  2. cd apps\web  &&  pnpm dev" -ForegroundColor Yellow
Write-Host "  3. cd backend   &&  .\venv\Scripts\Activate.ps1  &&  uvicorn app.main:app --port 8001 --reload" -ForegroundColor Yellow
