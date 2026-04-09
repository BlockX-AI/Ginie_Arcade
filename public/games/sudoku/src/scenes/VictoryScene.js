/**
 * VictoryScene - Victory with leaderboard and auto-return home
 */

import { CHARACTERS } from '../data/characters.js'
import { AudioManager } from '../systems/AudioManager.js'
import { EnhancedUI } from '../systems/EnhancedUI.js'
import { LeaderboardManager } from '../systems/LeaderboardManager.js'

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' })
  }

  init(data) {
    this.character = data.character
    this.difficulty = data.difficulty
    this.gridSize = data.gridSize
    this.mistakes = data.mistakes
    this.hintsUsed = data.hintsUsed
    this.time = data.time
    
    this.calculateStats()
    this.updateProgress()
    
    // Add to leaderboard
    this.leaderboardManager = new LeaderboardManager()
    this.rank = this.leaderboardManager.addScore({
      character: this.character,
      difficulty: this.difficulty,
      gridSize: this.gridSize,
      time: this.time,
      mistakes: this.mistakes,
      hintsUsed: this.hintsUsed,
      stars: this.stars
    })
  }

  preload() {
    AudioManager.preloadAudio(this)
  }

  create() {
    this.audioManager = new AudioManager(this)
    this.audioManager.playMusic('menu_music', true)
    
    const charData = CHARACTERS[this.character]
    
    // Clean gradient background
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x1e3c72, 0x1e3c72, 0x2a5298, 0x2a5298, 1)
    graphics.fillRect(0, 0, 800, 800)
    
    // Victory banner
    const banner = this.add.text(400, 50, '🎉 VICTORY! 🎉', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000000', blur: 6, fill: true }
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: banner,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Character emoji
    const charEmoji = this.add.text(400, 120, charData.emoji, {
      fontSize: '80px'
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: charEmoji,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Stats card
    this.createStatsCard()
    
    // Star rating
    this.createStarRating()
    
    // LEADERBOARD
    this.createLeaderboard()
    
    // Buttons
    this.createButtons()
    
    // Confetti
    this.createConfetti()
    
    // Auto return to menu after 15 seconds
    this.autoReturnTimer = this.time.delayedCall(15000, () => {
      this.returnToMenu()
    })
  }

  calculateStats() {
    let stars = 3
    
    if (this.mistakes > 5) stars--
    if (this.mistakes > 10) stars--
    if (this.hintsUsed > 3) stars--
    
    this.stars = Math.max(1, stars)
    
    if (this.mistakes === 0 && this.hintsUsed === 0) {
      this.performanceLevel = 'PERFECT! 🏆'
      this.performanceColor = '#FFD700'
    } else if (this.mistakes <= 3 && this.hintsUsed <= 1) {
      this.performanceLevel = 'EXCELLENT! ⭐'
      this.performanceColor = '#2ecc71'
    } else if (this.mistakes <= 7) {
      this.performanceLevel = 'GOOD! 👍'
      this.performanceColor = '#3498db'
    } else {
      this.performanceLevel = 'COMPLETED! ✓'
      this.performanceColor = '#ecf0f1'
    }
  }

  createStatsCard() {
    const card = this.add.rectangle(250, 280, 400, 200, 0x34495e, 0.95)
    card.setStrokeStyle(4, 0xFFD700)
    
    const title = this.add.text(250, 215, 'YOUR STATS:', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    const minutes = Math.floor(this.time / 60)
    const seconds = this.time % 60
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    // Calculate score
    const score = this.leaderboardManager.calculateScore({
      character: this.character,
      difficulty: this.difficulty,
      gridSize: this.gridSize,
      time: this.time,
      mistakes: this.mistakes,
      hintsUsed: this.hintsUsed,
      stars: this.stars
    })

    // Report score to Ginix Arcade bridge
    console.log('SCORE:' + score)
    console.log('GAME_OVER:' + score)
    
    const statsLines = [
      `⏱️ Time: ${timeStr}`,
      `❌ Mistakes: ${this.mistakes}`,
      `💡 Hints: ${this.hintsUsed}`,
      `🏆 Score: ${score}`,
      `📊 ${this.difficulty.toUpperCase()} ${this.gridSize}×${this.gridSize}`
    ]
    
    statsLines.forEach((line, index) => {
      this.add.text(250, 250 + index * 28, line, {
        fontFamily: 'Arial Black',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5)
    })
  }

  createStarRating() {
    const starY = 400
    const starSpacing = 50
    const startX = 250 - (starSpacing * (3 - 1)) / 2
    
    for (let i = 0; i < 3; i++) {
      const x = startX + i * starSpacing
      const filled = i < this.stars
      
      const star = this.add.text(x, starY, filled ? '⭐' : '☆', {
        fontSize: '40px'
      }).setOrigin(0.5)
      
      if (filled) {
        this.time.delayedCall(i * 200, () => {
          this.audioManager.playSFX('correct_move')
          this.tweens.add({
            targets: star,
            scale: 1.3,
            duration: 200,
            yoyo: true
          })
        })
      }
    }
    
    // Performance text
    const perfText = this.add.text(250, 450, this.performanceLevel, {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: this.performanceColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: perfText,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  createLeaderboard() {
    // Leaderboard panel
    const panel = this.add.rectangle(550, 340, 300, 420, 0x2c3e50, 0.95)
    panel.setStrokeStyle(4, 0xFFD700)
    
    const title = this.add.text(550, 155, '🏆 TOP SCORES 🏆', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    // Get top scores
    const topScores = this.leaderboardManager.getTopScores(8)
    
    if (topScores.length === 0) {
      this.add.text(550, 340, 'No scores yet!\nBe the first!', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5)
    } else {
      const startY = 200
      
      topScores.forEach((entry, index) => {
        const isCurrentScore = index === this.rank - 1
        const bgColor = isCurrentScore ? 0xFFD700 : (index % 2 === 0 ? 0x34495e : 0x2c3e50)
        
        // Entry background
        const entryBg = this.add.rectangle(550, startY + index * 50, 280, 45, bgColor, 0.3)
        
        // Rank
        const rankText = this.add.text(430, startY + index * 50, `${index + 1}.`, {
          fontFamily: 'Arial Black',
          fontSize: '14px',
          color: isCurrentScore ? '#FFD700' : '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0, 0.5)
        
        // Character emoji
        const charData = CHARACTERS[entry.character]
        const emoji = this.add.text(460, startY + index * 50, charData.emoji, {
          fontSize: '20px'
        }).setOrigin(0, 0.5)
        
        // Score
        const scoreText = this.add.text(490, startY + index * 50, `${entry.score}`, {
          fontFamily: 'Arial Black',
          fontSize: '16px',
          color: isCurrentScore ? '#FFD700' : '#ffffff',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0, 0.5)
        
        // Details
        const detailsText = this.add.text(580, startY + index * 50, 
          `${entry.gridSize}×${entry.gridSize} ${entry.difficulty[0].toUpperCase()}`, {
          fontFamily: 'Arial',
          fontSize: '12px',
          color: '#95a5a6',
          stroke: '#000000',
          strokeThickness: 1
        }).setOrigin(0, 0.5)
        
        // Highlight current score
        if (isCurrentScore) {
          this.tweens.add({
            targets: [entryBg, rankText, scoreText],
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1
          })
        }
      })
    }
    
    // Your rank
    if (this.rank <= 10) {
      const rankBadge = this.add.text(550, 540, `YOUR RANK: #${this.rank}`, {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#FFD700',
        backgroundColor: '#000000',
        padding: { x: 15, y: 8 },
        stroke: '#FFD700',
        strokeThickness: 2
      }).setOrigin(0.5)
      
      this.tweens.add({
        targets: rankBadge,
        scale: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1
      })
    }
  }

  createButtons() {
    // Play again button
    const playAgainButton = EnhancedUI.createModernButton(this, 250, 520, 190, 60, '🔄 PLAY AGAIN', 0x2ecc71)
    
    EnhancedUI.applyJuicyEffects(this, playAgainButton, this.audioManager)
    
    this.tweens.add({
      targets: playAgainButton,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    playAgainButton.on('pointerdown', () => {
      this.audioManager.playButtonClick()
      this.autoReturnTimer.remove()
      this.playAgain()
    })
    
    // HOME BUTTON - Returns to menu
    const homeButton = EnhancedUI.createModernButton(this, 250, 600, 190, 60, '🏠 HOME', 0x3498db)
    
    EnhancedUI.applyJuicyEffects(this, homeButton, this.audioManager)
    
    homeButton.on('pointerdown', () => {
      this.audioManager.playButtonClick()
      this.autoReturnTimer.remove()
      this.returnToMenu()
    })
    
    // Auto-return countdown
    this.countdownText = this.add.text(250, 680, 'Auto-return in 15s', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#95a5a6',
      align: 'center'
    }).setOrigin(0.5)
    
    // Update countdown
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.autoReturnTimer) {
          const remaining = Math.ceil(this.autoReturnTimer.getRemaining() / 1000)
          if (remaining > 0) {
            this.countdownText.setText(`Auto-return in ${remaining}s`)
          }
        }
      },
      loop: true
    })
  }

  createConfetti() {
    const colors = [0xe74c3c, 0x3498db, 0xFFD700, 0x2ecc71, 0x9b59b6]
    
    this.time.addEvent({
      delay: 80,
      callback: () => {
        for (let i = 0; i < 3; i++) {
          const x = Phaser.Math.Between(0, 800)
          const y = -20
          const color = colors[Phaser.Math.Between(0, colors.length - 1)]
          
          const confetti = this.add.rectangle(x, y, 8, 8, color)
          
          this.tweens.add({
            targets: confetti,
            y: 850,
            x: x + Phaser.Math.Between(-50, 50),
            rotation: Phaser.Math.Between(0, 360),
            alpha: 0,
            duration: Phaser.Math.Between(2000, 3000),
            ease: 'Cubic.easeIn',
            onComplete: () => confetti.destroy()
          })
        }
      },
      loop: true
    })
  }

  returnToMenu() {
    this.cameras.main.fade(400, 0, 0, 0)
    
    this.time.delayedCall(400, () => {
      this.audioManager.stopMusic()
      this.scene.start('MenuScene')
    })
  }

  playAgain() {
    this.cameras.main.flash(300, 255, 255, 255)
    
    this.time.delayedCall(300, () => {
      this.audioManager.stopMusic()
      
      this.scene.start('GameScene', {
        character: this.character,
        difficulty: this.difficulty,
        gridSize: this.gridSize
      })
    })
  }

  updateProgress() {
    try {
      const saved = localStorage.getItem('sudokuRoastMode_progress')
      const progress = saved ? JSON.parse(saved) : {
        puzzlesCompleted: 0,
        streak: 0,
        totalStars: 0,
        lastCharacter: this.character,
        unlockedCharacters: ['sharmaJiBeta'],
        achievements: []
      }
      
      progress.puzzlesCompleted++
      progress.totalStars += this.stars
      progress.lastCharacter = this.character
      
      localStorage.setItem('sudokuRoastMode_progress', JSON.stringify(progress))
    } catch (e) {
      console.error('Failed to update progress:', e)
    }
  }

  shutdown() {
    if (this.audioManager) {
      this.audioManager.destroy()
    }
    if (this.autoReturnTimer) {
      this.autoReturnTimer.remove()
    }
  }
}
