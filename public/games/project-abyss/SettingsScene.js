// ============================================================
//  SettingsScene — Pause / Settings + rebindable controls
// ============================================================
class SettingsScene extends Phaser.Scene {
  constructor() { super({ key: C.SCENE_SETTINGS }); }

  init(data) {
    this._fromScene = data ? data.from : C.SCENE_MENU;
  }

  create() {
    const W = C.W, H = C.H;
    this._listeningFor = null; // which control we're rebinding

    // ── Dim overlay ──────────────────────────────────────
    this._overlay = this.add.rectangle(W/2, H/2, W, H, 0x000010, 0.88).setDepth(200).setInteractive();

    // ── Panel ────────────────────────────────────────────
    const px = W/2, py = H/2;
    this.add.rectangle(px, py, 600, 520, 0x001122, 1).setDepth(201).setStrokeStyle(2, 0x00aacc, 1);

    // Title
    const titleText = this._fromScene === C.SCENE_GAME ? '⏸  PAUSED  /  SETTINGS' : '⚙  SETTINGS';
    this.add.text(px, py - 235, titleText, {
      fontSize: '22px', fontFamily: 'monospace', color: '#00ffcc',
      stroke: '#003344', strokeThickness: 4
    }).setOrigin(0.5).setDepth(202);

    // ── Controls section ─────────────────────────────────
    this.add.text(px, py - 200, 'CONTROLS CONFIGURATION  (click to rebind)', {
      fontSize: '11px', fontFamily: 'monospace', color: '#5588aa'
    }).setOrigin(0.5).setDepth(202);

    this._bindRows = {};
    const bindings = [
      { id: 'up',          label: 'MOVE UP' },
      { id: 'down',        label: 'MOVE DOWN' },
      { id: 'left',        label: 'MOVE LEFT' },
      { id: 'right',       label: 'MOVE RIGHT' },
      { id: 'attack',      label: 'FIRE / ATTACK' },
      { id: 'heavyAttack', label: 'HEAVY FIRE (-30% BATTERY)' },
      { id: 'boost',       label: 'O₂ OVERDRIVE BOOST' },
      { id: 'convertO2',   label: 'CONVERT → OXYGEN [key]' },
      { id: 'convertBat',  label: 'CONVERT → BATTERY [key]' },
    ];

    bindings.forEach((b, i) => {
      const rowY = py - 175 + i * 35;
      this.add.text(px - 200, rowY, b.label, {
        fontSize: '13px', fontFamily: 'monospace', color: '#88bbcc'
      }).setDepth(202);

      const keyCode = AbyssState.controls[b.id];
      const btn = this.add.text(px + 80, rowY, this._formatKey(keyCode), {
        fontSize: '13px', fontFamily: 'monospace', color: '#ffdd00',
        backgroundColor: '#002233', padding: { x: 12, y: 4 }
      }).setDepth(203).setInteractive({ useHandCursor: true });

      btn.on('pointerup', () => this._startRebind(b.id, btn));
      btn.on('pointerover', () => { if (this._listeningFor !== b.id) btn.setColor('#ffffff'); });
      btn.on('pointerout',  () => { if (this._listeningFor !== b.id) btn.setColor('#ffdd00'); });

      this._bindRows[b.id] = btn;
    });

    // ── Waiting prompt ────────────────────────────────────
    this._listenPrompt = this.add.text(px, py + 150, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff8800',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(202);

    // ── Divider ──────────────────────────────────────────
    this.add.rectangle(px, py + 165, 460, 1, 0x003355).setDepth(202);

    // ── Volume label ─────────────────────────────────────
    this.add.text(px, py + 180, 'AUDIO', {
      fontSize: '11px', fontFamily: 'monospace', color: '#5588aa'
    }).setOrigin(0.5).setDepth(202);

    // Mute toggle
    const muteBtn = this.add.text(px, py + 200, this._muteLabel(), {
      fontSize: '14px', fontFamily: 'monospace', color: '#00ffcc',
      backgroundColor: '#002233', padding: { x: 14, y: 5 }
    }).setOrigin(0.5).setDepth(203).setInteractive({ useHandCursor: true });

    muteBtn.on('pointerup', () => {
      this._muted = !this._muted;
      if (window.Limaze) Limaze.mute(this._muted);
      muteBtn.setText(this._muteLabel());
      if (window.Limaze) Limaze.sfx('click');
    });

    // ── Resume / Back button ──────────────────────────────
    const resumeLabel = this._fromScene === C.SCENE_GAME ? '▶  RESUME GAME' : '← BACK TO MENU';
    const resumeBtn = this.add.text(px, py + 230, resumeLabel, {
      fontSize: '18px', fontFamily: 'monospace', color: '#00ffcc',
      stroke: '#003344', strokeThickness: 4
    }).setOrigin(0.5).setDepth(203).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: resumeBtn, alpha: 0.5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    resumeBtn.on('pointerup', () => this._close());

    // ESC to close
    this.input.keyboard.on('keydown-ESC', () => {
      if (this._listeningFor) { this._cancelRebind(); return; }
      this._close();
    });

    // Keyboard listener for rebinding
    this.input.keyboard.on('keydown', (evt) => {
      if (!this._listeningFor) return;
      if (evt.code === 'Escape') { this._cancelRebind(); return; }
      this._commitRebind(evt.code);
    });

    this._muted = false;
  }

  _formatKey(code) {
    // Handles both browser evt.code style AND Phaser KC name style
    const map = {
      // Browser codes
      'Space': 'SPACE', 'ShiftLeft': 'L-SHIFT', 'ShiftRight': 'R-SHIFT',
      'Digit1': '1', 'Digit2': '2', 'Digit3': '3', 'Digit4': '4',
      'ControlLeft': 'L-CTRL', 'ControlRight': 'R-CTRL',
      'AltLeft': 'L-ALT', 'AltRight': 'R-ALT',
      'Enter': 'ENTER', 'Tab': 'TAB', 'CapsLock': 'CAPS',
      // Phaser KC names (stored in AbyssState.controls)
      'SPACE': 'SPACE', 'SHIFT': 'SHIFT', 'ONE': '1', 'TWO': '2',
      'THREE': '3', 'FOUR': '4', 'CTRL': 'CTRL', 'ALT': 'ALT',
      'ENTER': 'ENTER', 'TAB': 'TAB',
    };
    // Key/Digit prefix stripping for display
    const stripped = String(code)
      .replace(/^Key/, '').replace(/^Digit/, '');
    return map[code] || stripped;
  }

  _startRebind(id, btn) {
    if (this._listeningFor) this._cancelRebind();
    this._listeningFor = id;
    btn.setColor('#ff4400').setText('PRESS ANY KEY…');
    this._listenPrompt.setText('Press a key to bind to "' + id.toUpperCase() + '"  (ESC to cancel)');
    if (window.Limaze) Limaze.sfx('select');
  }

  _cancelRebind() {
    if (!this._listeningFor) return;
    const id = this._listeningFor;
    this._listeningFor = null;
    this._bindRows[id].setColor('#ffdd00').setText(this._formatKey(AbyssState.controls[id]));
    this._listenPrompt.setText('');
  }

  _codeToKC(evtCode) {
    // Convert browser evt.code → Phaser KeyCode name string
    const map = {
      'Space':'SPACE','ShiftLeft':'SHIFT','ShiftRight':'SHIFT',
      'ControlLeft':'CTRL','ControlRight':'CTRL',
      'AltLeft':'ALT','AltRight':'ALT',
      'Enter':'ENTER','Tab':'TAB','CapsLock':'CAPS',
      'Digit1':'ONE','Digit2':'TWO','Digit3':'THREE','Digit4':'FOUR',
      'Digit5':'FIVE','Digit6':'SIX','Digit7':'SEVEN','Digit8':'EIGHT',
      'Digit9':'NINE','Digit0':'ZERO',
    };
    if (map[evtCode]) return map[evtCode];
    // KeyA → A, KeyF → F etc.
    if (evtCode.startsWith('Key')) return evtCode.slice(3);
    return evtCode.toUpperCase();
  }

  _commitRebind(evtCode) {
    const id = this._listeningFor;
    this._listeningFor = null;

    const kc = this._codeToKC(evtCode);

    // Check for conflicts and swap
    let conflict = null;
    Object.entries(AbyssState.controls).forEach(([k, v]) => {
      if (k !== id && v === kc) conflict = k;
    });
    if (conflict) {
      AbyssState.controls[conflict] = AbyssState.controls[id];
      this._bindRows[conflict].setText(this._formatKey(AbyssState.controls[conflict]));
    }

    AbyssState.controls[id] = kc;
    this._bindRows[id].setColor('#ffdd00').setText(this._formatKey(kc));
    this._listenPrompt.setText('');
    if (window.Limaze) Limaze.sfx('coin');
  }

  _muteLabel() {
    return this._muted ? '🔇  UNMUTE AUDIO' : '🔊  MUTE AUDIO';
  }

  _close() {
    if (window.Limaze) Limaze.sfx('click');
    if (this._fromScene === C.SCENE_GAME) {
      // Resume game
      const gs = this.scene.get(C.SCENE_GAME);
      if (gs && gs._resumeGame) gs._resumeGame();
      this.scene.stop(C.SCENE_SETTINGS);
    } else {
      this.scene.stop(C.SCENE_SETTINGS);
      this.scene.start(C.SCENE_MENU);
    }
  }
}
