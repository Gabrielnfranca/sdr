$token = Read-Host -Prompt "Cole seu Supabase Access Token (comeca com sbp_...)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Token cancelado." -ForegroundColor Red
    exit
}

# Configura o token na sessao atual
$env:SUPABASE_ACCESS_TOKEN = $token.Trim()

Write-Host "1. Iniciando Deploy da funcao search-leads..." -ForegroundColor Cyan
npx supabase functions deploy search-leads --project-ref arlpfhuxbnyexqlzajfs

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy realizado com sucesso!" -ForegroundColor Green
    
    Write-Host "2. Configurando Chave do Google..." -ForegroundColor Cyan
    npx supabase secrets set GOOGLE_PLACES_API_KEY=AIzaSyDrttlZvIHRQ3AJvCTwE3e1jne8Udh3-O8 --project-ref arlpfhuxbnyexqlzajfs
    
    Write-Host "Processo finalizado! Teste a busca no site." -ForegroundColor Green
} else {
    Write-Host "Falha no deploy. Verifique se o token esta correto e tem permissao de Admin." -ForegroundColor Red
}

Read-Host "Pressione Enter para sair"