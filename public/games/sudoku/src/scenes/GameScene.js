/**
 * GameScene - Colorful, fun, all controls working perfectly
 */

import { SudokuGenerator } from '../systems/SudokuGenerator.js'
import { CHARACTERS, getRandomDialogue } from '../data/characters.js'
import { AudioManager } from '../systems/AudioManager.js'
import { EnhancedUI } from '../systems/EnhancedUI.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
  }

  init(data) {
    this.character = data.character || 'sharmaJiBeta'
    this.difficulty = data.difficulty || 'medium'
    this.gridSize = data.gridSize || 9
    
    this.mistakes = 0
    this.hintsUsed = 0
    this.startTime = Date.now()
    this.pausedTime = 0
    this.isPaused = false
    this.selectedCell = null
    this.combo = 0
    this.maxCombo = 0
    
    this.puzzle = null
    this.solution = null
    this.playerGrid = null
    this.fixedCells = null
    
    this.cellContainers = []
    this.numberTexts = []
  }

  preload() {
    // Load sharp character images
    this.load.image('char_sharma', 'assets/images/character_sharma.png')
    this.load.image('char_aunty', 'assets/images/character_aunty.png')
    this.load.image('char_genz', 'assets/images/character_genz.png')
    this.load.image('char_bollywood', 'assets/images/character_bollywood.png')
    this.load.image('char_techbro', 'assets/images/character_techbro.png')
    
    // Load fun background
    this.load.image('bg_fun', 'assets/images/bg_fun.png')
    
    AudioManager.preloadAudio(this)
  }

  create() {
    this.audioManager = new AudioManager(this)
    this.audioManager.playMusic('game_music', true)
    
    // Fun colorful background
    const bg = this.add.image(400, 400, 'bg_fun')
    bg.setDisplaySize(800, 800)
    bg.setAlpha(0.3)
    
    // Vibrant gradient overlay
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0xfff9c4, 0xfff9c4, 0xffeb3b, 0xffeb3b, 0.4)
    graphics.fillRect(0, 0, 800, 800)
    
    // Floating fun emojis
    this.createFloatingEmojis()
    
    // Top bar with character and title
    this.createTopBar()
    
    // Generate puzzle
    this.generateNewPuzzle()
    
    // Main game area perfectly centered
    this.createCenteredGameArea()
    
    // Initial dialogue
    this.showDialogue("Let's go! Show me your skills! 🔥")
    
    this.input.on('pointerdown', this.handleClick, this)
    this.input.keyboard.on('keydown', this.handleKeyPress, this)
    
    // Pause overlay
    this.createPauseOverlay()
  }

  createFloatingEmojis() {
    const emojis = ['🔥', '⭐', '💯', '🎯', '✨', '🎮', '🏆']
    
    for (let i = 0; i < 12; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]
      const x = Phaser.Math.Between(0, 800)
      const y = Phaser.Math.Between(200, 800)
      const size = Phaser.Math.Between(16, 24)
      
      const particle = this.add.text(x, y, emoji, {
        fontSize: size + 'px',
        alpha: 0.15
      })
      
      this.tweens.add({
        targets: particle,
        y: y - 150,
        x: x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000)
      })
    }
  }

  generateNewPuzzle() {
    const generator = new SudokuGenerator(this.gridSize)
    const data = generator.generate(this.difficulty)
    
    this.puzzle = data.grid
    this.solution = data.solution
    this.playerGrid = data.grid.map(row => [...row])
    
    this.fixedCells = []
    this.totalCells = 0
    this.filledCells = 0
    
    for (let row = 0; row < this.gridSize; row++) {
      this.fixedCells[row] = []
      for (let col = 0; col < this.gridSize; col++) {
        this.fixedCells[row][col] = this.puzzle[row][col] !== 0
        this.totalCells++
        if (this.puzzle[row][col] !== 0) this.filledCells++
      }
    }
  }

  createTopBar() {
    // Top bar background with fun color
    const topBar = this.add.rectangle(400, 50, 800, 100, 0xff6b35, 0.2)
    
    const charData = CHARACTERS[this.character]
    
    // LEFT: Character display - SHARP AND CLEAR
    const charContainer = this.add.container(80, 50)
    
    // Colorful glow
    const charGlow = this.add.circle(0, 0, 35, parseInt(charData.color.replace('#', '0x')), 0.4)
    this.tweens.add({
      targets: charGlow,
      alpha: 0.6,
      scale: 1.08,
      duration: 1500,
      yoyo: true,
      repeat: -1
    })
    
    // Card background
    const charCard = this.add.circle(0, 0, 30, 0xffffff, 0.98)
    charCard.setStrokeStyle(4, parseInt(charData.color.replace('#', '0x')))
    
    // Character images mapping
    const characterImages = {
      sharmaJiBeta: 'char_sharma',
      desiAunty: 'char_aunty',
      genZZoomer: 'char_genz',
      bollywoodUncle: 'char_bollywood',
      techBro: 'char_techbro'
    }
    
    // Character image - SHARP AND CLEAR
    this.characterAvatar = this.add.image(0, 0, characterImages[this.character])
    this.characterAvatar.setDisplaySize(55, 55)
    
    // Create circular mask for clean edges
    const mask = this.make.graphics()
    mask.fillStyle(0xffffff)
    mask.fillCircle(80, 50, 28)
    this.characterAvatar.setMask(mask.createGeometryMask())
    
    // Gentle bounce animation
    this.tweens.add({
      targets: this.characterAvatar,
      y: -2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Character name
    const charName = this.add.text(45, -10, charData.name, {
      fontFamily: 'Arial Black',
      fontSize: '13px',
      color: '#2c3e50',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0, 0.5)
    
    // Character emoji
    const charEmoji = this.add.text(45, 10, charData.emoji, {
      fontSize: '18px'
    }).setOrigin(0, 0.5)
    
    charContainer.add([charGlow, charCard, charName, charEmoji])
    
    // CENTER: Fun Title
    const title = this.add.text(400, 38, 'SUDOKU', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#e74c3c',
      stroke: '#ffffff',
      strokeThickness: 5,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 5, fill: true }
    }).setOrigin(0.5)
    
    const subtitle = this.add.text(400, 65, 'ROAST MODE 🔥', {
      fontFamily: 'Arial Black',
      fontSize: '18px',
      color: '#ff6b35',
      stroke: '#ffffff',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    // Fun bounce animation
    this.tweens.add({
      targets: [title, subtitle],
      scale: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // RIGHT: Quick stats with color
    this.quickStatsText = this.add.text(720, 50, '', {
      fontFamily: 'Arial Black',
      fontSize: '13px',
      color: '#2c3e50',
      align: 'right',
      stroke: '#ffffff',
      strokeThickness: 3,
      lineSpacing: 4
    }).setOrigin(1, 0.5)
    
    this.dialogueBubble = null
  }

  showDialogue(text) {
    if (this.dialogueBubble) {
      this.dialogueBubble.destroy()
    }
    
    // Speech bubble below title
    this.dialogueBubble = EnhancedUI.createAnimatedBubble(this, 400, 128, 500, 58, text)
  }

  createCenteredGameArea() {
    const centerX = 400
    const centerY = 450
    
    // Calculate grid dimensions
    const cellSize = this.gridSize === 9 ? 38 : this.gridSize === 6 ? 48 : 58
    const gap = 2
    const boxWidth = this.gridSize === 9 ? 3 : 2
    const boxHeight = this.gridSize === 9 ? 3 : this.gridSize === 6 ? 3 : 2
    
    const totalWidth = this.gridSize * cellSize + (this.gridSize - 1) * gap + (Math.floor((this.gridSize - 1) / boxWidth)) * 4
    const totalHeight = this.gridSize * cellSize + (this.gridSize - 1) * gap + (Math.floor((this.gridSize - 1) / boxHeight)) * 4
    
    const gridStartX = centerX - totalWidth / 2
    const gridStartY = centerY - totalHeight / 2 - 50
    
    // Create grid
    this.createPerfectGrid(gridStartX, gridStartY, cellSize, gap, boxWidth, boxHeight)
    
    // Number pad centered below grid
    const numberPadY = gridStartY + totalHeight + 35
    this.createCenteredNumberPad(centerX, numberPadY)
    
    // Side panels
    this.createLeftPanel(75, centerY)
    this.createRightPanel(725, centerY)
  }

  createPerfectGrid(startX, startY, cellSize, gap, boxWidth, boxHeight) {
    this.cellContainers = []
    this.numberTexts = []
    
    for (let row = 0; row < this.gridSize; row++) {
      this.cellContainers[row] = []
      this.numberTexts[row] = []
      
      for (let col = 0; col < this.gridSize; col++) {
        const extraGapX = Math.floor(col / boxWidth) * 4
        const extraGapY = Math.floor(row / boxHeight) * 4
        
        const x = startX + col * (cellSize + gap) + extraGapX + cellSize / 2
        const y = startY + row * (cellSize + gap) + extraGapY + cellSize / 2
        
        const isFixed = this.fixedCells[row][col]
        const cellContainer = EnhancedUI.createBeautifulCell(this, x, y, cellSize, isFixed)
        cellContainer.setData('row', row)
        cellContainer.setData('col', col)
        
        if (!isFixed) {
          cellContainer.on('pointerdown', () => {
            if (!this.isPaused) {
              this.audioManager.playCellSelect()
              this.selectCell(cellContainer)
            }
          })
          
          cellContainer.on('pointerover', () => {
            if (!this.isPaused) {
              this.audioManager.playCellSelect()
              cellContainer.cell.setStrokeStyle(3, 0x3498db, 1)
            }
          })
          
          cellContainer.on('pointerout', () => {
            if (this.selectedCell !== cellContainer) {
              cellContainer.cell.setStrokeStyle(2, 0x7f8c8d, 1)
            }
          })
        }
        
        this.cellContainers[row][col] = cellContainer
        
        // Number text
        const value = this.playerGrid[row][col]
        if (value > 0) {
          const numberText = this.add.text(x, y, value.toString(), {
            fontFamily: 'Arial Black',
            fontSize: (this.gridSize === 9 ? 22 : 26) + 'px',
            color: isFixed ? '#2c3e50' : '#2980b9',
            stroke: isFixed ? '#95a5a6' : '#1abc9c',
            strokeThickness: 2
          }).setOrigin(0.5)
          
          this.numberTexts[row][col] = numberText
        }
        
        // Smooth pop-in animation
        cellContainer.setScale(0).setAlpha(0)
        this.tweens.add({
          targets: cellContainer,
          scale: 1,
          alpha: 1,
          duration: 250,
          delay: (row * this.gridSize + col) * 8,
          ease: 'Back.easeOut'
        })
      }
    }
  }

  createCenteredNumberPad(centerX, startY) {
    const buttonSize = 46
    const gap = 7
    const numbersPerRow = this.gridSize === 9 ? 5 : this.gridSize
    
    const totalWidth = numbersPerRow * buttonSize + (numbersPerRow - 1) * gap
    const padStartX = centerX - totalWidth / 2
    
    this.numberButtons = []
    
    // Number buttons
    for (let i = 1; i <= this.gridSize; i++) {
      const col = (i - 1) % numbersPerRow
      const row = Math.floor((i - 1) / numbersPerRow)
      
      const x = padStartX + col * (buttonSize + gap) + buttonSize / 2
      const y = startY + row * (buttonSize + gap)
      
      const button = EnhancedUI.createModernButton(this, x, y, buttonSize, buttonSize, i.toString(), 0x3498db)
      button.setScale(0).setAlpha(0)
      
      this.tweens.add({
        targets: button,
        scale: 1,
        alpha: 1,
        duration: 250,
        delay: 200 + i * 15,
        ease: 'Back.easeOut'
      })
      
      EnhancedUI.applyJuicyEffects(this, button, this.audioManager)
      
      button.on('pointerdown', () => {
        if (!this.isPaused) {
          if (this.selectedCell) {
            this.audioManager.playButtonClick()
            this.placeNumber(i)
          } else {
            this.showDialogue("Select a cell first! 😊")
            this.audioManager.playSFX('wrong_move')
          }
        }
      })
      
      this.numberButtons.push(button)
    }
    
    // Clear button
    const clearCol = this.gridSize % numbersPerRow
    const clearRow = Math.floor(this.gridSize / numbersPerRow)
    const clearX = padStartX + clearCol * (buttonSize + gap) + buttonSize / 2
    const clearY = startY + clearRow * (buttonSize + gap)
    
    const clearButton = EnhancedUI.createModernButton(this, clearX, clearY, buttonSize, buttonSize, '✗', 0xe74c3c)
    clearButton.setScale(0).setAlpha(0)
    
    this.tweens.add({
      targets: clearButton,
      scale: 1,
      alpha: 1,
      duration: 250,
      delay: 200 + (this.gridSize + 1) * 15,
      ease: 'Back.easeOut'
    })
    
    EnhancedUI.applyJuicyEffects(this, clearButton, this.audioManager)
    
    clearButton.on('pointerdown', () => {
      if (!this.isPaused) {
        if (this.selectedCell) {
          this.audioManager.playButtonClick()
          this.clearCell()
        }
      }
    })
  }

  createLeftPanel(x, y) {
    // Control buttons panel - colorful
    const panelBg = this.add.rectangle(x, y, 110, 320, 0xffffff, 0.95)
    panelBg.setStrokeStyle(4, 0xff6b35)
    
    const panelTitle = this.add.text(x, y - 172, 'CONTROLS', {
      fontFamily: 'Arial Black',
      fontSize: '14px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    const buttons = [
      { offset: -90, icon: '💡', label: 'Hint', color: 0xf39c12, action: () => this.useHint() },
      { offset: -20, icon: '✓', label: 'Check', color: 0x2ecc71, action: () => this.checkSolution() },
      { offset: 50, icon: '⏸️', label: 'Pause', color: 0x9b59b6, action: () => this.togglePause() },
      { offset: 120, icon: '🏠', label: 'Home', color: 0xe74c3c, action: () => this.quitToMenu() }
    ]
    
    this.controlButtons = []
    
    buttons.forEach((btnData, index) => {
      const btnY = y + btnData.offset
      
      const button = EnhancedUI.createModernButton(this, x, btnY, 85, 42, btnData.icon, btnData.color)
      button.setScale(0).setAlpha(0)
      button.setData('action', btnData.action)
      
      this.tweens.add({
        targets: button,
        scale: 1,
        alpha: 1,
        duration: 250,
        delay: 400 + index * 60,
        ease: 'Back.easeOut'
      })
      
      EnhancedUI.applyJuicyEffects(this, button, this.audioManager)
      
      button.on('pointerdown', () => {
        this.audioManager.playButtonClick()
        const action = button.getData('action')
        if (action) action()
      })
      
      // Label
      this.add.text(x, btnY + 28, btnData.label, {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#2c3e50',
        stroke: '#ffffff',
        strokeThickness: 2
      }).setOrigin(0.5)
      
      this.controlButtons.push(button)
    })
  }

  createRightPanel(x, y) {
    // Stats panel - colorful
    const panelBg = this.add.rectangle(x, y - 80, 110, 240, 0xffffff, 0.95)
    panelBg.setStrokeStyle(4, 0x3498db)
    
    const statsTitle = this.add.text(x, y - 192, '📊 STATS', {
      fontFamily: 'Arial Black',
      fontSize: '15px',
      color: '#3498db',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    this.statsText = this.add.text(x, y - 80, '', {
      fontFamily: 'Arial Black',
      fontSize: '14px',
      color: '#2c3e50',
      align: 'center',
      stroke: '#ffffff',
      strokeThickness: 2,
      lineSpacing: 8
    }).setOrigin(0.5)
    
    // Progress section
    const progressTitle = this.add.text(x, y + 60, 'PROGRESS', {
      fontFamily: 'Arial Black',
      fontSize: '12px',
      color: '#2c3e50',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5)
    
    const progressBg = this.add.rectangle(x, y + 83, 95, 18, 0xecf0f1, 0.95)
    progressBg.setStrokeStyle(2, 0x95a5a6)
    
    this.progressBar = this.add.rectangle(x - 47, y + 83, 0, 14, 0x2ecc71)
    this.progressBar.setOrigin(0, 0.5)
    
    this.progressText = this.add.text(x, y + 83, '0%', {
      fontFamily: 'Arial Black',
      fontSize: '10px',
      color: '#2c3e50',
      stroke: '#ffffff',
      strokeThickness: 2
    }).setOrigin(0.5)
    
    // Combo display - fun colors
    this.comboContainer = this.add.container(x, y + 130)
    
    const comboBg = this.add.rectangle(0, 0, 95, 48, 0xfff3e0, 0.95)
    comboBg.setStrokeStyle(3, 0xff6b35)
    
    this.comboText = this.add.text(0, 0, '', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5)
    
    this.comboContainer.add([comboBg, this.comboText])
    this.comboContainer.setAlpha(0)
    
    this.updateStats()
    this.updateProgress()
  }

  createPauseOverlay() {
    this.pauseOverlay = this.add.container(400, 400)
    
    // Dark overlay
    const darkBg = this.add.rectangle(0, 0, 800, 800, 0x000000, 0.85)
    darkBg.setInteractive()
    
    // Pause panel
    const pausePanel = this.add.rectangle(0, 0, 450, 320, 0xffffff, 0.98)
    pausePanel.setStrokeStyle(6, 0xff6b35)
    
    // Pause title
    const pauseTitle = this.add.text(0, -110, '⏸️ PAUSED', {
      fontFamily: 'Arial Black',
      fontSize: '40px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5)
    
    // Resume button
    const resumeBtn = EnhancedUI.createModernButton(this, 0, -25, 320, 65, '▶️ RESUME GAME', 0x2ecc71)
    EnhancedUI.applyJuicyEffects(this, resumeBtn, this.audioManager)
    resumeBtn.on('pointerdown', () => {
      this.audioManager.playButtonClick()
      this.togglePause()
    })
    
    // Home button
    const homeBtn = EnhancedUI.createModernButton(this, 0, 60, 320, 65, '🏠 BACK TO MENU', 0xe74c3c)
    EnhancedUI.applyJuicyEffects(this, homeBtn, this.audioManager)
    homeBtn.on('pointerdown', () => {
      this.audioManager.playButtonClick()
      this.quitToMenu()
    })
    
    this.pauseOverlay.add([darkBg, pausePanel, pauseTitle, resumeBtn, homeBtn])
    this.pauseOverlay.setDepth(1000)
    this.pauseOverlay.setVisible(false)
  }

  togglePause() {
    this.isPaused = !this.isPaused
    
    if (this.isPaused) {
      this.pauseStartTime = Date.now()
      this.pauseOverlay.setVisible(true)
      this.showDialogue("Game paused! Take a break ☕")
    } else {
      this.pausedTime += Date.now() - this.pauseStartTime
      this.pauseOverlay.setVisible(false)
      this.showDialogue("Let's continue! 🔥")
    }
  }

  selectCell(cellContainer) {
    const row = cellContainer.getData('row')
    const col = cellContainer.getData('col')
    
    if (this.fixedCells[row][col]) {
      this.showDialogue("That's fixed! Try another! 🤓")
      this.audioManager.playSFX('wrong_move')
      return
    }
    
    if (this.selectedCell) {
      EnhancedUI.unhighlightCell(this, this.selectedCell)
    }
    
    this.selectedCell = cellContainer
    EnhancedUI.highlightCell(this, cellContainer)
  }

  placeNumber(number) {
    if (!this.selectedCell) return
    
    const row = this.selectedCell.getData('row')
    const col = this.selectedCell.getData('col')
    
    this.playerGrid[row][col] = number
    
    if (this.numberTexts[row][col]) {
      this.numberTexts[row][col].destroy()
    }
    
    const cellPos = this.selectedCell
    this.numberTexts[row][col] = this.add.text(cellPos.x, cellPos.y, number.toString(), {
      fontFamily: 'Arial Black',
      fontSize: (this.gridSize === 9 ? 22 : 26) + 'px',
      color: '#2980b9',
      stroke: '#1abc9c',
      strokeThickness: 2
    }).setOrigin(0.5)
    
    this.filledCells++
    this.updateProgress()
    
    const isCorrect = number === this.solution[row][col]
    
    if (!isCorrect) {
      this.mistakes++
      this.combo = 0
      this.showDialogue(getRandomDialogue(this.character, 'wrongMoves'))
      this.audioManager.playWrongMove(this.character)
      EnhancedUI.showErrorEffect(this, this.selectedCell)
      
      this.tweens.add({
        targets: this.characterAvatar,
        angle: -10,
        duration: 100,
        yoyo: true,
        repeat: 1
      })
      
      this.tweens.add({
        targets: this.comboContainer,
        alpha: 0,
        duration: 150
      })
    } else {
      this.combo++
      this.maxCombo = Math.max(this.maxCombo, this.combo)
      this.showDialogue(getRandomDialogue(this.character, 'correctMoves'))
      this.audioManager.playCorrectMove(this.character)
      EnhancedUI.showSuccessEffect(this, cellPos.x, cellPos.y)
      
      if (this.combo >= 2) {
        this.comboText.setText(`${this.combo}x\nCOMBO!`)
        this.comboContainer.setAlpha(1)
        this.tweens.add({
          targets: this.comboContainer,
          scale: 1.15,
          duration: 120,
          yoyo: true
        })
      }
      
      this.tweens.add({
        targets: this.characterAvatar,
        scale: 1.1,
        duration: 120,
        yoyo: true
      })
      
      if (SudokuGenerator.isComplete(this.playerGrid, this.solution)) {
        this.time.delayedCall(700, () => this.onPuzzleComplete())
      }
    }
    
    this.updateStats()
  }

  clearCell() {
    if (!this.selectedCell) return
    
    const row = this.selectedCell.getData('row')
    const col = this.selectedCell.getData('col')
    
    if (this.playerGrid[row][col] !== 0) {
      this.filledCells--
    }
    
    this.playerGrid[row][col] = 0
    
    if (this.numberTexts[row][col]) {
      this.numberTexts[row][col].destroy()
      this.numberTexts[row][col] = null
    }
    
    this.updateStats()
    this.updateProgress()
  }

  useHint() {
    if (this.isPaused) return
    
    const hint = SudokuGenerator.getHint(this.playerGrid, this.solution)
    
    if (!hint) {
      this.showDialogue("Almost done! No hints needed! 🎉")
      return
    }
    
    this.hintsUsed++
    this.combo = 0
    this.showDialogue(getRandomDialogue(this.character, 'hints'))
    this.audioManager.playHint(this.character)
    
    const { row, col, value } = hint
    this.playerGrid[row][col] = value
    this.filledCells++
    
    if (this.numberTexts[row][col]) {
      this.numberTexts[row][col].destroy()
    }
    
    const cellPos = this.cellContainers[row][col]
    this.numberTexts[row][col] = this.add.text(cellPos.x, cellPos.y, value.toString(), {
      fontFamily: 'Arial Black',
      fontSize: (this.gridSize === 9 ? 22 : 26) + 'px',
      color: '#f39c12',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    EnhancedUI.createConfettiBurst(this, cellPos.x, cellPos.y)
    
    this.tweens.add({
      targets: this.comboContainer,
      alpha: 0,
      duration: 150
    })
    
    if (SudokuGenerator.isComplete(this.playerGrid, this.solution)) {
      this.time.delayedCall(700, () => this.onPuzzleComplete())
    }
    
    this.updateStats()
    this.updateProgress()
  }

  checkSolution() {
    if (this.isPaused) return
    
    const isValid = SudokuGenerator.verifyGrid(this.playerGrid)
    const isComplete = SudokuGenerator.isComplete(this.playerGrid, this.solution)
    
    if (isComplete) {
      this.onPuzzleComplete()
    } else if (isValid) {
      this.showDialogue("Perfect so far! Keep going! 💪")
      this.audioManager.playSFX('correct_move')
    } else {
      this.showDialogue("Hmm... something's not right! 🤔")
      this.audioManager.playSFX('wrong_move')
    }
  }

  onPuzzleComplete() {
    const elapsedTime = Math.floor((Date.now() - this.startTime - this.pausedTime) / 1000)
    
    this.showDialogue(getRandomDialogue(this.character, 'victory'))
    this.audioManager.playVictory(this.character)
    
    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 120, () => {
        EnhancedUI.createConfettiBurst(this, 400, 400)
      })
    }
    
    this.cameras.main.flash(500, 255, 215, 0)
    
    this.tweens.add({
      targets: this.characterAvatar,
      scale: 1.5,
      angle: 360,
      duration: 800,
      ease: 'Back.easeOut'
    })
    
    this.time.delayedCall(1800, () => {
      this.scene.start('VictoryScene', {
        character: this.character,
        difficulty: this.difficulty,
        gridSize: this.gridSize,
        mistakes: this.mistakes,
        hintsUsed: this.hintsUsed,
        time: elapsedTime,
        maxCombo: this.maxCombo
      })
    })
  }

  quitToMenu() {
    this.showDialogue("Going home! See you soon! 👋")
    
    this.time.delayedCall(400, () => {
      this.cameras.main.fade(300, 0, 0, 0)
      this.time.delayedCall(300, () => {
        this.audioManager.stopMusic()
        this.scene.start('MenuScene')
      })
    })
  }

  updateStats() {
    if (this.isPaused) return
    
    const elapsedTime = Math.floor((Date.now() - this.startTime - this.pausedTime) / 1000)
    const minutes = Math.floor(elapsedTime / 60)
    const seconds = elapsedTime % 60
    
    this.statsText.setText(
      `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}\n\n` +
      `❌ ${this.mistakes}\n\n` +
      `💡 ${this.hintsUsed}\n\n` +
      `🔥 ${this.combo}x`
    )
    
    this.quickStatsText.setText(
      `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}\n` +
      `❌ ${this.mistakes}  💡 ${this.hintsUsed}`
    )
  }

  updateProgress() {
    const completion = this.filledCells / this.totalCells
    const barWidth = 90
    const targetWidth = completion * barWidth
    const percentage = Math.floor(completion * 100)
    
    this.tweens.add({
      targets: this.progressBar,
      width: targetWidth,
      duration: 250,
      ease: 'Cubic.easeOut'
    })
    
    this.progressText.setText(`${percentage}%`)
  }

  handleKeyPress(event) {
    if (this.isPaused) return
    
    if (event.key >= '1' && event.key <= '9') {
      const num = parseInt(event.key)
      if (num <= this.gridSize && this.selectedCell) {
        this.placeNumber(num)
      }
    }
    
    if ((event.key === 'Backspace' || event.key === 'Delete') && this.selectedCell) {
      this.clearCell()
    }
    
    if (event.key === 'h' || event.key === 'H') {
      this.useHint()
    }
    
    if (event.key === 'Escape' || event.key === 'p' || event.key === 'P') {
      this.togglePause()
    }
  }

  handleClick(pointer) {}

  update() {
    if (!this.isPaused) {
      this.updateStats()
    }
  }

  shutdown() {
    if (this.audioManager) {
      this.audioManager.destroy()
    }
  }
}
