/*
 * Bounce Mallow — an endless procedural auto-runner platformer.
 * Single file, no external libraries.
 */
'use strict';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const PAL = {
  // Sky & atmosphere
  skyTop:      '#2372C2',
  skyMid:      '#5BB4EE',
  skyBot:      '#D8F1FB',
  sunOuter:    '#F7E26B',
  sunInner:    '#FFF8D2',
  cloudLit:    '#FFFFFF',
  cloudShade:  '#C3E0F4',
  cloudFar:    '#E3F3FC',

  // Mountains & Evergreen forest layers
  peakLit:     '#5E8BB3',
  peakShade:   '#385B80',
  snowLit:     '#FFFFFF',
  snowShade:   '#C8DFEE',
  ridgeFar:    '#25564C',
  ridgeFarHi:  '#2F6E5D',
  ridgeNear:   '#1B4332',
  pineDark:    '#1E5228',
  pineMid:     '#2E7330',
  pineLit:     '#4B9B39',
  trunk:       '#4A3324',

  // Ground strata & evergreen turf
  turfLit:     '#A8D832',
  turfMid:     '#5CA321',
  turfDark:    '#2E6B1E',
  soilTop:     '#9C5E28',
  soilMid:     '#734423',
  soilDeep:    '#493124',
  pebble:      '#362319',
  flowerRed:   '#F2647D',
  flowerGold:  '#F7E26B',

  // Rocky floating platforms
  rockTop:     '#9EAAB5',
  rockLit:     '#7E8B97',
  rockMid:     '#596572',
  rockDark:    '#38414C',
  rockOutline: '#1A2029',
  mossLit:     '#7BB82D',
  mossDark:    '#3D7322',

  // Player (Marshmallow)
  mallowTop:   '#FFFFFF',
  mallowBot:   '#E5ECF5',
  mallowShade: '#C4D1E2',
  mallowBlush: '#F28DA8',
  mallowLine:  '#1A1E29',

  // Spikes & Spike Bugs
  spikeBase:   '#2E3540',
  spikeSteel:  '#F4F7FA',
  spikeMid:    '#B6C1CC',
  spikeDark:   '#5B6675',
  spikeTip:    '#D93848',
  bugDark:     '#2B0E17',
  bugRedDk:    '#8B1726',
  bugRed:      '#CC2438',
  bugRedHi:    '#F25264',
  bugEye:      '#FFD43B',
  bugEyeGlow:  '#FF8A1F',

  // UI / HUD
  navy:        '#18222F',
  navyPanel:   '#1E2D3D',
  white:       '#FFFFFF',
  yellow:      '#F7E26B',
  pink:        '#F0809C',
  greenLt:     '#A8D832',
  blueDk:      '#1C6BA0',
  blue:        '#31A2F2',
  red:         '#C92A3B',
  gray:        '#B8C4D0',

  // Powerups (Espresso & Chamomile)
  espressoCup:    '#FFF7EC',
  espressoShade:  '#D9C7B4',
  espressoCoffee: '#4A2511',
  espressoCrema:  '#C97B36',
  espressoBand:   '#D95338',
  espressoGlow:   '#FFCC33',
  espressoSpark:  '#FFF07C',
  chamomilePetal: '#FFFDF4',
  chamomileShade: '#E3E6D8',
  chamomileCore:  '#F6C93B',
  chamomileCoreDk:'#D4941A',
  chamomileStem:  '#5BA832',
  chamomileGlow:  '#B8A8F8',
  chamomileSleep: '#7B68D6',
};

// ---------------------------------------------------------------------------
// State machine & world constants
// ---------------------------------------------------------------------------
const STATE = { TITLE: 0, COUNTDOWN: 1, PLAYING: 2, PAUSED: 3, GAMEOVER: 4 };
let state = STATE.TITLE;
let prevState = STATE.TITLE;
let stateTime = 0;
let animTime = 0;
let titleCamX = 0;

const REF_W = 500;
const REF_H = 560;

const GROUND_Y = 470;
const GROUND_SOLID_H = 1200;
const FALL_DEATH_Y = GROUND_Y + 210;
const PLAYER_SIZE = 36;
const GRAVITY = 1700;
const JUMP_VEL = -640;
const BASE_SPEED = 260;
const MAX_SPEED = 420;
const CHUNK_W = 460;
const START_X = 120;
const PX_PER_M = 10;
const COYOTE = 0.09;
const JUMP_BUFFER = 0.1;

// Exact jump kinematics used to guarantee reachable floating platforms
const MAX_JUMP_APEX = (JUMP_VEL * JUMP_VEL) / (2 * GRAVITY); // ~120.47 px
const TIME_TO_APEX = -JUMP_VEL / GRAVITY;                   // ~0.3765 s
const PLAT_H = 22;
const MIN_PLAT_HEIGHT = 66;
const MAX_PLAT_HEIGHT = Math.floor(MAX_JUMP_APEX - 24);     // 96 px

// Powerups (non-stackable speed modifiers)
const POWERUP_TYPE = { ESPRESSO: 'espresso', CHAMOMILE: 'chamomile' };
const POWERUP_DURATION = 6.0;
const POWERUP_ESPRESSO_MULT = 2.0;
const POWERUP_CHAMOMILE_MULT = 0.5;
const POWERUP_SIZE = 32;
const POWERUP_CHANCE = 0.14;
const POWERUP_MIN_CHUNK_GAP = 2;

// ---------------------------------------------------------------------------
// Responsive canvas / viewport
// ---------------------------------------------------------------------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const view = {
  cssW: 640,
  cssH: 640,
  dpr: 1,
  scale: 1,
  w: 640,
  h: 640,
  aspect: 1,
  isPortrait: false,
  playerScreenX: 0.26,
  groundScreenY: 470,
  camY: 0,
};

const pauseBtn = { x: 0, y: 0, w: 46, h: 46 };
const resumeBtn = { x: 0, y: 0, w: 240, h: 54 };
const quitBtn = { x: 0, y: 0, w: 240, h: 54 };

let world = null;
let camX = 0;

// ---------------------------------------------------------------------------
// Player & particles
// ---------------------------------------------------------------------------
const player = {
  x: START_X,
  y: GROUND_Y - PLAYER_SIZE,
  vx: 0,
  vy: 0,
  grounded: false,
  coyote: 0,
  jumpBuf: 0,
  squash: 1,
  squashVel: 0,
  tilt: 0,
  runPhase: 0,
  blinkTimer: 2.4,
  blinkDur: 0,
  dustTimer: 0,
  deathCause: '',
  deathT: 0,
  dead: false,
  powerup: null,
  powerupTimer: 0,
  powerupDuration: POWERUP_DURATION,
  powerupAnimT: 0,
  powerupBurstT: 0,
  speedMult: 1,
  fxTimer: 0,
};

const playerTrail = [];
let trailSampleTimer = 0;

const popups = [];

function spawnPopup(x, y, text, color) {
  popups.push({ x, y, text, color, life: 1.05, maxLife: 1.05 });
}

function updatePopups(dt) {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.life -= dt;
    p.y -= 36 * dt;
    if (p.life <= 0) popups.splice(i, 1);
  }
}

const particles = [];
const MAX_PARTICLES = 90;

