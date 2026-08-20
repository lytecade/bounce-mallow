/*
 * Bounce Mallow — an endless procedural auto-runner platformer.
 * Single file, no external libraries. Arne16 palette only.
 */
'use strict';

// ---------------------------------------------------------------------------
// Palette (Arne16 — the only colors used)
// ---------------------------------------------------------------------------
const PAL = {
  black:   '#000000',
  gray:    '#9D9D9D',
  white:   '#FFFFFF',
  red:     '#BE2633',
  pink:    '#E06F8B',
  brownDk: '#493C2B',
  brown:   '#A46422',
  orange:  '#EB8931',
  yellow:  '#F7E26B',
  tealDk:  '#2F484E',
  greenDk: '#44891A',
  greenLt: '#A3CE27',
  navy:    '#1B2632',
  blueDk:  '#005784',
  blue:    '#31A2F2',
  blueLt:  '#B2DCEF',
};

// ---------------------------------------------------------------------------
// Canvas / sizing
// ---------------------------------------------------------------------------
const LOGICAL = 640;                 // logical square size
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = 1;

function fitCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const size = Math.max(1, Math.min(window.innerWidth, window.innerHeight));
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  canvas.width = Math.round(LOGICAL * dpr);
  canvas.height = Math.round(LOGICAL * dpr);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------
const STATE = { TITLE: 0, COUNTDOWN: 1, PLAYING: 2, PAUSED: 3, GAMEOVER: 4 };
let state = STATE.TITLE;
let prevState = STATE.TITLE;         // state to return to after pause
let stateTime = 0;                   // seconds in current state

// ---------------------------------------------------------------------------
// World / player constants
// ---------------------------------------------------------------------------
const GROUND_Y = 470;                // top of the ground
const PLAYER_SIZE = 36;
const GRAVITY = 1700;
const JUMP_VEL = -640;
const BASE_SPEED = 260;
const MAX_SPEED = 420;
const CHUNK_W = 430;
const START_X = 120;
const PX_PER_M = 10;
const COYOTE = 0.09;
const JUMP_BUFFER = 0.1;

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------
const player = {
  x: START_X, y: GROUND_Y - PLAYER_SIZE,
  vx: 0, vy: 0,
  grounded: false,
  coyote: 0, jumpBuf: 0,
  squash: 1,        // vertical scale (squash & stretch)
  squashT: 0,
  dead: false,
  startDist: 0,
};

function speedForDist(meters) {
  return Math.min(BASE_SPEED + meters * 0.55, MAX_SPEED);
}

// ---------------------------------------------------------------------------
// World data: chunks
// ---------------------------------------------------------------------------
let world = null;

function newWorld() {
  world = {
    seed: Math.floor(Math.random() * 1e9),
    chunks: [],          // { x, w, solids:[], platforms:[], spikes:[], bugs:[], cloudSeed }
    nextX: 0,
  };
  // Opening safe flat chunk + one more
  for (let i = 0; i < 2; i++) addChunk(true);
}

// Small deterministic hash for decoration
function hash(n) {
  let s = Math.sin(n * 127.1 + (world ? world.seed : 12345) * 0.017) * 43758.5453;
  return s - Math.floor(s);
}

function difficulty() {
  const m = Math.max(0, (player.x - START_X) / PX_PER_M);
  return Math.min(m / 300, 1);       // 0 → 1 over 300 m
}

