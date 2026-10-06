/**
 * Game configurations.
 * @name configurations
 */
const configurations = {
    type: Phaser.AUTO,
    parent: 'game-container',
    resolution: (window.devicePixelRatio && window.devicePixelRatio > 1) ? window.devicePixelRatio : 1,
    render: {
        antialias: true,
        roundPixels: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 288,
        height: 512
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 300
            },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
}

 const GAMEPLAY = {
     pipeSpeedX: -140,
     pipeSpawnFrames: 110,
     gapHeight: 150,
     flapVelocityY: -320,
     maxFallVelocityY: 520,
     gravityY: 900,
     birdBodyRadius: 16
 }

/**
 *  Game assets — now sourced from assets1/
 *  @name assets
 */
const assets = {
    bird: {
        // We'll pick randomly from BIRD0–BIRD5 skins
        skins: ['bird0', 'bird1', 'bird4'],
        files: [
            'assets1/BIRD.png',
            'assets1/BIRD1.png',
            'assets1/BIRD4.png'
        ]
    },
    obstacle: {
        pillars: ['pillar0', 'pillar1', 'pillar2', 'pillar3'],
        files: [
            'assets1/PILLAR.png',
            'assets1/PILLAR1.png',
            'assets1/PILLAR2.png',
            'assets1/PILLAR3.png'
        ]
    },
    scene: {
        // Background options from assets1
        bg: [
            { key: 'bg0', file: 'assets1/image copy 4.png' },
            { key: 'bg1', file: 'assets1/image copy 5.png' },
            { key: 'bg2', file: 'assets1/image copy 6.png' },
            { key: 'bg3', file: 'assets1/image copy 7.png' },
            { key: 'bg4', file: 'assets1/image copy 8.png' }
        ],
        gameOver: 'gameover',
        restart: 'restart',
        messageInitial: 'message-initial'
    },
    scoreboard: {
        width: 32,
        digits: ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9'],
        files: [
            'assets1/0.png',
            'assets1/1.png',
            'assets1/2.png',
            'assets1/3.png',
            'assets1/4.png',
            'assets1/5.png',
            'assets1/6.png',
            'assets1/7.png',
            'assets1/8.png',
            'assets1/9.png'
        ]
    },
    audio: {
        flap: 'snd_flap',
        hit: 'snd_hit',
        die: 'snd_die',
        point: 'snd_point',
        score: 'snd_score',
        swoosh: 'snd_swoosh',
        gameOver: 'snd_gameover'
    }
}

// --- Global game state ---
const game = new Phaser.Game(configurations)
let gameOver
let gameStarted
let upButton
let restartButton
let gameOverBanner
let messageInitial
let player
let birdSkinKey
let framesMoveUp
let background
let currentBgIndex = 0
let pipesGroup
let gapsGroup
let nextPipes
let currentPillarKey
let scoreboardGroup
let score
// Audio refs
let sndFlap, sndHit, sndDie, sndPoint, sndScore, sndSwoosh, sndGameOver

function getStoredOrDefault(key, fallback) {
    try {
        const v = window.localStorage.getItem(key)
        return v == null ? fallback : v
    } catch (_) {
        return fallback
    }
}

function setStored(key, value) {
    try {
        window.localStorage.setItem(key, value)
    } catch (_) {}
}

/**
 *   Load all game assets from assets1/ and audio/
 */
function preload() {
    // ---- Backgrounds ----
    assets.scene.bg.forEach(bg => {
        this.load.image(bg.key, bg.file)
    })

    // ---- Bird skins (static images, we'll handle flap animation ourselves) ----
    assets.bird.files.forEach((file, i) => {
        this.load.image(assets.bird.skins[i], file)
    })

    // ---- Pillars ----
    assets.obstacle.files.forEach((file, i) => {
        this.load.image(assets.obstacle.pillars[i], file)
    })

    // ---- UI images ----
    this.load.image(assets.scene.messageInitial, 'assets1/flappyready.png')
    this.load.image(assets.scene.gameOver, 'assets1/gameover.png')
    this.load.image(assets.scene.restart, 'assets1/restart.png')

    // ---- Score digits ----
    assets.scoreboard.files.forEach((file, i) => {
        this.load.image(assets.scoreboard.digits[i], file)
    })

    // ---- Audio (wav preferred, ogg fallback) ----
    this.load.audio(assets.audio.flap, ['audio/flap.wav', 'audio/wing.ogg'])
    this.load.audio(assets.audio.hit, ['audio/hit.wav', 'audio/hit.ogg'])
    this.load.audio(assets.audio.die, ['audio/die.wav', 'audio/die.ogg'])
    this.load.audio(assets.audio.point, ['audio/point.wav', 'audio/point.ogg'])
    this.load.audio(assets.audio.score, ['audio/score.wav', 'audio/point.ogg'])
    this.load.audio(assets.audio.swoosh, ['audio/swoosh.wav', 'audio/swoosh.ogg'])
    this.load.audio(assets.audio.gameOver, ['audio/game_over.wav', 'audio/die.ogg'])
}

