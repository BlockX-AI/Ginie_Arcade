// ============================================================
// AETHER BLADE — game.js  (Phaser 3.80.1)
// ============================================================

// ── Asset URLs ──────────────────────────────────────────────
const A = {
  playerIdle  : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_ea1e5cf261bb7e1a/Orange-cloaked-cyberpunk-sci-fi-swordsma-1781508713876.png',
  playerRun   : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_4a1927bce9809c7b/Orange-cloaked-cyberpunk-sci-fi-swordsma-1781508636876.png',
  playerJump  : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_4077f439cdd4b7ed/Orange-cloaked-cyberpunk-sci-fi-swordsma-1781508651535.png',
  playerSlash : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_6c17c5fc99bb1b08/Orange-cloaked-cyberpunk-sci-fi-swordsma-1781508655947.png',
  player  : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_a7de4e0a5b384a4e/Orange-cloaked-sci-fi-swordsman-warrior--1781473798736.png',
  beetle  : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_40b40a2e7abcffa3/Red-ground-beetle-enemy-side-view-pixel--1781473773601.png',
  wasp    : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_12088db71573602d/Hover-wasp-drone-enemy-side-view-pixel-a-1781473788579.png',
  wizard  : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_02c8032130130eff/Blue-robed-wizard-mage-enemy-side-view-p-1781473832859.png',
  golem   : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_bff9872a3b414ac2/Massive-molten-lava-rock-golem-boss-fron-1781473826868.png',
  tile    : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_4a01dfd24fdc02f4/Stone-platform-tile-block-pixel-art-16-b-1781473845994.png',
  bgSky   : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_f50aab88ba3338b5/Deep-indigo-starry-night-sky-background--1781473899110.png',
  bgMtn   : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_28e8e5fbf6a04339/Dark-volcanic-mountain-silhouettes-backg-1781473874183.png',
  bgRuin  : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_12f6b18758c43d24/Ruined-rocky-foreground-ruins-background-1781473907360.png',
  fireball: 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_3ea4ed50b16e0cd7/Fire-explosion-magma-ball-projectile-pix-1781473920372.png',
  iceShrd : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_b6387c90320304a2/Ice-freeze-dash-projectile-crystal-shard-1781473925667.png',
  tornado : 'https://api.gamenest.ai/asset-cdn/user_ss0hupcn/asset_36ea511b55bb1062/Wind-tornado-piercing-vortex-projectile--1781473940111.png',
};

// ── Constants ────────────────────────────────────────────────
const W = 800, H = 450;
const GROUND_Y   = H - 60;
const TILE_W     = 64, TILE_H = 32;
const PLAYER_SPEED = 220;
const JUMP_VEL   = -600;
const GRAVITY    = 1400;
const AETHER_MAX = 100;
const MAX_BULLETS = 30;
const MAX_ENEMIES = 20;
const MAX_TILES   = 80;
const ELEM_COLORS = { FIRE:0xff4400, ICE:0x44ddff, EARTH:0x88aa22, WIND:0xaaffaa,
                      VOLT:0xffff00, CRYO:0x88eeff, NONE:0xffffff };

// ── Element combos ───────────────────────────────────────────
// keys is a Set of bound key strings (reads from CONTROLS at call time)
function getElement(keys) {
  const C = window.CONTROLS || { fire:'Q', ice:'W', earth:'E', wind:'R' };
  const f=keys.has(C.fire), i=keys.has(C.ice), e=keys.has(C.earth), w=keys.has(C.wind);
  if (f&&i) return 'VOLT';
  if (i&&w) return 'CRYO';
  if (f&&w) return 'FIRE';
  if (e&&w) return 'WIND';
  if (f)    return 'FIRE';
  if (i)    return 'ICE';
  if (e)    return 'EARTH';
  if (w)    return 'WIND';
  return 'NONE';
}

// ── Boot Scene ───────────────────────────────────────────────
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // progress bar bg
    const g = this.add.graphics();
    g.fillStyle(0x111122,1); g.fillRect(0,0,W,H);
    g.fillStyle(0x222244,1); g.fillRect(W/2-200,H/2-20,400,40);
    const bar = this.add.graphics();
    const txt = this.add.text(W/2,H/2-50,'AETHER BLADE',{fontSize:'32px',color:'#00ffff',fontFamily:'Courier New'}).setOrigin(0.5);
    const sub = this.add.text(W/2,H/2+40,'LOADING...',{fontSize:'14px',color:'#8888aa',fontFamily:'Courier New'}).setOrigin(0.5);

    this.load.on('progress', v => {
      bar.clear();
      bar.fillStyle(0x00ffcc,1);
      bar.fillRect(W/2-198,H/2-18,396*v,36);
    });

    Object.entries(A).forEach(([k,url]) => this.load.image(k, url));
  }
  create() { this.scene.start('AffinityPick'); }
}

// ── Affinity Picker Scene ────────────────────────────────────
class AffinityPickScene extends Phaser.Scene {
  constructor() { super('AffinityPick'); }
  create() {
    if (window.Limaze) Limaze.music('menu');

    const g = this.add.graphics();
    g.fillStyle(0x050510,1); g.fillRect(0,0,W,H);
    // neon grid
    g.lineStyle(1,0x001133,0.35);
    for(let x=0;x<W;x+=40){ g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.strokePath(); }
    for(let y=0;y<H;y+=40){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.strokePath(); }

    this.add.text(W/2, 38, 'AETHER BLADE', {
      fontSize:'38px', color:'#00ffff', fontFamily:'Courier New',
      stroke:'#003366', strokeThickness:5
    }).setOrigin(0.5);

    this.add.text(W/2, 82, 'CHOOSE YOUR AFFINITY', {
      fontSize:'18px', color:'#ff6600', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:3
    }).setOrigin(0.5);

    this.add.text(W/2, 108, 'Your starting element — shapes your default spell & sword tint', {
      fontSize:'11px', color:'#556677', fontFamily:'Courier New'
    }).setOrigin(0.5);

    const affinities = [
      { key:'FIRE',  label:'FIRE',   sub:'Explosive. Magma bursts.\nSword: wide burning arc.',  color:0xff4400, textCol:'#ff6622', icon:'🔥' },
      { key:'ICE',   label:'ICE',    sub:'Swift. Freeze dash.\nSword: icy precision lunge.',    color:0x44ddff, textCol:'#66eeff', icon:'❄️' },
      { key:'EARTH', label:'EARTH',  sub:'Sturdy. Platform summon.\nSword: heavy slam crush.',  color:0x88aa22, textCol:'#aacc44', icon:'🪨' },
      { key:'WIND',  label:'WIND',   sub:'Agile. Tornado piercer.\nSword: swift gust cut.',     color:0xaaffaa, textCol:'#ccffcc', icon:'🌪️' },
    ];

    const cardW=160, cardH=175, startX=W/2 - (cardW*2 + 30)/2;

    affinities.forEach((af, i) => {
      const col = i < 2 ? 0 : 1;
      const row = i < 2 ? i : i - 2;
      const cx = startX + col*(cardW+18);
      const cy = 148 + row*(cardH+14);

      // card bg
      const cardGfx = this.add.graphics();
      cardGfx.fillStyle(0x0a0a1e,0.9).fillRoundedRect(cx,cy,cardW,cardH,10);
      cardGfx.lineStyle(2,af.color,0.9).strokeRoundedRect(cx,cy,cardW,cardH,10);

      // element name
      this.add.text(cx+cardW/2, cy+22, af.label, {
        fontSize:'20px', color:af.textCol, fontFamily:'Courier New',
        stroke:'#000', strokeThickness:3
      }).setOrigin(0.5);

      // sub description
      this.add.text(cx+cardW/2, cy+70, af.sub, {
        fontSize:'10px', color:'#aabbcc', fontFamily:'Courier New',
        align:'center', wordWrap:{width:cardW-16}
      }).setOrigin(0.5);

      // select button
      const btnGfx = this.add.graphics();
      btnGfx.fillStyle(af.color,0.25).fillRoundedRect(cx+16,cy+cardH-40,cardW-32,30,6);
      btnGfx.lineStyle(1,af.color,0.8).strokeRoundedRect(cx+16,cy+cardH-40,cardW-32,30,6);

      const btn = this.add.text(cx+cardW/2, cy+cardH-25, 'SELECT', {
        fontSize:'13px', color:af.textCol, fontFamily:'Courier New'
      }).setOrigin(0.5).setInteractive({useHandCursor:true, hitArea:new Phaser.Geom.Rectangle(cx+16,cy+cardH-40,cardW-32,30), hitAreaCallback:Phaser.Geom.Rectangle.Contains});

      // hover glow
      btn.on('pointerover',  () => { cardGfx.clear(); cardGfx.fillStyle(af.color,0.12).fillRoundedRect(cx,cy,cardW,cardH,10); cardGfx.lineStyle(3,af.color,1).strokeRoundedRect(cx,cy,cardW,cardH,10); if(window.Limaze) Limaze.sfx('select'); });
      btn.on('pointerout',   () => { cardGfx.clear(); cardGfx.fillStyle(0x0a0a1e,0.9).fillRoundedRect(cx,cy,cardW,cardH,10); cardGfx.lineStyle(2,af.color,0.9).strokeRoundedRect(cx,cy,cardW,cardH,10); });
      btn.on('pointerup',    () => { this.selectAffinity(af.key); });

      // keyboard shortcut hint
      const shortcuts = {FIRE:'Q',ICE:'W',EARTH:'E',WIND:'R'};
      this.add.text(cx+cardW-12, cy+10, '['+shortcuts[af.key]+']', {
        fontSize:'10px', color:'#334455', fontFamily:'Courier New'
      }).setOrigin(1,0);
    });

    // keyboard shortcuts
    const kmap = {Q:'FIRE',W:'ICE',E:'EARTH',R:'WIND'};
    Object.entries(kmap).forEach(([k,aff]) => {
      this.input.keyboard.on('keydown-'+k, () => this.selectAffinity(aff));
    });

    this.add.text(W/2, H-18, 'Press Q / W / E / R to select quickly', {
      fontSize:'10px', color:'#334455', fontFamily:'Courier New'
    }).setOrigin(0.5);

    // Export for HTML mobile UI
    window.selectAffinity = (aff) => this.selectAffinity(aff);
    if (document.getElementById('mobile-affinity-ui')) {
      document.getElementById('mobile-affinity-ui').style.display = 'flex';
    }
  }

