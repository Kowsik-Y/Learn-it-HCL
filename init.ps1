Write-Host "Starting Learn-it HCL project initialization..." -ForegroundColor Cyan
Write-Host ""

# 1. Setup Web/Next.js (Frontend + API Gateway)
Write-Host "Setting up Web (Next.js)..." -ForegroundColor Yellow
Set-Location apps\web
corepack enable pnpm
pnpm install

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env for Web" -ForegroundColor Green
}

# Generate Prisma Client
npx prisma generate
Set-Location ..\..
Write-Host ""

# Create Super Admin
Write-Host "Setting up initial Super Admin Account..." -ForegroundColor Yellow
Write-Host "Temporarily starting database..." -ForegroundColor Cyan
docker-compose up -d db
Start-Sleep -Seconds 2
Set-Location apps\web
npx prisma db push
pnpm run create-super-admin
Set-Location ..\..
docker-compose stop db
Write-Host "Database stopped.`n" -ForegroundColor Green

# 2. Setup Backend/ML Service (Python)
Write-Host "Setting up ML Service (Python)..." -ForegroundColor Yellow
Set-Location backend

# Create and activate virtual environment
if (-not (Test-Path venv)) {
    python -m venv venv
    Write-Host "Created Python virtual environment" -ForegroundColor Green
}

.\venv\Scripts\activate
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
Set-Location ..
Write-Host ""

# 3. Final Instructions
Write-Host "Initialization complete!" -ForegroundColor Cyan
Write-Host "To start development, follow these steps:"
Write-Host "  1. Start the PostgreSQL database: docker-compose up -d db" -ForegroundColor Yellow
Write-Host "  2. Push the Prisma schema to the DB: cd apps\web; npx prisma db push" -ForegroundColor Yellow
Write-Host "  3. Start the Next.js dev server: cd apps\web; pnpm dev" -ForegroundColor Yellow
Write-Host "  4. Start the ML Service: cd backend; .\venv\Scripts\activate; uvicorn app.main:app --port 8001 --reload" -ForegroundColor Yellow