/**
 *   Create the game objects (images, groups, sprites and animations).
 */
function create() {
    // --- Backgrounds: stack all, only show one at a time ---
    assets.scene.bg.forEach((bg, i) => {
        const img = this.add.image(144, 256, bg.key)
        img.setDisplaySize(288, 512)
        img.visible = (i === 0)
        img._isBackground = true
        img._bgIndex = i
    })

    gapsGroup = this.physics.add.group()
    pipesGroup = this.physics.add.group()
    scoreboardGroup = this.physics.add.staticGroup()

     this.physics.world.gravity.y = GAMEPLAY.gravityY

    // Invisible ground physics body at the bottom
    const groundY = 480
    const groundBody = this.add.rectangle(144, groundY, 288, 64, 0x000000, 0)
    this.physics.add.existing(groundBody, true) // static
    // Store for collision
    this._groundBody = groundBody

    messageInitial = this.add.image(144, 180, assets.scene.messageInitial)
    messageInitial.setDisplaySize(200, 60)
    messageInitial.setDepth(30)
    messageInitial.visible = false

    upButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP)

    // --- Prepare audio ---
    sndFlap = this.sound.add(assets.audio.flap, { volume: 0.6 })
    sndHit = this.sound.add(assets.audio.hit, { volume: 0.7 })
    sndDie = this.sound.add(assets.audio.die, { volume: 0.8 })
    sndPoint = this.sound.add(assets.audio.point, { volume: 0.6 })
    sndScore = this.sound.add(assets.audio.score, { volume: 0.5 })
    sndSwoosh = this.sound.add(assets.audio.swoosh, { volume: 0.5 })
    sndGameOver = this.sound.add(assets.audio.gameOver, { volume: 0.8 })

    prepareGame(this)

    window.FlappyCustomizer = {
        getBackgroundOptions: () => assets.scene.bg.map((bg, i) => ({ index: i, key: bg.key })),
        getBirdOptions: () => assets.bird.skins.slice(),
        getPipeOptions: () => assets.obstacle.pillars.slice(),
        getCurrentBackgroundIndex: () => currentBgIndex,
        getCurrentBirdSkinKey: () => birdSkinKey,
        getCurrentPipeKey: () => currentPillarKey,
        setBackgroundIndex: (index) => {
            const idx = Number(index)
            if (Number.isNaN(idx)) return
            currentBgIndex = Phaser.Math.Wrap(idx, 0, assets.scene.bg.length)
            setStored('flappy_bg_index', String(currentBgIndex))
            showBackground(game.scene.scenes[0], currentBgIndex)
        },
        setBirdSkinKey: (key) => {
            if (!assets.bird.skins.includes(key)) return
            birdSkinKey = key
            setStored('flappy_bird_key', birdSkinKey)
            if (!gameStarted && player) player.setTexture(birdSkinKey)
        },
        setPipeKey: (key) => {
            if (!assets.obstacle.pillars.includes(key)) return
            currentPillarKey = key
            setStored('flappy_pipe_key', currentPillarKey)
        }
    }

    gameOverBanner = this.add.image(144, 220, assets.scene.gameOver)
    gameOverBanner.setDisplaySize(230, 80)
    gameOverBanner.setDepth(20)
    gameOverBanner.visible = false

    restartButton = this.add.image(144, 320, assets.scene.restart).setInteractive()
    restartButton.setDisplaySize(120, 45)
    restartButton.on('pointerdown', restartGame)
    restartButton.setDepth(20)
    restartButton.visible = false
}

/**
 * Helper: get all background images from scene
 */
function getBackgrounds(scene) {
    return scene.children.list.filter(c => c._isBackground)
}

/**
 * Show a background by index, hide others.
 */
function showBackground(scene, index) {
    getBackgrounds(scene).forEach(bg => {
        bg.visible = (bg._bgIndex === index)
    })
}

/**
 *  Update the scene frame by frame.
 */
