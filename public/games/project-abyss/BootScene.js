// ============================================================
//  BootScene — preload all assets, then go to Menu
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super({ key: C.SCENE_BOOT }); }

  preload() {
    // Background layers — parallax abyss scene
    this.load.image('bg',
      'https://api.gamenest.ai/asset-cdn/user_4ihqw6ah/asset_156b7731ee5c70fd/Deep-ocean-abyss-background-scene-wide-l-1781605102111.png');

    // Player — static sprite facing right (no animation sheet)
    this.load.image('player',
      'https://api.gamenest.ai/asset-cdn/user_4ihqw6ah/asset_fe8a6518d6c0efb4/Bio-mechanical-deep-sea-creature-facing--1781604722912.png');

    // Monster
    this.load.image('monster',
      'https://api.gamenest.ai/asset-cdn/user_4ihqw6ah/asset_18e7f208f8bd0e3b/Deep-sea-abyssal-monster-enemy-front-fac-1781603721017.png');

    // Bio-energy particle
    this.load.image('particle',
      'https://api.gamenest.ai/asset-cdn/user_4ihqw6ah/asset_8015aa4988ef17a8/Glowing-bio-energy-particle-orb-small-fl-1781603735358.png');

    // Bullets
    this.load.image('bullet',
      'https://api.gamenest.ai/asset-cdn/user_4ihqw6ah/asset_0c83547a56cafc2d/Mechanical-energy-projectile-weapon-bolt-1781603742766.png');

    // Heavy bullet
    this.load.image('bullet_heavy',
      'https://api.gamenest.ai/asset-cdn/user_4ihqw6ah/asset_c6a2410ec59651a5/Large-heavy-energy-projectile-weapon-bol-1781604754854.png');

    // Loading bar
    const bar = this.add.graphics();
    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x00ffcc, 1);
      bar.fillRect(C.W/2 - 200, C.H/2 - 12, 400 * v, 24);
      bar.lineStyle(2, 0x00ffcc, 1);
      bar.strokeRect(C.W/2 - 200, C.H/2 - 12, 400, 24);
    });
    this.add.text(C.W/2, C.H/2 - 40, 'PROJECT ABYSS-ENGINE', {
      fontSize: '28px', fontFamily: 'monospace', color: '#00ffcc', alpha: 0.8
    }).setOrigin(0.5);
  }

  create() {
    // No sprite sheet animations — player is a static image
    this.scene.start(C.SCENE_MENU);
  }
}
