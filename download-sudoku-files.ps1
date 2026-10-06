# Download Sudoku game source files
$baseUrl = 'https://arcade-web-chi.vercel.app/games/sudoku'
$files = @{
    'src/main.js' = 'public\games\sudoku\src\main.js'
    'src/config.js' = 'public\games\sudoku\src\config.js'
    'src/scenes/GameScene.js' = 'public\games\sudoku\src\scenes\GameScene.js'
    'src/scenes/MenuScene.js' = 'public\games\sudoku\src\scenes\MenuScene.js'
}

Write-Host "Downloading Sudoku source files..." -ForegroundColor Cyan

foreach ($file in $files.Keys) {
    $url = "$baseUrl/$file"
    $outFile = $files[$file]
    $outDir = Split-Path $outFile -Parent
    
    if (!(Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    
    try {
        Write-Host "  Downloading $file..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
        Write-Host " Done" -ForegroundColor Green
    }
    catch {
        Write-Host " Failed" -ForegroundColor Red
        Write-Host "    Will try to fetch via browser" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Green