function update() {
    if (gameOver || !gameStarted)
        return

    if (Phaser.Input.Keyboard.JustDown(upButton))
        moveBird()

    if (player.body.velocity.y > GAMEPLAY.maxFallVelocityY)
        player.setVelocityY(GAMEPLAY.maxFallVelocityY)

    const targetAngle = Phaser.Math.Clamp(player.body.velocity.y / 8, -25, 90)
    player.angle = Phaser.Math.Linear(player.angle, targetAngle, 0.12)

    pipesGroup.children.iterate(function (child) {
        if (child == undefined) return
        if (child.x < -120)
            child.destroy()
        else
            child.setVelocityX(GAMEPLAY.pipeSpeedX)
    })

    gapsGroup.children.iterate(function (child) {
        if (!child || !child.body) return
        child.body.setVelocityX(GAMEPLAY.pipeSpeedX)
    })

    nextPipes++
    if (nextPipes === GAMEPLAY.pipeSpawnFrames) {
        makePipes(game.scene.scenes[0])
        nextPipes = 0
    }
}

/**
 *  Bird collision event (hit ground or pipe).
 */
function hitBird(playerObj) {
    if (gameOver) return
    gameOver = true
    gameStarted = false

     pipesGroup.children.iterate(function (child) {
         if (!child || !child.body) return
         child.body.setVelocityX(0)
     })
     gapsGroup.children.iterate(function (child) {
         if (!child || !child.body) return
         child.body.setVelocityX(0)
     })

    // Play hit then die sounds
    if (!sndHit.isPlaying) sndHit.play()
    this.time.delayedCall(300, () => {
        if (!sndDie.isPlaying) sndDie.play()
        this.time.delayedCall(300, () => {
            if (!sndGameOver.isPlaying) sndGameOver.play()
        })
    })

    this.cameras.main.shake(180, 0.012)
    this.cameras.main.flash(120, 255, 255, 255)

    playerObj.setTintFill(0xffffff)
    this.time.delayedCall(120, () => {
        playerObj.clearTint()
    })

    gameOverBanner.visible = true
    this.time.delayedCall(700, () => {
        restartButton.visible = true
    })

    console.log('game over - final score: ' + score)
    if (window.GinixBridge) window.GinixBridge.endGame(score)
}

/**
 *   Update the scoreboard when passing a gap.
 */
function updateScore(_, gap) {
    score++
    gap.destroy()

    // Sound: every 10 pts play score fanfare, otherwise point ding
    if (score % 10 === 0) {
        sndScore.play()
        // Switch background theme
        currentBgIndex = (currentBgIndex + 1) % assets.scene.bg.length
        showBackground(game.scene.scenes[0], currentBgIndex)
        // Switch pillar style
        const pillarIdx = Phaser.Math.Between(0, assets.obstacle.pillars.length - 1)
        currentPillarKey = assets.obstacle.pillars[pillarIdx]
    } else {
        sndPoint.play()
    }

    console.log('score: ' + score)
    if (window.GinixBridge) window.GinixBridge.updateScore(score)

    updateScoreboard()
}

/**
 * Create a pair of pillars and a gap zone in the game.
 */
function makePipes(scene) {
    if (!gameStarted || gameOver) return

    const GAP = GAMEPLAY.gapHeight  // vertical gap between top & bottom pillar
    const PIPE_H = 360
    const PIPE_W = 72

    // Choose a center Y for the gap that keeps pipes well within bounds
    const gapCenterY = Phaser.Math.Between(160, 360)

    const gapZone = scene.add.zone(310, gapCenterY, 10, GAP)
    scene.physics.add.existing(gapZone)
    gapsGroup.add(gapZone)
    gapZone.body.allowGravity = false
    gapZone.body.setImmovable(true)
    gapZone.visible = false

    // Top pillar: flipped vertically at top
    const pipeTopY = gapCenterY - (GAP / 2) - (PIPE_H / 2)
    const pipeTop = pipesGroup.create(310, pipeTopY, currentPillarKey)
    pipeTop.body.allowGravity = false
    pipeTop.setDisplaySize(PIPE_W, PIPE_H)
    pipeTop.flipY = true
    pipeTop.body.setImmovable(true)
    pipeTop.body.setSize(pipeTop.displayWidth, pipeTop.displayHeight, true)

    // Bottom pillar
    const pipeBottomY = gapCenterY + (GAP / 2) + (PIPE_H / 2)
    const pipeBottom = pipesGroup.create(310, pipeBottomY, currentPillarKey)
    pipeBottom.body.allowGravity = false
    pipeBottom.setDisplaySize(PIPE_W, PIPE_H)
    pipeBottom.body.setImmovable(true)
    pipeBottom.body.setSize(pipeBottom.displayWidth, pipeBottom.displayHeight, true)
}

