// Day & Night Survival - Full Sprite Version
const W = 800, H = 560;

const SPRITES = {
  playerBlackIdle:  'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_d75ab8d175b26104/Black-stickman-character-front-facing-id-1781623423411.png',
  playerWhiteIdle:  'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_d7c2b4fe806d710f/White-stickman-character-front-facing-id-1781623422900.png',
  playerBlackWalk:  'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_d92388d4e6d4bc0c/Black-stickman-character-walking-pose-st-1781623443761.png',
  playerWhiteWalk:  'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_e282dad3075a0c10/White-stickman-character-walking-pose-st-1781623466470.png',
  divineDog:        'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_58b3617f7293342c/Divine-Dog-enemy-red-stick-figure-dog-sh-1781623470034.png',
  lightAngel:       'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_2bbf3b5956dcd0c8/Light-Angel-enemy-yellow-stickman-angel--1781623501813.png',
  demonWolf:        'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_ef36c45645c65542/Demon-Wolf-enemy-purple-stickman-wolf-st-1781623499143.png',
  tridentDevil:     'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_f4450e9ea9a5822d/Trident-Devil-enemy-orange-stickman-devi-1781623550711.png',
  slashVfx:         'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_ded5d255ca076cc5/Sword-slash-arc-attack-effect-wide-sweep-1781623517794.png',
  burstVfx:         'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_1584c2ef31bd2dbd/Magic-burst-shotgun-cone-blast-effect-wi-1781623543018.png',
  arrowVfx:         'https://api.gamenest.ai/asset-cdn/user_frhrz4r9/asset_185ae070b3b0582f/Magic-arrow-projectile-sprite-long-thin--1781623571328.png',
};

// â”€â”€â”€ GLOBAL CONTROLS CONFIG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Stores the current key bindings (Phaser KeyCode numbers or strings)
window.CONTROLS = {
  left:   Phaser.Input.Keyboard.KeyCodes.A,
  right:  Phaser.Input.Keyboard.KeyCodes.D,
  jump:   Phaser.Input.Keyboard.KeyCodes.SPACE,
  burst:  Phaser.Input.Keyboard.KeyCodes.F,
  arrow:  Phaser.Input.Keyboard.KeyCodes.E,
  domain: Phaser.Input.Keyboard.KeyCodes.Q,
};
window.CONTROL_LABELS = { left:'Move Left', right:'Move Right', jump:'Jump', burst:'Magic Burst', arrow:'Magic Arrow', domain:'Domain' };

// â”€â”€â”€ SETTINGS SCENE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(data) {
    this.fromScene = data && data.from ? data.from : 'Menu';

    // Dark overlay background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a18, 1); bg.fillRect(0, 0, W, H);
    bg.lineStyle(3, 0x00ccff, 1); bg.strokeRoundedRect(W/2-220, 60, 440, H-120, 16);

    this.add.text(W/2, 95, 'SETTINGS â€” CONTROLS', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#00ccff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(W/2, 125, 'Click a button then press any key to remap', {
      fontSize: '12px', fontFamily: 'monospace', color: '#888888'
    }).setOrigin(0.5);

    // Always-fixed: Mouse Aim, Left Click Slash, Right Click Burst
    const fixedStyle = { fontSize: '12px', fontFamily: 'monospace', color: '#555555' };
    this.add.text(W/2, 155, 'Mouse Aim â€” always active', fixedStyle).setOrigin(0.5);
    this.add.text(W/2, 172, 'Left Click: Sword Slash  |  Right Click OR key below: Magic Burst', fixedStyle).setOrigin(0.5);

    // Remappable bindings
    this.bindingKeys = ['left','right','jump','burst','arrow','domain'];
    this.bindingBtns = {};
    this.listeningFor = null;

    this.bindingKeys.forEach((key, i) => {
      const y = 198 + i * 52;
      const label = window.CONTROL_LABELS[key];

      this.add.text(W/2 - 160, y + 12, label + ':', {
        fontSize: '15px', fontFamily: 'monospace', color: '#cccccc'
      });

      const btnG = this.add.graphics();
      const btnX = W/2 + 30, btnW = 160, btnH = 36;
      btnG.fillStyle(0x223344, 1); btnG.fillRoundedRect(btnX, y, btnW, btnH, 8);
      btnG.lineStyle(2, 0x446688, 1); btnG.strokeRoundedRect(btnX, y, btnW, btnH, 8);

      const btnLabel = this.add.text(btnX + btnW/2, y + btnH/2, this.keyName(window.CONTROLS[key]), {
        fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
      }).setOrigin(0.5);

      const zone = this.add.zone(btnX + btnW/2, y + btnH/2, btnW, btnH).setInteractive();
      zone.on('pointerup', () => this.startListening(key, btnG, btnLabel, btnX, y, btnW, btnH));

      this.bindingBtns[key] = { gfx: btnG, label: btnLabel, x: btnX, y, w: btnW, h: btnH };
    });

    // Back button
    const backG = this.add.graphics();
    backG.fillStyle(0x00ccff, 1); backG.fillRoundedRect(W/2 - 80, H - 90, 160, 44, 10);
    this.add.text(W/2, H - 68, 'BACK', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5);
    const backZone = this.add.zone(W/2, H - 68, 160, 44).setInteractive();
    backZone.on('pointerup', () => this.goBack());
    this.input.keyboard.on('keydown-ESC', () => this.goBack());

    // Capture any keydown while listening
    this.input.keyboard.on('keydown', (event) => {
      if (!this.listeningFor) return;
      // Prevent ESC from being mapped
      if (event.keyCode === 27) { this.cancelListening(); return; }
      const key = this.listeningFor;
      window.CONTROLS[key] = event.keyCode;
      const btn = this.bindingBtns[key];
      btn.label.setText(this.keyName(event.keyCode));
      btn.gfx.clear();
      btn.gfx.fillStyle(0x223344, 1); btn.gfx.fillRoundedRect(btn.x, btn.y, btn.w, btn.h, 8);
      btn.gfx.lineStyle(2, 0x446688, 1); btn.gfx.strokeRoundedRect(btn.x, btn.y, btn.w, btn.h, 8);
      this.listeningFor = null;
    });
  }

  keyName(code) {
    const map = {
      32: 'SPACE', 65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E', 70: 'F',
      71: 'G', 72: 'H', 73: 'I', 74: 'J', 75: 'K', 76: 'L', 77: 'M',
      78: 'N', 79: 'O', 80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T',
      85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y', 90: 'Z',
      37: 'â†', 38: 'â†‘', 39: 'â†’', 40: 'â†“',
      16: 'SHIFT', 17: 'CTRL', 18: 'ALT', 9: 'TAB',
    };
    // Number row
    for (let i = 0; i <= 9; i++) map[48 + i] = `${i}`;
    return map[code] || `KEY_${code}`;
  }

  startListening(key, btnG, btnLabel, bx, by, bw, bh) {
    this.listeningFor = key;
    btnG.clear();
    btnG.fillStyle(0x004466, 1); btnG.fillRoundedRect(bx, by, bw, bh, 8);
    btnG.lineStyle(2, 0x00ffff, 1); btnG.strokeRoundedRect(bx, by, bw, bh, 8);
    btnLabel.setText('Press keyâ€¦').setColor('#00ffff');
  }

  cancelListening() {
    if (!this.listeningFor) return;
    const key = this.listeningFor;
    const btn = this.bindingBtns[key];
    btn.label.setText(this.keyName(window.CONTROLS[key])).setColor('#ffffff');
    btn.gfx.clear();
    btn.gfx.fillStyle(0x223344, 1); btn.gfx.fillRoundedRect(btn.x, btn.y, btn.w, btn.h, 8);
    btn.gfx.lineStyle(2, 0x446688, 1); btn.gfx.strokeRoundedRect(btn.x, btn.y, btn.w, btn.h, 8);
    this.listeningFor = null;
  }

  goBack() {
    this.scene.start(this.fromScene);
  }
}