function addChunk(safe) {
  const x = world.nextX;
  const d = difficulty();
  const solids = [];
  const platforms = [];
  const spikes = [];
  const bugs = [];

  let cursor = 0;

  // Safe opening chunk: pure flat ground
  if (safe) {
    solids.push({ x: x, y: GROUND_Y, w: CHUNK_W, h: 640 - GROUND_Y });
    world.nextX = x + CHUNK_W;
    world.chunks.push({ x, w: CHUNK_W, solids, platforms, spikes, bugs });
    return;
  }

  const maxGap = 95 + 55 * d;
  const minGap = 90;
  const wantGap = Math.random() < 0.45 + 0.15 * d;
  let gapX = -1, gapW = 0;

  if (wantGap) {
    gapX = 120 + Math.random() * (CHUNK_W - 320);
    gapW = minGap + Math.random() * (maxGap - minGap);
  }

  // Build ground solids (with optional gap), keep 90px flat landing zone after gap
  if (gapX >= 0) {
    solids.push({ x: x, y: GROUND_Y, w: gapX, h: 640 - GROUND_Y });
    solids.push({ x: x + gapX + gapW, y: GROUND_Y, w: CHUNK_W - gapX - gapW, h: 640 - GROUND_Y });
  } else {
    solids.push({ x: x, y: GROUND_Y, w: CHUNK_W, h: 640 - GROUND_Y });
  }

  // Flat "no hazard" zones: edges of chunk, near gap edges, after gap landing
  const noZone = [];
  noZone.push([0, 60]);
  if (gapX >= 0) {
    noZone.push([gapX - 55, gapX + gapW + 95]);
  }
  noZone.push([CHUNK_W - 45, CHUNK_W]);

  function inNoZone(px, pw) {
    for (const [a, b] of noZone) if (px < b && px + pw > a) return true;
    return false;
  }
  function tooClose(list, minD) {
    for (const o of list) {
      if (Math.abs(o.x - (x + cursor)) < minD) return true;
    }
    return false;
  }

  // Floating platform to climb over / across (helps over gaps, adds height play)
  const platChance = 0.5;
  if (Math.random() < platChance) {
    let px, pw;
    if (gapX >= 0 && Math.random() < 0.6) {
      pw = 90 + Math.random() * 50;
      px = gapX + gapW / 2 - pw / 2 + (Math.random() * 60 - 30);
    } else {
      pw = 90 + Math.random() * 70;
      px = 100 + Math.random() * (CHUNK_W - pw - 160);
    }
    px = Math.max(60, Math.min(px, CHUNK_W - pw - 60));
    const py = GROUND_Y - 95 - Math.floor(Math.random() * 3) * 38;
    platforms.push({ x: x + px, y: py, w: pw, h: 16 });
  }

  // Spike clusters (white spikes)
  const spikeClusters = 1 + Math.floor(Math.random() * (1 + d * 2));
  for (let i = 0; i < spikeClusters; i++) {
    const count = 1 + Math.floor(Math.random() * (1 + d * 2)); // 1..3
    const sw = count * 18;
    const px = 90 + Math.random() * (CHUNK_W - sw - 130);
    if (inNoZone(px, sw)) continue;
    if (tooClose(spikes, 70)) continue;
    spikes.push({ x: x + px, y: GROUND_Y - 26, w: sw, h: 26 });
  }

  // Spike bug patrolling the ground
  const bugChance = 0.25 + 0.45 * d;
  if (Math.random() < bugChance) {
    const spanMin = 110, spanMax = 200;
    const span = spanMin + Math.random() * (spanMax - spanMin);
    let bx = 90 + Math.random() * (CHUNK_W - span - 140);
    // never patrol over a spike cluster (unfair overlap)
    for (const sp of spikes) {
      const spLocal = sp.x - x;
      if (bx + span + 20 > spLocal && bx - 20 < spLocal + sp.w) {
        bx = 60;
        break;
      }
    }
    if (inNoZone(bx, span + 30)) bx = 60;
    const minX = x + Math.max(70, bx);
    const maxX = Math.min(x + CHUNK_W - 70 - 30, minX + span);
    if (maxX - minX < 90) {
      // not enough room — skip bug
    } else {
      const bugSpeed = 70 + 70 * d + Math.random() * 30;
      bugs.push({
        x: minX + 15, y: GROUND_Y - 26, w: 30, h: 26,
        minX, maxX: maxX - 30,
        speed: bugSpeed, dir: Math.random() < 0.5 ? -1 : 1,
        phase: Math.random() * 6.28,
      });
    }
  }

  world.nextX = x + CHUNK_W;
  world.chunks.push({ x, w: CHUNK_W, solids, platforms, spikes, bugs });
}

