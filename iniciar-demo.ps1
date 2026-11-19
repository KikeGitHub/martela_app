param(
    [int]$Port = 8090,
    [switch]$ValidarPlaywright
)

$DemoPath = Join-Path $PSScriptRoot "workspace\demo"
$OracleScript = Join-Path $PSScriptRoot "workspace\frontend\e2e\run-oracle-playwright.mjs"

if ($ValidarPlaywright) {
    Write-Host "🔍 Ejecutando Oráculo Playwright sobre la Demo MARTELA..." -ForegroundColor Cyan
    node $OracleScript
    exit $LASTEXITCODE
}

$Url = "http://localhost:$Port/index.html"
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host "  💎 MARTELA JOYERÍA FINA — Demo Interactiva (Módulos Core SDOP)" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host "  URL:        $Url" -ForegroundColor Green
Write-Host "  Roles:      admin | compras (Karina) | recepcion (David) | boveda (Elisa) | finanzas (Adriana) | chofer (Miguel)"
Write-Host "  Contraseña: martela123"
Write-Host "============================================================================" -ForegroundColor Yellow

Start-Process $Url
python -m http.server $Port --directory $DemoPath