// â”€â”€â”€ MENU SCENE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  preload() {
    Object.entries(SPRITES).forEach(([k,v]) => this.load.image(k, v));
  }

  create() {
    if (window.Limaze) Limaze.music('menu');
    this.isDay = true;
    this.t = 0;

    this.bg = this.add.graphics();
    this.drawBg(true);

    this.titleText = this.add.text(W/2, 130, 'DAY & NIGHT', {
      fontSize: '52px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#111111', stroke: '#888888', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W/2, 190, 'SURVIVAL', {
      fontSize: '28px', fontFamily: 'monospace',
      color: '#ffdd00', stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5);

    const instrStyle = { fontSize: '13px', fontFamily: 'monospace', color: '#555555', align: 'center' };
    this.add.text(W/2, 248, 'A/D: Move   SPACE: Jump   Mouse: Aim', instrStyle).setOrigin(0.5);
    this.add.text(W/2, 266, 'Left Click: Sword (free, regens energy)', instrStyle).setOrigin(0.5);
    this.add.text(W/2, 284, 'Right Click / F: Magic Burst (-5%)   E: Arrow (-20%)', instrStyle).setOrigin(0.5);
    this.add.text(W/2, 302, 'Q at 100% Energy: DOMAIN â€” freeze all enemies!', instrStyle).setOrigin(0.5);

    // PLAY button
    const btnGfx = this.add.graphics();
    btnGfx.fillStyle(0x222222, 1);
    btnGfx.fillRoundedRect(W/2 - 90, 326, 180, 52, 12);
    this.add.text(W/2, 352, 'PLAY', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);
    const btnZone = this.add.zone(W/2, 352, 180, 52).setInteractive();
    btnZone.on('pointerup', () => this.startGame());
    this.input.keyboard.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard.on('keydown-ENTER', () => this.startGame());

    // SETTINGS button
    const setGfx = this.add.graphics();
    setGfx.fillStyle(0x334455, 1);
    setGfx.fillRoundedRect(W/2 - 90, 392, 180, 44, 10);
    setGfx.lineStyle(2, 0x00aacc, 1);
    setGfx.strokeRoundedRect(W/2 - 90, 392, 180, 44, 10);
    this.add.text(W/2, 414, 'âš™  SETTINGS', {
      fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold', color: '#00ccff'
    }).setOrigin(0.5);
    const setZone = this.add.zone(W/2, 414, 180, 44).setInteractive();
    setZone.on('pointerup', () => this.openSettings());

    // mini stickmen preview
    if (this.textures.exists('playerBlackIdle')) {
      this.add.image(W/2 - 60, 488, 'playerBlackIdle').setScale(1.2);
      this.add.image(W/2 + 60, 488, 'playerWhiteIdle').setScale(1.2).setTint(0x999999);
    }
  }

  drawBg(day) {
    this.bg.clear();
    this.bg.fillStyle(day ? 0xeeeeee : 0x111111, 1);
    this.bg.fillRect(0, 0, W, H);
  }

  startGame() {
    if (window.Limaze) Limaze.stopMusic();
    this.scene.start('Game');
  }

  openSettings() {
    if (window.Limaze) Limaze.sfx('click');
    this.scene.start('Settings', { from: 'Menu' });
  }

  update(time, delta) {
    this.t += delta;
    if (this.t > 5000) { this.t = 0; this.isDay = !this.isDay; this.drawBg(this.isDay); }
    this.titleText.setColor(this.isDay ? '#111111' : '#ffffff');
  }
}

// â”€â”€â”€ GAME SCENE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  preload() {
    Object.entries(SPRITES).forEach(([k,v]) => this.load.image(k, v));
  }

  create() {
    this.score = 0;
    this.startTime = Date.now();
    this.energy = 100;
    this.isDay = true;
    this.cycleTimer = 0;
    this.cycleDuration = 30000;
    this.alive = true;

    // domain state
    this.domainActive = false;
    this.domainTimer = 0;
    this.domainCooldown = false;
    this.domainCooldownTimer = 0;
    this.domainMarks = [];
    this.invulnerable = false;

    // flash
    this.flashAlpha = 0;
    this.flashDir = 0;

    // platforms
    this.platforms = [
      { x: 80,  y: 420, w: 160, h: 14 },
      { x: 310, y: 340, w: 180, h: 14 },
      { x: 555, y: 410, w: 160, h: 14 },
      { x: 200, y: 240, w: 150, h: 14 },
    ];
    this.ground = { y: H - 38, h: 38 };

    // player
    this.player = {
      x: W/2, y: H - 38 - 32,
      vx: 0, vy: 0, w: 24, h: 48,
      onGround: false, facingAngle: 0,
      flipX: false, moving: false,
      walkFrame: 0, walkTimer: 0,
    };

    // collections (hard caps)
    this.enemies    = [];  this.MAX_ENEMIES = 40;
    this.projectiles= [];  this.MAX_PROJ    = 60;
    this.slashes    = [];  this.MAX_VFX     = 20;
    this.bursts     = [];
    this.arrows     = [];
    this.particles  = [];  this.MAX_PARTS   = 120;

    // spawn
    this.spawnTimer    = 0;
    this.spawnInterval = 3000;
    this.totalTime     = 0;

    // cooldowns (ms)
    this.slashCooldown = 0;
    this.burstCooldown = 0;
    this.arrowCooldown = 0;

    // â”€â”€ Graphics layers
    this.gfxBg      = this.add.graphics().setDepth(0);
    this.gfxPlatform= this.add.graphics().setDepth(1);
    this.gfxFlash   = this.add.graphics().setDepth(20);
    this.gfxDomain  = this.add.graphics().setDepth(18);
    this.gfxParts   = this.add.graphics().setDepth(9);
    this.gfxVfx     = this.add.graphics().setDepth(10);
    this.gfxEnProj  = this.add.graphics().setDepth(7);

    // â”€â”€ Sprite containers
    this.playerSprite = this.add.image(this.player.x, this.player.y, 'playerBlackIdle')
      .setDepth(12).setDisplaySize(this.player.w * 1.8, this.player.h * 1.1);

    // enemy sprite pool (max 40)
    this.enemySprites = [];
    for (let i = 0; i < this.MAX_ENEMIES; i++) {
      const s = this.add.image(-200, -200, 'divineDog').setDepth(8).setVisible(false).setDisplaySize(44, 44);
      this.enemySprites.push(s);
    }

    // arrow sprite pool (max 20)
    this.arrowSprites = [];
    for (let i = 0; i < this.MAX_VFX; i++) {
      const s = this.add.image(-200,-200,'arrowVfx').setDepth(11).setVisible(false).setDisplaySize(60,14);
      this.arrowSprites.push(s);
    }

    // slash sprite pool (max 8)
    this.slashSprites = [];
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(-200,-200,'slashVfx').setDepth(13).setVisible(false).setDisplaySize(88,56);
      this.slashSprites.push(s);
    }

    // burst sprite pool (max 8)
    this.burstSprites = [];
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(-200,-200,'burstVfx').setDepth(13).setVisible(false).setDisplaySize(88,56);
      this.burstSprites.push(s);
    }

    // domain mark graphics pool
    this.domainMarkGfx = [];
    for (let i = 0; i < this.MAX_ENEMIES; i++) {
      const g = this.add.graphics().setDepth(15).setVisible(false);
      this.domainMarkGfx.push(g);
    }

    // â”€â”€ Input (uses remappable window.CONTROLS)
    this.keys = this.input.keyboard.addKeys({
      left:   window.CONTROLS.left,
      right:  window.CONTROLS.right,
      jump:   window.CONTROLS.jump,
      burst:  window.CONTROLS.burst,
      arrow:  window.CONTROLS.arrow,
      domain: window.CONTROLS.domain,
    });
    // keydown listeners rebuild each game start so remaps apply
    this.input.keyboard.on('keydown', (evt) => {
      if (!this.alive) return;
      if (evt.keyCode === window.CONTROLS.jump)   this.handleJump();
      if (evt.keyCode === window.CONTROLS.burst)  this.doBurst();
      if (evt.keyCode === window.CONTROLS.arrow)  this.fireArrow();
      if (evt.keyCode === window.CONTROLS.domain) this.triggerDomain();
    });
    this.input.on('pointerdown', (ptr) => {
      if (!this.alive) return;
      if (ptr.leftButtonDown())  this.doSlash();
      if (ptr.rightButtonDown()) this.doBurst();
    });

    // â”€â”€ Export for Mobile UI â”€â”€
    window.doJump = () => { if (this.alive) this.handleJump(); };
    window.doBurst = () => { if (this.alive) this.doBurst(); };
    window.doArrow = () => { if (this.alive) this.fireArrow(); };
    window.doDomain = () => { if (this.alive) this.triggerDomain(); };
    window.doSlash = () => { if (this.alive) this.doSlash(); };

    // â”€â”€ Export for Mobile UI â”€â”€
    window.doJump = () => { if (this.alive) this.handleJump(); };
    window.doBurst = () => { if (this.alive) this.doBurst(); };
    window.doArrow = () => { if (this.alive) this.fireArrow(); };
    window.doDomain = () => { if (this.alive) this.triggerDomain(); };
    window.doSlash = () => { if (this.alive) this.doSlash(); };
    this.input.mouse.disableContextMenu();

    // â”€â”€ HUD text
    const ts  = { fontSize:'14px', fontFamily:'monospace', color:'#ffffff', stroke:'#000', strokeThickness:3 };
    const ts2 = { ...ts, color:'#111111' };
    this.scoreText    = this.add.text(12, 10, 'SCORE: 0', ts).setDepth(25);
    this.cycleText    = this.add.text(W/2, 10, 'DAY  |  30s', { ...ts, align:'center' }).setOrigin(0.5,0).setDepth(25);
    this.domainLabel  = this.add.text(W/2, H/2 - 30, '', { fontSize:'26px', fontFamily:'monospace', color:'#00ffff', stroke:'#000', strokeThickness:4, align:'center' }).setOrigin(0.5).setDepth(25);
    this.cooldownLabel= this.add.text(W-12, 10, '', ts).setOrigin(1,0).setDepth(25);
    this.energyLabel  = this.add.text(12, H - 24, 'ENERGY: 100%', ts).setDepth(25);

    // draw static platforms
    this.drawPlatforms();

    if (window.Limaze) Limaze.music('upbeat');
  }

  // â”€â”€â”€ DRAW BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drawBg() {
    const g = this.gfxBg; g.clear();
    if (this.isDay) {
      g.fillStyle(0xddeeff, 1); g.fillRect(0, 0, W, H);
      // sun
      g.fillStyle(0xffee44, 1); g.fillCircle(720, 60, 36);
      // ground stripe
      g.fillStyle(0x88bb66, 1); g.fillRect(0, this.ground.y, W, this.ground.h);
      g.fillStyle(0x66994d, 1); g.fillRect(0, this.ground.y, W, 5);
    } else {
      g.fillStyle(0x0a0a18, 1); g.fillRect(0, 0, W, H);
      // moon
      g.fillStyle(0xeeeebb, 1); g.fillCircle(720, 60, 28);
      g.fillStyle(0x0a0a18, 1); g.fillCircle(734, 54, 22);
      // stars
      g.fillStyle(0xffffff, 0.8);
      [[60,40],[120,80],[200,30],[300,55],[450,20],[580,45],[660,90],[100,130],[350,100]].forEach(([sx,sy]) => {
        g.fillRect(sx-1, sy-1, 3, 3);
      });
      // ground
      g.fillStyle(0x222233, 1); g.fillRect(0, this.ground.y, W, this.ground.h);
      g.fillStyle(0x333355, 1); g.fillRect(0, this.ground.y, W, 5);
    }
  }

  // â”€â”€â”€ DRAW PLATFORMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drawPlatforms() {
    const g = this.gfxPlatform; g.clear();
    this.platforms.forEach(p => {
      if (this.isDay) {
        g.fillStyle(0x886633, 1); g.fillRect(p.x, p.y, p.w, p.h);
        g.fillStyle(0x66aa44, 1); g.fillRect(p.x, p.y, p.w, 5);
      } else {
        g.fillStyle(0x334466, 1); g.fillRect(p.x, p.y, p.w, p.h);
        g.fillStyle(0x445588, 1); g.fillRect(p.x, p.y, p.w, 5);
      }
    });
  }

  // â”€â”€â”€ UPDATE PLAYER SPRITE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  updatePlayerSprite(delta) {
    const p = this.player;
    // walk animation toggle
    if (p.moving) {
      p.walkTimer += delta;
      if (p.walkTimer > 220) { p.walkFrame = 1 - p.walkFrame; p.walkTimer = 0; }
    } else { p.walkFrame = 0; p.walkTimer = 0; }

    let key;
    if (this.isDay) {
      key = (p.moving && p.walkFrame === 1) ? 'playerBlackWalk' : 'playerBlackIdle';
    } else {
      key = (p.moving && p.walkFrame === 1) ? 'playerWhiteWalk' : 'playerWhiteIdle';
    }

    this.playerSprite.setTexture(key);
    this.playerSprite.setPosition(p.x, p.y - p.h * 0.05);
    this.playerSprite.setDisplaySize(p.w * 1.9, p.h * 1.1);
    this.playerSprite.setFlipX(p.flipX);

    // tint for day/night readability
    this.playerSprite.clearTint();
    if (this.domainCooldown) {
      this.playerSprite.setTint(this.isDay ? 0x88ccff : 0xaaffee);
    }
  }

  // â”€â”€â”€ UPDATE ENEMY SPRITES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  updateEnemySprites() {
    this.enemySprites.forEach((s, i) => {
      if (i < this.enemies.length) {
        const e = this.enemies[i];
        let key = 'divineDog';
        let sw = 44, sh = 44;
        if (e.type === 'lightAngel')   { key = 'lightAngel';   sw = 50; sh = 58; }
        if (e.type === 'demonWolf')    { key = 'demonWolf';    sw = 44; sh = 44; }
        if (e.type === 'tridentDevil') { key = 'tridentDevil'; sw = 50; sh = 58; }
        s.setTexture(key).setPosition(e.x, e.y).setDisplaySize(sw, sh).setVisible(true);
        // walking flip for ground enemies
        if (e.type === 'divineDog' || e.type === 'demonWolf') {
          s.setFlipX(e.vx < 0);
        }
        // domain mark overlay tint
        if (e.domainMark) s.setTint(0xff4444); else s.clearTint();
      } else {
        s.setVisible(false).setPosition(-200, -200);
      }
    });
  }

  // â”€â”€â”€ UPDATE ARROW SPRITES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  updateArrowSprites() {
    this.arrowSprites.forEach((s, i) => {
      if (i < this.arrows.length) {
        const a = this.arrows[i];
        s.setPosition(a.x, a.y)
         .setRotation(a.angle)
         .setDisplaySize(60, 14)
         .setVisible(true);
      } else {
        s.setVisible(false).setPosition(-200, -200);
      }
    });
  }

  // â”€â”€â”€ DRAW VFX (slash/burst rendered via graphics + sprite) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drawVfx() {
    const g = this.gfxVfx; g.clear();

    // slash sprites
    this.slashSprites.forEach((s, i) => {
      if (i < this.slashes.length) {
        const sl = this.slashes[i];
        const alpha = sl.life / sl.maxLife;
        s.setPosition(sl.x, sl.y)
         .setRotation(sl.angle)
         .setDisplaySize(sl.w, sl.h)
         .setAlpha(alpha)
         .setVisible(true);
      } else {
        s.setVisible(false).setPosition(-200, -200);
      }
    });

    // burst sprites
    this.burstSprites.forEach((s, i) => {
      if (i < this.bursts.length) {
        const b = this.bursts[i];
        const alpha = b.life / b.maxLife;
        s.setPosition(b.x, b.y)
         .setRotation(b.angle)
         .setDisplaySize(b.w * (1 + (1 - alpha) * 0.3), b.h)
         .setAlpha(alpha)
         .setVisible(true);
      } else {
        s.setVisible(false).setPosition(-200, -200);
      }
    });

    // enemy projectiles drawn on gfxEnProj
    const gp = this.gfxEnProj; gp.clear();
    this.projectiles.forEach(pr => {
      if (pr.type === 'angelBeam') {
        gp.fillStyle(0xffffff, 0.9); gp.fillRect(pr.x - 2, pr.y - 12, 4, 24);
      } else if (pr.type === 'trident') {
        // draw crimson trident shape
        gp.fillStyle(0xcc1111, 1);
        const ax = Math.cos(pr.angle), ay = Math.sin(pr.angle);
        const px = pr.x, py = pr.y;
        gp.fillRect(px + ax*-10 - 2, py + ay*-10 - 2, 4, 4);
        gp.fillRect(px + ax*8 - 2, py + ay*8 - 2, 4, 4);
        gp.lineStyle(3, 0xcc1111, 1);
        gp.beginPath(); gp.moveTo(px + ax*-12, py + ay*-12); gp.lineTo(px + ax*12, py + ay*12); gp.strokePath();
        // tines
        const perp = { x: -ay, y: ax };
        gp.beginPath(); gp.moveTo(px + ax*8, py + ay*8); gp.lineTo(px + ax*8 + perp.x*6, py + ay*8 + perp.y*6); gp.strokePath();
        gp.beginPath(); gp.moveTo(px + ax*8, py + ay*8); gp.lineTo(px + ax*8 - perp.x*6, py + ay*8 - perp.y*6); gp.strokePath();
        gp.beginPath(); gp.moveTo(px + ax*8, py + ay*8); gp.lineTo(px + ax*14, py + ay*14); gp.strokePath();
      }
    });
  }

  // â”€â”€â”€ DRAW PARTICLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drawParticles() {
    const g = this.gfxParts; g.clear();
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      g.fillStyle(p.color, alpha);
      g.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
  }

  // â”€â”€â”€ DRAW DOMAIN OVERLAY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drawDomain() {
    const g = this.gfxDomain; g.clear();
    if (this.domainActive) {
      g.fillStyle(0x001133, 0.35); g.fillRect(0, 0, W, H);
      // vignette ring
      g.lineStyle(6, 0x00ccff, 0.5);
      g.strokeRect(10, 10, W-20, H-20);

      // domain marks on enemies
      this.enemies.forEach(e => {
        if (e.domainMark) {
          g.lineStyle(3, 0xff2222, 1);
          const s = 14;
          g.beginPath(); g.moveTo(e.x - s, e.y - s); g.lineTo(e.x + s, e.y + s); g.strokePath();
          g.beginPath(); g.moveTo(e.x + s, e.y - s); g.lineTo(e.x - s, e.y + s); g.strokePath();
          // glow circle
          g.lineStyle(2, 0xff6666, 0.5); g.strokeCircle(e.x, e.y, s + 4);
        }
      });
    }

    // energy ring around player
    const p = this.player;
    const pct = Math.max(0, Math.min(1, this.energy / 100));
    const ringR = 28;
    // background ring
    g.lineStyle(5, this.isDay ? 0xaaaaaa : 0x444444, 0.6);
    g.strokeCircle(p.x, p.y, ringR);
    // energy arc
    const startA = -Math.PI / 2;
    const endA = startA + Math.PI * 2 * pct;
    const ringColor = pct > 0.6 ? 0x44ff88 : pct > 0.3 ? 0xffcc00 : 0xff4444;
    if (pct > 0.001) {
      g.lineStyle(5, ringColor, 1);
      g.beginPath();
      g.arc(p.x, p.y, ringR, startA, endA, false);
      g.strokePath();
    }
    // full glow at 100%
    if (this.energy >= 95) {
      g.lineStyle(3, 0x00ffff, 0.7);
      g.strokeCircle(p.x, p.y, ringR + 4);
    }
  }

  // â”€â”€â”€ DRAW FLASH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  drawFlash() {
    const g = this.gfxFlash; g.clear();
    if (this.flashAlpha > 0) {
      const col = this.isDay ? 0xffffff : 0x000000;
      g.fillStyle(col, this.flashAlpha);
      g.fillRect(0, 0, W, H);
    }
  }

  // â”€â”€â”€ PLATFORM COLLISION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  platformCollide(obj, w, h) {
    // ground
    const gy = this.ground.y;
    if (obj.y + h/2 >= gy && obj.vy >= 0) {
      obj.y = gy - h/2;
      obj.vy = 0;
      obj.onGround = true;
      return;
    }
    obj.onGround = false;
    // platforms (only from above)
    for (const p of this.platforms) {
      const inX = obj.x + w/2 > p.x && obj.x - w/2 < p.x + p.w;
      const wasAbove = (obj.y + h/2 - obj.vy * 0.016) <= p.y + 2;
      if (inX && obj.vy >= 0 && obj.y + h/2 >= p.y && obj.y + h/2 <= p.y + p.h + 6 && wasAbove) {
        obj.y = p.y - h/2;
        obj.vy = 0;
        obj.onGround = true;
        return;
      }
    }
  }

  // â”€â”€â”€ HANDLE JUMP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  handleJump() {
    if (!this.alive) return;
    if (this.player.onGround) {
      this.player.vy = -500;
      this.player.onGround = false;
      if (window.Limaze) Limaze.sfx('jump');
    }
  }

  // â”€â”€â”€ SWORD SLASH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doSlash() {
    if (!this.alive) return;
    if (this.slashCooldown > 0) return;
    if (this.slashes.length >= this.MAX_VFX) this.slashes.shift();

    const p = this.player;
    const ang = p.facingAngle;
    const dist = 44;
    const sx = p.x + Math.cos(ang) * dist;
    const sy = p.y + Math.sin(ang) * dist;

    this.slashes.push({ x: sx, y: sy, angle: ang, w: 88, h: 56, life: 220, maxLife: 220 });
    this.slashCooldown = 320;
    if (window.Limaze) Limaze.sfx('hit');

    // hit detection & energy regen
    let hitAny = false;
    const reach = 70;
    this.enemies = this.enemies.filter(e => {
      const dx = e.x - p.x, dy = e.y - p.y;
      const dist2 = Math.sqrt(dx*dx + dy*dy);
      const ang2Enemy = Math.atan2(dy, dx);
      const angDiff = Math.abs(Phaser.Math.Angle.ShortestBetween(
        Phaser.Math.RadToDeg(ang), Phaser.Math.RadToDeg(ang2Enemy)
      ));
      if (dist2 < reach && angDiff < 60) {
        if (!this.domainActive) {
          this.spawnParticles(e.x, e.y, this.enemyColor(e.type), 8);
          this.score += 10;
          hitAny = true;
          return false;
        } else {
          e.domainMark = true;
          return true;
        }
      }
      return true;
    });

    if (hitAny) {
      this.energy = Math.min(100, this.energy + 10);
      if (window.Limaze) Limaze.sfx('coin');
    }
  }

  // â”€â”€â”€ MAGIC BURST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  doBurst() {
    if (!this.alive) return;
    if (this.domainCooldown) return;  // locked during domain cooldown
    if (this.burstCooldown > 0) return;
    if (this.energy < 5) return;

    const p = this.player;
    const ang = p.facingAngle;
    const dist = 48;
    const bx = p.x + Math.cos(ang) * dist;
    const by = p.y + Math.sin(ang) * dist;

    if (this.bursts.length >= this.MAX_VFX) this.bursts.shift();
    this.bursts.push({ x: bx, y: by, angle: ang, w: 88, h: 56, life: 180, maxLife: 180 });

    this.energy = Math.max(0, this.energy - 5);
    this.burstCooldown = 400;
    if (window.Limaze) Limaze.sfx('explosion');

    // hit nearby enemies in cone
    const coneRange = 110;
    this.enemies = this.enemies.filter(e => {
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      const ang2e = Math.atan2(dy, dx);
      const diff = Math.abs(Phaser.Math.Angle.ShortestBetween(
        Phaser.Math.RadToDeg(ang), Phaser.Math.RadToDeg(ang2e)
      ));
      if (d < coneRange && diff < 45) {
        if (!this.domainActive) {
          this.spawnParticles(e.x, e.y, this.enemyColor(e.type), 8);
          this.score += 15;
          return false;
        } else {
          e.domainMark = true;
          return true;
        }
      }
      return true;
    });
  }

  // â”€â”€â”€ FIRE ARROW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  fireArrow() {
    if (!this.alive) return;
    if (this.domainCooldown) return;
    if (this.arrowCooldown > 0) return;
    if (this.energy < 20) return;

    const p = this.player;
    const ang = p.facingAngle;
    const speed = 700;

    if (this.arrows.length >= this.MAX_VFX) {
      const old = this.arrows.shift();
      // hide its sprite
    }
    this.arrows.push({
      x: p.x + Math.cos(ang) * 30,
      y: p.y + Math.sin(ang) * 30,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      angle: ang,
      life: 1800,
    });
    this.energy = Math.max(0, this.energy - 20);
    this.arrowCooldown = 600;
    if (window.Limaze) Limaze.sfx('powerup');
  }

  // â”€â”€â”€ TRIGGER DOMAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  triggerDomain() {
    if (!this.alive) return;
    if (this.energy < 95) return;
    if (this.domainActive || this.domainCooldown) return;

    // Set invulnerable + cooldown BEFORE zeroing energy so the death
    // check can never fire on the same frame domain is triggered.
    this.invulnerable = true;
    this.domainCooldown = true;          // pre-arm so death check is blocked
    this.domainCooldownTimer = 15000;    // 5s domain + 10s immortality window
    this.domainActive = true;
    this.domainTimer = 5000;
    this.energy = 0;
    if (window.Limaze) { Limaze.sfx('win'); Limaze.music('tense'); }
  }

  // â”€â”€â”€ CYCLE SWITCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  switchCycle() {
    this.isDay = !this.isDay;
    // destroy all enemies
    this.enemies.forEach(e => this.spawnParticles(e.x, e.y, 0xffffff, 10));
    this.enemies = [];
    // clear projectiles
    this.projectiles = [];
    // flash
    this.flashAlpha = 0.85;
    this.flashDir = -1;
    this.drawPlatforms();
    if (window.Limaze) Limaze.sfx('select');
    const mood = this.isDay ? 'upbeat' : 'tense';
    if (window.Limaze) { Limaze.stopMusic(); Limaze.music(mood); }
  }

  // â”€â”€â”€ SPAWN ENEMIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  spawnEnemy() {
    if (this.enemies.length >= this.MAX_ENEMIES) return;
    const speedScale = 1 + this.totalTime / 60000;

    if (this.isDay) {
      // Day: Demon Wolves (ground) + Trident Devils (platform)
      const r = Math.random();
      if (r < 0.55) {
        // Demon Wolf - drops from top onto ground
        this.enemies.push({
          type: 'demonWolf', x: Math.random() * (W - 60) + 30,
          y: -30, vx: (Math.random() > 0.5 ? 1 : -1) * (80 + 60 * speedScale),
          vy: 0, onGround: false, w: 36, h: 36,
          hp: 1, shootTimer: 0, domainMark: false,
        });
      } else {
        // Trident Devil - spawns on random platform
        const plat = this.platforms[Math.floor(Math.random() * this.platforms.length)];
        this.enemies.push({
          type: 'tridentDevil', x: plat.x + plat.w / 2, y: plat.y - 32,
          vx: 0, vy: 0, onGround: true, w: 28, h: 50,
          hp: 1, shootTimer: 1200 + Math.random() * 600,
          platformRef: plat, domainMark: false,
        });
      }
    } else {
      // Night: Divine Dogs (ground) + Light Angels (platform)
      const r = Math.random();
      if (r < 0.55) {
        this.enemies.push({
          type: 'divineDog', x: Math.random() * (W - 60) + 30,
          y: -30, vx: (Math.random() > 0.5 ? 1 : -1) * (100 + 70 * speedScale),
          vy: 0, onGround: false, w: 36, h: 36,
          hp: 1, shootTimer: 0, domainMark: false,
        });
      } else {
        const plat = this.platforms[Math.floor(Math.random() * this.platforms.length)];
        this.enemies.push({
          type: 'lightAngel', x: plat.x + plat.w / 2, y: plat.y - 34,
          vx: 0, vy: 0, onGround: true, w: 28, h: 52,
          hp: 1, shootTimer: 1400 + Math.random() * 600,
          platformRef: plat, domainMark: false,
        });
      }
    }
  }

  // â”€â”€â”€ ENEMY COLOR (for particles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  enemyColor(type) {
    switch(type) {
      case 'divineDog':    return 0xff3333;
      case 'lightAngel':   return 0xffee44;
      case 'demonWolf':    return 0xaa44ff;
      case 'tridentDevil': return 0xff8822;
    }
    return 0xffffff;
  }

  // â”€â”€â”€ SPAWN PARTICLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.MAX_PARTS) this.particles.shift();
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        color, size: 3 + Math.random() * 4,
        life: 400 + Math.random() * 300, maxLife: 700,
      });
    }
  }

  // â”€â”€â”€ TAKE DAMAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  takeDamage() {
    // Brief post-hit invuln still blocks rapid multi-hits
    if (this.invulnerable) return;

    if (window.Limaze) Limaze.sfx('hurt');
    this.playerSprite.setTint(0xff4444);
    this.time.delayedCall(200, () => { if (this.alive) this.playerSprite.clearTint(); });

    // During domain cooldown window: player is at 0 energy â€”
    // a single hit instantly kills them (one-hit kill) but nothing else does.
    if (this.domainCooldown) {
      this.domainCooldown = false;
      this.invulnerable = false;
      this.energy = 0;
      this.gameOver();
      return;
    }

    // Normal damage
    this.energy = Math.max(0, this.energy - 15);
    // Brief invuln window to prevent instant double-hits
    this.invulnerable = true;
    this.invulnTimer = 800;
  }

  // â”€â”€â”€ GAME OVER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  gameOver() {
    if (!this.alive) return;
    this.alive = false;
    if (window.Limaze) {
      Limaze.postScore(Math.floor(this.score));
      Limaze.stopMusic();
      Limaze.sfx('lose');
    }
    this.scene.pause();
    this.scene.launch('GameOver', { score: Math.floor(this.score) });
  }

  // â”€â”€â”€ MAIN UPDATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  update(time, delta) {
    if (!this.alive) return;
    const dt = delta / 1000;

    this.totalTime += delta;

    // â”€â”€ flash fade
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    }

    // â”€â”€ invuln timer
    if (this.invulnerable) {
      this.invulnTimer -= delta;
      if (this.invulnTimer <= 0) { this.invulnerable = false; }
    }

    // â”€â”€ domain cooldown â€” 10s immortality window (one-hit kill, no energy death)
    if (this.domainCooldown) {
      this.domainCooldownTimer -= delta;
      // Keep energy pinned at 0 â€” passive decay cannot kill; only a direct hit does
      this.energy = 0;
      if (this.domainCooldownTimer <= 0) {
        this.domainCooldown = false;
        this.domainActive  = false;
        this.invulnerable  = false;
        // Grace energy so player can start slashing to regen immediately
        this.energy = 5;
        this.cooldownLabel.setText('');
        if (window.Limaze) { Limaze.stopMusic(); Limaze.music(this.isDay ? 'upbeat' : 'tense'); }
      } else {
        // Show "DOMAIN Xs" during active 5s, then "â˜… IMMORTAL Xs â˜…" for the rest
        if (this.domainActive) {
          const secs = Math.ceil(this.domainTimer / 1000);
          this.cooldownLabel.setText(`â¬¡ DOMAIN: ${secs}s`).setColor('#00ffff');
        } else {
          const secs = Math.ceil(this.domainCooldownTimer / 1000);
          this.cooldownLabel.setText(`â˜… IMMORTAL: ${secs}s â˜…`).setColor('#00ffff');
        }
      }
    } else {
      this.cooldownLabel.setText('');
    }

    // â”€â”€ domain active
    if (this.domainActive) {
      this.domainTimer -= delta;
      const secs = Math.ceil(this.domainTimer / 1000);
      this.domainLabel.setText(`â¬¡ DOMAIN â¬¡\n${secs}s â€” CLICK ENEMIES TO MARK`);
      if (this.domainTimer <= 0) {
        this.domainActive = false;
        // domainCooldown + invulnerable already set at trigger time.
        // Remaining cooldown timer is whatever is left of the 15s window.
        this.domainLabel.setText('');
        // explode marked enemies
        this.enemies = this.enemies.filter(e => {
          if (e.domainMark) {
            this.spawnParticles(e.x, e.y, this.enemyColor(e.type), 16);
            this.score += 50;
            if (window.Limaze) Limaze.sfx('explosion');
            return false;
          }
          return true;
        });
      }
    } else {
      this.domainLabel.setText('');
    }

    // domain click mark
    if (this.domainActive && this.input.activePointer.isDown && this.input.activePointer.leftButtonDown()) {
      const px = this.input.activePointer.x, py = this.input.activePointer.y;
      this.enemies.forEach(e => {
        const dx = e.x - px, dy = e.y - py;
        if (Math.sqrt(dx*dx + dy*dy) < 36) { e.domainMark = true; }
      });
    }

    // â”€â”€ day/night cycle
    if (!this.domainActive) {
      this.cycleTimer += delta;
      if (this.cycleTimer >= this.cycleDuration) {
        this.cycleTimer = 0;
        this.switchCycle();
      }
      const remaining = Math.ceil((this.cycleDuration - this.cycleTimer) / 1000);
      this.cycleText.setText(`${this.isDay ? 'DAY' : 'NIGHT'}  |  ${remaining}s`);
      this.cycleText.setColor(this.isDay ? '#111111' : '#ffffff');
    }

    // â”€â”€ aim angle from mouse
    const ptr = this.input.activePointer;
    const p = this.player;
    p.facingAngle = Math.atan2(ptr.y - p.y, ptr.x - p.x);
    p.flipX = ptr.x < p.x;

    // â”€â”€ player movement (uses remappable keys)
    const spd = 240;
    p.vx = 0;
    p.moving = false;
    if (this.keys.left.isDown || window.mobileLeft)  { p.vx = -spd; p.moving = true; p.flipX = true; }
    if (this.keys.right.isDown || window.mobileRight) { p.vx =  spd; p.moving = true; p.flipX = false; }

    // â”€â”€ cooldowns
    if (this.slashCooldown > 0) this.slashCooldown -= delta;
    if (this.burstCooldown  > 0) this.burstCooldown  -= delta;
    if (this.arrowCooldown  > 0) this.arrowCooldown  -= delta;

    // â”€â”€ gravity
    if (!p.onGround) p.vy += 1100 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = Phaser.Math.Clamp(p.x, p.w/2, W - p.w/2);

    // â”€â”€ platform collision
    this.platformCollide(p, p.w, p.h);

    // â”€â”€ energy passive: NO passive decay (only costs from magic use)
    // energy clamp
    this.energy = Phaser.Math.Clamp(this.energy, 0, 100);

    // â”€â”€ check death â€” energy drain can't kill during domain active phase;
    //    domain cooldown one-hit kill is handled inside takeDamage()
    if (this.energy <= 0 && !this.domainCooldown && !this.domainActive) { this.gameOver(); return; }

    // â”€â”€ spawn enemies
    if (!this.domainActive) {
      this.spawnTimer += delta;
      const interval = Math.max(600, this.spawnInterval - this.totalTime / 200);
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this.spawnEnemy();
        if (Math.random() < 0.3) this.spawnEnemy(); // double spawn chance
      }
    }

    // â”€â”€ update enemies
    this.enemies.forEach(e => {
      if (this.domainActive) return; // frozen!
      if (e.type === 'divineDog' || e.type === 'demonWolf') {
        // ground runner
        if (!e.onGround) e.vy += 900 * dt;
        e.y += e.vy * dt;
        e.x += e.vx * dt;
        this.platformCollide(e, e.w, e.h);
        // chase player on ground
        if (e.onGround) e.vx = (p.x > e.x ? 1 : -1) * (1 + this.totalTime / 60000) * (e.type === 'divineDog' ? 105 : 95);
        // wall bounce
        if (e.x < 20 || e.x > W - 20) e.vx *= -1;
        // contact damage
        const dx = Math.abs(e.x - p.x), dy = Math.abs(e.y - p.y);
        if (dx < 24 && dy < 30) this.takeDamage();
      } else {
        // platform floater â€” stay on platform
        if (e.platformRef) {
          e.x = e.platformRef.x + e.platformRef.w / 2;
          e.y = e.platformRef.y - (e.h / 2);
        }
        e.shootTimer -= delta;
        if (e.shootTimer <= 0) {
          e.shootTimer = Math.max(600, 1500 - this.totalTime / 500);
          if (this.projectiles.length < this.MAX_PROJ) {
            if (e.type === 'lightAngel') {
              this.projectiles.push({ type: 'angelBeam', x: e.x, y: e.y + 20, vx: 0, vy: 260, life: 2000 });
            } else if (e.type === 'tridentDevil') {
              const ang = Math.atan2(p.y - e.y, p.x - e.x);
              const spd2 = 320 + this.totalTime / 1000;
              this.projectiles.push({ type: 'trident', x: e.x, y: e.y, vx: Math.cos(ang) * spd2, vy: Math.sin(ang) * spd2, angle: ang, life: 3000 });
              if (window.Limaze) Limaze.sfx('hit');
            }
          }
        }
      }
    });

    // â”€â”€ update projectiles
    this.projectiles = this.projectiles.filter(pr => {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= delta;
      if (pr.life <= 0 || pr.x < -20 || pr.x > W+20 || pr.y < -20 || pr.y > H+20) return false;
      // hit player
      const dx = Math.abs(pr.x - p.x), dy = Math.abs(pr.y - p.y);
      if (dx < 18 && dy < 22) { this.takeDamage(); return false; }
      return true;
    });

    // â”€â”€ update arrows
    this.arrows = this.arrows.filter(a => {
      a.x += a.vx * dt; a.y += a.vy * dt; a.life -= delta;
      if (a.life <= 0 || a.x < -20 || a.x > W+20 || a.y < -20 || a.y > H+20) return false;
      // hit enemy
      let hit = false;
      this.enemies = this.enemies.filter(e => {
        if (hit) return true;
        const dx = Math.abs(e.x - a.x), dy = Math.abs(e.y - a.y);
        if (dx < 26 && dy < 26) {
          if (!this.domainActive) {
            this.spawnParticles(e.x, e.y, this.enemyColor(e.type), 10);
            this.score += 20;
            hit = true;
            if (window.Limaze) Limaze.sfx('coin');
            return false;
          } else {
            e.domainMark = true;
            hit = true;
          }
        }
        return true;
      });
      return !hit;
    });

    // â”€â”€ update slashes (lifetime)
    this.slashes = this.slashes.filter(sl => { sl.life -= delta; return sl.life > 0; });
    this.bursts  = this.bursts.filter(b  => { b.life  -= delta; return b.life  > 0; });

    // â”€â”€ update particles
    this.particles = this.particles.filter(pt => {
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.vx *= 0.92; pt.vy *= 0.92;
      pt.life -= delta;
      return pt.life > 0;
    });

    // â”€â”€ HUD
    this.scoreText.setText(`SCORE: ${Math.floor(this.score)}`);
    this.scoreText.setColor(this.isDay ? '#111111' : '#ffffff');
    this.energyLabel.setText(`ENERGY: ${Math.floor(this.energy)}%`);
    this.energyLabel.setColor(this.energy > 60 ? '#44ff88' : this.energy > 30 ? '#ffcc00' : '#ff4444');
    if (this.energy >= 95 && !this.domainActive && !this.domainCooldown) {
      this.energyLabel.setText(`ENERGY: ${Math.floor(this.energy)}% â€” PRESS Q: DOMAIN!`).setColor('#00ffff');
    }

    // â”€â”€ DRAW everything
    this.drawBg();
    this.drawPlatforms();
    this.updatePlayerSprite(delta);
    this.updateEnemySprites();
    this.updateArrowSprites();
    this.drawVfx();
    this.drawParticles();
    this.drawDomain();
    this.drawFlash();
  }
}