  selectAffinity(affinity) {
    if (document.getElementById('mobile-affinity-ui')) {
      document.getElementById('mobile-affinity-ui').style.display = 'none';
    }
    if(window.Limaze) { Limaze.sfx('powerup'); Limaze.stopMusic(); }
    // flash the color
    const col = { FIRE:0xff4400, ICE:0x44ddff, EARTH:0x88aa22, WIND:0xaaffaa }[affinity] || 0xffffff;
    const fl = this.add.graphics().setDepth(200);
    fl.fillStyle(col,0.4).fillRect(0,0,W,H);
    this.tweens.add({ targets:fl, alpha:0, duration:300, onComplete:() => {
      this.scene.start('Menu', { affinity });
    }});
  }
}

// ── Menu Scene ───────────────────────────────────────────────
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }
  create(data) {
    this.affinity = (data && data.affinity) ? data.affinity : 'FIRE';
    if (window.Limaze) Limaze.music('menu');

    const affinityCol = { FIRE:'#ff6622', ICE:'#66eeff', EARTH:'#aacc44', WIND:'#ccffcc' };
    const affinityHex = { FIRE:0xff4400, ICE:0x44ddff, EARTH:0x88aa22, WIND:0xaaffaa };
    const col  = affinityCol[this.affinity]  || '#ff6622';
    const hcol = affinityHex[this.affinity]  || 0xff4400;

    // dark bg
    const g = this.add.graphics();
    g.fillStyle(0x050510,1); g.fillRect(0,0,W,H);

    // neon grid lines
    g.lineStyle(1,0x001133,0.4);
    for(let x=0;x<W;x+=40) { g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.strokePath(); }
    for(let y=0;y<H;y+=40) { g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.strokePath(); }

    this.add.text(W/2, 60, 'AETHER BLADE', {
      fontSize:'48px', color:'#00ffff', fontFamily:'Courier New',
      stroke:'#003366', strokeThickness:6
    }).setOrigin(0.5);

    this.add.text(W/2, 110, 'CYBERPUNK INFINITE RUNNER', {
      fontSize:'15px', color:'#ff6600', fontFamily:'Courier New'
    }).setOrigin(0.5);

    // Affinity badge
    const badgeG = this.add.graphics();
    badgeG.fillStyle(hcol,0.18).fillRoundedRect(W/2-110,132,220,32,8);
    badgeG.lineStyle(2,hcol,0.9).strokeRoundedRect(W/2-110,132,220,32,8);
    this.add.text(W/2, 148, 'AFFINITY: ' + this.affinity, {
      fontSize:'14px', color:col, fontFamily:'Courier New',
      stroke:'#000', strokeThickness:2
    }).setOrigin(0.5);

    // Controls
    const ctrlText = [
      window.CONTROLS.jump + ' — JUMP',
      window.CONTROLS.slash + ' / LEFT CLICK — SWORD SLASH',
      window.CONTROLS.kick + ' — KICK',
      window.CONTROLS.fire + '=FIRE  ' + window.CONTROLS.ice + '=ICE  ' + window.CONTROLS.earth + '=EARTH  ' + window.CONTROLS.wind + '=WIND',
      window.CONTROLS.cast + ' + ELEMENT — CAST SPELL',
    ];
    ctrlText.forEach((t,i) => {
      this.add.text(W/2, 195+i*26, t, {
        fontSize:'12px', color:'#aaccff', fontFamily:'Courier New'
      }).setOrigin(0.5);
    });

    // player sprite preview — use run pose
    this.add.image(W/2, 355, 'playerRun').setScale(0.6).setTint(hcol);

    // Start button
    const startBg = this.add.graphics();
    startBg.fillStyle(0x003366,1); startBg.fillRoundedRect(W/2-120,H-108,240,48,8);
    startBg.lineStyle(2,0x00ffff,1); startBg.strokeRoundedRect(W/2-120,H-108,240,48,8);

    const startTxt = this.add.text(W/2, H-84, '► START GAME', {
      fontSize:'20px', color:'#00ffff', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({useHandCursor:true});

    const doStart = () => {
      if (window.Limaze) Limaze.stopMusic();
      this.scene.start('Game', { affinity: this.affinity });
    };
    startTxt.on('pointerup', doStart);
    this.input.keyboard.on('keydown-SPACE', doStart);
    this.input.keyboard.on('keydown-ENTER', doStart);

    // change affinity link
    const changeBtn = this.add.text(W/2 - 90, H-42, '[ CHANGE AFFINITY ]', {
      fontSize:'11px', color:'#446688', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    changeBtn.on('pointerup', () => {
      if(window.Limaze) Limaze.stopMusic();
      this.scene.start('AffinityPick');
    });

    // Settings button
    const settingsBtn = this.add.text(W/2 + 80, H-42, '[ SETTINGS ]', {
      fontSize:'11px', color:'#336655', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    settingsBtn.on('pointerup', () => {
      if(window.Limaze) Limaze.stopMusic();
      this.scene.start('Settings', { from:'Menu', returnData:{ affinity: this.affinity } });
    });

    // pulse animation
    this.tweens.add({
      targets: startTxt, alpha: 0.4, duration: 700,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.add.text(W/2, H-18, 'v1.0  |  GAMENEST', {
      fontSize:'10px', color:'#334455', fontFamily:'Courier New'
    }).setOrigin(0.5);
  }
}

// ── Main Game Scene ──────────────────────────────────────────
class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create(data) {
    this.cameras.main.setBackgroundColor(0x050510);
    if (window.Limaze) Limaze.music('upbeat');

    // ── Affinity (from picker) ──
    this.affinity = (data && data.affinity) ? data.affinity : 'FIRE';
    // affinityKeyMap is set by _registerControls() using window.CONTROLS
    this.affinityKeyMap = { FIRE: window.CONTROLS.fire, ICE: window.CONTROLS.ice, EARTH: window.CONTROLS.earth, WIND: window.CONTROLS.wind };
    this.paused = false;

    // ── State ──
    this.gameOver   = false;
    this.distance   = 0;
    this.startTime  = Date.now();
    this.wave       = 1;
    this.waveTimer  = 0;
    this.aether     = AETHER_MAX * 0.7;
    this.hp         = 3;
    this.maxHp      = 3;
    this.hurtTimer  = 0;
    this.slashTimer = 0;
    this.kickTimer  = 0;
    this.spellCooldown = 0;
    this.spellImmunity = 0;
    this.iceDashing = false;
    this.iceDashTimer = 0;
    this.cameraX    = 0;
    this.scrollX    = 0;
    this.elemKeys   = new Set();
    this.shiftHeld  = false;
    this.enemySpawnTimer = 0;
    this.earthPlatformCool = 0;

    // ── Parallax layers (tileSprite) ──
    this.bgSky  = this.add.tileSprite(0,0,W,H,'bgSky').setOrigin(0,0).setDepth(0);
    this.bgMtn  = this.add.tileSprite(0,0,W,H,'bgMtn').setOrigin(0,0).setDepth(1).setAlpha(0.85);
    this.bgRuin = this.add.tileSprite(0,0,W,H,'bgRuin').setOrigin(0,0).setDepth(2).setAlpha(0.7);

    // ── Groups ──
    this.platforms  = this.add.group({ maxSize: MAX_TILES });
    this.enemies    = this.add.group({ maxSize: MAX_ENEMIES });
    this.bullets    = this.add.group({ maxSize: MAX_BULLETS });
    this.particles  = this.add.group({ maxSize: 40 });

    // ── Player ──
    this.player = this.add.image(180, GROUND_Y - 64, 'playerRun')
      .setDepth(10).setScale(0.55);
    this.playerVX = PLAYER_SPEED;
    this.playerVY = 0;
    this.onGround = false;
    this.playerWorldX = 180;
    // animation state: 'idle','run','jump','slash'
    this.playerAnim     = 'run';
    this.slashAnimTimer = 0; // how long slash frame shows

    // sword glow graphic
    this.slashGfx = this.add.graphics().setDepth(12);

    // ── Input — reads from window.CONTROLS so rebinds take effect ──
    this.cursors = this.input.keyboard.createCursorKeys();

    // Helper: get Phaser KeyCode from CONTROLS string
    const kc = (name) => {
      const map = { SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE, SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        CTRL: Phaser.Input.Keyboard.KeyCodes.CTRL, ALT: Phaser.Input.Keyboard.KeyCodes.ALT,
        UP: Phaser.Input.Keyboard.KeyCodes.UP, DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
        LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT, RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT };
      return map[name] || name;
    };

    // Re-register all keys from CONTROLS each time scene starts
    this._registerControls = () => {
      // remove old listeners to avoid doubling
      this.input.keyboard.removeAllListeners();
      this.input.removeAllListeners();

      const C = window.CONTROLS;

      // Element keys: add to elemKeys set while held
      ['fire','ice','earth','wind'].forEach(el => {
        const k = C[el];
        this.input.keyboard.on('keydown-'+k, () => this.elemKeys.add(k));
        this.input.keyboard.on('keyup-'+k,   () => this.elemKeys.delete(k));
      });
      // Also keep affinityKeyMap in sync with CONTROLS
      this.affinityKeyMap = { FIRE: C.fire, ICE: C.ice, EARTH: C.earth, WIND: C.wind };

      // Jump
      this.input.keyboard.on('keydown-'+C.jump, () => this.tryJump());
      this.input.keyboard.on('keydown-UP',       () => this.tryJump());

      // Kick
      this.input.keyboard.on('keydown-'+C.kick, () => { if (!this.gameOver) this.doKick(); });

      // Slash
      this.input.keyboard.on('keydown-'+C.slash, () => { if (!this.gameOver && !this.paused) this.doSlash(); });

      // Cast spell
      this.input.keyboard.on('keydown-'+C.cast, () => {
        this.shiftHeld = true;
        this.doCastSpell();
      });
      this.input.keyboard.on('keyup-'+C.cast, () => { this.shiftHeld = false; });

      // Pause / ESC
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
      this.input.keyboard.on('keydown-P',   () => this.togglePause());

      // Mouse LEFT CLICK = slash, also check touch jump zone
      this.input.on('pointerdown', (ptr) => {
        if (this.gameOver || this.paused) return;
        if (ptr.y < H * 0.35) { this.tryJump(); return; }
        this.doSlash();
      });
    };
    this._registerControls();

    // ── Export for Mobile UI ──
    window.doJump = () => this.tryJump();
    window.doSlash = () => { if (!this.gameOver && !this.paused) this.doSlash(); };
    window.doKick = () => { if (!this.gameOver) this.doKick(); };
    window.doCast = () => {
      this.shiftHeld = true;
      this.doCastSpell();
      this.time.delayedCall(100, () => this.shiftHeld = false);
    };
    window.setHoldElement = (elem) => {
      const key = this.affinityKeyMap[elem];
      if (key) this.elemKeys.add(key);
    };
    window.clearHoldElement = (elem) => {
      const key = this.affinityKeyMap[elem];
      if (key) this.elemKeys.delete(key);
    };

    // ── Build initial terrain ──
    this.nextPlatX = 0;
    this.nextPlatY = GROUND_Y;
    
    // Create a safe starting platform
    for (let t = 0; t < 10; t++) {
      const tile = this.add.image(t * TILE_W, GROUND_Y, 'tile').setDepth(5).setDisplaySize(TILE_W, TILE_H);
      tile.platTop = GROUND_Y - TILE_H / 2;
      tile.worldX = t * TILE_W;
      this.platforms.add(tile);
    }
    this.nextPlatX = 10 * TILE_W;

    for (let i = 0; i < 20; i++) this.spawnNextPlatform();

    // ── HUD (fixed camera) ──
    this.hudCam = this.cameras.add(0, 0, W, H);
    this.hudCam.ignore([
      this.bgSky, this.bgMtn, this.bgRuin,
      this.slashGfx, this.player
    ]);
    this.buildHUD();

    // ── Physics timer ──
    this.lastTime = this.time.now;

    // ── Visibility pause ──
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.scene.pause();
      else this.scene.resume();
    });
  }

  // ── Pause / Settings ────────────────────────────────────────
  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      // Show pause overlay
      if (!this.pauseOverlay) {
        this.pauseOverlay = this.add.graphics().setDepth(200).setScrollFactor(0);
        this.pauseOverlay.fillStyle(0x000011, 0.82).fillRect(0, 0, W, H);
        this.pauseOverlay.lineStyle(2, 0x00ffff, 0.5).strokeRect(60, 60, W-120, H-120);

        this.pauseTitleTxt = this.add.text(W/2, 110, 'PAUSED', {
          fontSize: '44px', color: '#00ffff', fontFamily: 'Courier New',
          stroke: '#003366', strokeThickness: 5
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

        // Resume button
        const rg = this.add.graphics().setDepth(200).setScrollFactor(0);
        rg.fillStyle(0x002244,1).fillRoundedRect(W/2-110, 180, 220, 46, 8);
        rg.lineStyle(2, 0x00ffff, 1).strokeRoundedRect(W/2-110, 180, 220, 46, 8);
        this.pauseResumeBtn = this.add.text(W/2, 203, '► RESUME', {
          fontSize:'20px', color:'#00ffff', fontFamily:'Courier New'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setInteractive({useHandCursor:true});
        this.pauseResumeBtn.on('pointerup', () => this.togglePause());

        // Settings button
        const sg = this.add.graphics().setDepth(200).setScrollFactor(0);
        sg.fillStyle(0x001122,1).fillRoundedRect(W/2-110, 246, 220, 46, 8);
        sg.lineStyle(2, 0x0088cc, 1).strokeRoundedRect(W/2-110, 246, 220, 46, 8);
        this.pauseSettingsBtn = this.add.text(W/2, 269, '⚙ SETTINGS', {
          fontSize:'18px', color:'#44aaff', fontFamily:'Courier New'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setInteractive({useHandCursor:true});
        this.pauseSettingsBtn.on('pointerup', () => {
          if(window.Limaze) Limaze.stopMusic();
          // Launch Settings on top, keep Game scene alive but paused
          this.scene.pause('Game');
          this.scene.launch('Settings', { from:'Game', returnData:{ affinity: this.affinity } });
        });

        // Menu button
        const mg = this.add.graphics().setDepth(200).setScrollFactor(0);
        mg.fillStyle(0x110011,1).fillRoundedRect(W/2-110, 312, 220, 46, 8);
        mg.lineStyle(2, 0x885599, 1).strokeRoundedRect(W/2-110, 312, 220, 46, 8);
        this.pauseMenuBtn = this.add.text(W/2, 335, '◄ MAIN MENU', {
          fontSize:'17px', color:'#bb88dd', fontFamily:'Courier New'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0).setInteractive({useHandCursor:true});
        this.pauseMenuBtn.on('pointerup', () => {
          if(window.Limaze) Limaze.stopMusic();
          this.scene.start('Menu', { affinity: this.affinity });
        });

        this.pauseHintTxt = this.add.text(W/2, H-80, 'ESC or P to resume', {
          fontSize:'12px', color:'#334455', fontFamily:'Courier New'
        }).setOrigin(0.5).setDepth(201).setScrollFactor(0);

        this._pauseObjects = [this.pauseOverlay, this.pauseTitleTxt,
          rg, this.pauseResumeBtn, sg, this.pauseSettingsBtn,
          mg, this.pauseMenuBtn, this.pauseHintTxt];
      } else {
        this._pauseObjects.forEach(o => o.setVisible(true));
      }
      if (window.Limaze) { Limaze.stopMusic(); Limaze.sfx('click'); }
    } else {
      // Hide overlay
      if (this._pauseObjects) this._pauseObjects.forEach(o => o.setVisible(false));
      if (window.Limaze) { Limaze.music('upbeat'); Limaze.sfx('click'); }
      // re-register controls in case they changed in Settings
      this.affinityKeyMap = { FIRE: window.CONTROLS.fire, ICE: window.CONTROLS.ice, EARTH: window.CONTROLS.earth, WIND: window.CONTROLS.wind };
      this._registerControls();
    }
  }

  // ── HUD ────────────────────────────────────────────────────
  buildHUD() {
    const d = 15;
    // distance label
    this.hudDist = this.add.text(d, d, 'DIST: 0m', {
      fontSize:'14px', color:'#00ffcc', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:3
    }).setDepth(50).setScrollFactor(0);

    // wave label
    this.hudWave = this.add.text(d, d+22, 'WAVE: 1', {
      fontSize:'14px', color:'#ff6600', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:3
    }).setDepth(50).setScrollFactor(0);

    // element label
    this.hudElem = this.add.text(d, d+44, 'ELEM: NONE', {
      fontSize:'13px', color:'#ffffff', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:3
    }).setDepth(50).setScrollFactor(0);

    // HP hearts
    this.hudHpTxt = this.add.text(d, d+66, 'HP: ♥♥♥', {
      fontSize:'14px', color:'#ff4444', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:3
    }).setDepth(50).setScrollFactor(0);

    // Aether bar background
    const bx = W - 220, by = d;
    this.add.graphics().setDepth(49).setScrollFactor(0)
      .fillStyle(0x001122,0.8).fillRoundedRect(bx-4,by-4,212,24,6)
      .lineStyle(1,0x004466,1).strokeRoundedRect(bx-4,by-4,212,24,6);

    this.hudAetherBar = this.add.graphics().setDepth(50).setScrollFactor(0);
    this.add.text(bx, by+26, 'AETHER', {
      fontSize:'11px', color:'#00ccff', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:2
    }).setDepth(50).setScrollFactor(0);

    // Spell cooldown
    this.hudSpell = this.add.text(W-220, by+44, '', {
      fontSize:'11px', color:'#ffcc00', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:2
    }).setDepth(50).setScrollFactor(0);

    // Pause button (top-right corner)
    const pbG = this.add.graphics().setDepth(50).setScrollFactor(0);
    pbG.fillStyle(0x111133, 0.8).fillRoundedRect(W-52, 8, 44, 30, 6);
    pbG.lineStyle(1, 0x334466, 1).strokeRoundedRect(W-52, 8, 44, 30, 6);
    this.hudPauseBtn = this.add.text(W-30, 23, '⏸', {
      fontSize:'16px', color:'#8899bb', fontFamily:'Courier New'
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setInteractive({useHandCursor:true});
    this.hudPauseBtn.on('pointerup', () => this.togglePause());

    // all HUD items ignored by main cam
    this.cameras.main.ignore([
      this.hudDist, this.hudWave, this.hudElem,
      this.hudHpTxt, this.hudAetherBar, this.hudSpell,
      pbG, this.hudPauseBtn
    ]);
  }

  updateHUD() {
    const affinityKey = this.affinityKeyMap[this.affinity];
    const effectiveKeys = this.elemKeys.size > 0 ? this.elemKeys : new Set([affinityKey]);
    const elem = getElement(effectiveKeys);
    const col = { FIRE:'#ff6600', ICE:'#44ddff', EARTH:'#88cc44',
                  WIND:'#aaffaa', VOLT:'#ffff00', CRYO:'#88eeff', NONE:'#aaaacc' };
    this.hudDist.setText('DIST: ' + Math.floor(this.distance) + 'm');
    this.hudWave.setText('WAVE: ' + this.wave);
    const elemLabel = this.elemKeys.size === 0 ? elem + ' (affinity)' : elem;
    this.hudElem.setText('ELEM: ' + elemLabel).setColor(col[elem] || '#ffffff');
    const hearts = '♥'.repeat(this.hp) + '♡'.repeat(Math.max(0, this.maxHp - this.hp));
    this.hudHpTxt.setText('HP: ' + hearts);

    // aether bar
    const bx = W-220, by = 15;
    this.hudAetherBar.clear();
    const pct = Phaser.Math.Clamp(this.aether / AETHER_MAX, 0, 1);
    const barCol = pct > 0.5 ? 0x00ccff : pct > 0.25 ? 0xffcc00 : 0xff4400;
    this.hudAetherBar.fillStyle(barCol, 0.9).fillRoundedRect(bx, by, 204*pct, 16, 4);

    // spell cooldown
    if (this.spellCooldown > 0) {
      this.hudSpell.setText('SPELL CD: ' + this.spellCooldown.toFixed(1) + 's');
    } else if (this.aether < 30) {
      this.hudSpell.setText('LOW AETHER!');
    } else {
      this.hudSpell.setText('SHIFT + ELEM to CAST');
    }
  }

  // ── Platform Generation ─────────────────────────────────────
  spawnNextPlatform() {
    if (this.platforms.getLength() >= MAX_TILES) return;

    const wave = this.wave;
    // gap between platforms: grows with wave
    const gapMin = 40 + wave * 8;
    const gapMax = 100 + wave * 20;
    const gap = Phaser.Math.Between(gapMin, Math.min(gapMax, 280));

    // platform width: narrows with wave
    const lenMin = Math.max(2, 5 - Math.floor(wave * 0.3));
    const lenMax = Math.max(lenMin + 1, 8 - Math.floor(wave * 0.2));
    const len = Phaser.Math.Between(lenMin, lenMax);

    // height variation
    const dyMax = Math.min(80 + wave * 10, 160);
    const dy = Phaser.Math.Between(-dyMax, dyMax);
    this.nextPlatY = Phaser.Math.Clamp(this.nextPlatY + dy, H * 0.35, GROUND_Y + 10);

    this.nextPlatX += gap;
    const startX = this.nextPlatX;

    for (let t = 0; t < len; t++) {
      const tile = this.add.image(
        startX + t * TILE_W,
        this.nextPlatY,
        'tile'
      ).setDepth(5).setDisplaySize(TILE_W, TILE_H);

      // store as physics-like object with bounds
      tile.platTop = this.nextPlatY - TILE_H / 2;
      tile.worldX  = startX + t * TILE_W;
      this.platforms.add(tile);
    }

    this.nextPlatX = startX + len * TILE_W;
  }

  // ── Terrain update ───────────────────────────────────────────
  updateTerrain() {
    const camRight = this.cameraX + W + 200;
    // spawn ahead
    while (this.nextPlatX < camRight + 400) {
      this.spawnNextPlatform();
    }
    // recycle behind
    const camLeft = this.cameraX - 300;
    const toRemove = [];
    this.platforms.getChildren().forEach(t => {
      if (t.worldX < camLeft) toRemove.push(t);
    });
    toRemove.forEach(t => { this.platforms.remove(t, true, true); });
  }

  // ── Platform collision ───────────────────────────────────────
  resolvePlatforms(dt) {
    const px = this.playerWorldX;
    const py = this.player.y;
    const pw = 28, ph = 54;
    const prevY = py - this.playerVY * dt;

    let landed = false;
    this.platforms.getChildren().forEach(tile => {
      const tx = tile.worldX;
      const top = tile.platTop;
      // horizontal overlap
      if (Math.abs(px - tx) < pw + TILE_W * 0.5) {
        // was above platform, now at or below
        if (prevY + ph/2 <= top + 4 && py + ph/2 >= top) {
          if (this.playerVY >= 0) {
            this.player.y = top - ph/2;
            this.playerVY = 0;
            landed = true;
          }
        }
      }
    });
    this.onGround = landed;
  }

  // ── Jump ────────────────────────────────────────────────────
  tryJump() {
    if (this.gameOver) return;
    if (this.onGround) {
      this.playerVY = JUMP_VEL;
      this.onGround = false;
      if (window.Limaze) Limaze.sfx('jump');
    }
  }

  // ── Slash ───────────────────────────────────────────────────
  doSlash() {
    if (this.gameOver || this.slashTimer > 0) return;
    const _ak = this.affinityKeyMap[this.affinity];
    const _ek = this.elemKeys.size > 0 ? this.elemKeys : new Set([_ak]);
    const elem = getElement(_ek);
    // Close reach: base 55px, element extends to 75px
    const range = elem === 'NONE' ? 55 : 75;
    const dmg   = elem === 'NONE' ? 1 : 2;
    const col   = ELEM_COLORS[elem] || 0xffffff;

    // Draw tight slash arc right next to character
    this.slashGfx.clear();
    const sx = this.player.x + 18;
    const sy = this.player.y - 4;
    this.slashGfx.lineStyle(5, col, 1);
    this.slashGfx.beginPath();
    this.slashGfx.arc(sx, sy, range * 0.6, -0.8, 1.1, false);
    this.slashGfx.strokePath();
    this.slashGfx.lineStyle(2, col, 0.45);
    this.slashGfx.beginPath();
    this.slashGfx.arc(sx, sy, range * 0.38, -0.8, 1.1, false);
    this.slashGfx.strokePath();

    // Show slash sprite frame briefly
    this.player.setTexture('playerSlash');
    this.slashAnimTimer = 0.13;

    this.slashTimer = 0.12;
    this.time.delayedCall(120, () => this.slashGfx.clear());
    if (window.Limaze) Limaze.sfx('hit');

    // Hit detection — tight range right in front of player
    this.enemies.getChildren().forEach(en => {
      if (!en.active) return;
      const dx = en.worldX - this.playerWorldX;
      const dy = en.y - this.player.y;
      // forward reach = range, backward = 20px, vertical = 52px
      if (dx > -20 && dx < range + 16 && Math.abs(dy) < 52) {
        this.damageEnemy(en, dmg, col);
        this.aether = Math.min(AETHER_MAX, this.aether + 5);
      }
    });

    if (elem === 'WIND') this.playerVX = PLAYER_SPEED * 1.4;
  }

  // ── Kick ────────────────────────────────────────────────────
  doKick() {
    if (this.gameOver || this.kickTimer > 0) return;
    this.kickTimer = 0.18;
    if (window.Limaze) Limaze.sfx('hit');

    // Draw kick impact circle — tight, near player
    this.slashGfx.clear();
    this.slashGfx.fillStyle(0xff8800, 0.65);
    this.slashGfx.fillCircle(this.player.x + 42, this.player.y + 14, 22);
    this.slashGfx.lineStyle(3, 0xffcc44, 1);
    this.slashGfx.strokeCircle(this.player.x + 42, this.player.y + 14, 22);
    this.time.delayedCall(130, () => this.slashGfx.clear());

    // Show slash sprite briefly for kick too
    this.player.setTexture('playerSlash');
    this.slashAnimTimer = 0.13;

    this.enemies.getChildren().forEach(en => {
      if (!en.active) return;
      const dx = en.worldX - this.playerWorldX;
      const dy = en.y - this.player.y;
      if (dx > -20 && dx < 80 && Math.abs(dy) < 60) {
        en.knockback = 280;
        this.damageEnemy(en, 1, 0xff8800);
      }
    });
  }

  // ── Spell Casting ────────────────────────────────────────────
  doCastSpell() {
    if (this.gameOver) return;
    if (this.spellCooldown > 0) return;
    if (this.aether < 30) { if(window.Limaze) Limaze.sfx('hurt'); return; }

    const affinityKey2 = this.affinityKeyMap[this.affinity];
    const castKeys = this.elemKeys.size > 0 ? this.elemKeys : new Set([affinityKey2]);
    const elem = getElement(castKeys);
    if (elem === 'NONE') return;

    this.aether -= 35;
    this.spellCooldown = 3.0;
    this.spellImmunity = 0.8; // invincible briefly during cast
    if (window.Limaze) Limaze.sfx('powerup');

    switch(elem) {
      case 'FIRE':   this.spellFire();   break;
      case 'ICE':    this.spellIce();    break;
      case 'EARTH':  this.spellEarth();  break;
      case 'WIND':   this.spellWind();   break;
      case 'VOLT':   this.spellVolt();   break;
      case 'CRYO':   this.spellCryo();   break;
    }
  }

  spawnBullet(x, y, vx, vy, textureKey, tint, dmg, lifeMs) {
    if (this.bullets.getLength() >= MAX_BULLETS) {
      // recycle oldest
      const oldest = this.bullets.getFirstAlive();
      if (oldest) { oldest.setActive(false).setVisible(false); this.bullets.remove(oldest); }
    }
    const b = this.add.image(x, y, textureKey)
      .setDepth(15).setDisplaySize(32, 32).setTint(tint);
    b.vx = vx; b.vy = vy; b.dmg = dmg;
    b.lifeTimer = lifeMs / 1000;
    this.bullets.add(b);
    return b;
  }

  spellFire() {
    // 3 magma cores spread — snapshot position so bullets start correctly
    const snapX = this.player.x;
    const snapY = this.player.y;
    for (let i = -1; i <= 1; i++) {
      this.spawnBullet(
        snapX + 44, snapY + i * 22,
        500, i * 55,
        'fireball', 0xff4400, 2, 2200
      );
    }
    this.screenFlash(0xff2200, 0.3);
  }

  spellIce() {
    // horizontal freeze dash
    this.iceDashing = true;
    this.iceDashTimer = 0.45;
    this.playerVX = PLAYER_SPEED * 3.5;
    this.screenFlash(0x44ddff, 0.25);
    // spawn ice shards immediately at current position
    const snapX = this.player.x;
    const snapY = this.player.y;
    for (let i = 0; i < 5; i++) {
      this.spawnBullet(
        snapX + 50 + i * 28, snapY + (i % 2 === 0 ? -10 : 10),
        520, 0,
        'iceShrd', 0x88eeff, 1, 1800
      );
    }
  }

  spellEarth() {
    // spawn temporary platform below player
    const tx = this.playerWorldX;
    const ty = this.player.y + 70;
    const tile = this.add.image(tx, ty, 'tile').setDepth(5).setDisplaySize(TILE_W*3, TILE_H).setTint(0x88aa22);
    tile.platTop = ty - TILE_H/2;
    tile.worldX  = tx;
    this.platforms.add(tile);
    this.time.delayedCall(4000, () => {
      this.platforms.remove(tile, true, true);
    });
    this.screenFlash(0x88aa22, 0.3);
    if (window.Limaze) Limaze.sfx('explosion');
    // slam nearby enemies
    this.enemies.getChildren().forEach(en => {
      if (Math.abs(en.x - this.player.x) < 160) this.damageEnemy(en, 3, 0x88aa22);
    });
  }

  spellWind() {
    // piercing tornado forward — spawn immediately from current position
    const snapX = this.player.x;
    const snapY = this.player.y;
    const offsets = [[-12, -60], [0, 0], [12, 60]];
    offsets.forEach(([ox, oy]) => {
      const b = this.spawnBullet(
        snapX + 44 + ox, snapY + oy,
        400, 0,
        'tornado', 0xaaffaa, 2, 3000
      );
      if (b) b.piercing = true;
    });
    this.screenFlash(0xaaffaa, 0.2);
  }

  spellVolt() {
    // lightning teleport forward
    const teleportDist = 280;
    this.playerWorldX += teleportDist;
    this.player.x = W * 0.3; // keep screen position stable
    this.cameraX   += teleportDist;
    this.screenFlash(0xffff00, 0.5);
    if (window.Limaze) Limaze.sfx('powerup');
    // zap all on-screen enemies
    this.enemies.getChildren().forEach(en => this.damageEnemy(en, 3, 0xffff00));
  }

  spellCryo() {
    // blizzard — slow all enemies
    this.enemies.getChildren().forEach(en => {
      en.frozen = true;
      en.frozenTimer = 3.0;
      en.setTint(0x88eeff);
    });
    this.screenFlash(0x88eeff, 0.4);
    if (window.Limaze) Limaze.sfx('powerup');
  }

  screenFlash(color, alpha) {
    const fl = this.add.graphics().setDepth(100).setScrollFactor(0);
    fl.fillStyle(color, alpha).fillRect(0,0,W,H);
    this.tweens.add({
      targets: fl, alpha: 0, duration: 350,
      onComplete: () => fl.destroy()
    });
  }

  // ── Enemy Spawning ───────────────────────────────────────────
  spawnEnemy(type) {
    if (this.enemies.getLength() >= MAX_ENEMIES) return;
    let spawnX = this.cameraX + W + Phaser.Math.Between(60, 180);

    // Find nearest platform to spawn on
    let nearestTile = null;
    let minDist = Infinity;
    this.platforms.getChildren().forEach(tile => {
      const dist = Math.abs(tile.worldX - spawnX);
      if (dist < minDist) {
        minDist = dist;
        nearestTile = tile;
      }
    });

    let baseTop = GROUND_Y - 16;
    if (nearestTile) {
      spawnX = nearestTile.worldX;
      baseTop = nearestTile.platTop;
    }

    let tex, scaleX, scaleY, hp, speed, yPos;
    switch(type) {
      case 'beetle':
        tex='beetle'; scaleX=0.55; scaleY=0.55;
        hp=2; speed=80; yPos=baseTop - 2;
        break;
      case 'wasp':
        tex='wasp'; scaleX=0.55; scaleY=0.55;
        hp=2; speed=100; yPos=baseTop - 84 - Phaser.Math.Between(0,80);
        break;
      case 'wizard':
        tex='wizard'; scaleX=0.5; scaleY=0.5;
        hp=3; speed=60; yPos=baseTop - 32;
        break;
      case 'golem':
        tex='golem'; scaleX=0.55; scaleY=0.55;
        hp=8; speed=40; yPos=baseTop - 54;
        break;
      default:
        tex='beetle'; scaleX=0.5; scaleY=0.5;
        hp=2; speed=80; yPos=baseTop - 2;
    }

    const en = this.add.sprite(spawnX, yPos, tex)
      .setDepth(8).setScale(scaleX, scaleY);
    en.hp       = hp;
    en.maxHp    = hp;
    en.speed    = speed;
    en.type     = type;
    en.knockback= 0;
    en.frozen   = false;
    en.frozenTimer = 0;
    en.shootTimer  = (type === 'wizard') ? Phaser.Math.Between(1, 3) : 999;
    en.worldX   = spawnX;
    en.active   = true;
    this.enemies.add(en);
  }

  // ── Damage Enemy ────────────────────────────────────────────
  damageEnemy(en, dmg, col) {
    if (!en || !en.active) return;
    en.hp -= dmg;
    en.setTint(col || 0xffffff);
    this.time.delayedCall(150, () => { if(en.active) en.clearTint(); });
    if (window.Limaze) Limaze.sfx('hit');

    if (en.hp <= 0) {
      this.aether = Math.min(AETHER_MAX, this.aether + 8);
      this.spawnDeathParticles(en.x, en.y, col || 0xff6600);
      if (window.Limaze) Limaze.sfx('explosion');
      en.active = false;
      en.setVisible(false);
      this.enemies.remove(en, true, true);
    }
  }

  // ── Death Particles ──────────────────────────────────────────
  spawnDeathParticles(x, y, col) {
    for (let i = 0; i < 5; i++) {
      if (this.particles.getLength() >= 40) break;
      const g = this.add.graphics().setDepth(20);
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      g.vx = Math.cos(angle) * speed;
      g.vy = Math.sin(angle) * speed;
      g.lifeTimer = 0.6;
      g.fillStyle(col, 1);
      g.fillCircle(x, y, 4 + Math.random()*4);
      this.particles.add(g);
    }
  }

  // ── Enemy Projectile ────────────────────────────────────────
  enemyShoot(en) {
    if (this.bullets.getLength() >= MAX_BULLETS) return;
    const dx = this.player.x - en.x;
    const spd = 200;
    const b = this.add.image(en.x, en.y - 10, 'fireball')
      .setDepth(14).setDisplaySize(20,20).setTint(0x4444ff);
    b.vx = (dx > 0 ? 1 : -1) * spd;
    b.vy = 0;
    b.dmg = 1;
    b.lifeTimer = 3.0;
    b.enemyBullet = true;
    this.bullets.add(b);
  }

  // ── Damage Player ────────────────────────────────────────────
  damagePlayer(dmg) {
    if (this.hurtTimer > 0) return;
    if (this.spellImmunity > 0) return; // immune during spell cast
    if (this.iceDashing) return;        // immune during ice dash
    this.hp -= dmg;
    this.hurtTimer = 1.2;
    this.aether = Math.max(0, this.aether - 10);
    if (window.Limaze) Limaze.sfx('hurt');
    this.cameras.main.shake(200, 0.012);
    this.screenFlash(0xff0000, 0.25);
    if (this.hp <= 0) this.triggerGameOver();
  }

  // ── Game Over ────────────────────────────────────────────────
  triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    if (window.Limaze) {
      Limaze.sfx('lose');
      Limaze.stopMusic();
      Limaze.postScore(Math.floor(this.distance));
    }
    this.time.delayedCall(800, () => {
      this.scene.start('GameOver', { score: Math.floor(this.distance), wave: this.wave });
    });
  }

  // ── Main Update ──────────────────────────────────────────────
  update(time, delta) {
    if (this.gameOver || this.paused) return;
    const dt = Math.min(delta / 1000, 0.05);

    // ── Timers ──
    if (this.slashTimer > 0)    this.slashTimer    -= dt;
    if (this.kickTimer  > 0)    this.kickTimer     -= dt;
    if (this.spellCooldown > 0) this.spellCooldown -= dt;
    if (this.hurtTimer > 0)     this.hurtTimer     -= dt;
    if (this.spellImmunity > 0) this.spellImmunity -= dt;
    if (this.iceDashTimer > 0) {
      this.iceDashTimer -= dt;
      if (this.iceDashTimer <= 0) {
        this.iceDashing = false;
        this.playerVX = PLAYER_SPEED;
      }
    }

    // ── Wave progression ──
    this.waveTimer += dt;
    const distForWave = Math.floor(this.distance / 600);
    this.wave = Math.max(1, distForWave + 1);

    // ── Aether regen ──
    this.aether = Math.min(AETHER_MAX, this.aether + dt * 4);

    // ── Player physics ──
    // Gravity
    if (!this.onGround) this.playerVY += GRAVITY * dt;
    else this.playerVY = Math.max(0, this.playerVY);

    // horizontal (auto run, wave speeds up slightly)
    const speedMult = 1 + (this.wave - 1) * 0.08;
    if (!this.iceDashing) this.playerVX = PLAYER_SPEED * speedMult;

    // move world position
    this.playerWorldX += this.playerVX * dt;

    // vertical
    const newY = this.player.y + this.playerVY * dt;
    this.player.y = newY;

    // platform resolve
    this.onGround = false;
    this.resolvePlatforms(dt);

    // fall-death
    if (this.player.y > H + 80) {
      this.damagePlayer(1);
      if (!this.gameOver) {
        // respawn safely above nearest platform
        let nearestTile = null;
        let minDist = Infinity;
        const targetX = this.cameraX + W * 0.3;
        this.platforms.getChildren().forEach(tile => {
          const dist = Math.abs(tile.worldX - targetX);
          if (dist < minDist) {
            minDist = dist;
            nearestTile = tile;
          }
        });
        if (nearestTile) {
          this.playerWorldX = nearestTile.worldX;
          this.player.y = nearestTile.platTop - 50;
        } else {
          this.player.y = GROUND_Y - 64;
        }
        this.playerVY = 0;
      }
    }

    // ── Camera tracks world position ──
    const targetCamX = this.playerWorldX - W * 0.28;
    this.cameraX += (targetCamX - this.cameraX) * 0.15;
    const scrollDelta = this.cameraX - (this.scrollX || 0);
    this.scrollX = this.cameraX;

    // player screen X
    this.player.x = this.playerWorldX - this.cameraX;

    // ── Parallax ──
    this.bgSky.tilePositionX  = this.cameraX * 0.08;
    this.bgMtn.tilePositionX  = this.cameraX * 0.32;
    this.bgRuin.tilePositionX = this.cameraX * 0.72;

    // update tile screen positions
    this.platforms.getChildren().forEach(tile => {
      tile.x = tile.worldX - this.cameraX;
    });

    // ── Distance ──
    this.distance += (this.playerVX * dt) / 12;
    if (window.Limaze && Math.floor(this.distance) % 50 === 0 && Math.floor(this.distance) > 0) {
      Limaze.postScore(Math.floor(this.distance));
    }

    // ── Terrain ──
    this.updateTerrain();

    // ── Affinity default element (if no keys held, affinity tints the sword) ──
    const affinityKey = this.affinityKeyMap[this.affinity];
    const effectiveKeys = this.elemKeys.size > 0 ? this.elemKeys : new Set([affinityKey]);
    const elem = getElement(effectiveKeys);
    const col  = ELEM_COLORS[elem] || 0xffffff;

    // ── Player sprite animation ──
    if (this.slashAnimTimer > 0) {
      this.slashAnimTimer -= dt;
      // keep slash frame showing — do nothing
    } else {
      // revert slash frame once timer expires
      if (this.player.texture.key === 'playerSlash') {
        this.player.setTexture(this.onGround ? 'playerRun' : 'playerJump');
      }
      // pick frame
      if (!this.onGround) {
        if (this.player.texture.key !== 'playerJump') this.player.setTexture('playerJump');
      } else {
        // alternate run/idle every ~180ms to fake leg stride
        const runFrame = (Math.floor(time / 180) % 2 === 0) ? 'playerRun' : 'playerIdle';
        if (this.player.texture.key !== runFrame) this.player.setTexture(runFrame);
      }
    }

    // Tint — hurt flash, or elemental/affinity colour
    if (this.hurtTimer > 0 && Math.sin(time * 0.025) > 0) {
      this.player.setTint(0xff4444);
    } else {
      this.player.setTint(col);
    }

    this.player.setFlipX(false);

    // ── Enemy spawning ──
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      const spawnRate = Math.max(1.0, 3.5 - this.wave * 0.3);
      this.enemySpawnTimer = spawnRate + Math.random() * spawnRate * 0.5;

      const roll = Math.random();
      if (this.wave === 1) {
        this.spawnEnemy(roll < 0.6 ? 'beetle' : 'wasp');
      } else if (this.wave === 2) {
        if (roll < 0.35) this.spawnEnemy('beetle');
        else if (roll < 0.65) this.spawnEnemy('wasp');
        else if (roll < 0.9) this.spawnEnemy('wizard');
        else this.spawnEnemy('golem');
      } else {
        if (roll < 0.25) this.spawnEnemy('beetle');
        else if (roll < 0.5) this.spawnEnemy('wasp');
        else if (roll < 0.75) this.spawnEnemy('wizard');
        else this.spawnEnemy('golem');
      }
    }

    // ── Update enemies ──
    const toKillEn = [];
    this.enemies.getChildren().forEach(en => {
      if (!en.active) { toKillEn.push(en); return; }

      // unfreeze
      if (en.frozen) {
        en.frozenTimer -= dt;
        if (en.frozenTimer <= 0) { en.frozen = false; en.clearTint(); }
      }

      const frozen = en.frozen;
      const enSpd  = frozen ? en.speed * 0.15 : en.speed;

      // update world pos (enemies don't move with camera, they move in world space)
      if (en.knockback > 0) {
        en.worldX += en.knockback * dt;
        en.knockback = Math.max(0, en.knockback - 600 * dt);
      } else if (!frozen) {
        // move toward player
        const dx = this.playerWorldX - en.worldX;
        if (en.type === 'wasp') {
          // wasp tracks Y
          const targetY = this.player.y;
          const dy = targetY - en.y;
          en.y += Math.sign(dy) * enSpd * 0.5 * dt;
          en.worldX -= enSpd * dt * 0.3; // wasp kites with player advance
        } else if (en.type === 'wizard') {
          // wizard keeps distance
          if (dx < 250) en.worldX -= enSpd * dt;
          else if (dx > 350) en.worldX -= enSpd * 0.3 * dt;
        } else {
          // beetles/golem charge
          en.worldX -= enSpd * 0.6 * dt;
        }
      }

      // wizard shoot
      if (en.type === 'wizard' && !frozen) {
        en.shootTimer -= dt;
        if (en.shootTimer <= 0) {
          en.shootTimer = 2.5 + Math.random() * 2;
          this.enemyShoot(en);
        }
      }

      // update screen X
      en.x = en.worldX - this.cameraX;

      // despawn if far off-screen left
      if (en.x < -150) toKillEn.push(en);

      // player collision — only when not immune
      if (this.hurtTimer <= 0 && this.spellImmunity <= 0 && !this.iceDashing) {
        if (Math.abs(en.x - this.player.x) < 32 && Math.abs(en.y - this.player.y) < 38) {
          this.damagePlayer(1);
        }
      }
    });
    toKillEn.forEach(en => this.enemies.remove(en, true, true));

    // ── Update bullets ──
    const toKillB = [];
    this.bullets.getChildren().forEach(b => {
      b.lifeTimer -= dt;
      if (b.lifeTimer <= 0) { toKillB.push(b); return; }

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.enemyBullet) {
        // hit player — both in screen space
        if (Math.abs(b.x - this.player.x) < 24 && Math.abs(b.y - this.player.y) < 34) {
          this.damagePlayer(1);
          toKillB.push(b);
        }
      } else {
        // hit enemies — en.x is already screen space (set each frame from worldX - cameraX)
        this.enemies.getChildren().forEach(en => {
          if (!en.active) return;
          // use generous hitbox so spells feel responsive
          const hitW = en.type === 'golem' ? 52 : 36;
          const hitH = en.type === 'golem' ? 52 : 36;
          if (Math.abs(b.x - en.x) < hitW && Math.abs(b.y - en.y) < hitH) {
            this.damageEnemy(en, b.dmg, 0xffffff);
            if (!b.piercing) toKillB.push(b);
          }
        });
      }

      // off screen (bullets are in screen space, check against viewport bounds)
      if (b.x < -80 || b.x > W + 80 || b.y < -80 || b.y > H + 80) toKillB.push(b);
    });
    // dedup
    const uniqueKillB = [...new Set(toKillB)];
    uniqueKillB.forEach(b => this.bullets.remove(b, true, true));

    // ── Update particles ──
    const toKillP = [];
    this.particles.getChildren().forEach(p => {
      p.lifeTimer -= dt;
      if (p.lifeTimer <= 0) { toKillP.push(p); return; }
      p.x = (p.x || 0) + p.vx * dt;
      p.y = (p.y || 0) + p.vy * dt;
    });
    toKillP.forEach(p => this.particles.remove(p, true, true));

    // ── HUD ──
    this.updateHUD();
  }
}

// ── Game Over Scene ───────────────────────────────────────────
class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(data) {
    if (window.Limaze) Limaze.music('menu');

    const gameScene = this.scene.get('Game');
    const duration = gameScene && gameScene.startTime ? Math.floor((Date.now() - gameScene.startTime) / 1000) : 0;
    const finalScore = data.score || 0;

    window.parent.postMessage({
      type: 'scoreUpdate',
      score: Math.floor(finalScore)
    }, '*');
    window.parent.postMessage({
      type: 'gameEnd',
      score: Math.floor(finalScore),
      duration: duration
    }, '*');

    const g = this.add.graphics();
    g.fillStyle(0x050510,0.95).fillRect(0,0,W,H);
    g.lineStyle(2,0xff0000,0.6).strokeRect(20,20,W-40,H-40);

    this.add.text(W/2, 90, 'GAME OVER', {
      fontSize:'52px', color:'#ff2200', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:6
    }).setOrigin(0.5);

    this.add.text(W/2, 165, 'DISTANCE: ' + (data.score || 0) + 'm', {
      fontSize:'24px', color:'#00ffcc', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:4
    }).setOrigin(0.5);

    this.add.text(W/2, 210, 'WAVE REACHED: ' + (data.wave || 1), {
      fontSize:'18px', color:'#ff8800', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:3
    }).setOrigin(0.5);

    // Rank message
    const dist = data.score || 0;
    let rank = 'STREET RUNNER';
    if (dist > 500)  rank = 'AETHER ADEPT';
    if (dist > 1500) rank = 'BLADE MASTER';
    if (dist > 3000) rank = 'CYBER LEGEND';
    this.add.text(W/2, 260, rank, {
      fontSize:'22px', color:'#ffff00', fontFamily:'Courier New',
      stroke:'#000', strokeThickness:4
    }).setOrigin(0.5);

    // Retry
    const retryBg = this.add.graphics();
    retryBg.fillStyle(0x003300,1).fillRoundedRect(W/2-120,H-150,240,52,8);
    retryBg.lineStyle(2,0x00ff88,1).strokeRoundedRect(W/2-120,H-150,240,52,8);
    const retryBtn = this.add.text(W/2, H-124, '► PLAY AGAIN', {
      fontSize:'20px', color:'#00ff88', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    retryBtn.on('pointerup', () => {
      if(window.Limaze) Limaze.stopMusic();
      this.scene.start('Game');
    });

    // Menu
    const menuBtn = this.add.text(W/2, H-60, '[ MAIN MENU ]', {
      fontSize:'15px', color:'#888899', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({useHandCursor:true});
    menuBtn.on('pointerup', () => {
      if(window.Limaze) Limaze.stopMusic();
      this.scene.start('Menu');
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      if(window.Limaze) Limaze.stopMusic();
      this.scene.start('Game');
    });
    this.input.keyboard.on('keydown-ENTER', () => {
      if(window.Limaze) Limaze.stopMusic();
      this.scene.start('Game');
    });

    this.tweens.add({
      targets: retryBtn, alpha: 0.5, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }
}

// ── Settings Scene ────────────────────────────────────────────
// Stores rebindable controls globally so GameScene can read them
window.CONTROLS = {
  jump:  'SPACE',
  slash: 'F',
  kick:  'D',
  fire:  'Q',
  ice:   'W',
  earth: 'E',
  wind:  'R',
  cast:  'SHIFT',
};

class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }

  create(data) {
    this.returnScene = (data && data.from) ? data.from : 'Menu';
    this.returnData  = (data && data.returnData) ? data.returnData : {};
    this.waitingFor  = null; // which control is being rebound

    const g = this.add.graphics();
    g.fillStyle(0x050510, 1).fillRect(0, 0, W, H);
    g.lineStyle(1, 0x001133, 0.4);
    for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x,0); g.lineTo(x,H); g.strokePath(); }
    for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.strokePath(); }

    this.add.text(W/2, 28, 'SETTINGS — KEY BINDINGS', {
      fontSize: '24px', color: '#00ffff', fontFamily: 'Courier New',
      stroke: '#003366', strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(W/2, 58, 'Click a binding to rebind it, then press the new key', {
      fontSize: '11px', color: '#556677', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Divider
    const dg = this.add.graphics();
    dg.lineStyle(1, 0x003355, 1).beginPath().moveTo(60, 74).lineTo(W-60, 74).strokePath();

    // Control rows
    this.controlDefs = [
      { id:'jump',  label:'JUMP',          fixed: false },
      { id:'kick',  label:'KICK',          fixed: false },
      { id:'fire',  label:'FIRE ELEMENT',  fixed: false },
      { id:'ice',   label:'ICE ELEMENT',   fixed: false },
      { id:'earth', label:'EARTH ELEMENT', fixed: false },
      { id:'wind',  label:'WIND ELEMENT',  fixed: false },
      { id:'cast',  label:'CAST SPELL',    fixed: false },
      { id:'slash', label:'SLASH ATTACK',  fixed: false },
    ];

    this.bindingTexts = {};
    const startY = 90;
    const rowH   = 42;
    const colLbl = 100;
    const colBtn = W - 180;

    this.controlDefs.forEach((def, i) => {
      const y = startY + i * rowH;

      // label
      this.add.text(colLbl, y + 14, def.label, {
        fontSize: '14px', color: '#aaccff', fontFamily: 'Courier New'
      }).setOrigin(0, 0.5);

      // binding badge bg
      const badgeG = this.add.graphics();
      const bx = colBtn - 60, bw = 130, bh = 32;
      const currentKey = window.CONTROLS[def.id];
      const badgeCol = def.fixed ? 0x222222 : 0x003366;
      const borderCol = def.fixed ? 0x444444 : 0x0088cc;

      badgeG.fillStyle(badgeCol, 1).fillRoundedRect(bx, y, bw, bh, 6);
      badgeG.lineStyle(2, borderCol, 0.9).strokeRoundedRect(bx, y, bw, bh, 6);

      const keyTxt = this.add.text(colBtn, y + bh/2,
        def.fixed ? currentKey + ' (fixed)' : currentKey,
        { fontSize:'13px', color: def.fixed ? '#555566' : '#00ffcc', fontFamily:'Courier New' }
      ).setOrigin(0.5);

      this.bindingTexts[def.id] = { txt: keyTxt, badgeG, bx, bw: bw, bh, y: y, borderCol };

      if (!def.fixed) {
        // make interactive zone
        const zone = this.add.zone(bx, y, bw, bh).setOrigin(0, 0).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => {
          badgeG.clear();
          badgeG.fillStyle(0x004488, 1).fillRoundedRect(bx, y, bw, bh, 6);
          badgeG.lineStyle(2, 0x00ffff, 1).strokeRoundedRect(bx, y, bw, bh, 6);
        });
        zone.on('pointerout', () => {
          if (this.waitingFor !== def.id) {
            badgeG.clear();
            badgeG.fillStyle(0x003366, 1).fillRoundedRect(bx, y, bw, bh, 6);
            badgeG.lineStyle(2, 0x0088cc, 0.9).strokeRoundedRect(bx, y, bw, bh, 6);
          }
        });
        zone.on('pointerup', () => {
          this.startRebind(def.id);
        });
      }

      // row separator
      const sg = this.add.graphics();
      sg.lineStyle(1, 0x112233, 0.5).beginPath().moveTo(80, y+rowH-2).lineTo(W-80, y+rowH-2).strokePath();
    });

    // Status text (shows "Press any key...")
    this.statusTxt = this.add.text(W/2, H - 90, '', {
      fontSize: '14px', color: '#ffcc00', fontFamily: 'Courier New',
      stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Conflict warning
    this.conflictTxt = this.add.text(W/2, H - 68, '', {
      fontSize: '11px', color: '#ff4444', fontFamily: 'Courier New'
    }).setOrigin(0.5);

    // Reset to defaults
    const resetG = this.add.graphics();
    resetG.fillStyle(0x221100, 1).fillRoundedRect(W/2 - 100, H - 46, 200, 32, 6);
    resetG.lineStyle(1, 0xff6600, 0.8).strokeRoundedRect(W/2 - 100, H - 46, 200, 32, 6);
    const resetBtn = this.add.text(W/2, H - 30, 'RESET TO DEFAULTS', {
      fontSize:'12px', color:'#ff9944', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    resetBtn.on('pointerup', () => this.resetDefaults());

    // Back button
    const backG = this.add.graphics();
    backG.fillStyle(0x001122, 1).fillRoundedRect(14, H - 46, 100, 32, 6);
    backG.lineStyle(1, 0x0055aa, 0.8).strokeRoundedRect(14, H - 46, 100, 32, 6);
    const backBtn = this.add.text(64, H - 30, '◄ BACK', {
      fontSize:'13px', color:'#4488cc', fontFamily:'Courier New'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerup', () => this.goBack());
    this.input.keyboard.on('keydown-ESC', () => this.goBack());

    // Global key capture for rebinding
    this.input.keyboard.on('keydown', (ev) => {
      if (!this.waitingFor) return;
      ev.preventDefault();
      const keyName = ev.code
        .replace('Key','').replace('Digit','')
        .replace('Arrow','').replace('Space','SPACE')
        .replace('ShiftLeft','SHIFT').replace('ShiftRight','SHIFT')
        .replace('ControlLeft','CTRL').replace('ControlRight','CTRL')
        .replace('AltLeft','ALT').replace('AltRight','ALT');
      this.applyRebind(this.waitingFor, keyName.toUpperCase());
    });
  }

  startRebind(id) {
    // cancel previous
    if (this.waitingFor) this.cancelRebind();

    this.waitingFor = id;
    const info = this.bindingTexts[id];
    if (!info) return;

    // highlight badge as "waiting"
    info.badgeG.clear();
    info.badgeG.fillStyle(0x332200, 1).fillRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
    info.badgeG.lineStyle(2, 0xffcc00, 1).strokeRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
    info.txt.setText('[ press key ]').setColor('#ffcc00');

    this.statusTxt.setText('▶ Press a key to bind to: ' + id.toUpperCase());
    this.conflictTxt.setText('');
    if (window.Limaze) Limaze.sfx('click');
  }

  cancelRebind() {
    if (!this.waitingFor) return;
    const id = this.waitingFor;
    this.waitingFor = null;
    const info = this.bindingTexts[id];
    if (!info) return;
    info.badgeG.clear();
    info.badgeG.fillStyle(0x003366, 1).fillRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
    info.badgeG.lineStyle(2, 0x0088cc, 0.9).strokeRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
    info.txt.setText(window.CONTROLS[id]).setColor('#00ffcc');
    this.statusTxt.setText('');
  }

  applyRebind(id, newKey) {
    if (!newKey || newKey.length === 0) { this.cancelRebind(); return; }

    // Check for conflicts (skip 'id' itself)
    let conflict = null;
    Object.entries(window.CONTROLS).forEach(([k, v]) => {
      if (k !== id && v === newKey) conflict = k;
    });

    if (conflict) {
      this.conflictTxt.setText('⚠ ' + newKey + ' already used by ' + conflict.toUpperCase() + ' — choose another');
      // stay in rebind mode
      return;
    }

    window.CONTROLS[id] = newKey;
    this.waitingFor = null;

    const info = this.bindingTexts[id];
    if (info) {
      info.badgeG.clear();
      info.badgeG.fillStyle(0x003366, 1).fillRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
      info.badgeG.lineStyle(2, 0x00ff88, 1).strokeRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
      info.txt.setText(newKey).setColor('#00ff88');
      // fade border back to normal after 1s
      this.time.delayedCall(1000, () => {
        if (!info) return;
        info.badgeG.clear();
        info.badgeG.fillStyle(0x003366, 1).fillRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
        info.badgeG.lineStyle(2, 0x0088cc, 0.9).strokeRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
        info.txt.setColor('#00ffcc');
      });
    }

    this.statusTxt.setText('✓ Bound!').setColor('#00ff88');
    this.conflictTxt.setText('');
    this.time.delayedCall(1200, () => {
      this.statusTxt.setText('').setColor('#ffcc00');
    });
    if (window.Limaze) Limaze.sfx('coin');
  }

  resetDefaults() {
    window.CONTROLS = { jump:'SPACE', slash:'F', kick:'D', fire:'Q', ice:'W', earth:'E', wind:'R', cast:'SHIFT' };
    // refresh all displayed texts
    this.controlDefs.forEach(def => {
      const info = this.bindingTexts[def.id];
      if (!info || def.fixed) return;
      const cur = window.CONTROLS[def.id];
      info.txt.setText(cur).setColor('#00ffcc');
      info.badgeG.clear();
      info.badgeG.fillStyle(0x003366, 1).fillRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
      info.badgeG.lineStyle(2, 0x0088cc, 0.9).strokeRoundedRect(info.bx, info.y, info.bw, info.bh, 6);
    });
    this.statusTxt.setText('Controls reset to defaults').setColor('#00ffcc');
    this.time.delayedCall(1500, () => this.statusTxt.setText(''));
    if (window.Limaze) Limaze.sfx('select');
  }

  goBack() {
    if (this.waitingFor) this.cancelRebind();
    // If returning to Game, stop Settings overlay and resume Game
    if (this.returnScene === 'Game') {
      const gameScene = this.scene.get('Game');
      this.scene.stop('Settings');
      if (gameScene) {
        gameScene.affinityKeyMap = { FIRE: window.CONTROLS.fire, ICE: window.CONTROLS.ice, EARTH: window.CONTROLS.earth, WIND: window.CONTROLS.wind };
        this.scene.resume('Game');
        // re-register fresh controls, then close the pause overlay
        gameScene._registerControls();
        if (gameScene.paused) gameScene.togglePause();
      }
    } else {
      this.scene.start(this.returnScene, this.returnData);
    }
  }
}

// ── Phaser Config ─────────────────────────────────────────────
const config = {
  type: Phaser.AUTO,
  width: W,
  height: H,
  backgroundColor: '#050510',
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: W,
    height: H,
    parent: 'game-container',
    expandParent: true,
  },
  scene: [BootScene, AffinityPickScene, MenuScene, GameScene, SettingsScene, GameOverScene],
  input: {
    activePointers: 3,
  },
  render: {
    pixelArt: true,
    antialias: false,
  }
};

const game = new Phaser.Game(config);

// Resize safety — only refresh the scale manager, never alter logical W/H
function resizeGame() {
  if (game && game.scale && game.canvas) {
    try {
      game.scale.refresh();
    } catch(e) {}
  }
}
window.addEventListener('resize', resizeGame);
new ResizeObserver(resizeGame).observe(document.documentElement);
