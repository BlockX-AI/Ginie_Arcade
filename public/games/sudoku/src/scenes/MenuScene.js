/**
 * MenuScene - Maza wala interactive menu with juicy animations
 */

import { CHARACTERS, CHARACTER_UNLOCKS } from '../data/characters.js'
import { AudioManager } from '../systems/AudioManager.js'
import { EnhancedUI } from '../systems/EnhancedUI.js'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  init() {
    // Load player progress from localStorage
    this.playerProgress = this.loadProgress()
    this.selectedCharacter = this.playerProgress.lastCharacter || 'sharmaJiBeta'
    this.selectedDifficulty = 'medium'
    this.selectedGridSize = 9
  }

  preload() {
    // Load character images
    this.load.image('char_sharma', 'assets/images/character_sharma.png')
    this.load.image('char_aunty', 'assets/images/character_aunty.png')
    this.load.image('char_genz', 'assets/images/character_genz.png')
    this.load.image('char_bollywood', 'assets/images/character_bollywood.png')
    this.load.image('char_techbro', 'assets/images/character_techbro.png')
    
    // Load audio
    AudioManager.preloadAudio(this)
  }

  create() {
    // Initialize audio manager
    this.audioManager = new AudioManager(this)
    
    // Play menu music
    this.audioManager.playMusic('menu_music', true)
    
    // Animated gradient background
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x1e3c72, 0x1e3c72, 0x2a5298, 0x2a5298, 1)
    graphics.fillRect(0, 0, 800, 800)
    
    // Floating particles background
    this.createFloatingParticles()
    
    // Title with epic entrance
    this.createAnimatedTitle()
    
    // UI sections with staggered animations
    this.time.delayedCall(300, () => this.createCharacterSelection())
    this.time.delayedCall(500, () => this.createDifficultySelection())
    this.time.delayedCall(700, () => this.createGridSizeSelection())
    this.time.delayedCall(900, () => this.createPlayButton())
    
    // Side panels
    this.createStatsPanel()
    this.createAudioControls()
  }

  createFloatingParticles() {
    const emojis = ['🔥', '⭐', '😂', '🎯', '💯']
    
    for (let i = 0; i < 20; i++) {
      const emoji = emojis[Math.floor(Math.random() * emojis.length)]
      const x = Phaser.Math.Between(0, 800)
      const y = Phaser.Math.Between(0, 800)
      const size = Phaser.Math.Between(16, 32)
      
      const particle = this.add.text(x, y, emoji, {
        fontSize: size + 'px',
        alpha: 0.2
      })
      
      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(100, 200),
        x: x + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000)
      })
    }
  }

  createAnimatedTitle() {
    // Title 1
    const title1 = this.add.text(400, -50, 'SUDOKU', {
      fontFamily: 'Arial Black',
      fontSize: '64px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: title1,
      y: 50,
      duration: 600,
      ease: 'Bounce.easeOut'
    })
    
    // Title 2
    const title2 = this.add.text(400, -100, 'ROAST MODE 🔥', {
      fontFamily: 'Arial Black',
      fontSize: '52px',
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 6,
      shadow: { offsetX: 4, offsetY: 4, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: title2,
      y: 110,
      duration: 800,
      delay: 200,
      ease: 'Bounce.easeOut'
    })
    
    // Pulse animation
    this.tweens.add({
      targets: [title1, title2],
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    // Subtitle
    const subtitle = this.add.text(400, 900, 'Get roasted while you solve! 😂', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#f39c12',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5)
    
    this.tweens.add({
      targets: subtitle,
      y: 160,
      alpha: 1,
      duration: 600,
      delay: 400,
      ease: 'Cubic.easeOut'
    })
  }

  createCharacterSelection() {
    const sectionTitle = this.add.text(400, 210, '🎭 SELECT YOUR ROASTER 🎭', {
      fontFamily: 'Arial Black',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0)
    
    this.tweens.add({
      targets: sectionTitle,
      alpha: 1,
      scale: 1.1,
      duration: 400,
      ease: 'Back.easeOut'
    })
    
    const startX = 150
    const startY = 290
    const spacing = 130
    
    const characterImages = {
      sharmaJiBeta: 'char_sharma',
      desiAunty: 'char_aunty',
      genZZoomer: 'char_genz',
      bollywoodUncle: 'char_bollywood',
      techBro: 'char_techbro'
    }
    
    this.characterButtons = []
    
    Object.keys(CHARACTERS).forEach((charId, index) => {
      const char = CHARACTERS[charId]
      const unlock = CHARACTER_UNLOCKS[charId]
      const isUnlocked = this.playerProgress.puzzlesCompleted >= unlock.level
      const isSelected = this.selectedCharacter === charId
      
      const x = startX + (index % 5) * spacing
      const y = startY
      
      const card = EnhancedUI.createCharacterCard(
        this, x, y, char, isUnlocked, isSelected, 
        isUnlocked ? characterImages[charId] : null
      )
      
      // Entrance animation
      this.tweens.add({
        targets: card,
        scale: 1,
        alpha: 1,
        duration: 400,
        delay: index * 80,
        ease: 'Back.easeOut'
      })
      
      if (isUnlocked) {
        card.on('pointerover', () => {
          this.audioManager.playCellSelect()
          this.tweens.add({
            targets: card,
            scale: 1.1,
            duration: 200,
            ease: 'Back.easeOut'
          })
          card.glow.setAlpha(0.6)
        })
        
        card.on('pointerout', () => {
          if (this.selectedCharacter !== charId) {
            this.tweens.add({
              targets: card,
              scale: 1,
              duration: 200,
              ease: 'Back.easeIn'
            })
            card.glow.setAlpha(0.3)
          }
        })
        
        card.on('pointerdown', () => {
          this.audioManager.playButtonClick()
          this.selectCharacter(charId, card)
        })
      }
      
      this.characterButtons.push({ card, charId })
    })
  }

  selectCharacter(charId, selectedCard) {
    const char = CHARACTERS[charId]
    
    // Deselect all
    this.characterButtons.forEach(btn => {
      btn.card.cardBg.setStrokeStyle(4, 0x3498db)
      this.tweens.add({
        targets: btn.card,
        scale: 1,
        duration: 200
      })
    })
    
    // Select with animation
    selectedCard.cardBg.setStrokeStyle(5, 0xf39c12)
    this.tweens.add({
      targets: selectedCard,
      scale: 1.15,
      duration: 300,
      ease: 'Elastic.easeOut'
    })
    
    // Sparkles
    EnhancedUI.createSparkles(this, selectedCard.x, selectedCard.y, parseInt(char.color.replace('#', '0x')))
    
    this.selectedCharacter = charId
    
    // Show catchphrase
    if (this.catchphraseBubble) {
      this.catchphraseBubble.destroy()
    }
    
    this.catchphraseBubble = EnhancedUI.createAnimatedBubble(
      this, 400, 420, 680, 75, `"${char.catchphrase}"`
    )
  }

  createDifficultySelection() {
    const sectionTitle = this.add.text(400, 475, '⚡ DIFFICULTY ⚡', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0)
    
    this.tweens.add({
      targets: sectionTitle,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })
    
    const difficulties = [
      { id: 'easy', label: 'Easy 😊', color: 0x4caf50 },
      { id: 'medium', label: 'Medium 🌶️', color: 0xff9800 },
      { id: 'hard', label: 'Hard 🔥', color: 0xf44336 }
    ]
    
    const startX = 230
    const y = 525
    
    this.difficultyButtons = []
    
    difficulties.forEach((diff, index) => {
      const x = startX + index * 180
      
      const button = EnhancedUI.createModernButton(this, x, y, 160, 55, diff.label, diff.color)
      button.setAlpha(0).setScale(0)
      
      this.tweens.add({
        targets: button,
        scale: 1,
        alpha: 1,
        duration: 400,
        delay: index * 100,
        ease: 'Elastic.easeOut'
      })
      
      EnhancedUI.applyJuicyEffects(this, button, this.audioManager)
      
      button.on('pointerdown', () => {
        this.audioManager.playButtonClick()
        this.selectDifficulty(diff.id, button)
      })
      
      // Auto-select medium
      if (diff.id === 'medium') {
        button.button.setStrokeStyle(5, 0xffd700)
      }
      
      this.difficultyButtons.push({ button, id: diff.id })
    })
  }

  selectDifficulty(diffId, selectedButton) {
    // Deselect all
    this.difficultyButtons.forEach(btn => {
      btn.button.button.setStrokeStyle(4, 0xffffff, 0.8)
    })
    
    // Select this one
    selectedButton.button.setStrokeStyle(5, 0xffd700)
    
    // Jump animation
    this.tweens.add({
      targets: selectedButton,
      y: selectedButton.y - 10,
      duration: 150,
      yoyo: true,
      ease: 'Cubic.easeOut'
    })
    
    EnhancedUI.createSparkles(this, selectedButton.x, selectedButton.y, 0xffd700)
    
    this.selectedDifficulty = diffId
  }

  createGridSizeSelection() {
    const sectionTitle = this.add.text(400, 605, '📊 GRID SIZE 📊', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setAlpha(0)
    
    this.tweens.add({
      targets: sectionTitle,
      alpha: 1,
      duration: 400,
      ease: 'Back.easeOut'
    })
    
    const sizes = [
      { size: 4, label: '4×4 Chill', color: 0x4caf50 },
      { size: 6, label: '6×6 Medium', color: 0xff9800 },
      { size: 9, label: '9×9 Pro', color: 0xf44336 }
    ]
    
    const startX = 230
    const y = 655
    
    this.sizeButtons = []
    
    sizes.forEach((sizeData, index) => {
      const x = startX + index * 180
      
      const button = EnhancedUI.createModernButton(this, x, y, 160, 55, sizeData.label, sizeData.color)
      button.setAlpha(0).setScale(0)
      
      this.tweens.add({
        targets: button,
        scale: 1,
        alpha: 1,
        duration: 400,
        delay: index * 100,
        ease: 'Elastic.easeOut'
      })
      
      EnhancedUI.applyJuicyEffects(this, button, this.audioManager)
      
      button.on('pointerdown', () => {
        this.audioManager.playButtonClick()
        this.selectGridSize(sizeData.size, button)
      })
      
      // Auto-select 9x9
      if (sizeData.size === 9) {
        button.button.setStrokeStyle(5, 0xffd700)
      }
      
      this.sizeButtons.push({ button, size: sizeData.size })
    })
  }

  selectGridSize(size, selectedButton) {
    // Deselect all
    this.sizeButtons.forEach(btn => {
      btn.button.button.setStrokeStyle(4, 0xffffff, 0.8)
    })
    
    // Select this one
    selectedButton.button.setStrokeStyle(5, 0xffd700)
    
    // Jump animation
    this.tweens.add({
      targets: selectedButton,
      y: selectedButton.y - 10,
      duration: 150,
      yoyo: true,
      ease: 'Cubic.easeOut'
    })
    
    EnhancedUI.createSparkles(this, selectedButton.x, selectedButton.y, 0xffd700)
    
    this.selectedGridSize = size
  }

  createPlayButton() {
    const playButton = EnhancedUI.createModernButton(
      this, 400, 740, 320, 70, '▶️ START ROASTING!', 0x2ecc71
    )
    playButton.setScale(0).setAlpha(0)
    
    this.tweens.add({
      targets: playButton,
      scale: 1,
      alpha: 1,
      duration: 600,
      ease: 'Elastic.easeOut'
    })
    
    // Epic pulse
    this.tweens.add({
      targets: playButton,
      scale: 1.08,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
    
    EnhancedUI.applyJuicyEffects(this, playButton, this.audioManager)
    
    playButton.on('pointerdown', () => {
      this.audioManager.playButtonClick()
      
      // Epic screen shake
      this.cameras.main.shake(200, 0.005)
      
      // Save and transition
      this.playerProgress.lastCharacter = this.selectedCharacter
      this.saveProgress()
      
      this.cameras.main.flash(400, 255, 255, 255)
      
      this.time.delayedCall(400, () => {
        this.scene.start('GameScene', {
          character: this.selectedCharacter,
          difficulty: this.selectedDifficulty,
          gridSize: this.selectedGridSize
        })
      })
    })
  }

  createStatsPanel() {
    const panel = this.add.rectangle(90, 60, 160, 100, 0x34495e, 0.9)
    panel.setStrokeStyle(3, 0xf39c12)
    
    const stats = this.add.text(90, 60,
      `🏆 ${this.playerProgress.puzzlesCompleted}\n` +
      `🔥 ${this.playerProgress.streak} days\n` +
      `⭐ ${this.playerProgress.totalStars}`, {
      fontFamily: 'Arial Black',
      fontSize: '15px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5)
    
    // Slide in from left
    panel.x = -100
    stats.x = -100
    
    this.tweens.add({
      targets: [panel, stats],
      x: 90,
      duration: 600,
      delay: 1000,
      ease: 'Back.easeOut'
    })
  }

  createAudioControls() {
    const musicBtn = EnhancedUI.createModernButton(this, 710, 40, 65, 50, '🎵', 0x9b59b6)
    const sfxBtn = EnhancedUI.createModernButton(this, 710, 100, 65, 50, '🔊', 0x9b59b6)
    
    // Slide in from right
    musicBtn.x = 900
    sfxBtn.x = 900
    
    this.tweens.add({
      targets: [musicBtn, sfxBtn],
      x: 710,
      duration: 600,
      delay: 1100,
      ease: 'Back.easeOut'
    })
    
    EnhancedUI.applyJuicyEffects(this, musicBtn, this.audioManager)
    EnhancedUI.applyJuicyEffects(this, sfxBtn, this.audioManager)
    
    musicBtn.on('pointerdown', () => {
      const enabled = this.audioManager.toggleMusic()
      musicBtn.buttonText.setText(enabled ? '🎵' : '🔇')
      this.audioManager.playButtonClick()
    })
    
    sfxBtn.on('pointerdown', () => {
      const enabled = this.audioManager.toggleSFX()
      sfxBtn.buttonText.setText(enabled ? '🔊' : '🔇')
    })
    
    // Set initial state
    musicBtn.buttonText.setText(this.audioManager.musicVolume > 0 ? '🎵' : '🔇')
    sfxBtn.buttonText.setText(this.audioManager.sfxVolume > 0 ? '🔊' : '🔇')
  }

  loadProgress() {
    const defaultProgress = {
      puzzlesCompleted: 0,
      streak: 0,
      totalStars: 0,
      lastCharacter: 'sharmaJiBeta',
      unlockedCharacters: ['sharmaJiBeta'],
      achievements: []
    }
    
    try {
      const saved = localStorage.getItem('sudokuRoastMode_progress')
      return saved ? { ...defaultProgress, ...JSON.parse(saved) } : defaultProgress
    } catch (e) {
      return defaultProgress
    }
  }

  saveProgress() {
    try {
      localStorage.setItem('sudokuRoastMode_progress', JSON.stringify(this.playerProgress))
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }

  shutdown() {
    if (this.audioManager) {
      this.audioManager.destroy()
    }
  }
}
