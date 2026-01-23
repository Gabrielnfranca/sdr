Write-Host "Iniciando atualizacao do Sistema SDR..." -ForegroundColor Cyan

$PROJECT_REF = "arlpfhuxbnyexqlzajfs"
$SERP_KEY = "7ee9019ba7f495238e9946b57c543ca047df9ead020d39a6c2f1c3b3dc15a317"

Write-Host "1. Configurando Chaves de API no Servidor (Supabase)..." -ForegroundColor Yellow
cmd /c npx supabase secrets set SERPAPI_KEY=$SERP_KEY --project-ref $PROJECT_REF

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro ao configurar secrets. Verifique o login (npx supabase login)." -ForegroundColor Red
    exit
}

Write-Host "2. Atualizando Funcoes Inteligentes (Deploy)..." -ForegroundColor Yellow

Write-Host "   Enviando: search-intent..." 
cmd /c npx supabase functions deploy search-intent --project-ref $PROJECT_REF

Write-Host "   Enviando: search-leads..."
cmd /c npx supabase functions deploy search-leads --project-ref $PROJECT_REF

Write-Host "Atualizacao Concluida com Sucesso! Tente buscar novamente." -ForegroundColor Green
