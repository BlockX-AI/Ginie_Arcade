// ============================================================
//  MenuScene — Title screen
// ============================================================
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: C.SCENE_MENU }); }

  create() {
    if (window.Limaze) Limaze.music('menu');

    const W = C.W, H = C.H;

    // Scrolling background
    this.bg1 = this.add.tileSprite(0, 0, W, H, 'bg').setOrigin(0,0).setAlpha(0.85);

    // Title
    this.add.text(W/2, H * 0.22, 'PROJECT', {
      fontSize: '20px', fontFamily: 'monospace', color: '#00b8ff', letterSpacing: 8
    }).setOrigin(0.5);
    this.add.text(W/2, H * 0.32, 'ABYSS-ENGINE', {
      fontSize: '52px', fontFamily: 'monospace', color: '#00ffcc',
      stroke: '#003355', strokeThickness: 6
    }).setOrigin(0.5);
    this.add.text(W/2, H * 0.46, 'Bio-Mechanical Kinetic Survival', {
      fontSize: '16px', fontFamily: 'monospace', color: '#88ddff', alpha: 0.8
    }).setOrigin(0.5);

    // Decorative player preview — static image (no sprite sheet)
    this.add.image(W/2, H * 0.62, 'player').setScale(2.0);

    // Start button
    const startBtn = this.add.text(W/2, H * 0.80, '[ DIVE IN ]', {
      fontSize: '28px', fontFamily: 'monospace', color: '#00ffcc',
      stroke: '#004433', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Settings button
    const settBtn = this.add.text(W/2, H * 0.90, '[ SETTINGS ]', {
      fontSize: '18px', fontFamily: 'monospace', color: '#88aacc'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Button pulse
    this.tweens.add({
      targets: startBtn, alpha: 0.3, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    startBtn.on('pointerup', () => this._startGame());
    settBtn.on('pointerup', () => {
      if (window.Limaze) Limaze.sfx('click');
      this.scene.start(C.SCENE_SETTINGS, { from: C.SCENE_MENU });
    });

    // Keyboard shortcut
    this.input.keyboard.once('keydown-ENTER', () => this._startGame());
    this.input.keyboard.once('keydown-SPACE', () => this._startGame());

    // Particle emitter for ambiance (capped at 20)
    this._ambientParticles = [];
    this._spawnAmbient();
  }

  _startGame() {
    if (window.Limaze) { Limaze.stopMusic(); Limaze.sfx('powerup'); }
    AbyssState.reset();
    this.scene.start(C.SCENE_GAME);
    this.scene.launch(C.SCENE_HUD);
  }

  _spawnAmbient() {
    if (this._ambientParticles.length >= 20) return;
    const x = Phaser.Math.Between(0, C.W);
    const y = Phaser.Math.Between(0, C.H);
    const p = this.add.image(x, y, 'particle').setScale(Phaser.Math.FloatBetween(0.5, 1.5)).setAlpha(0.4);
    this._ambientParticles.push(p);
    this.tweens.add({
      targets: p,
      x: x + Phaser.Math.Between(-60, 60),
      y: y + Phaser.Math.Between(-30, 30),
      alpha: 0,
      duration: Phaser.Math.Between(2000, 4000),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        p.destroy();
        this._ambientParticles = this._ambientParticles.filter(i => i !== p);
        if (this.scene.isActive()) this._spawnAmbient();
      }
    });
  }

  update() {
    if (this.bg1) this.bg1.tilePositionX += 0.4;
  }
}
