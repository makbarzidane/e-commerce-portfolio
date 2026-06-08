$ErrorActionPreference = "Stop"

if (-not $env:DATABASE_URL) {
  $envFile = Join-Path (Get-Location) ".env"
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match "^\s*DATABASE_URL=(.+)$") {
        $env:DATABASE_URL = $Matches[1].Trim('"')
      }
    }
  }
}

if (-not $env:DATABASE_URL) {
  throw "DATABASE_URL tidak ditemukan. Isi .env atau environment variable terlebih dahulu."
}

$backupDir = Join-Path (Get-Location) "backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $backupDir "zimeira-$timestamp.sql"

if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
  pg_dump $env:DATABASE_URL --clean --if-exists --no-owner --file $target
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
  $container = "zimeira-postgres"
  $running = docker inspect -f "{{.State.Running}}" $container 2>$null

  if ($LASTEXITCODE -ne 0 -or $running -ne "true") {
    throw "pg_dump tidak ada di PATH dan container Docker '$container' tidak berjalan."
  }

  docker exec $container pg_dump -U postgres -d zimeira_hijab_store --clean --if-exists --no-owner | Out-File -FilePath $target -Encoding utf8
} else {
  throw "pg_dump tidak ada di PATH dan Docker tidak tersedia. Install PostgreSQL client tools atau jalankan Docker container lokal."
}

Write-Output "Backup database selesai: $target"
