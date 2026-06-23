// ============================================================
//  Project Abyss-Engine — Shared Constants & State
// ============================================================

const C = {
  // Canvas dimensions
  W: 960,
  H: 540,

  // Resource pools
  O2_MAX:        100,
  O2_DECAY_RATE: 2.0,      // per second passive loss (reduced from 3.5)
  BAT_MAX:       100,
  BAT_REGEN:     6,         // per second passive gain
  BIOE_MAX:      200,

  // Attack — standard
  ATTACK_COST:   1,         // battery cost per shot
  ATTACK_DMG:    20,
  BULLET_SPEED:  700,
  BULLET_CAP:    20,

  // Heavy Attack
  HEAVY_COST:    30,        // battery cost per heavy shot
  HEAVY_DMG:     75,        // damage dealt per heavy bolt
  HEAVY_SPEED:   500,       // slightly slower but hits hard
  HEAVY_CAP:     6,         // separate pool cap

  // Boost / Oxygen Overdrive
  BOOST_O2_COST: 35,        // % of max O2 consumed
  BOOST_SPEED:   900,
  BOOST_DURATION:600,       // ms

  // Player movement
  PLAYER_SPEED:  280,
  SCROLL_SPEED:  120,       // world scroll px/s (min, escalates)

  // Escalation
  BASE_MONSTER_HP:    60,
  BASE_MONSTER_SIZE:  1.0,
  BASE_MONSTER_SPEED: 90,
  MONSTER_HP_SCALE:   1.18,
  MONSTER_SIZE_SCALE: 1.05,
  MONSTER_SPD_SCALE:  1.08,

  // Particles
  PARTICLE_CAP:  40,
  BIOE_PER_PARTICLE: 5,

  // Scenes
  SCENE_BOOT:     'BootScene',
  SCENE_MENU:     'MenuScene',
  SCENE_GAME:     'GameScene',
  SCENE_HUD:      'HUDScene',
  SCENE_SETTINGS: 'SettingsScene',
  SCENE_GAMEOVER: 'GameOverScene',
};

// Persistent game state shared across scenes (no localStorage)
window.AbyssState = {
  // Runtime resource pools
  o2:         C.O2_MAX,
  battery:    C.BAT_MAX * 0.5,
  bioEnergy:  0,

  // Escalation tracker
  monsterKills: 0,

  // Distance
  distance:   0,
  startTime:  0,

  // Controls config (default keycodes)
  controls: {
    up:          'W',
    down:        'S',
    left:        'A',
    right:       'D',
    attack:      'SPACE',
    heavyAttack: 'F',
    boost:       'SHIFT',
    convertO2:   'ONE',
    convertBat:  'TWO',
  },

  // Active boost flag
  boosting: false,
  boostTimer: 0,

  // Firing animation flag
  firing: false,
  fireTimer: 0,

  reset() {
    this.o2        = C.O2_MAX;
    this.battery   = C.BAT_MAX * 0.5;
    this.bioEnergy = 0;
    this.monsterKills = 0;
    this.distance  = 0;
    this.boosting  = false;
    this.boostTimer= 0;
    this.firing    = false;
    this.fireTimer = 0;
    this.startTime = Date.now();
  }
};
