// ============================================================
//  HUDScene — Overlay HUD (runs parallel to GameScene)
// ============================================================
class HUDScene extends Phaser.Scene {
  constructor() { super({ key: C.SCENE_HUD }); }

  create() {
    const W = C.W;

    // ── Panel background strip ────────────────────────────
    this.add.rectangle(W/2, 38, W, 76, 0x000820, 0.82).setDepth(50);
    this.add.rectangle(W/2, 38, W, 76, 0x004466, 0).setDepth(50).setStrokeStyle(1, 0x0088bb, 0.5);

    // ── O2 bar ───────────────────────────────────────────
    const o2Label = this.add.text(14, 8, 'O₂ LUNG', {
      fontSize: '10px', fontFamily: 'monospace', color: '#00ccff' }).setDepth(60);

    this._o2BgBar = this.add.rectangle(14, 22, 180, 14, 0x001133).setOrigin(0, 0).setDepth(55);
    this._o2Bar   = this.add.rectangle(14, 22, 180, 14, 0x00aaff).setOrigin(0, 0).setDepth(56);
    this._o2Text  = this.add.text(200, 22, '100%', {
      fontSize: '10px', fontFamily: 'monospace', color: '#00ccff' }).setDepth(60);

    // ── Battery bar ──────────────────────────────────────
    this.add.text(14, 40, 'BIO-BATTERY', {
      fontSize: '10px', fontFamily: 'monospace', color: '#44ff88' }).setDepth(60);

    this._batBgBar = this.add.rectangle(14, 54, 180, 14, 0x001133).setOrigin(0, 0).setDepth(55);
    this._batBar   = this.add.rectangle(14, 54, 180, 14, 0x00ff66).setOrigin(0, 0).setDepth(56);
    this._batText  = this.add.text(200, 54, '50%', {
      fontSize: '10px', fontFamily: 'monospace', color: '#44ff88' }).setDepth(60);

    // ── Raw Bio-Energy bar ────────────────────────────────
    this.add.text(220, 8, 'RAW BIO-ENERGY', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ccff00' }).setDepth(60);

    this._bioBgBar = this.add.rectangle(220, 22, 200, 14, 0x001133).setOrigin(0,0).setDepth(55);
    this._bioBar   = this.add.rectangle(220, 22, 200, 14, 0x88ff00).setOrigin(0,0).setDepth(56);
    this._bioText  = this.add.text(426, 22, '0', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ccff00' }).setDepth(60);

    // Convert hints
    this.add.text(220, 40, '[1] → O₂   [2] → BATTERY', {
      fontSize: '10px', fontFamily: 'monospace', color: '#667744' }).setDepth(60);

    // ── Distance tracker ─────────────────────────────────
    this._distText = this.add.text(W/2, 8, 'DEPTH: 0 m', {
      fontSize: '14px', fontFamily: 'monospace', color: '#88ddff',
      stroke: '#000033', strokeThickness: 3
    }).setOrigin(0.5, 0).setDepth(60);

    // Kill counter
    this._killText = this.add.text(W/2, 26, 'KILLS: 0  │  THREAT LVL: 1', {
      fontSize: '10px', fontFamily: 'monospace', color: '#ff8844'
    }).setOrigin(0.5, 0).setDepth(60);

    // ── Right side: controls reminder ────────────────────
    this.add.text(W - 14, 8, 'SPACE: FIRE  │  F: HEAVY FIRE  │  SHIFT: BOOST  │  ESC: PAUSE', {
      fontSize: '9px', fontFamily: 'monospace', color: '#445566'
    }).setOrigin(1, 0).setDepth(60);

    this.add.text(W - 14, 22, 'WASD / ARROWS: MOVE', {
      fontSize: '9px', fontFamily: 'monospace', color: '#334455'
    }).setOrigin(1, 0).setDepth(60);

    // Boost cooldown indicator
    this._boostLabel = this.add.text(W - 14, 40, 'BOOST READY', {
      fontSize: '11px', fontFamily: 'monospace', color: '#00ffcc'
    }).setOrigin(1, 0).setDepth(60);

    // O2 critical warning
    this._o2Warn = this.add.text(W/2, 70, '⚠ CRITICAL O₂ — CONVERT NOW', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ff2200',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5, 0).setDepth(70).setAlpha(0);

    this._warnTween = this.tweens.add({
      targets: this._o2Warn, alpha: 1, duration: 300, yoyo: true, repeat: -1, paused: true
    });
  }

  update() {
    const S = AbyssState;

    // O2 bar
    const o2Pct = S.o2 / C.O2_MAX;
    this._o2Bar.width = 180 * o2Pct;
    const o2Col = o2Pct > 0.5 ? 0x00aaff : o2Pct > 0.25 ? 0xffaa00 : 0xff2200;
    this._o2Bar.setFillStyle(o2Col);
    this._o2Text.setText(Math.ceil(S.o2) + '%');

    // Battery bar
    const batPct = S.battery / C.BAT_MAX;
    this._batBar.width = 180 * batPct;
    this._batText.setText(Math.floor(S.battery) + '%');

    // Bio-energy bar
    const bioPct = S.bioEnergy / C.BIOE_MAX;
    this._bioBar.width = 200 * bioPct;
    this._bioText.setText(Math.floor(S.bioEnergy));

    // Distance
    this._distText.setText('DEPTH: ' + Math.floor(S.distance) + ' m');

    // Kill / threat
    this._killText.setText(
      'KILLS: ' + S.monsterKills + '  │  THREAT LVL: ' + (S.monsterKills + 1));

    // Boost label
    if (S.boosting) {
      this._boostLabel.setText('BOOSTING!').setColor('#ff6600');
    } else if (S.o2 < C.O2_MAX * (C.BOOST_O2_COST / 100)) {
      this._boostLabel.setText('BOOST: LOW O₂').setColor('#883300');
    } else {
      this._boostLabel.setText('BOOST READY').setColor('#00ffcc');
    }

    // O2 critical warning
    if (o2Pct < 0.2) {
      if (!this._warnTween.isPlaying()) this._warnTween.resume();
    } else {
      this._warnTween.pause();
      this._o2Warn.setAlpha(0);
    }
  }
}
