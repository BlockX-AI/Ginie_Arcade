# Download Flappy Bird game assets from fallback URL
$flappyAssets = @(
    'background-day.png',
    'background-night.png',
    'ground-sprite.png',
    'pipe-green-top.png',
    'pipe-green-bottom.png',
    'pipe-red-top.png',
    'pipe-red-bottom.png',
    'message-initial.png',
    'gameover.png',
    'restart-button.png',
    'bird-red-sprite.png',
    'bird-blue-sprite.png',
    'bird-yellow-sprite.png',
    'number0.png',
    'number1.png',
    'number2.png',
    'number3.png',
    'number4.png',
    'number5.png',
    'number6.png',
    'number7.png',
    'number8.png',
    'number9.png'
)

$baseUrl = 'https://arcade-web-chi.vercel.app/games/flappy/assets/'
$targetDir = 'public\games\flappy\assets\'

Write-Host "Downloading Flappy Bird assets..." -ForegroundColor Cyan

foreach ($asset in $flappyAssets) {
    $url = $baseUrl + $asset
    $outFile = Join-Path $targetDir $asset
    
    try {
        Write-Host "  Downloading $asset..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " Failed" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Green