function spawnParticles(x, y, count, opts) {
  const o = opts || {};
  const colors = o.colors || [PAL.white];
  for (let i = 0; i < count; i++) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const ang = (o.angleMin ?? -Math.PI) + Math.random() * ((o.angleMax ?? 0) - (o.angleMin ?? -Math.PI));
    const spd = (o.speedMin ?? 40) + Math.random() * ((o.speedMax ?? 130) - (o.speedMin ?? 40));
    const life = (o.lifeMin ?? 0.25) + Math.random() * ((o.lifeMax ?? 0.5) - (o.lifeMin ?? 0.25));
    particles.push({
      x: x + (Math.random() - 0.5) * (o.spreadX ?? 10),
      y: y + (Math.random() - 0.5) * (o.spreadY ?? 4),
      vx: Math.cos(ang) * spd + (o.vxBias ?? 0),
      vy: Math.sin(ang) * spd + (o.vyBias ?? 0),
      r: (o.rMin ?? 2.2) + Math.random() * ((o.rMax ?? 4.8) - (o.rMin ?? 2.2)),
      life,
      maxLife: life,
      gravity: o.gravity ?? 420,
      color: colors[Math.floor(Math.random() * colors.length)],
      square: Boolean(o.square),
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function layoutUI() {
  const btnS = Math.min(68, Math.max(46, Math.round(44 / view.scale)));
  pauseBtn.w = btnS;
  pauseBtn.h = btnS;
  pauseBtn.x = view.w - btnS - 14;
  pauseBtn.y = 14;

  const modalW = Math.min(270, Math.max(180, view.w - 60));
  const btnH = Math.min(72, Math.max(52, Math.round(44 / view.scale)));
  const centerY = view.h * 0.52;
  resumeBtn.w = modalW;
  resumeBtn.h = btnH;
  resumeBtn.x = (view.w - modalW) / 2;
  resumeBtn.y = centerY - 12;

  quitBtn.w = modalW;
  quitBtn.h = btnH;
  quitBtn.x = (view.w - modalW) / 2;
  quitBtn.y = resumeBtn.y + btnH + 18;
}

function readViewportSize() {
  const vv = window.visualViewport;
  const rawW = (vv && vv.width) ? vv.width : window.innerWidth;
  const rawH = (vv && vv.height) ? vv.height : window.innerHeight;
  return {
    cssW: Math.max(1, Math.round(rawW)),
    cssH: Math.max(1, Math.round(rawH)),
  };
}

function fitCanvas() {
  const { cssW, cssH } = readViewportSize();
  view.cssW = cssW;
  view.cssH = cssH;
  view.dpr = Math.min(window.devicePixelRatio || 1, 3);
  view.aspect = cssW / cssH;
  view.isPortrait = cssH > cssW;
  view.scale = Math.min(cssW / REF_W, cssH / REF_H);
  view.w = cssW / view.scale;
  view.h = cssH / view.scale;

  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  canvas.width = Math.round(cssW * view.dpr);
  canvas.height = Math.round(cssH * view.dpr);

  const t = Math.max(0, Math.min(1, (view.aspect - 0.65) / 0.65));
  view.playerScreenX = 0.23 + t * 0.05;
  const groundFrac = view.isPortrait ? 0.71 : 0.76;
  view.groundScreenY = view.h * groundFrac;
  view.camY = GROUND_Y - view.groundScreenY;

  layoutUI();

  // Keep camera and terrain synchronized if resized or rotated mid-game
  if (world) {
    camX = player.x - view.w * view.playerScreenX;
    updateChunks(camX);
  }
}

window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', () => {
  fitCanvas();
  setTimeout(fitCanvas, 120);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', fitCanvas);
}
fitCanvas();

function speedForDist(meters) {
  return Math.min(BASE_SPEED + meters * 0.55, MAX_SPEED);
}

// ---------------------------------------------------------------------------
// World data & procedural chunk generation
// ---------------------------------------------------------------------------
function newWorld() {
  world = {
    seed: Math.floor(Math.random() * 1e9),
    chunks: [],
    nextX: -CHUNK_W * 3,
    chunksSincePowerup: 1,
  };
  // Opening safe flat chunks spanning left of START_X for ultra-wide viewports
  for (let i = 0; i < 5; i++) addChunk(true);
}

// Deterministic hash in [0, 1)
function hash(n) {
  const s = Math.sin(n * 127.1 + (world ? world.seed : 12345) * 0.017) * 43758.5453;
  return s - Math.floor(s);
}

function hashStatic(n, seedOffset) {
  const s = Math.sin(n * 127.1 + (seedOffset || 17.3) * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function difficulty() {
  const m = Math.max(0, (player.x - START_X) / PX_PER_M);
  return Math.min(m / 300, 1);
}

function subtractInterval(intervals, cutA, cutB) {
  const next = [];
  for (const [a, b] of intervals) {
    if (cutB <= a || cutA >= b) {
      next.push([a, b]);
    } else {
      if (cutA > a) next.push([a, cutA]);
      if (cutB < b) next.push([cutB, b]);
    }
  }
  return next;
}

function buildChunk(x, d, safe, allowPowerup = true) {
  const solids = [];
  const platforms = [];
  const spikes = [];
  const bugs = [];
  const powerups = [];

  if (safe) {
    solids.push({ x, y: GROUND_Y, w: CHUNK_W, h: GROUND_SOLID_H, oneWay: false });
    return { x, w: CHUNK_W, solids, platforms, spikes, bugs, powerups };
  }

  const maxGap = 95 + 55 * d;
  const minGap = 90;
  const wantGap = Math.random() < 0.45 + 0.15 * d;
  let gapX = -1;
  let gapW = 0;

  if (wantGap) {
    gapX = 115 + Math.random() * (CHUNK_W - 335); // [115, 240]
    gapW = minGap + Math.random() * (maxGap - minGap);
  }

  if (gapX >= 0) {
    solids.push({ x, y: GROUND_Y, w: gapX, h: GROUND_SOLID_H, oneWay: false, cliffLeft: false, cliffRight: true });
    solids.push({ x: x + gapX + gapW, y: GROUND_Y, w: CHUNK_W - gapX - gapW, h: GROUND_SOLID_H, oneWay: false, cliffLeft: true, cliffRight: false });
  } else {
    solids.push({ x, y: GROUND_Y, w: CHUNK_W, h: GROUND_SOLID_H, oneWay: false, cliffLeft: false, cliffRight: false });
  }

  // Flat no-hazard zones: edges of chunk, gap lips, and generous landing apron
  const noZone = [[0, 60]];
  if (gapX >= 0) {
    noZone.push([gapX - 55, gapX + gapW + 95]);
  }
  noZone.push([CHUNK_W - 45, CHUNK_W]);

  function inZones(zones, px, pw) {
    for (const [a, b] of zones) {
      if (px < b && px + pw > a) return true;
    }
    return false;
  }

  function spikesTooClose(candX, candW, minDist) {
    for (const sp of spikes) {
      if (candX < sp.x + sp.w + minDist && candX + candW > sp.x - minDist) return true;
    }
    return false;
  }

  // Floating rocky one-way platform — strictly bounded to guaranteed reachable heights
  const platChance = 0.55;
  if (Math.random() < platChance) {
    const hAbove = MIN_PLAT_HEIGHT + Math.floor(Math.random() * 4) * 10; // 66, 76, 86, 96
    const py = GROUND_Y - hAbove;
    const v = speedForDist(Math.max(0, (x - START_X) / PX_PER_M));
    const distToApex = v * TIME_TO_APEX;

    let pw = 96 + Math.random() * 48;
    let px = 0;

    const rightStart = gapX >= 0 ? gapX + gapW + 95 : 105;
    const canPlaceAfterGap = gapX >= 0 && (CHUNK_W - 55 - pw >= rightStart);
    const bridgeGap = gapX >= 0 && (!canPlaceAfterGap || Math.random() < 0.7);

    if (bridgeGap) {
      const idealCenter = gapX + Math.min(gapW * 0.48, distToApex * 0.62);
      px = idealCenter - pw * 0.35 + (Math.random() * 24 - 12);
      const minReachableX = Math.max(55, gapX - 24);
      const maxReachableX = Math.min(CHUNK_W - pw - 55, gapX + Math.min(gapW * 0.5, distToApex * 0.65));
      px = Math.max(minReachableX, Math.min(px, Math.max(minReachableX, maxReachableX)));
      if (px + pw < gapX + 50) {
        pw = Math.min(144, CHUNK_W - px - 55);
      }
    } else if (gapX >= 0 && canPlaceAfterGap) {
      px = rightStart + Math.random() * Math.max(0, CHUNK_W - 55 - pw - rightStart);
    } else {
      pw = 96 + Math.random() * 64;
      px = 105 + Math.random() * Math.max(0, CHUNK_W - pw - 165);
    }

    platforms.push({
      x: x + px,
      y: py,
      w: pw,
      h: PLAT_H,
      oneWay: true,
      seed: Math.floor(Math.random() * 100000),
    });
  }

  // Keep takeoff zone ahead of each platform free of ground spikes
  const spikeNoZone = noZone.slice();
  for (const p of platforms) {
    const pLocal = p.x - x;
    spikeNoZone.push([pLocal - 95, pLocal - 12]);
  }

  // Spike clusters
  const spikeClusters = 1 + Math.floor(Math.random() * (1 + d * 2));
  for (let i = 0; i < spikeClusters; i++) {
    const count = 1 + Math.floor(Math.random() * (1 + d * 2)); // 1..3
    const sw = count * 18;
    const px = 80 + Math.random() * (CHUNK_W - sw - 130);
    if (inZones(spikeNoZone, px, sw)) continue;
    if (spikesTooClose(x + px, sw, 70)) continue;
    spikes.push({ x: x + px, y: GROUND_Y - 30, w: sw, h: 30, seed: Math.random() * 100 });
  }

  // Spike bug patrolling strictly along a spike-free span of a single solid segment
  const bugChance = 0.28 + 0.44 * d;
  if (Math.random() < bugChance) {
    const bugW = 36;
    const bugH = 30;
    let bestInterval = null;
    let bestLen = 0;

    for (const seg of solids) {
      if (seg.w < 170) continue;
      let intervals = [[seg.x + 28, seg.x + seg.w - 28]];
      for (const sp of spikes) {
        intervals = subtractInterval(intervals, sp.x - 28, sp.x + sp.w + 28);
      }
      for (const iv of intervals) {
        const len = iv[1] - iv[0];
        if (len > bestLen) {
          bestLen = len;
          bestInterval = iv;
        }
      }
    }

    if (bestInterval && bestLen >= 105) {
      const [L, R] = bestInterval;
      const span = Math.min(bestLen, 110 + Math.random() * 80);
      const minX = L + Math.random() * (bestLen - span);
      const maxX = minX + span - bugW;
      const bugSpeed = 75 + 75 * d + Math.random() * 30;
      bugs.push({
        x: minX + (maxX - minX) * Math.random(),
        y: GROUND_Y - bugH,
        w: bugW,
        h: bugH,
        minX,
        maxX,
        speed: bugSpeed,
        dir: Math.random() < 0.5 ? -1 : 1,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Rare speed powerups (Espresso Cup or Chamomile Flower) placed clear of spikes
  if (allowPowerup && Math.random() < POWERUP_CHANCE) {
    const type = Math.random() < 0.5 ? POWERUP_TYPE.ESPRESSO : POWERUP_TYPE.CHAMOMILE;
    let itemX = null;
    let itemY = null;

    if (platforms.length > 0 && Math.random() < 0.40) {
      const plat = platforms[0];
      itemX = plat.x + plat.w * 0.5 - POWERUP_SIZE * 0.5;
      itemY = plat.y - POWERUP_SIZE - 12;
    } else {
      const spikeFree = [];
      for (const seg of solids) {
        if (seg.w < POWERUP_SIZE + 84) continue;
        let intervals = [[seg.x + 38, seg.x + seg.w - 38]];
        for (const sp of spikes) {
          intervals = subtractInterval(intervals, sp.x - 36, sp.x + sp.w + 36);
        }
        for (const iv of intervals) {
          if (iv[1] - iv[0] >= POWERUP_SIZE + 8) spikeFree.push(iv);
        }
      }

      const bugAndSpikeFree = [];
      for (const iv of spikeFree) {
        let safeIvs = [iv];
        for (const b of bugs) {
          safeIvs = subtractInterval(safeIvs, b.minX - 18, b.maxX + b.w + 18);
        }
        for (const siv of safeIvs) {
          if (siv[1] - siv[0] >= POWERUP_SIZE + 8) bugAndSpikeFree.push(siv);
        }
      }

      const candidates = bugAndSpikeFree.length > 0 ? bugAndSpikeFree : spikeFree;
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const minX = chosen[0];
        const maxX = chosen[1] - POWERUP_SIZE;
        itemX = minX + Math.random() * Math.max(0, maxX - minX);
        itemY = GROUND_Y - POWERUP_SIZE - 12;
      }
    }

    if (itemX !== null && itemY !== null) {
      powerups.push({
        type,
        x: itemX,
        y: itemY,
        w: POWERUP_SIZE,
        h: POWERUP_SIZE,
        collected: false,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  return { x, w: CHUNK_W, solids, platforms, spikes, bugs, powerups };
}

function addChunk(safe) {
  const d = difficulty();
  const allowPowerup = !safe && world.chunksSincePowerup >= POWERUP_MIN_CHUNK_GAP;
  const chunk = buildChunk(world.nextX, d, safe, allowPowerup);
  if (!safe) {
    world.chunksSincePowerup = chunk.powerups.length > 0 ? 0 : world.chunksSincePowerup + 1;
  }
  world.nextX = chunk.x + chunk.w;
  world.chunks.push(chunk);
}

function updateChunks(cx) {
  while (world.nextX < cx + view.w + CHUNK_W * 2) addChunk(false);
  world.chunks = world.chunks.filter(c => c.x + c.w > cx - CHUNK_W);
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
function updateCamera() {
  const target = player.x - view.w * view.playerScreenX;
  camX += (target - camX) * 0.25;
  if (camX < target) camX = target;
}

// ---------------------------------------------------------------------------
// Audio (WebAudio, no libraries)
// ---------------------------------------------------------------------------
let audioCtx = null;
function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { audioCtx = null; }
}
function beep(freq, dur, type, vol, slide, delay) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime + (delay || 0);
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (e) { /* ignore */ }
}
const sfx = {
  jump()  { beep(300, 0.14, 'square', 0.10, 220); },
  land()  { beep(160, 0.07, 'triangle', 0.10, -60); },
  tick()  { beep(520, 0.08, 'square', 0.09); },
  go()    { beep(760, 0.18, 'square', 0.10, 200); },
  die()   { beep(300, 0.5, 'sawtooth', 0.12, -250); },
  start() { beep(440, 0.12, 'triangle', 0.10, 220); },
  espresso() {
    beep(520, 0.08, 'square', 0.08, 180, 0);
    beep(700, 0.08, 'square', 0.08, 220, 0.06);
    beep(940, 0.12, 'triangle', 0.10, 260, 0.12);
  },
  chamomile() {
    beep(460, 0.16, 'sine', 0.09, -40, 0);
    beep(370, 0.18, 'sine', 0.08, -35, 0.11);
    beep(295, 0.24, 'sine', 0.08, -25, 0.22);
  },
};

// ---------------------------------------------------------------------------
// Best score (localStorage, guarded)
// ---------------------------------------------------------------------------
let best = 0;
try { best = parseInt(localStorage.getItem('bounceMallowBest') || '0', 10) || 0; } catch (e) { best = 0; }
function saveBest(v) {
  if (v > best) {
    best = v;
    try { localStorage.setItem('bounceMallowBest', String(best)); } catch (e) { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Game flow
// ---------------------------------------------------------------------------
let lastCount = 4;

function resetPlayerPowerup() {
  player.powerup = null;
  player.powerupTimer = 0;
  player.powerupDuration = POWERUP_DURATION;
  player.powerupAnimT = 0;
  player.powerupBurstT = 0;
  player.speedMult = 1;
  player.fxTimer = 0;
  playerTrail.length = 0;
  trailSampleTimer = 0;
}

function applyPowerup(type, cx, cy) {
  player.powerup = type;
  player.powerupTimer = POWERUP_DURATION;
  player.powerupDuration = POWERUP_DURATION;
  player.powerupBurstT = 0.65;
  player.fxTimer = 0;

  if (type === POWERUP_TYPE.ESPRESSO) {
    player.speedMult = POWERUP_ESPRESSO_MULT;
    player.squash = 1.28;
    player.squashVel = 0;
    player.blinkDur = 0;
    spawnParticles(cx, cy, 18, {
      colors: [PAL.espressoGlow, PAL.espressoSpark, PAL.espressoBand, PAL.white],
      angleMin: -Math.PI,
      angleMax: Math.PI,
      speedMin: 70,
      speedMax: 210,
      rMin: 2.2,
      rMax: 4.5,
      lifeMin: 0.25,
      lifeMax: 0.50,
      gravity: 160,
      square: true,
    });
    spawnPopup(cx, cy - 12, 'ESPRESSO! 2x', PAL.espressoGlow);
    sfx.espresso();
  } else {
    player.speedMult = POWERUP_CHAMOMILE_MULT;
    player.squash = 0.78;
    player.squashVel = 0;
    playerTrail.length = 0;
    spawnParticles(cx, cy, 16, {
      colors: [PAL.chamomileGlow, PAL.chamomilePetal, PAL.chamomileCore, PAL.white],
      angleMin: -Math.PI,
      angleMax: Math.PI,
      speedMin: 25,
      speedMax: 95,
      rMin: 2.2,
      rMax: 4.2,
      lifeMin: 0.40,
      lifeMax: 0.80,
      gravity: -35,
    });
    spawnPopup(cx, cy - 12, 'CHAMOMILE! \u00BDx', PAL.chamomileGlow);
    sfx.chamomile();
  }

  const m = Math.max(0, (player.x - START_X) / PX_PER_M);
  player.vx = speedForDist(m) * player.speedMult;
}

function toTitle() {
  state = STATE.TITLE;
  stateTime = 0;
  particles.length = 0;
  popups.length = 0;
  resetPlayerPowerup();
}

function startGame() {
  newWorld();
  particles.length = 0;
  popups.length = 0;
  resetPlayerPowerup();
  player.x = START_X;
  player.y = GROUND_Y - PLAYER_SIZE;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  player.coyote = 0;
  player.jumpBuf = 0;
  player.squash = 1;
  player.squashVel = 0;
  player.tilt = 0;
  player.runPhase = 0;
  player.blinkTimer = 2.2;
  player.blinkDur = 0;
  player.dustTimer = 0;
  player.deathCause = '';
  player.deathT = 0;
  player.dead = false;

  camX = player.x - view.w * view.playerScreenX;
  updateChunks(camX);

  lastCount = 4;
  state = STATE.COUNTDOWN;
  stateTime = 0;
  sfx.start();
}

function onGameOver() {
  if (player.dead) return;
  player.dead = true;
  player.deathT = 0;
  player.squash = 0.78;
  playerTrail.length = 0;
  state = STATE.GAMEOVER;
  stateTime = 0;
  spawnParticles(player.x + PLAYER_SIZE * 0.5, player.y + PLAYER_SIZE * 0.5, 16, {
    colors: [PAL.white, PAL.mallowBlush, PAL.yellow],
    angleMin: -Math.PI,
    angleMax: Math.PI,
    speedMin: 60,
    speedMax: 210,
    rMin: 2.5,
    rMax: 5.5,
    lifeMin: 0.35,
    lifeMax: 0.65,
  });
  const score = scoreNow();
  saveBest(score);
  sfx.die();
}

function scoreNow() {
  return Math.max(0, Math.floor((player.x - START_X) / PX_PER_M));
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
function pointIn(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function handleAction() {
  switch (state) {
    case STATE.TITLE:
      initAudio();
      startGame();
      break;
    case STATE.COUNTDOWN:
      break;
    case STATE.PLAYING:
      initAudio();
      player.jumpBuf = JUMP_BUFFER;
      break;
    case STATE.PAUSED:
      state = prevState;
      break;
    case STATE.GAMEOVER:
      if (stateTime > 0.6) startGame();
      break;
  }
}

function handleQuit() {
  toTitle();
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const k = e.key;
  if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
    e.preventDefault();
    handleAction();
  } else if (k === 'Escape') {
    e.preventDefault();
    if (state === STATE.PLAYING || state === STATE.COUNTDOWN) {
      prevState = state;
      state = STATE.PAUSED;
      stateTime = 0;
    } else if (state === STATE.PAUSED) {
      state = prevState;
    }
  } else if (k === 'q' || k === 'Q') {
    if (state === STATE.PAUSED) handleQuit();
  }
});

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width * view.w;
  const py = (e.clientY - rect.top) / rect.height * view.h;

  if (state === STATE.PLAYING || state === STATE.COUNTDOWN) {
    if (pointIn(px, py, pauseBtn)) {
      prevState = state;
      state = STATE.PAUSED;
      stateTime = 0;
      return;
    }
    handleAction();
    return;
  }
  if (state === STATE.PAUSED) {
    if (pointIn(px, py, resumeBtn)) { state = prevState; return; }
    if (pointIn(px, py, quitBtn)) { handleQuit(); return; }
    return;
  }
  handleAction();
}, { passive: false });

document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

// ---------------------------------------------------------------------------
// Physics update
// ---------------------------------------------------------------------------
function allSolids() {
  const out = [];
  for (const c of world.chunks) {
    for (const s of c.solids) out.push(s);
    for (const p of c.platforms) out.push(p);
  }
  return out;
}

function updatePlayerBlink(dt) {
  if (player.blinkDur > 0) {
    player.blinkDur -= dt;
  } else {
    player.blinkTimer -= dt;
    if (player.blinkTimer <= 0) {
      player.blinkDur = 0.11;
      player.blinkTimer = 2.2 + Math.random() * 2.4;
    }
  }
}

function land(isRock) {
  if (!player.grounded && player.vy > 220) {
    player.squash = 0.76;
    player.squashVel = 0;
    spawnParticles(player.x + PLAYER_SIZE * 0.5, player.y + PLAYER_SIZE, 6, {
      colors: isRock ? [PAL.rockTop, PAL.rockLit, PAL.white] : [PAL.turfLit, PAL.white, PAL.soilTop],
      angleMin: -Math.PI * 0.9,
      angleMax: -Math.PI * 0.1,
      speedMin: 40,
      speedMax: 115,
      rMin: 2,
      rMax: 4,
      lifeMin: 0.18,
      lifeMax: 0.34,
      square: isRock,
    });
    sfx.land();
  }
  player.grounded = true;
  player.vy = 0;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function physicsStep(dt) {
  if (player.powerup !== null) {
    player.powerupTimer -= dt;
    player.powerupAnimT += dt;
    player.powerupBurstT = Math.max(0, player.powerupBurstT - dt);
    if (player.powerupTimer <= 0) {
      resetPlayerPowerup();
    }
  }

  const m = (player.x - START_X) / PX_PER_M;
  player.vx = speedForDist(m) * player.speedMult;
  player.x += player.vx * dt;

  // Jump (coyote + buffer)
  player.coyote = player.grounded ? COYOTE : Math.max(0, player.coyote - dt);
  player.jumpBuf = Math.max(0, player.jumpBuf - dt);
  if (player.jumpBuf > 0 && (player.grounded || player.coyote > 0)) {
    player.vy = JUMP_VEL;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuf = 0;
    player.squash = 1.24;
    player.squashVel = 0;
    spawnParticles(player.x + PLAYER_SIZE * 0.5, player.y + PLAYER_SIZE, 7, {
      colors: [PAL.white, PAL.cloudShade],
      angleMin: -Math.PI * 0.85,
      angleMax: -Math.PI * 0.15,
      speedMin: 35,
      speedMax: 105,
      rMin: 2.5,
      rMax: 4.8,
      lifeMin: 0.2,
      lifeMax: 0.38,
      vxBias: -player.vx * 0.15,
    });
    sfx.jump();
  }

  player.vy += GRAVITY * dt;
  if (player.vy > 900) player.vy = 900;

  const prevBottom = player.y + PLAYER_SIZE;
  player.y += player.vy * dt;

  // Ground / rocky platform collision
  player.grounded = false;
  const solids = allSolids();
  for (const s of solids) {
    const withinX = player.x + PLAYER_SIZE - 4 > s.x && player.x + 4 < s.x + s.w;
    if (!withinX) continue;
    if (player.y + PLAYER_SIZE > s.y && player.y < s.y + s.h) {
      if (s.oneWay) {
        if (player.vy >= 0 && prevBottom <= s.y + Math.max(8, player.vy * dt + 4)) {
          player.y = s.y - PLAYER_SIZE;
          land(true);
        }
      } else {
        if (player.vy >= 0 && prevBottom <= s.y + Math.max(10, player.vy * dt + 2)) {
          player.y = s.y - PLAYER_SIZE;
          land(false);
        } else if (player.y > s.y + 16) {
          player.deathCause = 'wall';
          onGameOver();
          return;
        } else {
          player.y = s.y - PLAYER_SIZE;
          land(false);
        }
      }
    }
  }

  // Spring-damped squash/stretch & tilt animation
  const squashTarget = player.powerup === POWERUP_TYPE.CHAMOMILE ? 0.94 : 1;
  const springForce = (squashTarget - player.squash) * 140;
  player.squashVel = (player.squashVel + springForce * dt) * Math.exp(-12 * dt);
  player.squash += player.squashVel * dt;
  player.squash = Math.max(0.70, Math.min(1.30, player.squash));

  const baseTilt = player.grounded
    ? 0.06
    : Math.max(-0.18, Math.min(0.20, player.vy * 0.00028));
  const targetTilt = player.powerup === POWERUP_TYPE.ESPRESSO
    ? baseTilt + 0.06
    : player.powerup === POWERUP_TYPE.CHAMOMILE
      ? baseTilt * 0.45
      : baseTilt;
  player.tilt += (targetTilt - player.tilt) * Math.min(1, dt * 14);

  if (player.grounded) {
    const speedRate = Math.max(4.5, 11 + (player.vx - BASE_SPEED) * 0.03);
    const phaseMult = player.powerup === POWERUP_TYPE.ESPRESSO ? 1.25
      : player.powerup === POWERUP_TYPE.CHAMOMILE ? 0.65 : 1;
    player.runPhase += dt * speedRate * phaseMult;
    player.dustTimer -= dt;
    if (player.dustTimer <= 0) {
      player.dustTimer = player.powerup === POWERUP_TYPE.ESPRESSO ? 0.09
        : player.powerup === POWERUP_TYPE.CHAMOMILE ? 0.22 : 0.14;
      spawnParticles(player.x + 6, player.y + PLAYER_SIZE - 1, 1, {
        colors: [PAL.turfLit, PAL.white],
        angleMin: -Math.PI * 0.92,
        angleMax: -Math.PI * 0.55,
        speedMin: 25,
        speedMax: 60,
        rMin: 1.8,
        rMax: 3.2,
        lifeMin: 0.18,
        lifeMax: 0.30,
        gravity: 160,
      });
    }
  }

  // Powerup ambient particles & espresso afterimage trail
  if (player.powerup === POWERUP_TYPE.ESPRESSO) {
    trailSampleTimer -= dt;
    if (trailSampleTimer <= 0) {
      trailSampleTimer = 0.028;
      playerTrail.push({
        x: player.x,
        y: player.y,
        squash: player.squash,
        tilt: player.tilt,
        runPhase: player.runPhase,
        grounded: player.grounded,
      });
      if (playerTrail.length > 4) playerTrail.shift();
    }
    player.fxTimer -= dt;
    if (player.fxTimer <= 0) {
      player.fxTimer = 0.065;
      spawnParticles(player.x + PLAYER_SIZE * 0.25, player.y + PLAYER_SIZE * 0.5, 1, {
        colors: [PAL.espressoGlow, PAL.espressoSpark, PAL.white],
        angleMin: Math.PI * 0.65,
        angleMax: Math.PI * 1.35,
        speedMin: 40,
        speedMax: 110,
        rMin: 1.8,
        rMax: 3.4,
        lifeMin: 0.14,
        lifeMax: 0.26,
        gravity: 40,
        square: true,
      });
    }
  } else if (player.powerup === POWERUP_TYPE.CHAMOMILE) {
    player.fxTimer -= dt;
    if (player.fxTimer <= 0) {
      player.fxTimer = 0.16;
      spawnParticles(player.x + PLAYER_SIZE * 0.5, player.y + 4, 1, {
        colors: [PAL.chamomileGlow, PAL.chamomilePetal, PAL.chamomileCore],
        angleMin: -Math.PI * 0.8,
        angleMax: -Math.PI * 0.2,
        speedMin: 14,
        speedMax: 34,
        rMin: 2.0,
        rMax: 3.6,
        lifeMin: 0.45,
        lifeMax: 0.75,
        gravity: -35,
        spreadX: 20,
      });
    }
  }

  // Off-screen fall
  if (player.y > FALL_DEATH_Y) {
    player.deathCause = 'fall';
    onGameOver();
    return;
  }

  // Spikes + spike bugs
  const hb = { x: player.x + 6, y: player.y + 6, w: PLAYER_SIZE - 12, h: PLAYER_SIZE - 12 };
  for (const c of world.chunks) {
    for (const sp of c.spikes) {
      const sb = { x: sp.x + 5, y: sp.y + 9, w: sp.w - 10, h: sp.h - 9 };
      if (overlap(hb, sb)) {
        player.deathCause = 'spike';
        onGameOver();
        return;
      }
    }
    for (const b of c.bugs) {
      const bb = { x: b.x + 5, y: b.y + 7, w: b.w - 10, h: b.h - 7 };
      if (overlap(hb, bb)) {
        player.deathCause = 'bug';
        onGameOver();
        return;
      }
    }
  }

  // Powerups (generous pickup hitbox; checked after hazards so dead players cannot collect)
  const pb = { x: player.x + 2, y: player.y + 2, w: PLAYER_SIZE - 4, h: PLAYER_SIZE - 4 };
  for (const c of world.chunks) {
    for (const item of c.powerups) {
      if (item.collected) continue;
      const ib = { x: item.x - 4, y: item.y - 4, w: item.w + 8, h: item.h + 8 };
      if (overlap(pb, ib)) {
        item.collected = true;
        applyPowerup(item.type, item.x + item.w * 0.5, item.y + item.h * 0.5);
      }
    }
  }
}

function updateBugs(dt) {
  for (const c of world.chunks) {
    for (const b of c.bugs) {
      b.x += b.dir * b.speed * dt;
      if (b.x < b.minX) { b.x = b.minX; b.dir = 1; }
      else if (b.x > b.maxX) { b.x = b.maxX; b.dir = -1; }
      b.phase += dt * 13;
    }
  }
}

function update(dt) {
  stateTime += dt;
  animTime += dt;
  updatePlayerBlink(dt);
  updateParticles(dt);

  switch (state) {
    case STATE.TITLE:
      titleCamX += 28 * dt;
      break;

    case STATE.COUNTDOWN: {
      const n = 3 - Math.floor(stateTime);
      if (n !== lastCount && n > 0) { lastCount = n; sfx.tick(); }
      if (stateTime >= 3) {
        state = STATE.PLAYING;
        stateTime = 0;
        sfx.go();
      }
      break;
    }

    case STATE.PLAYING: {
      const steps = 4;
      const sdt = dt / steps;
      for (let i = 0; i < steps && state === STATE.PLAYING; i++) physicsStep(sdt);
      if (state !== STATE.PLAYING) break;
      updateCamera();
      updateChunks(camX);
      updateBugs(dt);
      updatePopups(dt);
      break;
    }

    case STATE.PAUSED:
      break;

    case STATE.GAMEOVER:
      player.deathT += dt;
      player.squash += (0.88 - player.squash) * Math.min(1, dt * 8);
      updatePopups(dt);
      break;
  }
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------
function rr(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky() {
  const groundSY = view.groundScreenY;
  const grad = ctx.createLinearGradient(0, 0, 0, Math.max(200, groundSY + 40));
  grad.addColorStop(0, PAL.skyTop);
  grad.addColorStop(0.58, PAL.skyMid);
  grad.addColorStop(1, PAL.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, view.w, view.h);

  // Sun with warm halos & rotating soft rays
  const sunX = view.w * 0.80;
  const sunY = Math.max(66, Math.min(130, groundSY * 0.23));
  const pulse = 1 + Math.sin(animTime * 1.6) * 0.04;

  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.fillStyle = PAL.sunOuter;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.arc(0, 0, 56 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Subtle sunburst rays
  ctx.rotate(animTime * 0.08);
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(-5, -34);
    ctx.lineTo(0, -64 * pulse);
    ctx.lineTo(5, -34);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = PAL.sunOuter;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAL.sunInner;
  ctx.beginPath();
  ctx.arc(sunX - 3, sunY - 3, 27, 0, Math.PI * 2);
  ctx.fill();
}

function drawBirds(scrollX) {
  const groundSY = view.groundScreenY;
  const off = scrollX * 0.22 + animTime * 22;
  const step = 360;
  const first = Math.floor(off / step) - 1;
  const last = first + Math.ceil(view.w / step) + 3;

  ctx.strokeStyle = PAL.peakShade;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  for (let i = first; i <= last; i++) {
    const h1 = hashStatic(i, 41.2);
    if (h1 < 0.45) continue;
    const h2 = hashStatic(i, 73.8);
    const bx = i * step + h1 * 180 - off;
    const by = Math.max(48, groundSY * (0.16 + h2 * 0.20));
    const flap = Math.sin(animTime * 5.2 + i * 2.1) * 3.5;

    ctx.beginPath();
    ctx.moveTo(bx - 8, by + flap);
    ctx.quadraticCurveTo(bx - 4, by - 4, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 4, bx + 8, by + flap);
    ctx.stroke();
  }
}

function drawCloudLayer(scrollX, parallax, driftSpeed, step, baseFrac, scaleRange, shadeColor, litColor, alpha) {
  const groundSY = view.groundScreenY;
  const off = scrollX * parallax + animTime * driftSpeed;
  const first = Math.floor(off / step) - 1;
  const last = first + Math.ceil(view.w / step) + 3;

  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = first; i <= last; i++) {
    const h1 = hashStatic(i, 12.4 + parallax * 10);
    const h2 = hashStatic(i, 89.7 + parallax * 10);
    const cx = i * step + h1 * (step * 0.6) - off;
    const cy = Math.max(44, groundSY * (baseFrac + h2 * 0.24));
    const s = scaleRange[0] + h1 * (scaleRange[1] - scaleRange[0]);

    // Shaded cloud underbelly
    ctx.fillStyle = shadeColor;
    ctx.beginPath();
    ctx.arc(cx, cy + 4 * s, 16 * s, 0, Math.PI * 2);
    ctx.arc(cx + 22 * s, cy + 2 * s, 20 * s, 0, Math.PI * 2);
    ctx.arc(cx + 46 * s, cy + 4 * s, 15 * s, 0, Math.PI * 2);
    ctx.fill();

    // Sunlit puffy cloud top
    ctx.fillStyle = litColor;
    ctx.beginPath();
    ctx.arc(cx - 2 * s, cy, 15 * s, 0, Math.PI * 2);
    ctx.arc(cx + 18 * s, cy - 10 * s, 19 * s, 0, Math.PI * 2);
    ctx.arc(cx + 38 * s, cy - 4 * s, 16 * s, 0, Math.PI * 2);
    ctx.arc(cx + 50 * s, cy + 2 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMountains(scrollX) {
  const groundSY = view.groundScreenY;
  const skyScale = Math.min(1.15, Math.max(0.65, groundSY / 440));
  const off = scrollX * 0.07;
  const step = 240;
  const first = Math.floor(off / step) - 1;
  const last = first + Math.ceil(view.w / step) + 3;
  const baseY = groundSY + 8;

  for (let i = first; i <= last; i++) {
    const h1 = hashStatic(i, 5.1);
    const h2 = hashStatic(i, 19.8);
    const leftX = i * step - off - 25;
    const w = step * (0.95 + h2 * 0.45);
    const peakH = (135 + h1 * 105) * skyScale;
    const peakX = leftX + w * (0.42 + (h2 - 0.5) * 0.16);
    const peakY = baseY - peakH;
    const rightX = leftX + w;
    const ridgeMidY = baseY - peakH * 0.35;

    // Shaded right face
    ctx.fillStyle = PAL.peakShade;
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(rightX, baseY);
    ctx.lineTo(peakX - w * 0.04, baseY);
    ctx.closePath();
    ctx.fill();

    // Sunlit left face
    ctx.fillStyle = PAL.peakLit;
    ctx.beginPath();
    ctx.moveTo(leftX, baseY);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(peakX + w * 0.04, ridgeMidY);
    ctx.lineTo(peakX - w * 0.06, baseY);
    ctx.closePath();
    ctx.fill();

    // Snow cap (jagged sunlit + shaded slopes)
    const snowFrac = 0.34 + h2 * 0.08;
    const sLeftX = peakX - (peakX - leftX) * snowFrac;
    const sLeftY = peakY + peakH * snowFrac;
    const sRightX = peakX + (rightX - peakX) * snowFrac;
    const sRightY = peakY + peakH * snowFrac;
    const sMidX = peakX + w * 0.015;
    const sMidY = peakY + peakH * (snowFrac + 0.06);

    ctx.fillStyle = PAL.snowLit;
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(sLeftX, sLeftY);
    ctx.lineTo(peakX - w * 0.04, sLeftY - 8);
    ctx.lineTo(sMidX, sMidY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = PAL.snowShade;
    ctx.beginPath();
    ctx.moveTo(peakX, peakY);
    ctx.lineTo(sMidX, sMidY);
    ctx.lineTo(peakX + w * 0.06, sRightY - 7);
    ctx.lineTo(sRightX, sRightY);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPineTree(cx, baseY, h, w, variant) {
  const trunkW = Math.max(3, w * 0.18);
  const trunkH = h * 0.22;
  ctx.fillStyle = PAL.trunk;
  ctx.fillRect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH + 4);

  const layers = 3;
  for (let L = 0; L < layers; L++) {
    const t0 = L / layers;
    const layerTop = baseY - trunkH - h * (0.28 + t0 * 0.56);
    const layerBot = baseY - trunkH - h * (t0 * 0.44);
    const halfW = (w * 0.52) * (1 - t0 * 0.34);

    // Dark side
    ctx.fillStyle = variant > 0.5 ? PAL.pineMid : PAL.pineDark;
    ctx.beginPath();
    ctx.moveTo(cx, layerTop);
    ctx.lineTo(cx + halfW, layerBot);
    ctx.lineTo(cx - halfW, layerBot);
    ctx.closePath();
    ctx.fill();

    // Sunlit left bough half
    ctx.fillStyle = variant > 0.5 ? PAL.pineLit : PAL.pineMid;
    ctx.beginPath();
    ctx.moveTo(cx, layerTop);
    ctx.lineTo(cx - halfW, layerBot);
    ctx.lineTo(cx + 1, layerBot);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEvergreenRidges(scrollX) {
  const groundSY = view.groundScreenY;
  const skyScale = Math.min(1.15, Math.max(0.65, groundSY / 440));

  // Far pine ridge (parallax 0.18)
  const offFar = scrollX * 0.18;
  const stepFar = 170;
  const fStart = Math.floor(offFar / stepFar) - 1;
  const fEnd = fStart + Math.ceil(view.w / stepFar) + 3;
  const farBase = groundSY + 4;

  ctx.fillStyle = PAL.ridgeFar;
  ctx.beginPath();
  ctx.moveTo(0, farBase + 10);
  for (let i = fStart; i <= fEnd; i++) {
    const h1 = hashStatic(i, 31.4);
    const rx = i * stepFar - offFar;
    const ry = farBase - (54 + h1 * 48) * skyScale;
    const nx = (i + 1) * stepFar - offFar;
    const ny = farBase - (54 + hashStatic(i + 1, 31.4) * 48) * skyScale;
    ctx.quadraticCurveTo(rx + stepFar * 0.5, Math.min(ry, ny) - 18 * skyScale, nx, ny);
  }
  ctx.lineTo(view.w + stepFar, farBase + 10);
  ctx.closePath();
  ctx.fill();

  // Silhouette distant spruce spires along far ridge
  ctx.fillStyle = PAL.ridgeFarHi;
  for (let i = fStart; i <= fEnd; i++) {
    const h1 = hashStatic(i, 31.4);
    const rx = i * stepFar - offFar;
    const ry = farBase - (54 + h1 * 48) * skyScale;
    for (let t = 0; t < 3; t++) {
      const th = hashStatic(i * 7 + t, 64.1);
      if (th < 0.35) continue;
      const tx = rx + t * 52 + th * 20;
      const spireH = (16 + th * 18) * skyScale;
      const ty = ry + 12 * skyScale;
      ctx.beginPath();
      ctx.moveTo(tx, ty - spireH);
      ctx.lineTo(tx + 9, ty + 8);
      ctx.lineTo(tx - 9, ty + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Near lush conifer foothills + layered pine trees (parallax 0.34)
  const offNear = scrollX * 0.34;
  const stepNear = 150;
  const nStart = Math.floor(offNear / stepNear) - 1;
  const nEnd = nStart + Math.ceil(view.w / stepNear) + 3;
  const nearBase = groundSY + 6;

  ctx.fillStyle = PAL.ridgeNear;
  ctx.beginPath();
  ctx.moveTo(0, nearBase + 12);
  for (let i = nStart; i <= nEnd; i++) {
    const h1 = hashStatic(i, 52.9);
    const rx = i * stepNear - offNear;
    const ry = nearBase - (24 + h1 * 34) * skyScale;
    const nx = (i + 1) * stepNear - offNear;
    const ny = nearBase - (24 + hashStatic(i + 1, 52.9) * 34) * skyScale;
    ctx.quadraticCurveTo(rx + stepNear * 0.5, Math.min(ry, ny) - 12 * skyScale, nx, ny);
  }
  ctx.lineTo(view.w + stepNear, nearBase + 12);
  ctx.closePath();
  ctx.fill();

  for (let i = nStart; i <= nEnd; i++) {
    const h1 = hashStatic(i, 52.9);
    const rx = i * stepNear - offNear;
    const hillY = nearBase - (22 + h1 * 30) * skyScale;
    for (let t = 0; t < 3; t++) {
      const th = hashStatic(i * 11 + t, 91.3);
      if (th < 0.28) continue;
      const tx = rx + t * 48 + th * 22;
      const treeH = (34 + th * 28) * skyScale;
      const treeW = 20 + th * 12;
      drawPineTree(tx, hillY + 18 * skyScale, treeH, treeW, th);
    }
  }
}

function drawBackdrop(scrollX) {
  drawSky();
  drawBirds(scrollX);
  drawCloudLayer(scrollX, 0.14, 7, 360, 0.12, [0.55, 0.85], PAL.cloudFar, PAL.cloudFar, 0.72);
  drawMountains(scrollX);
  drawCloudLayer(scrollX, 0.28, 12, 310, 0.20, [0.75, 1.15], PAL.cloudShade, PAL.cloudLit, 0.94);
  drawEvergreenRidges(scrollX);
}

function drawGroundSolid(s, drawBottomY) {
  const bottom = Math.max(s.y + s.h, drawBottomY);
  const h = bottom - s.y;
  const drawW = s.cliffRight ? s.w : s.w + 1.2;

  // Topsoil & deep earth strata
  ctx.fillStyle = PAL.soilTop;
  ctx.fillRect(s.x, s.y, drawW, Math.min(48, h));

  if (h > 42) {
    ctx.fillStyle = PAL.soilMid;
    ctx.fillRect(s.x, s.y + 42, drawW, Math.min(70, h - 42));
  }
  if (h > 105) {
    ctx.fillStyle = PAL.soilDeep;
    ctx.fillRect(s.x, s.y + 105, drawW, h - 105);
  }

  // Deterministic buried pebbles & rocky strata flecks
  const firstStep = Math.ceil(s.x / 36) * 36;
  for (let sx = firstStep; sx < s.x + s.w - 10; sx += 36) {
    const h1 = hashStatic(sx, 14.1);
    const h2 = hashStatic(sx, 28.7);
    if (h1 > 0.35) {
      ctx.fillStyle = h2 > 0.5 ? PAL.soilMid : PAL.pebble;
      const py = s.y + 20 + h2 * 70;
      const pw = 6 + Math.floor(h1 * 7);
      const ph = 4 + Math.floor(h2 * 5);
      rr(sx + h1 * 12, py, pw, ph, 2);
      ctx.fill();
    }
    if (h2 > 0.55) {
      ctx.fillStyle = PAL.pebble;
      ctx.fillRect(sx + 10, s.y + 120 + h1 * 55, 5, 4);
    }
  }

  // Cliff edge vertical shading only at real gap walls (no vertical seam between adjacent chunks)
  if (s.cliffLeft || s.cliffRight) {
    ctx.fillStyle = PAL.pebble;
    ctx.globalAlpha = 0.42;
    if (s.cliffLeft) ctx.fillRect(s.x, s.y + 10, 6, h - 10);
    if (s.cliffRight) ctx.fillRect(s.x + s.w - 6, s.y + 10, 6, h - 10);
    ctx.globalAlpha = 1;
  }

  // Lush evergreen turf cap with seamless scalloped overhang across chunks
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y - 10, drawW, 36);
  ctx.clip();

  ctx.fillStyle = PAL.turfDark;
  ctx.fillRect(s.x, s.y + 8, drawW, 8);
  const scallopStart = Math.floor(s.x / 22) * 22;
  for (let gx = scallopStart; gx <= s.x + s.w + 22; gx += 22) {
    const r = 6 + hashStatic(gx, 3.3) * 4;
    ctx.beginPath();
    ctx.arc(gx, s.y + 13, r, 0, Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = PAL.turfMid;
  ctx.fillRect(s.x, s.y + 3, drawW, 8);

  ctx.fillStyle = PAL.turfLit;
  ctx.fillRect(s.x, s.y, drawW, 4);
  ctx.restore();

  // Grass tufts & tiny alpine flowers along surface
  for (let gx = Math.ceil(s.x / 28) * 28; gx < s.x + s.w - 8; gx += 28) {
    const h1 = hashStatic(gx, 9.4);
    if (h1 > 0.3) {
      ctx.fillStyle = PAL.turfLit;
      ctx.beginPath();
      ctx.moveTo(gx, s.y + 1);
      ctx.lineTo(gx + 3, s.y - 5 - h1 * 3);
      ctx.lineTo(gx + 6, s.y + 1);
      ctx.fill();
    }
    if (h1 > 0.80) {
      ctx.fillStyle = h1 > 0.90 ? PAL.flowerGold : PAL.flowerRed;
      ctx.beginPath();
      ctx.arc(gx + 12, s.y - 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRockyPlatform(p) {
  const x = p.x;
  const y = p.y;
  const w = p.w;
  const h = p.h;
  const s0 = hashStatic(p.seed, 1.1);
  const s1 = hashStatic(p.seed, 2.3);
  const s2 = hashStatic(p.seed, 3.7);
  const s3 = hashStatic(p.seed, 5.9);

  // Craggy rocky silhouette vertices
  const pts = [
    [x + 3, y],
    [x + w - 3, y],
    [x + w, y + 4],
    [x + w - 4, y + h - 3],
    [x + w * 0.78, y + h + 6 + s0 * 4],
    [x + w * 0.56, y + h + 1 + s1 * 5],
    [x + w * 0.36, y + h + 7 + s2 * 4],
    [x + w * 0.16, y + h + 2 + s3 * 4],
    [x + 3, y + h - 4],
    [x, y + 4],
  ];

  ctx.save();
  // Drop shadow underneath floating rock
  ctx.fillStyle = PAL.rockOutline;
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const px = pts[i][0];
    const py = pts[i][1] + 5;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Base granite fill
  ctx.fillStyle = PAL.rockMid;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
    else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  // Dark craggy bottom facets
  ctx.fillStyle = PAL.rockDark;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h - 4);
  ctx.lineTo(x + w * 0.24, y + 11);
  ctx.lineTo(x + w * 0.50, y + 13);
  ctx.lineTo(x + w * 0.76, y + 10);
  ctx.lineTo(x + w - 4, y + h - 3);
  ctx.lineTo(x + w * 0.78, y + h + 6 + s0 * 4);
  ctx.lineTo(x + w * 0.56, y + h + 1 + s1 * 5);
  ctx.lineTo(x + w * 0.36, y + h + 7 + s2 * 4);
  ctx.lineTo(x + w * 0.16, y + h + 2 + s3 * 4);
  ctx.closePath();
  ctx.fill();

  // Sunlit flat walkable stone top slab
  ctx.fillStyle = PAL.rockLit;
  ctx.beginPath();
  ctx.moveTo(x + 3, y);
  ctx.lineTo(x + w - 3, y);
  ctx.lineTo(x + w, y + 4);
  ctx.lineTo(x + w - 5, y + 10);
  ctx.lineTo(x + 5, y + 10);
  ctx.lineTo(x, y + 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.rockTop;
  ctx.fillRect(x + 4, y + 1, w - 8, 4);

  // Asymmetric stone fractures & geological flecks
  ctx.strokeStyle = PAL.rockOutline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.24, y + 6);
  ctx.lineTo(x + w * 0.31, y + 13);
  ctx.lineTo(x + w * 0.28, y + h + 1);
  ctx.moveTo(x + w * 0.62, y + 11);
  ctx.lineTo(x + w * 0.69, y + 17);
  ctx.lineTo(x + w * 0.65, y + h + 2);
  ctx.stroke();

  ctx.fillStyle = PAL.rockLit;
  ctx.fillRect(x + w * 0.44, y + 11, 7, 3);
  ctx.fillStyle = PAL.rockDark;
  ctx.fillRect(x + w * 0.14, y + 13, 6, 3);
  ctx.fillRect(x + w * 0.78, y + 12, 7, 3);

  // Crisp outer rock outline
  ctx.strokeStyle = PAL.rockOutline;
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
    else ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.stroke();

  // Small natural corner moss accents (keeps rock silhouette dominant)
  ctx.fillStyle = PAL.mossDark;
  rr(x + 4, y, 14, 5, 2);
  ctx.fill();
  ctx.fillStyle = PAL.mossLit;
  rr(x + 5, y, 10, 3, 1.5);
  ctx.fill();

  ctx.fillStyle = PAL.mossDark;
  rr(x + w - 18, y, 13, 4.5, 2);
  ctx.fill();
  ctx.fillStyle = PAL.mossLit;
  rr(x + w - 16, y, 9, 2.5, 1.5);
  ctx.fill();

  ctx.restore();
}

function drawSpikes(sp) {
  const n = Math.max(1, Math.round(sp.w / 18));
  const baseY = sp.y + sp.h;

  // Forged dark iron base plate anchored into turf
  ctx.fillStyle = PAL.spikeBase;
  rr(sp.x - 1, baseY - 6, sp.w + 2, 8, 2);
  ctx.fill();

  // Rivets on base plate
  ctx.fillStyle = PAL.spikeMid;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(sp.x + i * 18 + 9, baseY - 2, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < n; i++) {
    const sx = sp.x + i * 18;
    const isCenter = n >= 3 && i === Math.floor(n / 2);
    const tipY = sp.y - (isCenter ? 4 : 0);
    const midX = sx + 9;
    const leftX = sx + 1;
    const rightX = sx + 17;

    // Left sunlit steel bevel
    ctx.fillStyle = PAL.spikeSteel;
    ctx.beginPath();
    ctx.moveTo(leftX, baseY - 4);
    ctx.lineTo(midX, tipY);
    ctx.lineTo(midX, baseY - 4);
    ctx.closePath();
    ctx.fill();

    // Right shadowed steel bevel
    ctx.fillStyle = PAL.spikeDark;
    ctx.beginPath();
    ctx.moveTo(midX, tipY);
    ctx.lineTo(rightX, baseY - 4);
    ctx.lineTo(midX, baseY - 4);
    ctx.closePath();
    ctx.fill();

    // Crimson danger glint at sharp apex
    ctx.fillStyle = PAL.spikeTip;
    ctx.beginPath();
    ctx.moveTo(midX, tipY);
    ctx.lineTo(midX + 2.4, tipY + 7);
    ctx.lineTo(midX - 2.4, tipY + 7);
    ctx.closePath();
    ctx.fill();

    // Crisp dark forged edge
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftX, baseY - 4);
    ctx.lineTo(midX, tipY);
    ctx.lineTo(rightX, baseY - 4);
    ctx.stroke();
  }
}

function drawBug(b) {
  const cx = b.x + b.w / 2;
  const baseY = b.y + b.h;
  const dir = b.dir >= 0 ? 1 : -1;
  const bob = Math.sin(b.phase * 0.5) * 1.4;

  ctx.save();

  // Contact shadow
  ctx.fillStyle = PAL.mallowLine;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 1, b.w * 0.44, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Articulated legs (3 sharp limbs scuttling)
  ctx.strokeStyle = PAL.bugDark;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const legOff = (i - 1) * 9;
    const step = Math.sin(b.phase + i * 2.1);
    const kneeX = cx + legOff + step * 3;
    const kneeY = baseY - 9 + bob * 0.5;
    const footX = cx + legOff * 1.15 - step * 4;
    const footY = baseY + (step > 0 ? -1.5 : 1);
    ctx.beginPath();
    ctx.moveTo(cx + legOff * 0.7, baseY - 12 + bob);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY);
    ctx.stroke();
  }

  // Swept-back curved dorsal bone thorns
  const spineCount = 4;
  for (let i = 0; i < spineCount; i++) {
    const t = (i + 0.6) / spineCount;
    const sx = b.x + 6 + t * (b.w - 14);
    const sy = b.y + 12 + Math.abs(t - 0.5) * 5 + bob;
    const tipLean = -dir * (3 + i * 0.8);
    const tipH = 10 + (i === 1 || i === 2 ? 3 : 0);

    ctx.fillStyle = PAL.spikeSteel;
    ctx.strokeStyle = PAL.bugDark;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx - 3.5, sy);
    ctx.quadraticCurveTo(sx + tipLean * 0.4, sy - tipH * 0.7, sx + tipLean, sy - tipH);
    ctx.quadraticCurveTo(sx + 2, sy - tipH * 0.5, sx + 3.5, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Heavy armored carapace
  const bodyY = b.y + b.h * 0.56 + bob;
  ctx.fillStyle = PAL.bugRedDk;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, b.w * 0.48, b.h * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAL.bugRed;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY - 2, b.w * 0.44, b.h * 0.27, 0, 0, Math.PI * 2);
  ctx.fill();

  // Armored carapace specular arc & ridge lines
  ctx.fillStyle = PAL.bugRedHi;
  ctx.beginPath();
  ctx.ellipse(cx - dir * 3, bodyY - 5.5, b.w * 0.24, 3, -0.1 * dir, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = PAL.bugDark;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, b.w * 0.48, b.h * 0.34, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Snapping mandibles / pincers facing travel direction
  const jawSnap = Math.abs(Math.sin(b.phase * 0.9)) * 3;
  const frontX = cx + dir * (b.w * 0.44);
  ctx.fillStyle = PAL.spikeSteel;
  ctx.strokeStyle = PAL.bugDark;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(frontX, bodyY + 1);
  ctx.lineTo(frontX + dir * 7, bodyY - 1 - jawSnap * 0.5);
  ctx.lineTo(frontX + dir * 2, bodyY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fierce glowing predator eye + angry brow ridge
  const ex = cx + dir * (b.w * 0.23);
  const ey = bodyY - 2;
  ctx.fillStyle = PAL.bugEyeGlow;
  ctx.beginPath();
  ctx.arc(ex, ey, 4.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAL.bugEye;
  ctx.beginPath();
  ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Dark vertical predator slit
  ctx.fillStyle = PAL.bugDark;
  ctx.fillRect(ex + dir * 0.4 - 0.8, ey - 2.4, 1.6, 4.8);

  // Thick angry brow slant
  ctx.strokeStyle = PAL.bugDark;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(ex - dir * 5, ey - 5);
  ctx.lineTo(ex + dir * 4, ey - 2.5);
  ctx.stroke();

  ctx.restore();
}

function drawEspressoIcon(cx, cy, r) {
  ctx.save();
  const lw = Math.max(1.5, r * 0.14);

  // Saucer
  ctx.fillStyle = PAL.espressoShade;
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.68, r * 0.86, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cup handle
  ctx.lineCap = 'round';
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = Math.max(3, r * 0.32);
  ctx.beginPath();
  ctx.arc(cx + r * 0.44, cy + r * 0.14, r * 0.25, -Math.PI * 0.46, Math.PI * 0.46);
  ctx.stroke();
  ctx.strokeStyle = PAL.espressoCup;
  ctx.lineWidth = Math.max(1.4, r * 0.14);
  ctx.stroke();

  // Tapered ceramic cup body
  const drawCupPath = () => {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.56, cy - r * 0.30);
    ctx.lineTo(cx + r * 0.56, cy - r * 0.30);
    ctx.lineTo(cx + r * 0.38, cy + r * 0.54);
    ctx.quadraticCurveTo(cx, cy + r * 0.72, cx - r * 0.38, cy + r * 0.54);
    ctx.closePath();
  };

  drawCupPath();
  ctx.fillStyle = PAL.espressoCup;
  ctx.fill();

  // Terracotta accent stripe + side shading clipped to cup
  ctx.save();
  drawCupPath();
  ctx.clip();
  ctx.fillStyle = PAL.espressoShade;
  ctx.fillRect(cx + r * 0.12, cy - r * 0.35, r * 0.55, r * 1.1);
  ctx.fillStyle = PAL.espressoBand;
  ctx.fillRect(cx - r * 0.65, cy + r * 0.04, r * 1.3, r * 0.24);
  ctx.restore();

  drawCupPath();
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Mini energy lightning bolt emblem on front of cup
  ctx.fillStyle = PAL.espressoGlow;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.05, cy - r * 0.04);
  ctx.lineTo(cx - r * 0.10, cy + r * 0.18);
  ctx.lineTo(cx + r * 0.02, cy + r * 0.18);
  ctx.lineTo(cx - r * 0.06, cy + r * 0.40);
  ctx.lineTo(cx + r * 0.12, cy + r * 0.13);
  ctx.lineTo(cx + 0.0, cy + r * 0.13);
  ctx.closePath();
  ctx.fill();

  // Coffee surface & golden crema rim
  ctx.fillStyle = PAL.espressoCoffee;
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = lw * 0.85;
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.30, r * 0.56, r * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = PAL.espressoCrema;
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.30, r * 0.42, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = PAL.espressoCup;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.18, cy - r * 0.32, r * 0.12, r * 0.045, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawChamomileIcon(cx, cy, r, sway) {
  ctx.save();
  ctx.translate(cx, cy);
  if (sway) ctx.rotate(sway);

  const lw = Math.max(1.3, r * 0.13);
  const petals = 8;
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI * 2) / petals);
    ctx.fillStyle = PAL.chamomilePetal;
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.62, r * 0.25, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = PAL.chamomileShade;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.38, r * 0.12, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Domed golden center
  ctx.fillStyle = PAL.chamomileCore;
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = PAL.chamomileCoreDk;
  ctx.beginPath();
  ctx.arc(r * 0.08, r * 0.12, r * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.chamomileCore;
  ctx.beginPath();
  ctx.arc(-r * 0.06, -r * 0.06, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.36, 0, Math.PI * 2);
  ctx.stroke();

  // Tiny pollen speckles
  ctx.fillStyle = PAL.chamomileCoreDk;
  for (const [px, py] of [[-0.12, -0.06], [0.10, -0.10], [0.02, 0.10]]) {
    ctx.beginPath();
    ctx.arc(r * px, r * py, Math.max(0.8, r * 0.055), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEspressoItem(item) {
  const cx = item.x + item.w * 0.5;
  const bob = Math.sin(animTime * 4.5 + item.phase) * 3.5;
  const cy = item.y + item.h * 0.5 + bob;
  const pulse = 1 + Math.sin(animTime * 6 + item.phase) * 0.08;

  ctx.save();
  // Warm golden aura
  ctx.fillStyle = PAL.espressoGlow;
  ctx.globalAlpha = 0.24 + 0.08 * Math.sin(animTime * 6 + item.phase);
  ctx.beginPath();
  ctx.arc(cx, cy, 20 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Animated rising steam wisps
  ctx.strokeStyle = PAL.white;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const sx = cx + (i === 0 ? -4.5 : 4.5);
    const wave = Math.sin(animTime * 6.5 + item.phase + i * 2.1) * 2.5;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(sx, cy - 6);
    ctx.quadraticCurveTo(sx + wave, cy - 12, sx - wave * 0.8, cy - 18);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  drawEspressoIcon(cx, cy + 2, 13.5);

  // Twinkling energetic sparks around cup
  ctx.fillStyle = PAL.espressoSpark;
  for (let i = 0; i < 2; i++) {
    const ang = animTime * 3.2 + item.phase + i * Math.PI;
    const spx = cx + Math.cos(ang) * 18;
    const spy = cy + Math.sin(ang * 1.3) * 11 - 2;
    const sr = 2.0 + Math.sin(animTime * 10 + i) * 0.8;
    ctx.beginPath();
    ctx.moveTo(spx, spy - sr * 1.4);
    ctx.lineTo(spx + sr * 0.9, spy);
    ctx.lineTo(spx, spy + sr * 1.4);
    ctx.lineTo(spx - sr * 0.9, spy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawChamomileItem(item) {
  const cx = item.x + item.w * 0.5;
  const bob = Math.sin(animTime * 2.4 + item.phase) * 3.5;
  const cy = item.y + item.h * 0.5 + bob;
  const sway = Math.sin(animTime * 2.0 + item.phase) * 0.14;
  const pulse = 1 + Math.sin(animTime * 3 + item.phase) * 0.06;

  ctx.save();
  // Dreamy lavender halo
  ctx.fillStyle = PAL.chamomileGlow;
  ctx.globalAlpha = 0.24 + 0.08 * Math.sin(animTime * 3 + item.phase);
  ctx.beginPath();
  ctx.arc(cx, cy, 20 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Curved green stem + leaves
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = 4.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2);
  ctx.quadraticCurveTo(cx - 2, cy + 11, cx + 1.5, cy + 17);
  ctx.stroke();
  ctx.strokeStyle = PAL.chamomileStem;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  for (const [lx, ly, ang] of [[cx - 5, cy + 11, -0.55], [cx + 5.5, cy + 12.5, 0.55]]) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(ang);
    ctx.fillStyle = PAL.chamomileStem;
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.6, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawChamomileIcon(cx, cy - 3, 12.5, sway);

  // Soft drifting sparkles
  ctx.fillStyle = PAL.chamomileGlow;
  for (let i = 0; i < 2; i++) {
    const t = ((animTime * 0.55 + i * 0.5 + item.phase) % 1);
    const sx = cx + (i === 0 ? -13 : 13) + Math.sin(t * Math.PI * 2) * 3;
    const sy = cy + 6 - t * 22;
    ctx.globalAlpha = Math.sin(t * Math.PI) * 0.85;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPowerup(item) {
  if (item.collected) return;
  if (item.type === POWERUP_TYPE.ESPRESSO) drawEspressoItem(item);
  else drawChamomileItem(item);
}

function drawMallow(opts) {
  const x = opts.x;
  const y = opts.y;
  const size = opts.size;
  const sq = opts.squash;
  const tilt = opts.tilt || 0;
  const runPhase = opts.runPhase || 0;
  const grounded = opts.grounded !== false;
  const dead = Boolean(opts.dead);
  const blinking = Boolean(opts.blinking);
  const lookX = opts.lookX ?? 2;
  const lookY = opts.lookY ?? 0;
  const mouthOpen = Boolean(opts.mouthOpen);
  const deathT = opts.deathT || 0;
  const powerup = opts.powerup || null;
  const pT = opts.powerupAnimT || 0;
  const isEspresso = !dead && powerup === POWERUP_TYPE.ESPRESSO;
  const isChamomile = !dead && powerup === POWERUP_TYPE.CHAMOMILE;

  const w = size / sq;
  const h = size * sq;
  const cx = x + size * 0.5;
  const bottomY = y + size;
  const px = cx - w * 0.5;
  const py = bottomY - h;

  const effectiveTilt = isEspresso
    ? tilt + 0.05
    : isChamomile
      ? tilt + Math.sin(pT * 2.4) * 0.06 - 0.03
      : tilt;

  ctx.save();
  ctx.translate(cx, bottomY);
  ctx.rotate(effectiveTilt);

  if (isEspresso) {
    ctx.translate(Math.sin(pT * 52) * 1.4, Math.cos(pT * 61) * 0.9);
  } else if (isChamomile) {
    ctx.translate(0, Math.max(0, Math.sin(pT * 1.9)) * 1.1);
  }

  // Tiny animated hopping feet underneath body
  if (!dead) {
    const footSep = w * 0.24;
    const footLiftAmp = isEspresso ? 6.0 : isChamomile ? 2.2 : 4.5;
    const footShiftAmp = isEspresso ? 4.4 : isChamomile ? 2.1 : 3.5;
    const lLift = grounded ? Math.max(0, Math.sin(runPhase)) * footLiftAmp : 3;
    const rLift = grounded ? Math.max(0, Math.sin(runPhase + Math.PI)) * footLiftAmp : 4.5;
    const lShift = grounded ? Math.cos(runPhase) * footShiftAmp : -2;
    const rShift = grounded ? Math.cos(runPhase + Math.PI) * footShiftAmp : 3;

    ctx.fillStyle = PAL.mallowBot;
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = Math.max(2, size * 0.065);

    for (const [fx, fy] of [[-footSep + lShift, -1 - lLift], [footSep + rShift, -1 - rLift]]) {
      ctx.beginPath();
      ctx.ellipse(fx, fy, size * 0.13, size * 0.085, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Body local rect relative to (cx, bottomY)
  const bx = -w * 0.5;
  const by = -h;
  const rad = Math.min(w, h) * 0.30;

  // Kinetic speed lines behind espresso Mallow
  if (isEspresso) {
    ctx.strokeStyle = PAL.espressoSpark;
    ctx.lineWidth = Math.max(1.8, size * 0.055);
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const ly = by + h * (0.24 + i * 0.26);
      const len = 8 + ((i * 5 + Math.floor(pT * 24)) % 9);
      ctx.globalAlpha = 0.72 - i * 0.12;
      ctx.beginPath();
      ctx.moveTo(bx - 4, ly);
      ctx.lineTo(bx - 4 - len, ly);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Soft marshmallow vertical gradient
  const bodyGrad = ctx.createLinearGradient(0, by, 0, 0);
  bodyGrad.addColorStop(0, PAL.mallowTop);
  bodyGrad.addColorStop(0.75, PAL.mallowTop);
  bodyGrad.addColorStop(1, PAL.mallowBot);
  ctx.fillStyle = bodyGrad;
  rr(bx, by, w, h, rad);
  ctx.fill();

  // Subtle lower rim shading inside marshmallow
  ctx.save();
  rr(bx, by, w, h, rad);
  ctx.clip();
  ctx.fillStyle = PAL.mallowShade;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(bx, -h * 0.14, w, h * 0.16);
  if (isEspresso) {
    ctx.fillStyle = PAL.espressoGlow;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(bx, -h * 0.12, w, h * 0.14);
  } else if (isChamomile) {
    ctx.fillStyle = PAL.chamomileGlow;
    ctx.globalAlpha = 0.34;
    ctx.fillRect(bx, -h * 0.16, w, h * 0.18);
  }
  ctx.globalAlpha = 1;

  // Top-left glossy highlight pill
  ctx.fillStyle = PAL.white;
  ctx.save();
  ctx.translate(bx + w * 0.22, by + h * 0.20);
  ctx.rotate(-0.45);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.12, size * 0.055, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Crisp outer marshmallow contour
  ctx.strokeStyle = PAL.mallowLine;
  ctx.lineWidth = Math.max(2.6, size * 0.08);
  rr(bx, by, w, h, rad);
  ctx.stroke();

  // Rosy cheek blushes
  const eyeCenterX = lookX * (size / 36);
  const eyeY = by + h * 0.40 + lookY * (size / 36);
  const eyeSpread = w * 0.18;

  ctx.fillStyle = PAL.mallowBlush;
  ctx.globalAlpha = isEspresso ? 0.85 : isChamomile ? 0.50 : 0.65;
  ctx.beginPath();
  ctx.ellipse(eyeCenterX - eyeSpread - size * 0.09, eyeY + size * 0.11, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeCenterX + eyeSpread + size * 0.09, eyeY + size * 0.11, size * 0.08, size * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (dead) {
    // Dramatic X eyes + wavy mouth
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = Math.max(2.4, size * 0.075);
    ctx.lineCap = 'round';
    for (const sx of [-eyeSpread, eyeSpread]) {
      const ex = eyeCenterX + sx;
      const r = size * 0.09;
      ctx.beginPath();
      ctx.moveTo(ex - r, eyeY - r);
      ctx.lineTo(ex + r, eyeY + r);
      ctx.moveTo(ex + r, eyeY - r);
      ctx.lineTo(ex - r, eyeY + r);
      ctx.stroke();
    }
    // Wavy sad mouth
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.beginPath();
    ctx.moveTo(eyeCenterX - size * 0.10, eyeY + size * 0.18);
    ctx.quadraticCurveTo(eyeCenterX, eyeY + size * 0.11, eyeCenterX + size * 0.10, eyeY + size * 0.18);
    ctx.stroke();

    // Orbiting dizzy golden stars above Mallow
    for (let i = 0; i < 3; i++) {
      const ang = deathT * 5 + i * ((Math.PI * 2) / 3);
      const sx = Math.cos(ang) * (size * 0.42);
      const sy = by - 10 + Math.sin(ang) * 4;
      ctx.fillStyle = PAL.yellow;
      ctx.strokeStyle = PAL.mallowLine;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx, sy, 3.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (isEspresso) {
    // Super energetic wired eyes (wide sclera + darting pupils + star catchlights + hyped brows)
    const scleraR = size * 0.14;
    const dartX = Math.sin(pT * 29) * (size * 0.025);
    const dartY = Math.cos(pT * 23) * (size * 0.015);
    for (const sx of [-eyeSpread, eyeSpread]) {
      const ex = eyeCenterX + sx;
      ctx.fillStyle = PAL.white;
      ctx.strokeStyle = PAL.mallowLine;
      ctx.lineWidth = Math.max(1.8, size * 0.05);
      ctx.beginPath();
      ctx.arc(ex, eyeY, scleraR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = PAL.mallowLine;
      ctx.beginPath();
      ctx.arc(ex + dartX, eyeY + dartY, scleraR * 0.50, 0, Math.PI * 2);
      ctx.fill();

      // Bright star-like catchlight
      ctx.fillStyle = PAL.white;
      ctx.beginPath();
      ctx.arc(ex + dartX + scleraR * 0.22, eyeY + dartY - scleraR * 0.24, scleraR * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Hyped raised angled eyebrow
      const side = sx < 0 ? -1 : 1;
      ctx.strokeStyle = PAL.mallowLine;
      ctx.lineWidth = Math.max(1.8, size * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - scleraR * 0.75, eyeY - scleraR * 1.35 + side * 1.2);
      ctx.lineTo(ex + scleraR * 0.75, eyeY - scleraR * 1.35 - side * 1.2);
      ctx.stroke();
    }

    // Wide open excited ':D' grin
    ctx.fillStyle = PAL.mallowBlush;
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    ctx.beginPath();
    ctx.arc(eyeCenterX, eyeY + size * 0.11, size * 0.105, 0.05, Math.PI - 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crackling lightning bolts above Mallow's head
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const pulseY = Math.sin(pT * 18 + i * 2.5) * 2.5;
      const lx = side * (size * 0.26);
      const ly = by - 5 + pulseY;
      ctx.fillStyle = PAL.espressoGlow;
      ctx.strokeStyle = PAL.mallowLine;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(lx + side * 2, ly - 9);
      ctx.lineTo(lx - 3, ly - 3);
      ctx.lineTo(lx + 1, ly - 3);
      ctx.lineTo(lx - side * 2, ly + 3);
      ctx.lineTo(lx + 4, ly - 4);
      ctx.lineTo(lx, ly - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else if (isChamomile) {
    // Very sleepy heavy-lidded eyes + periodic cute yawn
    const eyeR = size * 0.105;
    const droop = 0.56 + 0.20 * Math.sin(pT * 2.2);

    if (blinking) {
      ctx.strokeStyle = PAL.mallowLine;
      ctx.lineWidth = Math.max(2.2, size * 0.068);
      ctx.lineCap = 'round';
      for (const sx of [-eyeSpread, eyeSpread]) {
        const ex = eyeCenterX + sx;
        ctx.beginPath();
        ctx.moveTo(ex - size * 0.09, eyeY + 1);
        ctx.quadraticCurveTo(ex, eyeY + size * 0.06, ex + size * 0.09, eyeY + 1);
        ctx.stroke();
      }
    } else {
      for (const sx of [-eyeSpread, eyeSpread]) {
        const ex = eyeCenterX + sx;
        const side = sx < 0 ? -1 : 1;
        ctx.fillStyle = PAL.mallowLine;
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, eyeR * 0.92, eyeR * 1.02, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = PAL.white;
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.22, eyeY + eyeR * 0.25, eyeR * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Heavy upper eyelid covering top part of eye
        const lidBottomY = eyeY - eyeR + eyeR * 2 * droop;
        ctx.fillStyle = PAL.mallowTop;
        ctx.beginPath();
        ctx.rect(ex - eyeR * 1.35, eyeY - eyeR * 1.45, eyeR * 2.7, lidBottomY - (eyeY - eyeR * 1.45));
        ctx.fill();

        ctx.strokeStyle = PAL.mallowLine;
        ctx.lineWidth = Math.max(2.1, size * 0.065);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - eyeR * 1.15, lidBottomY - side * 1.1);
        ctx.quadraticCurveTo(ex, lidBottomY + 1.2, ex + eyeR * 1.15, lidBottomY + side * 1.1);
        ctx.stroke();
      }
    }

    // Periodic sleepy yawn vs calm little mouth
    const yawnPhase = pT % 2.8;
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    ctx.lineCap = 'round';
    if (yawnPhase > 1.85) {
      const yawnOpen = Math.sin(((yawnPhase - 1.85) / 0.95) * Math.PI);
      ctx.fillStyle = PAL.mallowBlush;
      ctx.beginPath();
      ctx.ellipse(
        eyeCenterX,
        eyeY + size * 0.16,
        size * (0.045 + 0.025 * yawnOpen),
        size * (0.045 + 0.055 * yawnOpen),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(eyeCenterX, eyeY + size * 0.14, size * 0.045, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Floating upright 'Z z z' bubbles rising above Mallow
    ctx.save();
    ctx.translate(0, by - 4);
    ctx.rotate(-effectiveTilt);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = ['z', 'Z', 'z'];
    for (let i = 0; i < 3; i++) {
      const cycle = (pT * 0.65 + i * 0.33) % 1;
      const zx = Math.sin(cycle * Math.PI * 2 + i) * 5 + (i - 1) * 6;
      const zy = -4 - cycle * 26;
      const fSize = Math.round(9 + cycle * 6);
      ctx.globalAlpha = Math.sin(cycle * Math.PI) * 0.95;
      ctx.font = `bold ${fSize}px "Courier New", monospace`;
      ctx.strokeStyle = PAL.white;
      ctx.lineWidth = 3;
      ctx.strokeText(labels[i], zx, zy);
      ctx.fillStyle = PAL.chamomileSleep;
      ctx.fillText(labels[i], zx, zy);
    }
    ctx.restore();
  } else if (blinking) {
    // Cute closed eyes blink
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = Math.max(2.4, size * 0.075);
    ctx.lineCap = 'round';
    for (const sx of [-eyeSpread, eyeSpread]) {
      const ex = eyeCenterX + sx;
      ctx.beginPath();
      ctx.moveTo(ex - size * 0.08, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + size * 0.05, ex + size * 0.08, eyeY);
      ctx.stroke();
    }
  } else {
    // Expressive shiny beady eyes with white catchlights
    const eyeR = size * 0.105;
    for (const sx of [-eyeSpread, eyeSpread]) {
      const ex = eyeCenterX + sx;
      ctx.fillStyle = PAL.mallowLine;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeR * 0.92, eyeR * 1.12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = PAL.white;
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.32, eyeY - eyeR * 0.34, eyeR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.25, eyeY + eyeR * 0.35, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Little mouth (cheerful smile or cute surprised 'o' mid-jump)
    ctx.strokeStyle = PAL.mallowLine;
    ctx.lineWidth = Math.max(1.8, size * 0.05);
    ctx.lineCap = 'round';
    if (mouthOpen) {
      ctx.fillStyle = PAL.mallowBlush;
      ctx.beginPath();
      ctx.ellipse(eyeCenterX, eyeY + size * 0.16, size * 0.05, size * 0.065, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(eyeCenterX, eyeY + size * 0.12, size * 0.07, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }

  ctx.restore();

  // Keep lint happy if px/py computed only for shadow reference
  void px;
  void py;
}

function findShadowSurfaceY(worldX, feetY) {
  let bestY = null;
  for (const c of world.chunks) {
    for (const p of c.platforms) {
      if (worldX >= p.x + 2 && worldX <= p.x + p.w - 2 && p.y >= feetY - 2) {
        if (bestY === null || p.y < bestY) bestY = p.y;
      }
    }
    for (const s of c.solids) {
      if (worldX >= s.x + 2 && worldX <= s.x + s.w - 2 && s.y >= feetY - 2) {
        if (bestY === null || s.y < bestY) bestY = s.y;
      }
    }
  }
  return bestY;
}

function drawPlayer() {
  // Ground contact shadow on surface below player
  const centerX = player.x + PLAYER_SIZE * 0.5;
  const centerY = player.y + PLAYER_SIZE * 0.5;
  const surfY = findShadowSurfaceY(centerX, player.y + PLAYER_SIZE);
  if (surfY !== null) {
    const dist = Math.max(0, surfY - (player.y + PLAYER_SIZE));
    if (dist < 180) {
      const k = 1 - dist / 180;
      ctx.save();
      ctx.fillStyle = PAL.mallowLine;
      ctx.globalAlpha = 0.26 * k;
      ctx.beginPath();
      ctx.ellipse(centerX, surfY + 1, (PLAYER_SIZE * 0.48) * (0.45 + 0.55 * k), 3.6 * k, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Dreamy lavender aura behind chamomile Mallow
  if (!player.dead && player.powerup === POWERUP_TYPE.CHAMOMILE) {
    ctx.save();
    ctx.fillStyle = PAL.chamomileGlow;
    ctx.globalAlpha = 0.20 + 0.06 * Math.sin(player.powerupAnimT * 3);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, PLAYER_SIZE * 0.72, PLAYER_SIZE * 0.66, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Golden speed afterimages behind espresso Mallow
  if (!player.dead && player.powerup === POWERUP_TYPE.ESPRESSO && playerTrail.length > 0) {
    for (let i = 0; i < playerTrail.length; i++) {
      const tr = playerTrail[i];
      const frac = (i + 1) / (playerTrail.length + 1);
      ctx.save();
      ctx.globalAlpha = frac * 0.24;
      const w = PLAYER_SIZE / tr.squash;
      const h = PLAYER_SIZE * tr.squash;
      ctx.translate(tr.x + PLAYER_SIZE * 0.5, tr.y + PLAYER_SIZE);
      ctx.rotate(tr.tilt);
      ctx.fillStyle = PAL.espressoGlow;
      rr(-w * 0.5, -h, w, h, Math.min(w, h) * 0.30);
      ctx.fill();
      ctx.restore();
    }
  }

  // Expanding pickup shockwave ring
  if (!player.dead && player.powerupBurstT > 0 && player.powerup !== null) {
    const t = 1 - player.powerupBurstT / 0.65;
    ctx.save();
    ctx.strokeStyle = player.powerup === POWERUP_TYPE.ESPRESSO ? PAL.espressoGlow : PAL.chamomileGlow;
    ctx.globalAlpha = (1 - t) * 0.75;
    ctx.lineWidth = 3 * (1 - t * 0.5);
    ctx.beginPath();
    ctx.arc(centerX, centerY, PLAYER_SIZE * (0.55 + t * 0.95), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawMallow({
    x: player.x,
    y: player.y,
    size: PLAYER_SIZE,
    squash: player.squash,
    tilt: player.tilt,
    runPhase: player.runPhase,
    grounded: player.grounded,
    dead: player.dead,
    deathT: player.deathT,
    blinking: player.blinkDur > 0,
    lookX: 2.5,
    lookY: Math.max(-1.8, Math.min(2.0, player.vy * 0.004)),
    mouthOpen: !player.grounded && Math.abs(player.vy) > 130,
    powerup: player.powerup,
    powerupAnimT: player.powerupAnimT,
  });
}

function drawParticles() {
  for (const p of particles) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    if (p.square) {
      ctx.fillRect(p.x - p.r * 0.5, p.y - p.r * 0.5, p.r * 1.4, p.r * 1.4);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawPopups() {
  for (const p of popups) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = PAL.navy;
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-Math.round(camX), -Math.round(view.camY));

  const drawBottomY = view.camY + view.h + 40;

  // Smooth vertical chasm mist gradient inside gaps
  const chasmGrad = ctx.createLinearGradient(0, GROUND_Y + 18, 0, drawBottomY);
  chasmGrad.addColorStop(0, 'rgba(24, 34, 47, 0)');
  chasmGrad.addColorStop(0.45, 'rgba(24, 34, 47, 0.32)');
  chasmGrad.addColorStop(1, 'rgba(24, 34, 47, 0.75)');
  ctx.fillStyle = chasmGrad;
  ctx.fillRect(camX - 40, GROUND_Y + 18, view.w + 80, Math.max(0, drawBottomY - GROUND_Y - 18));

  for (const c of world.chunks) {
    for (const s of c.solids) drawGroundSolid(s, drawBottomY);
    for (const p of c.platforms) drawRockyPlatform(p);
    for (const sp of c.spikes) drawSpikes(sp);
    for (const b of c.bugs) drawBug(b);
    for (const item of c.powerups) drawPowerup(item);
  }

  drawPlayer();
  drawParticles();
  drawPopups();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// HUD & overlay screens
// ---------------------------------------------------------------------------
function drawScorePill() {
  const txt = scoreNow() + ' m';
  ctx.font = 'bold 22px "Courier New", monospace';
  const tw = ctx.measureText(txt).width;
  ctx.save();
  ctx.fillStyle = PAL.navyPanel;
  ctx.globalAlpha = 0.88;
  rr(14, 14, tw + 30, 42, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = PAL.white;
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 2;
  rr(14, 14, tw + 30, 42, 12);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, 29, 36);
  ctx.restore();
}

function drawPauseButton() {
  ctx.save();
  ctx.fillStyle = PAL.navyPanel;
  ctx.globalAlpha = 0.88;
  rr(pauseBtn.x, pauseBtn.y, pauseBtn.w, pauseBtn.h, 11);
  ctx.fill();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = PAL.white;
  ctx.lineWidth = 2;
  rr(pauseBtn.x, pauseBtn.y, pauseBtn.w, pauseBtn.h, 11);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const barW = Math.max(6, Math.round(pauseBtn.w * 0.14));
  const barH = Math.round(pauseBtn.h * 0.44);
  const gap = Math.round(pauseBtn.w * 0.14);
  const bx1 = pauseBtn.x + (pauseBtn.w - barW * 2 - gap) / 2;
  const by = pauseBtn.y + (pauseBtn.h - barH) / 2;
  ctx.fillStyle = PAL.white;
  rr(bx1, by, barW, barH, 2);
  ctx.fill();
  rr(bx1 + barW + gap, by, barW, barH, 2);
  ctx.fill();
  ctx.restore();
}

function centerTextFit(txt, y, maxW, baseSize, weight, color, shadowColor) {
  let size = baseSize;
  ctx.font = `${weight} ${size}px "Courier New", monospace`;
  const w = ctx.measureText(txt).width;
  if (w > maxW && w > 0) {
    size = Math.max(12, Math.floor(baseSize * (maxW / w)));
    ctx.font = `${weight} ${size}px "Courier New", monospace`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (shadowColor) {
    ctx.fillStyle = shadowColor;
    ctx.fillText(txt, view.w / 2 + 2.5, y + 2.5);
  }
  ctx.fillStyle = color;
  ctx.fillText(txt, view.w / 2, y);
}

function drawTitle() {
  drawBackdrop(titleCamX);

  const groundSY = view.groundScreenY;
  const pseudoGround = { x: -20, y: groundSY, w: view.w + 40, h: view.h - groundSY + 40 };
  drawGroundSolid(pseudoGround, view.h + 40);

  const mascotSize = Math.min(84, Math.max(58, groundSY * 0.175));
  const hopWave = Math.sin(animTime * 3.1);
  const hopLift = Math.max(0, hopWave) * (mascotSize * 0.34);
  const mallowSq = hopLift > 2
    ? 1 + (hopLift / (mascotSize * 0.34)) * 0.12
    : 0.92 + Math.abs(Math.cos(animTime * 3.1)) * 0.08;
  const mallowX = view.w / 2 - mascotSize / 2;
  const mallowY = groundSY - mascotSize - hopLift;

  // Ground shadow beneath title mascot
  const shadowScale = 1 - (hopLift / (mascotSize * 0.34)) * 0.45;
  ctx.save();
  ctx.fillStyle = PAL.mallowLine;
  ctx.globalAlpha = 0.28 * shadowScale;
  ctx.beginPath();
  ctx.ellipse(view.w / 2, groundSY + 1, mascotSize * 0.48 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawMallow({
    x: mallowX,
    y: mallowY,
    size: mascotSize,
    squash: mallowSq,
    tilt: hopLift > 2 ? -0.05 : 0.02,
    runPhase: animTime * 11,
    grounded: hopLift < 2,
    blinking: player.blinkDur > 0,
    lookX: 0.8,
    lookY: hopLift > 2 ? -1.0 : 0,
    mouthOpen: hopLift > mascotSize * 0.2,
  });

  // Title typography scaled smoothly across portrait & landscape
  const maxTextW = view.w - 48;
  const titleSize = Math.min(68, Math.max(40, groundSY * 0.145));
  const titleY1 = Math.max(58, groundSY * 0.22);
  const titleY2 = titleY1 + titleSize * 1.06;

  centerTextFit('BOUNCE', titleY1, maxTextW, titleSize, 'bold', PAL.white, PAL.navy);
  centerTextFit('MALLOW', titleY2, maxTextW, titleSize, 'bold', PAL.white, PAL.navy);

  const promptY = groundSY + Math.min(48, (view.h - groundSY) * 0.28);
  const pulseAlpha = 0.74 + 0.26 * Math.sin(stateTime * 4.2);
  ctx.save();
  ctx.globalAlpha = pulseAlpha;
  centerTextFit('PRESS ENTER / SPACE  OR  TAP TO START', promptY, maxTextW, 21, 'bold', PAL.white, PAL.navy);
  ctx.restore();
  centerTextFit('One button: JUMP. Catch Espresso (2x) or Chamomile (\u00BDx)!', promptY + 34, maxTextW, 15, 'bold', PAL.cloudLit, PAL.navy);
  if (best > 0) {
    centerTextFit('BEST: ' + best + ' m', promptY + 72, maxTextW, 20, 'bold', PAL.yellow, PAL.navy);
  }
}

function drawCountdown() {
  drawBackdrop(camX);
  drawWorld();
  drawScorePill();

  const n = Math.max(1, 3 - Math.floor(stateTime));
  const frac = stateTime % 1;
  const scale = 1 + (1 - Math.min(1, frac * 3)) * 0.45;
  ctx.save();
  ctx.translate(view.w / 2, Math.max(140, view.groundScreenY * 0.50));
  ctx.scale(scale, scale);
  ctx.font = 'bold 116px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PAL.navy;
  ctx.fillText(String(n), 4, 4);
  ctx.fillStyle = PAL.white;
  ctx.fillText(String(n), 0, 0);
  ctx.restore();

  centerTextFit('Get ready...', Math.min(view.groundScreenY - 38, view.h * 0.68), view.w - 48, 24, 'bold', PAL.white, PAL.navy);
}

function drawPowerupPill() {
  if (player.powerup === null) return;
  const isEsp = player.powerup === POWERUP_TYPE.ESPRESSO;
  const label = isEsp ? 'ESPRESSO 2x' : 'CHAMOMILE \u00BDx';
  const accent = isEsp ? PAL.espressoGlow : PAL.chamomileGlow;
  const frac = Math.max(0, Math.min(1, player.powerupTimer / player.powerupDuration));
  const pulse = player.powerupTimer <= 1.0 ? 0.55 + 0.45 * Math.sin(animTime * 16) : 1;

  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.font = 'bold 15px "Courier New", monospace';
  const tw = ctx.measureText(label).width;
  const px = 14;
  const py = 64;
  const pw = Math.ceil(tw + 48);
  const ph = 36;

  ctx.fillStyle = PAL.navyPanel;
  ctx.globalAlpha = 0.88 * pulse;
  rr(px, py, pw, ph, 11);
  ctx.fill();

  // Shrinking timer bar clipped to pill bottom
  ctx.save();
  rr(px, py, pw, ph, 11);
  ctx.clip();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.30 * pulse;
  ctx.fillRect(px, py + ph - 5, pw, 5);
  ctx.globalAlpha = 0.95 * pulse;
  ctx.fillRect(px, py + ph - 5, pw * frac, 5);
  ctx.restore();

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.65 * pulse;
  ctx.lineWidth = 2;
  rr(px, py, pw, ph, 11);
  ctx.stroke();

  ctx.globalAlpha = pulse;
  if (isEsp) {
    drawEspressoIcon(px + 20, py + 15, 8.5);
  } else {
    drawChamomileIcon(px + 20, py + 16, 8.5, Math.sin(player.powerupAnimT * 2) * 0.1);
  }

  ctx.fillStyle = PAL.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, px + 36, py + 16);
  ctx.restore();
}

function drawPlaying() {
  drawBackdrop(camX);
  drawWorld();
  drawScorePill();
  drawPowerupPill();
  drawPauseButton();
}

function drawDim() {
  ctx.fillStyle = PAL.navy;
  ctx.globalAlpha = 0.68;
  ctx.fillRect(0, 0, view.w, view.h);
  ctx.globalAlpha = 1;
}

function drawGameOver() {
  drawPlaying();
  drawDim();

  const score = scoreNow();
  const maxTextW = view.w - 48;
  const cy = Math.min(view.h * 0.41, view.groundScreenY - 145);

  centerTextFit('GAME OVER', cy - 76, maxTextW, 54, 'bold', PAL.white, PAL.mallowLine);
  centerTextFit('DISTANCE: ' + score + ' m', cy - 6, maxTextW, 30, 'bold', PAL.yellow, PAL.mallowLine);
  centerTextFit('BEST: ' + best + ' m', cy + 34, maxTextW, 22, 'bold', PAL.pink, PAL.mallowLine);
  if (score >= best && score > 0) {
    centerTextFit('NEW BEST!', cy + 68, maxTextW, 20, 'bold', PAL.greenLt, PAL.mallowLine);
  }
  if (stateTime > 0.6) {
    const pulseAlpha = 0.74 + 0.26 * Math.sin(stateTime * 4.2);
    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    centerTextFit('PRESS ENTER / SPACE  OR  TAP TO PLAY AGAIN', cy + 114, maxTextW, 20, 'bold', PAL.white, PAL.mallowLine);
    ctx.restore();
  }
}

function drawPaused() {
  drawPlaying();
  drawDim();

  const maxTextW = view.w - 48;
  centerTextFit('PAUSED', resumeBtn.y - 68, maxTextW, 48, 'bold', PAL.white, PAL.mallowLine);

  ctx.fillStyle = PAL.blueDk;
  rr(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h, 12);
  ctx.fill();
  ctx.strokeStyle = PAL.white;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 2;
  rr(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h, 12);
  ctx.stroke();
  ctx.globalAlpha = 1;
  centerTextFit('RESUME', resumeBtn.y + resumeBtn.h / 2, resumeBtn.w - 20, 24, 'bold', PAL.white);

  ctx.fillStyle = PAL.red;
  rr(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h, 12);
  ctx.fill();
  ctx.strokeStyle = PAL.white;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 2;
  rr(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h, 12);
  ctx.stroke();
  ctx.globalAlpha = 1;
  centerTextFit('QUIT', quitBtn.y + quitBtn.h / 2, quitBtn.w - 20, 24, 'bold', PAL.white);

  centerTextFit('ESC / ENTER: resume     Q: quit', quitBtn.y + quitBtn.h + 36, maxTextW, 16, 'bold', PAL.gray);
}

function render() {
  ctx.setTransform(view.scale * view.dpr, 0, 0, view.scale * view.dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  switch (state) {
    case STATE.TITLE:     drawTitle(); break;
    case STATE.COUNTDOWN: drawCountdown(); break;
    case STATE.PLAYING:   drawPlaying(); break;
    case STATE.PAUSED:    drawPaused(); break;
    case STATE.GAMEOVER:  drawGameOver(); break;
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let lastT = performance.now();
function frame(now) {
  const { cssW, cssH } = readViewportSize();
  if (cssW !== view.cssW || cssH !== view.cssH) fitCanvas();

  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 1 / 20) dt = 1 / 20;
  if (dt < 0) dt = 0;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Read-only / non-gameplay-altering inspection interface for automated testing
window.__bounceMallowDebug = {
  getState: () => ({
    state,
    STATE,
    stateTime,
    camX,
    view: { ...view },
    player: { ...player },
    buttons: {
      pauseBtn: { ...pauseBtn },
      resumeBtn: { ...resumeBtn },
      quitBtn: { ...quitBtn },
    },
    world: world ? {
      nextX: world.nextX,
      chunkCount: world.chunks.length,
      chunks: world.chunks,
    } : null,
    constants: {
      GROUND_Y,
      PLAYER_SIZE,
      GRAVITY,
      JUMP_VEL,
      BASE_SPEED,
      MAX_SPEED,
      CHUNK_W,
      START_X,
      MAX_JUMP_APEX,
      TIME_TO_APEX,
      PLAT_H,
      MIN_PLAT_HEIGHT,
      MAX_PLAT_HEIGHT,
      FALL_DEATH_Y,
      POWERUP_TYPE,
      POWERUP_DURATION,
      POWERUP_ESPRESSO_MULT,
      POWERUP_CHAMOMILE_MULT,
      POWERUP_SIZE,
      POWERUP_CHANCE,
      POWERUP_MIN_CHUNK_GAP,
    },
  }),
  speedForDist,
  sampleChunks: (count, distMeters) => {
    const savedPlayerX = player.x;
    player.x = START_X + (distMeters || 0) * PX_PER_M;
    const d = difficulty();
    const out = [];
    let nx = 0;
    let sincePowerup = 1;
    for (let i = 0; i < count; i++) {
      const allowPowerup = sincePowerup >= POWERUP_MIN_CHUNK_GAP;
      const c = buildChunk(nx, d, false, allowPowerup);
      sincePowerup = c.powerups.length > 0 ? 0 : sincePowerup + 1;
      out.push(c);
      nx = c.x + c.w;
    }
    player.x = savedPlayerX;
    return out;
  },
  testPlatformLanding: (heightAboveGround) => {
    // Pure physics step simulation matching physicsStep() against a single test platform
    const simYStart = GROUND_Y - PLAYER_SIZE;
    const platY = GROUND_Y - heightAboveGround;
    const plat = { x: 220, y: platY, w: 120, h: PLAT_H, oneWay: true };
    let sx = 100;
    let sy = simYStart;
    let svy = JUMP_VEL;
    let landed = false;
    const dt = 1 / 180;
    for (let step = 0; step < 360; step++) {
      sx += BASE_SPEED * dt;
      svy += GRAVITY * dt;
      if (svy > 900) svy = 900;
      const prevBottom = sy + PLAYER_SIZE;
      sy += svy * dt;
      const withinX = sx + PLAYER_SIZE - 4 > plat.x && sx + 4 < plat.x + plat.w;
      if (withinX && sy + PLAYER_SIZE > plat.y && sy < plat.y + plat.h) {
        if (svy >= 0 && prevBottom <= plat.y + Math.max(8, svy * dt + 4)) {
          sy = plat.y - PLAYER_SIZE;
          landed = true;
          break;
        }
      }
    }
    return { landed, platY, finalY: sy, finalX: sx };
  },
};
