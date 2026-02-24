# ============================================================
# deploy.ps1 — Build + Deploy para VPS Hostinger
# Rode este script no Windows em PowerShell
# ============================================================

# --- CONFIGURAÇÕES — EDITE AQUI ---
$VPS_IP     = "SEU_IP_AQUI"         # IP da sua VPS na Hostinger
$VPS_USER   = "root"                # Usuário SSH (geralmente root)
$VPS_PASS   = ""                    # Senha SSH (deixe vazio para usar chave SSH)
$APP_DIR    = "/var/www/setvote"    # Diretório na VPS (mesmo do setup_vps.sh)
$PROJECT_DIR = $PSScriptRoot        # Diretório do projeto (pasta do script)
# ----------------------------------

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SetVote — Deploy para VPS Hostinger" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se o node está instalado
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não encontrado. Instale em https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Build do projeto
Write-Host "[1/3] Gerando build de produção..." -ForegroundColor Yellow
Set-Location $PROJECT_DIR
npm install --silent
npm run build

if (-not (Test-Path "$PROJECT_DIR\dist")) {
    Write-Host "❌ Build falhou — pasta dist não foi criada." -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Build concluído com sucesso!" -ForegroundColor Green
Write-Host ""

# 3. Enviar para a VPS via SCP
Write-Host "[2/3] Enviando arquivos para a VPS..." -ForegroundColor Yellow
Write-Host "  VPS: $VPS_USER@$VPS_IP`:$APP_DIR" -ForegroundColor Gray

# Verifica se o SCP está disponível (OpenSSH do Windows 10+)
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "⚠️  SCP não encontrado. Opções:" -ForegroundColor Yellow
    Write-Host "  1. Instale OpenSSH: Settings → Apps → Optional Features → OpenSSH Client"
    Write-Host "  2. Use WinSCP (GUI): https://winscp.net"
    Write-Host "     - Host: $VPS_IP | User: $VPS_USER | Pasta remota: $APP_DIR"
    Write-Host "     - Copie o conteúdo da pasta 'dist\' para essa pasta"
    exit 1
}

# Cria pasta na VPS (se não existir)
if ($VPS_PASS -eq "") {
    # Usando chave SSH
    ssh "${VPS_USER}@${VPS_IP}" "mkdir -p $APP_DIR"
    scp -r "$PROJECT_DIR\dist\*" "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
} else {
    Write-Host "  Dica: use chave SSH para não precisar digitar a senha." -ForegroundColor Gray
    ssh "${VPS_USER}@${VPS_IP}" "mkdir -p $APP_DIR"
    scp -r "$PROJECT_DIR\dist\*" "${VPS_USER}@${VPS_IP}:${APP_DIR}/"
}

Write-Host "  ✅ Arquivos enviados!" -ForegroundColor Green
Write-Host ""

# 4. Recarregar Nginx na VPS
Write-Host "[3/3] Recarregando Nginx na VPS..." -ForegroundColor Yellow
ssh "${VPS_USER}@${VPS_IP}" "nginx -t && systemctl reload nginx"
Write-Host "  ✅ Nginx recarregado!" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  🚀 Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "  Acesse: http://$VPS_IP" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