// â”€â”€â”€ GAME OVER SCENE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    const score = data.score || 0;
    
    // Get duration from Game scene
    const gameScene = this.scene.get('Game');
    const duration = gameScene && gameScene.startTime ? Math.floor((Date.now() - gameScene.startTime) / 1000) : 0;
    
    // Send score to Arcade wrapper
    window.parent.postMessage({
      type: 'scoreUpdate',
      score: Math.floor(score)
    }, '*');
    window.parent.postMessage({
      type: 'gameEnd',
      score: Math.floor(score),
      duration: duration
    }, '*');

    if (window.Limaze) Limaze.music('menu');

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.78); bg.fillRect(0, 0, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a1a2e, 1); panel.fillRoundedRect(W/2 - 200, H/2 - 170, 400, 340, 18);
    panel.lineStyle(3, 0x00ffff, 1); panel.strokeRoundedRect(W/2 - 200, H/2 - 170, 400, 340, 18);

    this.add.text(W/2, H/2 - 120, 'GAME OVER', {
      fontSize: '40px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ff4444', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 - 50, `SCORE`, {
      fontSize: '18px', fontFamily: 'monospace', color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 + 0, `${score}`, {
      fontSize: '52px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#ffdd00', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // play again button
    const btnG = this.add.graphics();
    btnG.fillStyle(0x00ccff, 1); btnG.fillRoundedRect(W/2 - 100, H/2 + 70, 200, 52, 10);
    btnG.lineStyle(2, 0xffffff, 1); btnG.strokeRoundedRect(W/2 - 100, H/2 + 70, 200, 52, 10);

    this.add.text(W/2, H/2 + 96, 'PLAY AGAIN', {
      fontSize: '22px', fontFamily: 'monospace', fontStyle: 'bold', color: '#000000'
    }).setOrigin(0.5);

    const zone = this.add.zone(W/2, H/2 + 96, 200, 52).setInteractive();
    zone.on('pointerup', () => this.restart());
    this.input.keyboard.on('keydown-SPACE', () => this.restart());
    this.input.keyboard.on('keydown-ENTER', () => this.restart());

    // Settings button on game over
    const setG2 = this.add.graphics();
    setG2.fillStyle(0x223344, 1); setG2.fillRoundedRect(W/2 - 80, H/2 + 138, 160, 38, 8);
    setG2.lineStyle(2, 0x00aacc, 1); setG2.strokeRoundedRect(W/2 - 80, H/2 + 138, 160, 38, 8);
    this.add.text(W/2, H/2 + 157, 'âš™  SETTINGS', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', color: '#00ccff'
    }).setOrigin(0.5);
    const setZone2 = this.add.zone(W/2, H/2 + 157, 160, 38).setInteractive();
    setZone2.on('pointerup', () => {
      if (window.Limaze) Limaze.sfx('click');
      this.scene.stop('GameOver');
      this.scene.stop('Game');
      this.scene.start('Settings', { from: 'Menu' });
    });

    if (window.Limaze) Limaze.sfx('lose');
  }

  restart() {
    if (window.Limaze) Limaze.stopMusic();
    this.scene.stop('GameOver');
    this.scene.stop('Game');
    this.scene.start('Game');
  }
}

// â”€â”€â”€ BOOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const config = {
  type: Phaser.AUTO,
  width: W, height: H,
  backgroundColor: '#111111',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, SettingsScene, GameScene, GameOverScene],
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});