function updateChunks(camX) {
  // Generate ahead
  while (world.nextX < camX + LOGICAL + CHUNK_W * 2) addChunk(false);
  // Remove behind
  world.chunks = world.chunks.filter(c => c.x + c.w > camX - 60);
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
let camX = 0;
const PLAYER_SCREEN_X = 0.38;

function updateCamera() {
  const target = player.x - LOGICAL * PLAYER_SCREEN_X;
  camX += (target - camX) * 0.25;
  if (camX < target) camX = target; // never lag behind
  if (camX < -40) camX = -40;
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
function beep(freq, dur, type, vol, slide) {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + dur);
  } catch (e) { /* ignore */ }
}
const sfx = {
  jump()   { beep(300, 0.14, 'square', 0.10, 220); },
  land()   { beep(160, 0.07, 'triangle', 0.10, -60); },
  tick()   { beep(520, 0.08, 'square', 0.09); },
  go()     { beep(760, 0.18, 'square', 0.10, 200); },
  die()    { beep(300, 0.5, 'sawtooth', 0.12, -250); },
  start()  { beep(440, 0.12, 'triangle', 0.10, 220); },
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
function toTitle() {
  state = STATE.TITLE;
  stateTime = 0;
}
function startGame() {
  newWorld();
  player.x = START_X;
  player.y = GROUND_Y - PLAYER_SIZE;
  player.vx = 0; player.vy = 0;
  player.grounded = true;
  player.coyote = 0; player.jumpBuf = 0;
  player.squash = 1; player.dead = false;
  camX = player.x - LOGICAL * PLAYER_SCREEN_X;
  state = STATE.COUNTDOWN;
  stateTime = 0;
  sfx.start();
}

let lastCount = 4;
function onGameOver() {
  player.dead = true;
  state = STATE.GAMEOVER;
  stateTime = 0;
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
// UI hit areas (in logical coords)
const pauseBtn = { x: LOGICAL - 58, y: 12, w: 46, h: 46 };
const resumeBtn = { x: 200, y: 296, w: 240, h: 54 };
const quitBtn = { x: 200, y: 372, w: 240, h: 54 };

function pointIn(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function handleAction() {
  // jump / confirm
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
  const px = (e.clientX - rect.left) / rect.width * LOGICAL;
  const py = (e.clientY - rect.top) / rect.height * LOGICAL;

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

// Prevent scroll/zoom on touch
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

function physicsStep(dt) {
  const m = (player.x - START_X) / PX_PER_M;
  player.vx = speedForDist(m);
  player.x += player.vx * dt;

  // Jump (coyote + buffer)
  player.coyote = player.grounded ? COYOTE : Math.max(0, player.coyote - dt);
  player.jumpBuf = Math.max(0, player.jumpBuf - dt);
  if (player.jumpBuf > 0 && (player.grounded || player.coyote > 0)) {
    player.vy = JUMP_VEL;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuf = 0;
    player.squash = 1.18;
    sfx.jump();
  }

  player.vy += GRAVITY * dt;
  if (player.vy > 900) player.vy = 900;

  const prevBottom = player.y + PLAYER_SIZE;
  player.y += player.vy * dt;

  // Ground / platform collision
  player.grounded = false;
  const solids = allSolids();
  for (const s of solids) {
    const withinX = player.x + PLAYER_SIZE - 4 > s.x && player.x + 4 < s.x + s.w;
    if (!withinX) continue;
    if (player.y + PLAYER_SIZE > s.y && player.y < s.y + s.h) {
      const isOneWay = s.h === 16;
      if (isOneWay) {
        // one-way floating platform: only land when falling from above
        if (player.vy >= 0 && prevBottom <= s.y + 6) {
          player.y = s.y - PLAYER_SIZE;
          land();
        }
      } else {
        if (player.vy >= 0 && prevBottom <= s.y + Math.max(10, player.vy * dt + 2)) {
          player.y = s.y - PLAYER_SIZE;
          land();
        } else if (player.y > s.y + 16) {
          // hit the side of the ground (fell short of a gap) → crash
          player.deathCause = 'wall';
          onGameOver();
          return;
        } else {
          // head just below the top — forgive it, snap onto the surface
          player.y = s.y - PLAYER_SIZE;
          land();
        }
      }
    }
  }

  // Squash/stretch relaxes back to 1
  player.squash += (1 - player.squash) * Math.min(1, dt * 12);

  // Off-screen fall
  if (player.y > LOGICAL + 60) {
    player.deathCause = 'fall';
    onGameOver();
    return;
  }

  // Spikes + bugs
  const hb = { x: player.x + 6, y: player.y + 6, w: PLAYER_SIZE - 12, h: PLAYER_SIZE - 12 };
  for (const c of world.chunks) {
    for (const sp of c.spikes) {
      const sb = { x: sp.x + 5, y: sp.y + 10, w: sp.w - 10, h: sp.h - 10 };
      if (overlap(hb, sb)) { player.deathCause = 'spike'; onGameOver(); return; }
    }
    for (const b of c.bugs) {
      const bb = { x: b.x + 4, y: b.y + 6, w: b.w - 8, h: b.h - 6 };
      if (overlap(hb, bb)) { player.deathCause = 'bug'; onGameOver(); return; }
    }
  }
}

function land() {
  if (!player.grounded && player.vy > 250) {
    player.squash = 0.8;
    sfx.land();
  }
  player.grounded = true;
  player.vy = 0;
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
function update(dt) {
  stateTime += dt;

  switch (state) {
    case STATE.TITLE:
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
      // physics substeps
      const steps = 3;
      const sdt = dt / steps;
      for (let i = 0; i < steps && state === STATE.PLAYING; i++) physicsStep(sdt);
      if (state !== STATE.PLAYING) break;
      updateCamera();
      updateChunks(camX);
      updateBugs(dt);
      break;
    }

    case STATE.PAUSED:
      break;

    case STATE.GAMEOVER:
      break;
  }
}

function updateBugs(dt) {
  for (const c of world.chunks) {
    for (const b of c.bugs) {
      b.x += b.dir * b.speed * dt;
      if (b.x < b.minX) { b.x = b.minX; b.dir = 1; }
      else if (b.x > b.maxX) { b.x = b.maxX; b.dir = -1; }
      b.phase += dt * 10;
    }
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky() {
  ctx.fillStyle = PAL.blueLt;
  ctx.fillRect(0, 0, LOGICAL, LOGICAL);
  // Sun
  ctx.fillStyle = PAL.yellow;
  ctx.beginPath();
  ctx.arc(530, 90, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.white;
  ctx.beginPath();
  ctx.arc(530, 90, 32, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(parallax, color, baseY, amp, step) {
  const off = camX * parallax;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, LOGICAL);
  const first = Math.floor(off / step) - 1;
  for (let i = first; i < first + Math.ceil(LOGICAL / step) + 3; i++) {
    const h = amp * (0.5 + 0.5 * hash(i));
    const x = i * step - off;
    ctx.lineTo(x, baseY);
    ctx.lineTo(x + step / 2, baseY - h);
    ctx.lineTo(x + step, baseY);
  }
  ctx.lineTo(LOGICAL, LOGICAL);
  ctx.closePath();
  ctx.fill();
}

function drawClouds() {
  const off = camX * 0.3;
  ctx.fillStyle = PAL.white;
  const span = 1200;
  const first = Math.floor(off / 300) - 1;
  for (let i = first; i < first + 7; i++) {
    const h1 = hash(i), h2 = hash(i + 999);
    const x = i * 300 + h1 * 160 - off;
    const y = 50 + h2 * 160;
    const s = 0.7 + h1 * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s, y - 8 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, y, 15 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s, y + 6 * s, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-Math.round(camX), 0);

  for (const c of world.chunks) {
    // Ground solids
    for (const s of c.solids) {
      ctx.fillStyle = PAL.brown;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = PAL.brownDk;
      ctx.fillRect(s.x, s.y + 42, s.w, s.h - 42);
      ctx.fillStyle = PAL.greenDk;
      ctx.fillRect(s.x, s.y, s.w, 10);
      ctx.fillStyle = PAL.greenLt;
      ctx.fillRect(s.x, s.y, s.w, 4);
      // speckles
      ctx.fillStyle = PAL.brownDk;
      for (let sx = Math.ceil(s.x / 46) * 46; sx < s.x + s.w; sx += 46) {
        const hsh = hash(sx);
        if (hsh > 0.35) ctx.fillRect(sx + hsh * 20, s.y + 20 + hsh * 26, 6, 6);
      }
    }
    // Floating platforms
    for (const p of c.platforms) {
      ctx.fillStyle = PAL.greenDk;
      rr(p.x, p.y, p.w, p.h, 6);
      ctx.fill();
      ctx.fillStyle = PAL.greenLt;
      ctx.fillRect(p.x + 3, p.y + 2, p.w - 6, 4);
    }
    // Spikes (white)
    for (const sp of c.spikes) {
      const n = Math.round(sp.w / 18);
      for (let i = 0; i < n; i++) {
        const sx = sp.x + i * 18;
        ctx.fillStyle = PAL.gray;
        ctx.beginPath();
        ctx.moveTo(sx + 2, sp.y + sp.h);
        ctx.lineTo(sx + 9, sp.y);
        ctx.lineTo(sx + 16, sp.y + sp.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = PAL.white;
        ctx.beginPath();
        ctx.moveTo(sx + 3, sp.y + sp.h);
        ctx.lineTo(sx + 9, sp.y + 2);
        ctx.lineTo(sx + 14, sp.y + sp.h);
        ctx.closePath();
        ctx.fill();
      }
    }
    // Spike bugs
    for (const b of c.bugs) {
      const wob = Math.sin(b.phase) * 2;
      // legs
      ctx.strokeStyle = PAL.black;
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const lx = b.x + 6 + i * 9;
        ctx.beginPath();
        ctx.moveTo(lx, b.y + b.h - 6);
        ctx.lineTo(lx + (i % 2 ? 5 : -5), b.y + b.h + 2 + wob * 0.4);
        ctx.stroke();
      }
      // body
      ctx.fillStyle = PAL.red;
      ctx.beginPath();
      ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2 + 3, b.w / 2, (b.h - 6) / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // spikes on back
      ctx.fillStyle = PAL.white;
      for (let i = 0; i < 4; i++) {
        const sx = b.x + 5 + i * 7;
        ctx.beginPath();
        ctx.moveTo(sx, b.y + 10);
        ctx.lineTo(sx + 3.5, b.y + wob * 0.3);
        ctx.lineTo(sx + 7, b.y + 10);
        ctx.closePath();
        ctx.fill();
      }
      // eyes
      ctx.fillStyle = PAL.black;
      const ex = b.x + (b.dir > 0 ? b.w - 8 : 8);
      ctx.beginPath();
      ctx.arc(ex, b.y + 12, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.white;
      ctx.beginPath();
      ctx.arc(ex - 1, b.y + 11, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer();
  ctx.restore();
}

function drawPlayer() {
  const s = PLAYER_SIZE;
  const sq = player.squash;
  const w = s / sq; // widen when squashed, narrow when stretched
  const h = s * sq;
  const px = player.x + (s - w) / 2;
  const py = player.y + (s - h);

  ctx.save();
  ctx.fillStyle = PAL.white;
  ctx.strokeStyle = PAL.black;
  ctx.lineWidth = 3;
  rr(px, py, w, h, 10);
  ctx.fill();
  ctx.stroke();

  if (player.dead) {
    // X eyes
    ctx.strokeStyle = PAL.black;
    ctx.lineWidth = 3;
    const cx = px + w / 2 + 6;
    for (const off of [-7, 7]) {
      const ex = cx + off, ey = py + h * 0.4;
      ctx.beginPath();
      ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4);
      ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4);
      ctx.stroke();
    }
  } else {
    // Eyes: small black, looking slightly right
    ctx.fillStyle = PAL.black;
    const cy = py + h * 0.38;
    ctx.beginPath();
    ctx.arc(px + w * 0.32 + 2, cy, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + w * 0.62 + 2, cy, 3.6, 0, Math.PI * 2);
    ctx.fill();
    // white glints (looking right)
    ctx.fillStyle = PAL.white;
    ctx.beginPath();
    ctx.arc(px + w * 0.32 + 3.4, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + w * 0.62 + 3.4, cy - 1, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// HUD / screens
// ---------------------------------------------------------------------------
function drawScorePill() {
  const txt = scoreNow() + ' m';
  ctx.font = 'bold 22px "Courier New", monospace';
  const tw = ctx.measureText(txt).width;
  ctx.fillStyle = PAL.navy;
  ctx.globalAlpha = 0.85;
  rr(12, 12, tw + 28, 40, 12);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, 26, 33);
}

function drawPauseButton() {
  ctx.fillStyle = PAL.navy;
  ctx.globalAlpha = 0.85;
  rr(pauseBtn.x, pauseBtn.y, pauseBtn.w, pauseBtn.h, 10);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.white;
  ctx.fillRect(pauseBtn.x + 15, pauseBtn.y + 13, 7, 20);
  ctx.fillRect(pauseBtn.x + 26, pauseBtn.y + 13, 7, 20);
}

function centerText(txt, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, LOGICAL / 2, y);
}

function drawMallowAt(cx, cy, size, bob) {
  const s = size;
  const h = s * (1 + Math.sin(bob) * 0.05);
  const w = s * (1 - Math.sin(bob) * 0.05);
  ctx.fillStyle = PAL.white;
  ctx.strokeStyle = PAL.black;
  ctx.lineWidth = 4;
  rr(cx - w / 2, cy - h / 2, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PAL.black;
  ctx.beginPath();
  ctx.arc(cx - w * 0.14, cy - h * 0.1, 4.5, 0, Math.PI * 2);
  ctx.arc(cx + w * 0.16, cy - h * 0.1, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PAL.white;
  ctx.beginPath();
  ctx.arc(cx - w * 0.14 + 1.6, cy - h * 0.1 - 1.4, 1.6, 0, Math.PI * 2);
  ctx.arc(cx + w * 0.16 + 1.6, cy - h * 0.1 - 1.4, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawTitle() {
  drawSky();
  drawClouds();
  drawHills(0.15, PAL.blueDk, 460, 110, 220);
  drawHills(0.25, PAL.greenDk, 500, 80, 170);
  ctx.fillStyle = PAL.brown;
  ctx.fillRect(0, 500, LOGICAL, 140);
  ctx.fillStyle = PAL.greenLt;
  ctx.fillRect(0, 500, LOGICAL, 8);

  // Title with shadow
  ctx.font = 'bold 58px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PAL.navy;
  ctx.fillText('BOUNCE', LOGICAL / 2 + 4, 150);
  ctx.fillText('MALLOW', LOGICAL / 2 + 4, 212);
  ctx.fillStyle = PAL.white;
  ctx.fillText('BOUNCE', LOGICAL / 2, 146);
  ctx.fillText('MALLOW', LOGICAL / 2, 208);

  drawMallowAt(LOGICAL / 2, 330, 74, stateTime * 4);

  const blink = Math.floor(stateTime * 2) % 2 === 0;
  if (blink) {
    centerText('PRESS ENTER / SPACE  OR  TAP TO START', 420, 'bold 22px "Courier New", monospace', PAL.navy);
  }
  centerText('One button: JUMP. Avoid spikes and spike bugs!', 462, '16px "Courier New", monospace', PAL.tealDk);
  if (best > 0) {
    centerText('BEST: ' + best + ' m', 560, 'bold 20px "Courier New", monospace', PAL.navy);
  }
}

function drawCountdown() {
  drawSky();
  drawClouds();
  drawHills(0.15, PAL.blueDk, 460, 110, 220);
  drawHills(0.25, PAL.greenDk, 500, 80, 170);
  drawWorld();
  drawScorePill();

  const n = Math.max(1, 3 - Math.floor(stateTime));
  const frac = stateTime % 1;
  const scale = 1 + (1 - Math.min(1, frac * 3)) * 0.5;
  ctx.save();
  ctx.translate(LOGICAL / 2, 260);
  ctx.scale(scale, scale);
  ctx.font = 'bold 120px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PAL.navy;
  ctx.fillText(String(n), 4, 4);
  ctx.fillStyle = PAL.white;
  ctx.fillText(String(n), 0, 0);
  ctx.restore();
  centerText('Get ready...', 400, 'bold 24px "Courier New", monospace', PAL.navy);
}

function drawPlaying() {
  drawSky();
  drawClouds();
  drawHills(0.15, PAL.blueDk, 460, 110, 220);
  drawHills(0.25, PAL.greenDk, 500, 80, 170);
  drawWorld();
  drawScorePill();
  drawPauseButton();
}

function drawDim() {
  ctx.fillStyle = PAL.navy;
  ctx.globalAlpha = 0.66;
  ctx.fillRect(0, 0, LOGICAL, LOGICAL);
  ctx.globalAlpha = 1;
}

function drawGameOver() {
  drawPlaying();
  drawDim();

  const score = scoreNow();
  centerText('GAME OVER', 200, 'bold 54px "Courier New", monospace', PAL.white);
  centerText('DISTANCE: ' + score + ' m', 280, 'bold 30px "Courier New", monospace', PAL.yellow);
  centerText('BEST: ' + best + ' m', 320, 'bold 22px "Courier New", monospace', PAL.pink);
  if (score >= best && score > 0) {
    centerText('NEW BEST!', 356, 'bold 20px "Courier New", monospace', PAL.greenLt);
  }
  if (stateTime > 0.6) {
    const blink = Math.floor(stateTime * 2) % 2 === 0;
    if (blink) {
      centerText('PRESS ENTER / SPACE  OR  TAP TO PLAY AGAIN', 430, 'bold 21px "Courier New", monospace', PAL.white);
    }
  }
}

function drawPaused() {
  drawPlaying();
  drawDim();
  centerText('PAUSED', 210, 'bold 48px "Courier New", monospace', PAL.white);

  // Resume button
  ctx.fillStyle = PAL.blueDk;
  rr(resumeBtn.x, resumeBtn.y, resumeBtn.w, resumeBtn.h, 12);
  ctx.fill();
  centerText('RESUME', resumeBtn.y + resumeBtn.h / 2, 'bold 24px "Courier New", monospace', PAL.white);

  // Quit button
  ctx.fillStyle = PAL.red;
  rr(quitBtn.x, quitBtn.y, quitBtn.w, quitBtn.h, 12);
  ctx.fill();
  centerText('QUIT', quitBtn.y + quitBtn.h / 2, 'bold 24px "Courier New", monospace', PAL.white);

  centerText('ESC / ENTER: resume     Q: quit', 470, '16px "Courier New", monospace', PAL.gray);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  switch (state) {
    case STATE.TITLE:    drawTitle(); break;
    case STATE.COUNTDOWN: drawCountdown(); break;
    case STATE.PLAYING:  drawPlaying(); break;
    case STATE.PAUSED:   drawPaused(); break;
    case STATE.GAMEOVER: drawGameOver(); break;
  }
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------
let lastT = performance.now();
function frame(now) {
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 1 / 20) dt = 1 / 20;   // clamp big frame gaps
  if (dt < 0) dt = 0;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
