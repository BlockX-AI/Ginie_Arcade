# Download remaining Sudoku scene files
$baseUrl = 'https://arcade-web-chi.vercel.app/games/sudoku/src/scenes'
$scenes = @('MenuScene.js', 'GameScene.js', 'VictoryScene.js')
$outDir = 'public\games\sudoku\src\scenes'

Write-Host "Downloading Sudoku scene files..." -ForegroundColor Cyan

foreach ($scene in $scenes) {
    $url = "$baseUrl/$scene"
    $outFile = Join-Path $outDir $scene
    
    try {
        Write-Host "  Downloading $scene..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " Failed" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Green
