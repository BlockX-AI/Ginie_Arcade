// ============================================================
//  GameOverScene — Death screen with stats
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: C.SCENE_GAMEOVER }); }

  create() {
    const W = C.W, H = C.H, S = AbyssState;

    // Background
    this.add.rectangle(W/2, H/2, W, H, 0x000005, 0.96).setDepth(0);
    this.add.tileSprite(0, 0, W, H, 'bg').setOrigin(0,0).setAlpha(0.25).setDepth(1);

    // Dead player (tinted red)
    const p = this.add.sprite(W/2, H/2 - 40, 'player_idle').setScale(3).setTint(0xff2200).setDepth(5);
    p.play('idle');
    this.tweens.add({ targets: p, alpha: 0.3, duration: 900, yoyo: true, repeat: -1 });

    // Title
    this.add.text(W/2, H * 0.10, 'SYSTEMS CRITICAL', {
      fontSize: '40px', fontFamily: 'monospace', color: '#ff2200',
      stroke: '#330000', strokeThickness: 6
    }).setOrigin(0.5).setDepth(10);

    this.add.text(W/2, H * 0.22, 'O₂ LUNG DEPLETED — MISSION TERMINATED', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff6644'
    }).setOrigin(0.5).setDepth(10);

    // Stats panel
    const statY = H * 0.58;
    const stats = [
      ['DEPTH REACHED',   Math.floor(S.distance) + ' m'],
      ['ENTITIES DESTROYED', S.monsterKills + ''],
      ['THREAT LEVEL',    (S.monsterKills + 1) + ''],
      ['BIO-ENERGY BANKED', Math.floor(S.bioEnergy) + ''],
    ];

    stats.forEach(([label, val], i) => {
      this.add.text(W/2 - 160, statY + i * 30, label + ':', {
        fontSize: '14px', fontFamily: 'monospace', color: '#5588aa'
      }).setDepth(10);
      this.add.text(W/2 + 160, statY + i * 30, val, {
        fontSize: '14px', fontFamily: 'monospace', color: '#00ffcc'
      }).setOrigin(1, 0).setDepth(10);
    });

    // Buttons
    const playBtn = this.add.text(W/2 - 110, H * 0.88, '[ RETRY ]', {
      fontSize: '22px', fontFamily: 'monospace', color: '#00ffcc',
      stroke: '#003344', strokeThickness: 4
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    const menuBtn = this.add.text(W/2 + 110, H * 0.88, '[ MENU ]', {
      fontSize: '22px', fontFamily: 'monospace', color: '#88aacc',
      stroke: '#111133', strokeThickness: 4
    }).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: playBtn, alpha: 0.4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    playBtn.on('pointerup', () => {
      if (window.Limaze) Limaze.sfx('powerup');
      AbyssState.reset();
      this.scene.start(C.SCENE_GAME);
      this.scene.start(C.SCENE_HUD);
    });
    menuBtn.on('pointerup', () => {
      if (window.Limaze) Limaze.sfx('click');
      this.scene.start(C.SCENE_MENU);
    });

    // Keyboard shortcuts
    this.input.keyboard.once('keydown-ENTER', () => {
      AbyssState.reset();
      this.scene.start(C.SCENE_GAME);
      this.scene.start(C.SCENE_HUD);
    });
    this.input.keyboard.once('keydown-ESC', () => this.scene.start(C.SCENE_MENU));

    // Leaderboard note
    this.add.text(W/2, H * 0.96, 'Score submitted to leaderboard: ' + Math.floor(S.distance) + ' m', {
      fontSize: '10px', fontFamily: 'monospace', color: '#334455'
    }).setOrigin(0.5).setDepth(10);

    // Send score to Arcade wrapper
    const finalScore = Math.floor(S.distance);
    const duration = Math.floor((Date.now() - S.startTime) / 1000);
    window.parent.postMessage({
      type: 'scoreUpdate',
      score: finalScore
    }, '*');
    window.parent.postMessage({
      type: 'gameEnd',
      score: finalScore,
      duration: duration
    }, '*');
  }
}
