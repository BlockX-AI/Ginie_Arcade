// ============================================================
//  GameScene — Core game loop
// ============================================================
class GameScene extends Phaser.Scene {
  constructor() { super({ key: C.SCENE_GAME }); }

  // ── create ───────────────────────────────────────────────
  create() {
    const W = C.W, H = C.H;
    const S = AbyssState;
    this._S = S;

    // ── background — dual-image seamless parallax ────────
    // Layer 0: far (slow, full opacity) — two panels side by side
    this._bgFar = [
      this.add.image(0,   H/2, 'bg').setOrigin(0, 0.5).setDisplaySize(W, H).setDepth(0),
      this.add.image(W,   H/2, 'bg').setOrigin(0, 0.5).setDisplaySize(W, H).setDepth(0)
    ];
    // Layer 1: mid (faster, darker tint for depth)
    this._bgMid = [
      this.add.image(0,   H/2, 'bg').setOrigin(0, 0.5).setDisplaySize(W, H).setDepth(1).setAlpha(0.45).setTint(0x001133),
      this.add.image(W,   H/2, 'bg').setOrigin(0, 0.5).setDisplaySize(W, H).setDepth(1).setAlpha(0.45).setTint(0x001133)
    ];

    // ── scrollSpeed (escalates) ───────────────────────────
    this._scrollSpeed = C.SCROLL_SPEED;

    // ── player — static image facing right ───────────────
    this.player = this.physics.add.image(180, H/2, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setScale(1.6);

    // Removed idle bob tween so it doesn't override physics Y movement

    // Player world boundary: allow full height, block at left edge
    this.physics.world.setBounds(0, 0, W, H);

    // ── bullet pools ──────────────────────────────────────
    this._bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: C.BULLET_CAP,
      runChildUpdate: false
    });
    this._heavyBullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      maxSize: C.HEAVY_CAP,
      runChildUpdate: false
    });

    // ── particle pool (bio-energy drops) ─────────────────
    this._particles = [];   // {sprite, value}

    // ── monster container ─────────────────────────────────
    this._monsters = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Image,
      runChildUpdate: false
    });
    this._spawnTimer = 0;

    // HP bar graphics
    this._hpBar = this.add.graphics().setDepth(20);

    // ── boost trail graphics ──────────────────────────────
    this._trail = this.add.graphics().setDepth(8);
    this._trailPoints = [];

    // ── damage flash overlay ──────────────────────────────
    this._flash = this.add.rectangle(W/2, H/2, W, H, 0xff0000, 0).setDepth(100);

    // ── distance tracker ─────────────────────────────────
    this._distanceAcc = 0;

    // ── input system ─────────────────────────────────────
    this._keys = {};
    // Cursor keys created ONCE here (never inside update)
    this._cursors = this.input.keyboard.createCursorKeys();
    this._rebuildKeys();

    // Mouse / touch primary fire
    this.input.on('pointerdown', (ptr) => {
      // Only fire if not tapping UI (top strip is HUD)
      if (ptr.y > 90) this._tryAttack();
    });

    // ── spawn first monster ───────────────────────────────
    // Handled in update loop

    // ── pause toggle ──────────────────────────────────────
    this._paused = false;
    this.input.keyboard.on('keydown-ESC', () => this._togglePause());

    // ── physics overlaps ─────────────────────────────────
    // Bullet ↔ monster handled manually in update for pool compat

    // ── music ─────────────────────────────────────────────
    if (window.Limaze) Limaze.music('tense');

    // ── visibility pause ─────────────────────────────────
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._pauseGame();
    });

    // ── Export for Mobile UI ──
    window.doAttack = () => this._tryAttack();
    window.doHeavy  = () => this._tryHeavyAttack();
    window.doBoost  = () => this._tryBoost();
    window.doO2     = () => this._tryConvertO2();
    window.doBat    = () => this._tryConvertBat();
  }

  // ── rebuildKeys: read controls config and create key objects ─
  _rebuildKeys() {
    // Remove old keys safely
    Object.values(this._keys).forEach(k => {
      try { if (k && k.destroy) k.destroy(); } catch(e) {}
    });
    this._keys = {};
    const ctrl = AbyssState.controls;
    const kb   = this.input.keyboard;
    const KC   = Phaser.Input.Keyboard.KeyCodes;

    // Helper: resolve a stored control string to a KeyCode integer
    const resolve = (s) => {
      if (typeof s === 'number') return s;
      // Try direct KC lookup first (e.g. 'KeyF' won't be in KC, but 'F' will)
      const stripped = s.replace(/^Key/, '').replace(/^Digit/, '').replace(/^ShiftLeft$/, 'SHIFT').replace(/^Space$/, 'SPACE').toUpperCase();
      return KC[stripped] || KC[s.toUpperCase()] || s;
    };

    this._keys.up          = kb.addKey(resolve(ctrl.up));
    this._keys.down        = kb.addKey(resolve(ctrl.down));
    this._keys.left        = kb.addKey(resolve(ctrl.left));
    this._keys.right       = kb.addKey(resolve(ctrl.right));
    this._keys.attack      = kb.addKey(resolve(ctrl.attack));
    this._keys.heavyAttack = kb.addKey(resolve(ctrl.heavyAttack));
    this._keys.boost       = kb.addKey(resolve(ctrl.boost));
    this._keys.convertO2   = kb.addKey(resolve(ctrl.convertO2));
    this._keys.convertBat  = kb.addKey(resolve(ctrl.convertBat));
  }

  // ── _spawnMonster ─────────────────────────────────────────
  _spawnMonster() {
    if (this._monsters.getChildren().length >= 15) return;
    const kills = AbyssState.monsterKills;
    const hp    = Math.floor(C.BASE_MONSTER_HP * Math.pow(C.MONSTER_HP_SCALE, kills));
    const spd   = C.BASE_MONSTER_SPEED * Math.pow(C.MONSTER_SPD_SCALE, kills);
    const scale = C.BASE_MONSTER_SIZE  * Math.pow(C.MONSTER_SIZE_SCALE, kills);

    const y = Phaser.Math.Between(80, C.H - 80);
    const m = this._monsters.create(C.W + 60, y, 'monster');
    m.setScale(Math.min(scale, 3.5));
    m.setDepth(9);
    
    m.hp    = hp;
    m.maxHp = hp;
    m.speed = spd;
    m.scaleFactor = Math.min(scale, 3.5);

    // Sine wave vertical movement data
    m.sineT  = 0;
    m.sineAmp= Phaser.Math.Between(30, 80);
    m.sineSpd= Phaser.Math.FloatBetween(1.2, 2.5);
  }

  // ── _tryAttack ────────────────────────────────────────────
  _tryAttack() {
    const S = this._S;
    if (S.battery < C.ATTACK_COST) return;
    S.battery -= C.ATTACK_COST;
    S.firing = true;
    S.fireTimer = 300;

    // Get a bullet from pool
    const b = this._bullets.get();
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.setTexture('bullet');
    b.setPosition(this.player.x + 40, this.player.y);
    b.setDepth(11);
    b.setScale(1.5);
    this.physics.velocityFromAngle(0, C.BULLET_SPEED, b.body.velocity);

    if (window.Limaze) Limaze.sfx('hit');

    // Auto-deactivate when off screen (handled in update)
  }

  // ── _tryHeavyAttack ───────────────────────────────────────
  _tryHeavyAttack() {
    const S = this._S;
    if (S.battery < C.HEAVY_COST) return;   // needs 30% battery
    S.battery -= C.HEAVY_COST;
    S.firing = true;
    S.fireTimer = 500;

    const b = this._heavyBullets.get();
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.setTexture('bullet_heavy');
    b.setPosition(this.player.x + 55, this.player.y);
    b.setDepth(11);
    b.setScale(1.8);
    this.physics.velocityFromAngle(0, C.HEAVY_SPEED, b.body.velocity);

    // Screen-shake effect
    this.cameras.main.shake(140, 0.008);

    if (window.Limaze) Limaze.sfx('explosion');
  }

  // ── _tryBoost ─────────────────────────────────────────────
  _tryBoost() {
    const S = this._S;
    if (S.boosting) return;
    const cost = C.O2_MAX * (C.BOOST_O2_COST / 100);
    if (S.o2 < cost) return;
    S.o2 -= cost;
    S.boosting = true;
    S.boostTimer = C.BOOST_DURATION;
    if (window.Limaze) Limaze.sfx('powerup');
  }

  // ── _tryConvertO2 ─────────────────────────────────────────
  _tryConvertO2() {
    const S = this._S;
    if (S.bioEnergy <= 0) return;
    const need = C.O2_MAX - S.o2;
    if (need <= 0) return;
    const use = Math.min(S.bioEnergy, need);
    S.bioEnergy -= use;
    S.o2 = Math.min(C.O2_MAX, S.o2 + use);
    if (window.Limaze) Limaze.sfx('coin');
  }

  // ── _tryConvertBat ────────────────────────────────────────
  _tryConvertBat() {
    const S = this._S;
    if (S.bioEnergy <= 0) return;
    const need = C.BAT_MAX - S.battery;
    if (need <= 0) return;
    const use = Math.min(S.bioEnergy, need);
    S.bioEnergy -= use;
    S.battery = Math.min(C.BAT_MAX, S.battery + use);
    if (window.Limaze) Limaze.sfx('coin');
  }

  // ── _spawnParticles ───────────────────────────────────────
  _spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      if (this._particles.length >= C.PARTICLE_CAP) break;
      const px = x + Phaser.Math.Between(-40, 40);
      const py = y + Phaser.Math.Between(-40, 40);
      const s  = this.add.image(px, py, 'particle').setScale(1.2).setDepth(12);
      this._particles.push({ sprite: s, vx: Phaser.Math.FloatBetween(-30,30),
                             vy: Phaser.Math.FloatBetween(-50, 50), life: 1 });
    }
  }

  // ── _killMonster ─────────────────────────────────────────
  _killMonster(m) {
    if (!m) return;
    const drops = Phaser.Math.Between(3, 8);
    this._spawnParticles(m.x, m.y, drops);
    m.destroy();
    AbyssState.monsterKills++;
    this._scrollSpeed = Math.min(C.SCROLL_SPEED + AbyssState.monsterKills * 5, 400);
    if (window.Limaze) Limaze.sfx('explosion');
  }

  // ── _togglePause ─────────────────────────────────────────
  _togglePause() {
    if (this._paused) this._resumeGame();
    else this._pauseGame();
  }

  _pauseGame() {
    if (this._paused) return;
    this._paused = true;
    this.physics.pause();
    if (window.Limaze) Limaze.stopMusic();
    this.scene.launch(C.SCENE_SETTINGS, { from: C.SCENE_GAME });
    this.scene.pause(C.SCENE_GAME);
    this.scene.pause(C.SCENE_HUD);
  }

  _resumeGame() {
    this._paused = false;
    this.physics.resume();
    if (window.Limaze) Limaze.music('tense');
    this._rebuildKeys();
    this.scene.resume(C.SCENE_GAME);
    this.scene.resume(C.SCENE_HUD);
  }

  // ── update ───────────────────────────────────────────────
  update(time, delta) {
    const dt  = delta / 1000;
    const S   = this._S;
    if (this._paused) return;

    // ── Scroll — dual-image parallax (panels loop left→right) ──
    const farSpd = this._scrollSpeed * dt * 0.28;
    const midSpd = this._scrollSpeed * dt * 0.55;

    for (const p of this._bgFar) {
      p.x -= farSpd;
      if (p.x <= -C.W) p.x += C.W * 2;
    }
    for (const p of this._bgMid) {
      p.x -= midSpd;
      if (p.x <= -C.W) p.x += C.W * 2;
    }
    S.distance += this._scrollSpeed * dt * 0.05;

    // ── Resource decay ────────────────────────────────────
    S.o2 = Math.max(0, S.o2 - C.O2_DECAY_RATE * dt);
    // Battery no longer regenerates automatically; must be converted from Bio-Energy

    // ── Game over check ───────────────────────────────────
    if (S.o2 <= 0) { this._gameOver(); return; }

    // ── Boost timer ───────────────────────────────────────
    if (S.boosting) {
      S.boostTimer -= delta;
      if (S.boostTimer <= 0) {
        S.boosting = false;
      }
    }

    // ── Fire timer ────────────────────────────────────────
    if (S.firing) {
      S.fireTimer -= delta;
      if (S.fireTimer <= 0) {
        S.firing = false;
      }
    }

    // ── Input ────────────────────────────────────────────
    this._handleInput(dt);

    // ── Player visual state (static image — tint shows state)
    if (S.boosting) {
      this.player.setTint(0x00ffff);           // cyan overdrive tint
    } else if (S.firing) {
      this.player.setTint(0xffaa00);           // orange fire tint
      this._heavyFlash && this.player.setTint(0xff4400); // heavy = deep orange
    } else {
      this.player.clearTint();
    }

    // ── Spawner ──────────────────────────────────────────
    this._spawnTimer -= delta;
    if (this._spawnTimer <= 0) {
      this._spawnMonster();
      // Decrease spawn time based on kills
      const spawnDelay = Math.max(500, 2000 - AbyssState.monsterKills * 50);
      this._spawnTimer = spawnDelay;
    }

    // ── Monster movement ─────────────────────────────────
    this._monsters.getChildren().forEach(m => {
      if (!m.active) return;
      
      m.sineT += dt * m.sineSpd;
      // Seek the player's Y position to "attack"
      const targetY = this.player.y + Math.sin(m.sineT) * m.sineAmp;

      // Move left (toward player)
      const spd = S.boosting ? m.speed * 1.6 : m.speed;
      m.x -= (this._scrollSpeed * 0.7 + spd) * dt;
      m.y += (targetY - m.y) * 2 * dt;

      // If monster reaches left edge, deal O2 damage
      if (m.x < -80) {
        S.o2 = Math.max(0, S.o2 - 20);
        this._damageFlash();
        m.destroy();
      } else {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, m.x, m.y);
          
        if (dist < 60 * m.scaleFactor) {
          // During boost: ram deals damage to monster
          if (S.boosting) {
            m.hp -= 40 * dt * 10; // burst damage
            if (m.hp <= 0) this._killMonster(m);
          } else {
            // Monster damages player!
            if (!this._playerInvuln) {
              S.o2 = Math.max(0, S.o2 - 15); // deal 15 damage
              this._damageFlash();
              this._playerInvuln = true;
              this.time.delayedCall(1000, () => this._playerInvuln = false);
            }
          }
        }
      }
    });

    this._drawHPBars();

    // ── Standard bullet update ───────────────────────────
    this._bullets.getChildren().forEach(b => {
      if (!b.active) return;
      if (b.x > C.W + 50) { b.setActive(false).setVisible(false); return; }
      
      const monsters = this._monsters.getChildren();
      for (let i = 0; i < monsters.length; i++) {
        const m = monsters[i];
        if (!m.active) continue;
        const dist = Phaser.Math.Distance.Between(b.x, b.y, m.x, m.y);
        if (dist < 30 * m.scaleFactor) {
          b.setActive(false).setVisible(false);
          m.hp -= C.ATTACK_DMG;
          if (m.hp <= 0) this._killMonster(m);
          break; // bullet destroys itself on first hit
        }
      }
    });

    // ── Heavy bullet update ──────────────────────────────
    this._heavyBullets.getChildren().forEach(b => {
      if (!b.active) return;
      if (b.x > C.W + 80) { b.setActive(false).setVisible(false); return; }
      
      const monsters = this._monsters.getChildren();
      for (let i = 0; i < monsters.length; i++) {
        const m = monsters[i];
        if (!m.active) continue;
        const dist = Phaser.Math.Distance.Between(b.x, b.y, m.x, m.y);
        // Heavy bolt has bigger hit radius
        if (dist < 45 * m.scaleFactor) {
          b.setActive(false).setVisible(false);
          m.hp -= C.HEAVY_DMG;
          // Extra impact flash
          this._flash.setFillStyle(0xff6600).setAlpha(0.22);
          this.tweens.add({ targets: this._flash, alpha: 0, duration: 180, ease: 'Power2' });
          this.cameras.main.shake(80, 0.005);
          if (window.Limaze) Limaze.sfx('hit');
          if (m.hp <= 0) this._killMonster(m);
          break; // hit first monster it contacts
        }
      }
    });

    // ── Particle (bio-energy) update ─────────────────────
    const toRemove = [];
    for (let i = 0; i < this._particles.length; i++) {
      const p = this._particles[i];
      p.sprite.x += (p.vx - this._scrollSpeed * 0.6) * dt;
      p.sprite.y += p.vy * dt;
      p.life -= dt * 0.35;
      p.sprite.setAlpha(p.life);

      // Player collects particle
      const d = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, p.sprite.x, p.sprite.y);
      if (d < 40 || p.life <= 0 || p.sprite.x < -20) {
        if (d < 40 && p.life > 0) {
          S.bioEnergy = Math.min(C.BIOE_MAX, S.bioEnergy + C.BIOE_PER_PARTICLE);
          if (window.Limaze) Limaze.sfx('coin');
        }
        p.sprite.destroy();
        toRemove.push(i);
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) this._particles.splice(toRemove[i], 1);

    // ── Boost trail ──────────────────────────────────────
    this._updateTrail(dt);

    // ── Screen boundary: block player from scrolling off left ─
    if (this.player.x < 60) this.player.x = 60;
  }

  // ── _handleInput ─────────────────────────────────────────
  _handleInput(dt) {
    const S    = this._S;
    const keys = this._keys;
    const p    = this.player;
    let vx = 0, vy = 0;

    // Movement — use pre-created key objects (never addKey inside update!)
    const mi = window.mobileInputs || {};
    const left  = keys.left.isDown  || this._cursors.left.isDown || mi.left;
    const right = keys.right.isDown || this._cursors.right.isDown || mi.right;
    const up    = keys.up.isDown    || this._cursors.up.isDown || mi.up;
    const down  = keys.down.isDown  || this._cursors.down.isDown || mi.down;

    const spd = S.boosting ? C.BOOST_SPEED : C.PLAYER_SPEED;
    if (left)  vx -= spd;
    if (right) vx += spd;
    if (up)    vy -= spd;
    if (down)  vy += spd;

    p.setVelocity(vx, vy);

    // Energy increase with movement
    if (vx !== 0 || vy !== 0) {
      S.battery = Math.min(C.BAT_MAX, S.battery + 10 * dt);
    }

    // Action keys — JustDown on pre-created objects
    if (Phaser.Input.Keyboard.JustDown(keys.attack))      this._tryAttack();
    if (Phaser.Input.Keyboard.JustDown(keys.heavyAttack)) this._tryHeavyAttack();
    if (Phaser.Input.Keyboard.JustDown(keys.boost))       this._tryBoost();
    if (Phaser.Input.Keyboard.JustDown(keys.convertO2))   this._tryConvertO2();
    if (Phaser.Input.Keyboard.JustDown(keys.convertBat))  this._tryConvertBat();
  }

  // ── _updateTrail ─────────────────────────────────────────
  _updateTrail(dt) {
    const S = this._S;
    this._trail.clear();
    if (!S.boosting) { this._trailPoints = []; return; }

    this._trailPoints.push({ x: this.player.x - 20, y: this.player.y, t: 1 });
    if (this._trailPoints.length > 18) this._trailPoints.shift();

    for (let i = 0; i < this._trailPoints.length; i++) {
      const pt = this._trailPoints[i];
      pt.t -= dt * 2.5;
      this._trail.fillStyle(0x00ffff, Math.max(0, pt.t) * 0.7);
      const r = Math.max(1, (i / this._trailPoints.length) * 10);
      this._trail.fillCircle(pt.x, pt.y, r);
    }
    this._trailPoints = this._trailPoints.filter(pt => pt.t > 0);
  }

  // ── _drawHPBars ────────────────────────────────────────────
  _drawHPBars() {
    this._hpBar.clear();
    this._monsters.getChildren().forEach(m => {
      if (!m.active) return;
      const mx = m.x;
      const my = m.y - 50 * m.scaleFactor;
      const bw = 60 * m.scaleFactor;
      const pct = Math.max(0, m.hp / m.maxHp);
      this._hpBar.fillStyle(0x330000, 0.8);
      this._hpBar.fillRect(mx - bw/2, my, bw, 8);
      this._hpBar.fillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff2200, 1);
      this._hpBar.fillRect(mx - bw/2, my, bw * pct, 8);
    });
  }

  // ── _damageFlash ──────────────────────────────────────────
  _damageFlash() {
    this._flash.setAlpha(0.35);
    this.tweens.add({ targets: this._flash, alpha: 0, duration: 300, ease: 'Power2' });
    if (window.Limaze) Limaze.sfx('hurt');
  }

  // ── _gameOver ─────────────────────────────────────────────
  _gameOver() {
    if (window.Limaze) {
      Limaze.stopMusic();
      Limaze.sfx('lose');
      Limaze.postScore(Math.floor(AbyssState.distance));
    }
    this.scene.stop(C.SCENE_HUD);
    this.scene.start(C.SCENE_GAMEOVER);
  }
}
