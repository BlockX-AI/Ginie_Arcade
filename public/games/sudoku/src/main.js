/**
 * Lightweight component-and-system style helpers.
 * These are optional; feel free to replace with any architecture that fits your game.
 */
function createWorld() {
  return {
    nextId: 0,
    position: new Map(),
    velocity: new Map(),
    sprite: new Map(),
    controllable: new Set()
  }
}

function addEntity(world, components) {
  const id = world.nextId++
  if (components.position) world.position.set(id, components.position)
  if (components.velocity) world.velocity.set(id, components.velocity)
  if (components.sprite) world.sprite.set(id, components.sprite)
  if (components.controllable) world.controllable.add(id)
  return id
}

function applyMovement(world, dt) {
  for (const [id, vel] of world.velocity) {
    const pos = world.position.get(id)
    if (!pos) continue
    pos.x += vel.x * dt
    pos.y += vel.y * dt
    const sprite = world.sprite.get(id)
    if (sprite) sprite.setPosition(pos.x, pos.y)
  }
}

/**
 * Input hub bridges keyboard + virtual pad events (see src/ui/overlay.js) into easy-to-read state.
 */
class InputHub {
  constructor() {
    this.axis = { x: 0, y: 0 }
    this.buttons = { jump: false, fire: false, pause: false }
    this.digital = { left: false, right: false, up: false, down: false }
    this._onInput = this._onInput.bind(this)
    window.addEventListener('phaser:input', this._onInput)
  }

  _onInput(event) {
    const { action, phase, axis } = event.detail || {}
    const isDown = phase === 'down' || phase === 'change'
    switch (action) {
      case 'MOVE':
        this.axis = axis || { x: 0, y: 0 }
        this._recalcDigitalFromAxis()
        break
      case 'MOVE_LEFT':
      case 'MOVE_RIGHT':
      case 'MOVE_UP':
      case 'MOVE_DOWN':
        this._setDigital(action, phase)
        this._recalcAxisFromDigital()
        break
      case 'JUMP':
        this.buttons.jump = isDown
        break
      case 'FIRE':
        this.buttons.fire = isDown
        break
      case 'PAUSE':
        this.buttons.pause = isDown
        break
      default:
        break
    }
  }

  _setDigital(action, phase) {
    const pressed = phase === 'down'
    if (action === 'MOVE_LEFT') this.digital.left = pressed
    if (action === 'MOVE_RIGHT') this.digital.right = pressed
    if (action === 'MOVE_UP') this.digital.up = pressed
    if (action === 'MOVE_DOWN') this.digital.down = pressed
  }

  _recalcDigitalFromAxis() {
    const t = 0.35
    const { x, y } = this.axis
    this.digital.left = x <= -t
    this.digital.right = x >= t
    this.digital.up = y <= -t
    this.digital.down = y >= t
  }

  _recalcAxisFromDigital() {
    const x = (this.digital.right ? 1 : 0) - (this.digital.left ? 1 : 0)
    const y = (this.digital.down ? 1 : 0) - (this.digital.up ? 1 : 0)
    const len = Math.hypot(x, y)
    this.axis = len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 }
  }

  getAxis() {
    return this.axis
  }

  isJumping() {
    return this.buttons.jump
  }

  destroy() {
    window.removeEventListener('phaser:input', this._onInput)
  }
}

class Example extends Phaser.Scene {
  constructor() {
    super({ key: 'Example' })
  }

  preload() {
    // Load assets here.
  }

  create() {
    // Create game objects.

    this.world = createWorld()
    this.inputHub = new InputHub()

    const player = this.add.rectangle(400, 320, 32, 32, 0x00ffc3).setOrigin(0.5)
    addEntity(this.world, {
      position: { x: 400, y: 320 },
      velocity: { x: 0, y: 0 },
      sprite: player,
      controllable: true
    })

    this.speed = 180

    this.statusText = this.add.text(18, 18, 'Move: arrows/joystick | Jump: A/Space', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff'
    })
    this.statusText.setDepth(10)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputHub?.destroy()
    })
  }

  update(_time, delta) {
    // Update game logic here.

    const dt = delta / 1000
    const axis = this.inputHub.getAxis()

    for (const id of this.world.controllable) {
      const vel = this.world.velocity.get(id)
      if (!vel) continue
      vel.x = axis.x * this.speed
      vel.y = axis.y * this.speed
      if (this.inputHub.isJumping()) {
        // Tiny example effect: pulse tint while holding jump.
        const sprite = this.world.sprite.get(id)
        sprite?.setFillStyle(0x98fb98)
      } else {
        const sprite = this.world.sprite.get(id)
        sprite?.setFillStyle(0x00ffc3)
      }
    }

    applyMovement(this.world, dt)

    this.statusText.setText(
      `Move: arrows/joystick | Jump: A/Space\nAxis: ${axis.x.toFixed(2)}, ${axis.y.toFixed(2)}`
    )
  }
}

/**
 * Sudoku: Roast Mode - Main Entry Point
 * A comedy-driven Sudoku game with hilarious character commentary
 */

import { MenuScene } from './scenes/MenuScene.js'
import { GameScene } from './scenes/GameScene.js'
import { VictoryScene } from './scenes/VictoryScene.js'

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 800,
  height: 800,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 3
  },
  backgroundColor: '#2c3e50',
  scene: [MenuScene, GameScene, VictoryScene]
}

export const game = new Phaser.Game(config)