/**
 * Move the bird upward (flap).
 */
function moveBird() {
    if (gameOver)
        return

    if (!gameStarted)
        startGame(game.scene.scenes[0])

    player.setVelocityY(GAMEPLAY.flapVelocityY)

    // Play flap sound
    if (sndFlap) {
        sndFlap.stop()
        sndFlap.play()
    }
}

/**
 * Pick a random bird skin.
 */
function getRandomBirdSkin() {
    const idx = Phaser.Math.Between(0, assets.bird.skins.length - 1)
    return assets.bird.skins[idx]
}

/**
 * Pick a random pillar style.
 */
function getRandomPillar() {
    const idx = Phaser.Math.Between(0, assets.obstacle.pillars.length - 1)
    return assets.obstacle.pillars[idx]
}

/**
 * Update the game scoreboard display.
 */
function updateScoreboard() {
    scoreboardGroup.clear(true, true)

    const scoreStr = score.toString()
    const totalW = scoreStr.length * assets.scoreboard.width
    let xPos = 144 - totalW / 2 + assets.scoreboard.width / 2

    for (let i = 0; i < scoreStr.length; i++) {
        const digitKey = assets.scoreboard.digits[parseInt(scoreStr[i])]
        const digitImg = scoreboardGroup.create(xPos, 40, digitKey)
        digitImg.setDisplaySize(28, 40)
        digitImg.setDepth(20)
        xPos += assets.scoreboard.width
    }
}

/**
 * Restart the game — clean everything and re-prepare.
 */
function restartGame() {
    pipesGroup.clear(true, true)
    gapsGroup.clear(true, true)
    scoreboardGroup.clear(true, true)
    player.destroy()
    gameOverBanner.visible = false
    restartButton.visible = false

    // play swoosh on restart
    if (sndSwoosh) sndSwoosh.play()

    const gameScene = game.scene.scenes[0]
    prepareGame(gameScene)
    gameScene.physics.resume()
}

/**
 * Prepare / reset all game state, show initial message, create the bird.
 * @param {object} scene - Phaser scene.
 */
function prepareGame(scene) {
    framesMoveUp = 0
    nextPipes = 0
    score = 0
    gameOver = false
    gameStarted = false

    // Restore user selections (if any)
    const storedBgIndex = Number(getStoredOrDefault('flappy_bg_index', '0'))
    currentBgIndex = Number.isFinite(storedBgIndex) ? Phaser.Math.Wrap(storedBgIndex, 0, assets.scene.bg.length) : 0
    showBackground(scene, currentBgIndex)

    const storedBirdKey = getStoredOrDefault('flappy_bird_key', '')
    birdSkinKey = assets.bird.skins.includes(storedBirdKey) ? storedBirdKey : getRandomBirdSkin()

    const storedPipeKey = getStoredOrDefault('flappy_pipe_key', '')
    currentPillarKey = assets.obstacle.pillars.includes(storedPipeKey) ? storedPipeKey : getRandomPillar()

    messageInitial.visible = true

    // Bird sizing: display as ~48x48 sprite
    player = scene.physics.add.image(60, 265, birdSkinKey)
    player.setDisplaySize(48, 48)
    player.setCollideWorldBounds(true)
    player.body.allowGravity = false
    player.body.setCircle(GAMEPLAY.birdBodyRadius)
    player.body.setOffset((player.displayWidth / 2) - GAMEPLAY.birdBodyRadius, (player.displayHeight / 2) - GAMEPLAY.birdBodyRadius)

    // Collide with invisible ground body
    scene.physics.add.collider(player, scene._groundBody, hitBird, null, scene)
    scene.physics.add.collider(player, pipesGroup, hitBird, null, scene)
    scene.physics.add.overlap(player, gapsGroup, updateScore, null, scene)

    // Touch/click background to flap
    scene.input.removeAllListeners('pointerdown')
    scene.input.on('pointerdown', () => {
        if (!gameOver) moveBird()
    })
}

/**
 * Start the game — show score 0 and spawn first pipes.
 * @param {object} scene - Phaser scene.
 */
function startGame(scene) {
    gameStarted = true
    messageInitial.visible = false

    player.body.allowGravity = true

    // Show "0" score
    const digitImg = scoreboardGroup.create(144, 40, assets.scoreboard.digits[0])
    digitImg.setDisplaySize(28, 40)
    digitImg.setDepth(20)

    makePipes(scene)

    if (sndSwoosh) sndSwoosh.play()
}
