/**
 * Bounce Mallow - An Endless Procedural Platformer
 * Uses Arne16 color palette exclusively
 */

// ─── Arne16 Color Palette ───
const C = {
    BLACK:     '#000000',
    GRAY:      '#9D9D9D',
    WHITE:     '#FFFFFF',
    RED:       '#BE2633',
    PINK:      '#E06F8B',
    DARKBROWN: '#493C2B',
    BROWN:     '#A46422',
    ORANGE:    '#EB8931',
    YELLOW:    '#F7E26B',
    DARKTEAL:  '#2F484E',
    GREEN:     '#44891A',
    LIME:      '#A3CE27',
    DARKBLUE:  '#1B2632',
    BLUE:      '#005784',
    LIGHTBLUE: '#31A2F2',
    SKYBLUE:   '#B2DCEF',
};

// ─── Game States ───
const STATE = {
    TITLE: 'title',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
};

// ─── Canvas Setup ───
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const BASE_SIZE = 800;
canvas.width = BASE_SIZE;
canvas.height = BASE_SIZE;

let scale = 1;

function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    scale = Math.min(w / BASE_SIZE, h / BASE_SIZE);
    canvas.style.width = (BASE_SIZE * scale) + 'px';
    canvas.style.height = (BASE_SIZE * scale) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── Game Constants ───
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const AUTO_SPEED = 2.5;
const CHUNK_WIDTH = 400;
const GROUND_Y = 650;
const PLAYER_SIZE = 28;
const PLAYER_EYE_SIZE = 4;
const SPAKE_SIZE = 20;
const ENEMY_SIZE = 24;
const PLATFORM_H = 16;

// ─── Game State Variables ───
let gameState = STATE.TITLE;
let player = null;
let camera = { x: 0, y: 0 };
let chunks = [];
let particles = [];
let score = 0;
let bestScore = 0;
let countdownTimer = 0;
let countdownValue = 3;
let frameCount = 0;
let shakeTimer = 0;
let shakeIntensity = 0;

// ─── Input ───
let jumpPressed = false;
let escPressed = false;

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        jumpPressed = true;
    }
    if (e.code === 'Escape') {
        e.preventDefault();
        escPressed = true;
    }
});

canvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    jumpPressed = true;
});
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jumpPressed = true;
}, { passive: false });

// ─── Player Object ───
function createPlayer(x, y) {
    return {
        x: x,
        y: y,
        vx: 0,
        vy: 0,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        grounded: false,
        jumpBufferTimer: 0,
        coyoteTimer: 0,
        alive: true,
        squash: 1,
        stretch: 1,
        blinkTimer: 0,
        blinking: false,
    };
}

// ─── Chunk System ───
let nextChunkIndex = 0;
let chunkDifficulty = 0;

function createChunk(index, isSafe) {
    const x = index * CHUNK_WIDTH;
    const diff = isSafe ? 0 : Math.min(index * 0.04, 1.0);
    const chunk = {
        index: index,
        x: x,
        platforms: [],
        spikes: [],
        enemies: [],
        decorations: [],
    };

    // Build ground with possible gaps (no gaps in safe chunks)
    const gapChance = isSafe ? 0 : 0.2 + diff * 0.25;
    const hasGap = Math.random() < gapChance && index > 0;

    if (hasGap && index > 0) {
        const gapSize = 60 + Math.random() * 60 + diff * 40;
        const gapStart = 40 + Math.random() * (CHUNK_WIDTH - gapSize - 80);
        chunk.platforms.push({
            x: x, y: GROUND_Y,
            w: gapStart, h: BASE_SIZE - GROUND_Y
        });
        chunk.platforms.push({
            x: x + gapStart + gapSize, y: GROUND_Y,
            w: CHUNK_WIDTH - gapStart - gapSize, h: BASE_SIZE - GROUND_Y
        });
    } else {
        chunk.platforms.push({
            x: x, y: GROUND_Y,
            w: CHUNK_WIDTH, h: BASE_SIZE - GROUND_Y
        });
    }

    // Add elevated platforms
    const platCount = Math.floor(1 + Math.random() * 2);
    for (let i = 0; i < platCount; i++) {
        const px = x + 40 + Math.random() * (CHUNK_WIDTH - 120);
        const py = GROUND_Y - 80 - Math.random() * 100;
        const pw = 60 + Math.random() * 80;
        chunk.platforms.push({ x: px, y: py, w: pw, h: PLATFORM_H });
    }

    // Add spikes on ground platforms only (tall platforms = ground)
    const spikeChance = isSafe ? 0 : 0.3 + diff * 0.3;
    for (const plat of chunk.platforms) {
        if (plat.h > 30 && Math.random() < spikeChance && plat.w > 80) {
            const numSpikes = 1 + Math.floor(Math.random() * 2);
            for (let s = 0; s < numSpikes; s++) {
                const sx = plat.x + 30 + Math.random() * (plat.w - 60);
                chunk.spikes.push({
                    x: sx, y: plat.y - SPAKE_SIZE,
                    w: SPAKE_SIZE, h: SPAKE_SIZE
                });
            }
        }
    }

    // Add patrol enemies
    const enemyChance = isSafe ? 0 : 0.25 + diff * 0.3;
    if (Math.random() < enemyChance && index > 1 && !isSafe) {
        const platIdx = Math.floor(Math.random() * chunk.platforms.length);
        const plat = chunk.platforms[platIdx];
        if (plat.w > 80) {
            const ex = plat.x + 30 + Math.random() * (plat.w - 60);
            chunk.enemies.push({
                x: ex,
                y: plat.y - ENEMY_SIZE,
                w: ENEMY_SIZE,
                h: ENEMY_SIZE,
                startX: plat.x + 10,
                endX: plat.x + plat.w - ENEMY_SIZE - 10,
                speed: 0.8 + Math.random() * 0.8 + diff * 0.5,
                dir: Math.random() < 0.5 ? 1 : -1,
                alive: true,
                animTimer: Math.random() * Math.PI * 2,
            });
        }
    }

    // Add background decorations (clouds, stars)
    if (Math.random() < 0.6) {
        chunk.decorations.push({
            type: 'cloud',
            x: x + Math.random() * CHUNK_WIDTH,
            y: 40 + Math.random() * 120,
            size: 30 + Math.random() * 40,
        });
    }
    if (Math.random() < 0.3) {
        for (let s = 0; s < 3; s++) {
            chunk.decorations.push({
                type: 'star',
                x: x + Math.random() * CHUNK_WIDTH,
                y: 30 + Math.random() * 100,
                size: 2 + Math.random() * 3,
                twinkle: Math.random() * Math.PI * 2,
            });
        }
    }

    return chunk;
}

function getChunkAt(x) {
    return Math.floor(x / CHUNK_WIDTH);
}

function updateChunks() {
    if (!player) return;
    const playerChunk = getChunkAt(player.x);
    const viewLeft = camera.x - CHUNK_WIDTH;
    const viewRight = camera.x + BASE_SIZE + CHUNK_WIDTH * 2;

    // Generate new chunks ahead
    while (nextChunkIndex <= playerChunk + 2) {
        chunks.push(createChunk(nextChunkIndex, false));
        nextChunkIndex++;
    }

    // Remove old chunks
    chunks = chunks.filter(c => (c.index * CHUNK_WIDTH + CHUNK_WIDTH) > viewLeft);
}

// ─── Particles ───
function spawnParticles(x, y, color, count, spread) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * spread,
            vy: (Math.random() - 1) * spread * 0.7,
            life: 0.6 + Math.random() * 0.4,
            maxLife: 0.6 + Math.random() * 0.4,
            size: 2 + Math.random() * 4,
            color: color,
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// ─── Collision ───
function aabb(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.width > b.x &&
           a.y < b.y + (b.h || b.height) &&
           a.y + a.height > b.y;
}

function pointInTri(px, py, x1, y1, x2, y2, x3, y3) {
    const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
    const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(hasNeg && hasPos);
}

function playerVsSpikes() {
    const p = player;
    // Shrink player hitbox slightly for fairer spike collisions
    const margin = 4;
    const hitX = p.x + margin;
    const hitY = p.y + margin;
    const hitW = p.width - margin * 2;
    const hitH = p.height - margin * 2;

    for (const chunk of chunks) {
        for (const spike of chunk.spikes) {
            const sx = spike.x;
            const sy = spike.y;
            const sw = spike.w;
            const sh = spike.h;

            // Quick AABB rejection
            if (hitX + hitW < sx - 2 || hitX > sx + sw + 2 ||
                hitY + hitH < sy - 2 || hitY > sy + sh + 2) continue;

            // Triangle vertices (pointing up)
            const tx1 = sx;
            const ty1 = sy + sh;
            const tx2 = sx + sw;
            const ty2 = sy + sh;
            const tx3 = sx + sw / 2;
            const ty3 = sy;

            // Check if any corner of the hitbox is inside the spike triangle
            const corners = [
                [hitX, hitY], [hitX + hitW, hitY],
                [hitX, hitY + hitH], [hitX + hitW, hitY + hitH],
                [hitX + hitW / 2, hitY + hitH / 2],
            ];
            for (const [cx, cy] of corners) {
                if (pointInTri(cx, cy, tx1, ty1, tx2, ty2, tx3, ty3)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ─── Reset Game ───
function resetGame() {
    player = createPlayer(150, GROUND_Y - PLAYER_SIZE - 20);
    camera.x = 0;
    camera.y = 0;
    chunks = [];
    particles = [];
    score = 0;
    frameCount = 0;
    nextChunkIndex = 0;
    shakeTimer = 0;
    // Create initial chunks (first few are safe for the player to start)
    for (let i = -1; i <= 5; i++) {
        chunks.push(createChunk(i, i < 3));
    }
    nextChunkIndex = 6;
}

// ─── Update ───
let lastTime = 0;

function update(dt) {
    frameCount++;

    // Handle state transitions
    if (gameState === STATE.TITLE) {
        if (jumpPressed) {
            gameState = STATE.COUNTDOWN;
            resetGame();
            countdownTimer = 0;
            countdownValue = 3;
        }
        jumpPressed = false;
        return;
    }

    if (gameState === STATE.COUNTDOWN) {
        countdownTimer += dt;
        countdownValue = 3 - Math.floor(countdownTimer);
        if (countdownTimer >= 3) {
            gameState = STATE.PLAYING;
        }
        jumpPressed = false;
        return;
    }

    if (gameState === STATE.GAMEOVER) {
        updateParticles(dt);
        if (jumpPressed) {
            if (bestScore === 0 || score > bestScore) {
                bestScore = score;
            }
            gameState = STATE.COUNTDOWN;
            resetGame();
            countdownTimer = 0;
            countdownValue = 3;
        }
        jumpPressed = false;
        return;
    }

    if (gameState === STATE.PAUSED) {
        if (jumpPressed) {
            gameState = STATE.PLAYING;
        }
        if (escPressed) {
            gameState = STATE.TITLE;
        }
        jumpPressed = false;
        escPressed = false;
        return;
    }

    // ─── PLAYING STATE ───
    if (escPressed) {
        gameState = STATE.PAUSED;
        escPressed = false;
        jumpPressed = false;
        return;
    }

    // Jump buffer for responsive controls
    if (jumpPressed) {
        player.jumpBufferTimer = 0.1;
        jumpPressed = false;
    }
    if (player.jumpBufferTimer > 0) {
        player.jumpBufferTimer -= dt;
    }

    // Coyote time
    if (player.grounded) {
        player.coyoteTimer = 0.1;
    } else {
        player.coyoteTimer -= dt;
    }

    // Apply jump
    if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        player.jumpBufferTimer = 0;
        player.coyoteTimer = 0;
        player.squash = 0.7;
        player.stretch = 1.3;
        spawnParticles(player.x + player.width / 2, player.y + player.height, C.WHITE, 5, 3);
    }

    // Auto-move right
    player.vx = AUTO_SPEED;

    // Running dust particles
    if (player.grounded && frameCount % 6 === 0) {
        spawnParticles(player.x + 2, player.y + player.height, C.GRAY, 1, 1.5);
    }

    // Apply gravity
    player.vy += GRAVITY;

    // Clamp vertical velocity
    if (player.vy > 15) player.vy = 15;

    // Move player
    player.x += player.vx;
    player.y += player.vy;

    // Squash and stretch recovery
    player.squash += (1 - player.squash) * 0.15;
    player.stretch += (1 - player.stretch) * 0.15;

    // Blink timer
    player.blinkTimer -= dt;
    if (player.blinkTimer <= 0) {
        player.blinking = !player.blinking;
        player.blinkTimer = player.blinking ? 0.15 : 2 + Math.random() * 4;
    }

    // Platform collision
    player.grounded = false;
    for (const chunk of chunks) {
        for (const plat of chunk.platforms) {
            if (player.x + player.width > plat.x &&
                player.x < plat.x + plat.w) {
                // Landing on top
                if (player.vy >= 0 &&
                    player.y + player.height >= plat.y &&
                    player.y + player.height <= plat.y + plat.h + player.vy + 2) {
                    player.y = plat.y - player.height;
                    player.vy = 0;
                    player.grounded = true;
                    if (player.stretch > 1.05) {
                        player.squash = 1.2;
                        player.stretch = 0.8;
                        spawnParticles(player.x + player.width / 2, player.y + player.height, C.GRAY, 3, 2);
                    }
                }
            }
        }
    }

    // Spike collision
    if (playerVsSpikes()) {
        killPlayer();
        return;
    }

    // Enemy collision & update
    for (const chunk of chunks) {
        for (const enemy of chunk.enemies) {
            if (!enemy.alive) continue;
            // Move enemy
            enemy.animTimer += dt * 3;
            enemy.x += enemy.speed * enemy.dir;
            if (enemy.x <= enemy.startX || enemy.x + enemy.w >= enemy.endX) {
                enemy.dir *= -1;
            }
            // Check collision with player
            if (player.x + player.width > enemy.x + 4 &&
                player.x < enemy.x + enemy.w - 4 &&
                player.y + player.height > enemy.y + 4 &&
                player.y < enemy.y + enemy.h - 4) {
                killPlayer();
                return;
            }
        }
    }

    // Fall death
    if (player.y > camera.y + BASE_SIZE + 50) {
        killPlayer();
        return;
    }

    // Update score
    score = Math.max(score, Math.floor(player.x / 10));

    // Update camera
    const targetCamX = player.x - BASE_SIZE * 0.35;
    camera.x += (targetCamX - camera.x) * 0.08;
    if (camera.x < 0) camera.x = 0;

    // Update chunks
    updateChunks();

    // Update particles
    updateParticles(dt);

    // Screen shake
    if (shakeTimer > 0) shakeTimer -= dt;
}

function killPlayer() {
    player.alive = false;
    gameState = STATE.GAMEOVER;
    if (score > bestScore) bestScore = score;
    shakeTimer = 0.4;
    shakeIntensity = 8;
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, C.WHITE, 20, 8);
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, C.PINK, 10, 6);
    spawnParticles(player.x + player.width / 2, player.y + player.height / 2, C.YELLOW, 8, 5);
}

// ─── Drawing Functions ───
function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, BASE_SIZE);
    grad.addColorStop(0, C.DARKBLUE);
    grad.addColorStop(0.35, C.BLUE);
    grad.addColorStop(0.65, C.LIGHTBLUE);
    grad.addColorStop(1, C.SKYBLUE);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

    // Subtle sun/moon glow
    const sunX = BASE_SIZE * 0.75 - camera.x * 0.02;
    const sunY = 100;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 80);
    sunGrad.addColorStop(0, 'rgba(247, 226, 107, 0.4)');
    sunGrad.addColorStop(0.5, 'rgba(247, 226, 107, 0.1)');
    sunGrad.addColorStop(1, 'rgba(247, 226, 107, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
}

function drawDecorations() {
    for (const chunk of chunks) {
        for (const dec of chunk.decorations) {
            const sx = dec.x - camera.x;
            const sy = dec.y;
            if (sx < -100 || sx > BASE_SIZE + 100) continue;

            if (dec.type === 'cloud') {
                ctx.fillStyle = 'rgba(178, 220, 239, 0.6)';
                const s = dec.size;
                ctx.beginPath();
                ctx.arc(sx, sy, s * 0.5, 0, Math.PI * 2);
                ctx.arc(sx - s * 0.35, sy + 3, s * 0.4, 0, Math.PI * 2);
                ctx.arc(sx + s * 0.35, sy + 3, s * 0.4, 0, Math.PI * 2);
                ctx.arc(sx, sy - s * 0.2, s * 0.35, 0, Math.PI * 2);
                ctx.fill();
            } else if (dec.type === 'star') {
                const alpha = 0.5 + 0.5 * Math.sin(frameCount * 0.05 + dec.twinkle);
                ctx.fillStyle = `rgba(247, 226, 107, ${alpha})`;
                ctx.fillRect(sx, sy, dec.size, dec.size);
            }
        }
    }
}

function drawPlatforms() {
    for (const chunk of chunks) {
        for (const plat of chunk.platforms) {
            const sx = plat.x - camera.x;
            const sy = plat.y;
            if (sx + plat.w < 0 || sx > BASE_SIZE) continue;

            const drawH = Math.min(plat.h, BASE_SIZE - sy);
            if (drawH <= 0) continue;

            // Main body
            ctx.fillStyle = C.DARKBROWN;
            ctx.fillRect(sx, sy, plat.w, drawH);

            // Top highlight edge
            ctx.fillStyle = C.BROWN;
            ctx.fillRect(sx, sy, plat.w, 3);

            // Grass/ground detail on top for ground platforms
            if (plat.h > 30) {
                ctx.fillStyle = C.GREEN;
                ctx.fillRect(sx, sy + 2, plat.w, 2);

                // Small grass blades
                ctx.fillStyle = C.LIME;
                for (let gx = sx + 5; gx < sx + plat.w - 5; gx += 15) {
                    const bladeH = 3 + Math.sin(gx * 0.5) * 2;
                    ctx.fillRect(gx, sy - bladeH + 2, 2, bladeH);
                }

                // Ground texture lines
                ctx.fillStyle = C.DARKTEAL;
                for (let gx = sx + 10; gx < sx + plat.w - 10; gx += 25) {
                    ctx.fillRect(gx, sy + 8, 12, 1);
                }
            } else {
                // Small platform edge detail
                ctx.fillStyle = C.BROWN;
                ctx.fillRect(sx, sy + plat.h - 2, plat.w, 2);
            }
        }
    }
}

function drawSpikes() {
    for (const chunk of chunks) {
        for (const spike of chunk.spikes) {
            const sx = spike.x - camera.x;
            const sy = spike.y;
            if (sx + spike.w < 0 || sx > BASE_SIZE) continue;

            ctx.fillStyle = C.WHITE;
            ctx.beginPath();
            ctx.moveTo(sx, sy + spike.h);
            ctx.lineTo(sx + spike.w / 2, sy);
            ctx.lineTo(sx + spike.w, sy + spike.h);
            ctx.closePath();
            ctx.fill();

            // Dark outline
            ctx.strokeStyle = C.GRAY;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

function drawEnemies() {
    for (const chunk of chunks) {
        for (const enemy of chunk.enemies) {
            if (!enemy.alive) continue;
            const sx = enemy.x - camera.x;
            const sy = enemy.y;
            if (sx + enemy.w < -50 || sx > BASE_SIZE + 50) continue;

            const wobble = Math.sin(enemy.animTimer) * 2;

            // Body - red bug shape
            ctx.fillStyle = C.RED;
            // Main body (rounded)
            const bx = sx, by = sy + wobble;
            const bw = enemy.w, bh = enemy.h;

            // Body
            ctx.beginPath();
            ctx.ellipse(bx + bw / 2, by + bh * 0.6, bw * 0.45, bh * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Head
            ctx.beginPath();
            ctx.ellipse(bx + bw / 2, by + bh * 0.25, bw * 0.3, bh * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();

            // Spikes on back
            ctx.fillStyle = C.ORANGE;
            for (let i = 0; i < 3; i++) {
                const angle = -Math.PI / 2 + (i - 1) * 0.4;
                const spx = bx + bw / 2 + Math.cos(angle) * bh * 0.3;
                const spy = by + bh * 0.6 + Math.sin(angle) * bh * 0.3;
                ctx.beginPath();
                ctx.moveTo(bx + bw / 2, by + bh * 0.5);
                ctx.lineTo(spx, spy - 4);
                ctx.lineTo(bx + bw / 2 + (spx - bx - bw / 2) * 0.5, spy);
                ctx.closePath();
                ctx.fill();
            }

            // Eyes
            ctx.fillStyle = C.BLACK;
            const eyeOffX = enemy.dir > 0 ? 2 : -2;
            ctx.fillRect(bx + bw * 0.32 + eyeOffX, by + bh * 0.18, 3, 3);
            ctx.fillRect(bx + bw * 0.62 + eyeOffX, by + bh * 0.18, 3, 3);

            // Legs
            ctx.strokeStyle = C.RED;
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const legY = by + bh * 0.5 + i * 5;
                const legWiggle = Math.sin(enemy.animTimer + i) * 3;
                // Left leg
                ctx.beginPath();
                ctx.moveTo(bx + bw * 0.2, legY);
                ctx.lineTo(bx + legWiggle, legY + 6);
                ctx.stroke();
                // Right leg
                ctx.beginPath();
                ctx.moveTo(bx + bw * 0.8, legY);
                ctx.lineTo(bx + bw - legWiggle, legY + 6);
                ctx.stroke();
            }
        }
    }
}

function drawPlayer() {
    if (!player) return;
    const p = player;
    const sx = p.x - camera.x;
    const sy = p.y;

    // Squash and stretch transform
    const cx = sx + p.width / 2;
    const cy = sy + p.height;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(p.squash, p.stretch);
    ctx.translate(-p.width / 2, -p.height);

    // Shadow
    if (p.grounded) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(p.width / 2, p.height + 1, p.width * 0.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Marshmallow body (white with rounded corners)
    ctx.fillStyle = C.WHITE;
    const r = 8;
    const px = 0, py = 0, pw = p.width, ph = p.height;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pw - r, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
    ctx.lineTo(px + pw, py + ph - r);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
    ctx.lineTo(px + r, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
    ctx.lineTo(px, py + r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.closePath();
    ctx.fill();

    // Subtle pink outline
    ctx.strokeStyle = C.PINK;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes (looking slightly right)
    if (!p.blinking) {
        const eyeY = p.height * 0.35;
        const eyeRightOffset = 3;
        // Left eye
        ctx.fillStyle = C.BLACK;
        ctx.beginPath();
        ctx.arc(p.width * 0.33 + eyeRightOffset, eyeY, PLAYER_EYE_SIZE, 0, Math.PI * 2);
        ctx.fill();
        // Right eye
        ctx.beginPath();
        ctx.arc(p.width * 0.67 + eyeRightOffset, eyeY, PLAYER_EYE_SIZE, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = C.WHITE;
        ctx.beginPath();
        ctx.arc(p.width * 0.33 + eyeRightOffset + 1, eyeY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.width * 0.67 + eyeRightOffset + 1, eyeY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Closed eyes (blinking)
        ctx.strokeStyle = C.BLACK;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.width * 0.25, p.height * 0.4);
        ctx.lineTo(p.width * 0.42, p.height * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.width * 0.58, p.height * 0.4);
        ctx.lineTo(p.width * 0.75, p.height * 0.4);
        ctx.stroke();
    }

    ctx.restore();
}

function drawParticles() {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        const sx = p.x - camera.x;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

function drawHUD() {
    // Score background
    ctx.fillStyle = 'rgba(27, 38, 50, 0.6)';
    roundRect(15, 15, 170, 40, 8);
    ctx.fill();

    // Score text
    ctx.fillStyle = C.YELLOW;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Score: ' + score, 25, 36);

    // Best score
    if (bestScore > 0) {
        ctx.fillStyle = C.GRAY;
        ctx.font = '12px monospace';
        ctx.fillText('Best: ' + bestScore, 25, 48);
    }
}

function drawTitleScreen() {
    drawSky();

    // Floating particles for atmosphere
    for (let i = 0; i < 20; i++) {
        const x = (frameCount * 0.3 + i * 137) % BASE_SIZE;
        const y = 200 + Math.sin(frameCount * 0.02 + i * 2) * 50 + i * 15;
        const alpha = 0.3 + 0.3 * Math.sin(frameCount * 0.03 + i);
        ctx.fillStyle = `rgba(247, 226, 107, ${alpha})`;
        ctx.fillRect(x, y, 3, 3);
    }

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title shadow
    ctx.fillStyle = C.DARKBROWN;
    ctx.font = 'bold 60px monospace';
    ctx.fillText('BOUNCE', BASE_SIZE / 2 + 3, 203);
    ctx.fillText('MALLOW', BASE_SIZE / 2 + 3, 263);

    // Title text
    ctx.fillStyle = C.WHITE;
    ctx.fillText('BOUNCE', BASE_SIZE / 2, 200);
    ctx.fillStyle = C.YELLOW;
    ctx.fillText('MALLOW', BASE_SIZE / 2, 260);

    // Draw a marshmallow character
    const marx = BASE_SIZE / 2;
    const mary = 340;
    drawMarshmallowBig(marx, mary, 48);

    // Instructions
    const pulse = 0.7 + 0.3 * Math.sin(frameCount * 0.06);
    ctx.fillStyle = `rgba(178, 220, 239, ${pulse})`;
    ctx.font = '22px monospace';
    ctx.fillText('Press SPACE / ENTER / TAP', BASE_SIZE / 2, 440);

    ctx.fillStyle = C.GRAY;
    ctx.font = '16px monospace';
    ctx.fillText('Jump to survive!', BASE_SIZE / 2, 475);

    // Controls info
    ctx.fillStyle = C.LIGHTBLUE;
    ctx.font = '14px monospace';
    ctx.fillText('SPACE / ENTER / TAP — Jump', BASE_SIZE / 2, 530);
    ctx.fillText('ESC — Pause', BASE_SIZE / 2, 555);

    // Best score
    if (bestScore > 0) {
        ctx.fillStyle = C.YELLOW;
        ctx.font = '16px monospace';
        ctx.fillText('Best Score: ' + bestScore, BASE_SIZE / 2, 610);
    }
}

function drawMarshmallowBig(x, y, size) {
    const r = 12;
    const bob = Math.sin(frameCount * 0.05) * 5;

    ctx.fillStyle = C.WHITE;
    ctx.beginPath();
    ctx.moveTo(x - size / 2 + r, y + bob - size / 2);
    ctx.lineTo(x + size / 2 - r, y + bob - size / 2);
    ctx.quadraticCurveTo(x + size / 2, y + bob - size / 2, x + size / 2, y + bob - size / 2 + r);
    ctx.lineTo(x + size / 2, y + bob + size / 2 - r);
    ctx.quadraticCurveTo(x + size / 2, y + bob + size / 2, x + size / 2 - r, y + bob + size / 2);
    ctx.lineTo(x - size / 2 + r, y + bob + size / 2);
    ctx.quadraticCurveTo(x - size / 2, y + bob + size / 2, x - size / 2, y + bob + size / 2 - r);
    ctx.lineTo(x - size / 2, y + bob - size / 2 + r);
    ctx.quadraticCurveTo(x - size / 2, y + bob - size / 2, x - size / 2 + r, y + bob - size / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = C.PINK;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = C.BLACK;
    ctx.beginPath();
    ctx.arc(x - size * 0.18 + 4, y + bob - size * 0.1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.22 + 4, y + bob - size * 0.1, 6, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = C.WHITE;
    ctx.beginPath();
    ctx.arc(x - size * 0.18 + 5, y + bob - size * 0.1 - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.22 + 5, y + bob - size * 0.1 - 2, 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawCountdown() {
    drawSky();
    drawDecorations();
    drawPlatforms();

    // Overlay
    ctx.fillStyle = 'rgba(27, 38, 50, 0.7)';
    ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const val = countdownValue;
    const pulse = 1 + 0.1 * Math.sin(frameCount * 0.1);
    const fontSize = val > 0 ? Math.floor(100 * pulse) : 50;

    ctx.fillStyle = C.YELLOW;
    ctx.font = `bold ${fontSize}px monospace`;
    if (val > 0) {
        ctx.fillText(val.toString(), BASE_SIZE / 2, BASE_SIZE / 2);
    } else {
        ctx.fillText('GO!', BASE_SIZE / 2, BASE_SIZE / 2);
    }

    // Draw player
    if (player) {
        drawPlayer();
    }
}

function drawPauseScreen() {
    // Darken background
    ctx.fillStyle = 'rgba(27, 38, 50, 0.8)';
    ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = C.WHITE;
    ctx.font = 'bold 48px monospace';
    ctx.fillText('PAUSED', BASE_SIZE / 2, BASE_SIZE / 2 - 50);

    const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.06);
    ctx.fillStyle = `rgba(178, 220, 239, ${pulse})`;
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE / TAP to Resume', BASE_SIZE / 2, BASE_SIZE / 2 + 10);

    ctx.fillStyle = C.GRAY;
    ctx.font = '18px monospace';
    ctx.fillText('Press ESC to Quit', BASE_SIZE / 2, BASE_SIZE / 2 + 50);

    ctx.fillStyle = C.YELLOW;
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, BASE_SIZE / 2, BASE_SIZE / 2 + 100);
}

function drawGameOverScreen() {
    drawSky();
    drawDecorations();
    drawPlatforms();
    drawSpikes();
    drawEnemies();
    drawParticles();

    // Overlay
    ctx.fillStyle = 'rgba(27, 38, 50, 0.85)';
    ctx.fillRect(0, 0, BASE_SIZE, BASE_SIZE);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Game Over text
    ctx.fillStyle = C.RED;
    ctx.font = 'bold 56px monospace';
    ctx.fillText('GAME OVER', BASE_SIZE / 2, 180);

    // Score panel
    ctx.fillStyle = C.DARKTEAL;
    roundRect(BASE_SIZE / 2 - 140, 240, 280, 180, 12);
    ctx.fill();
    ctx.strokeStyle = C.GRAY;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = C.WHITE;
    ctx.font = '20px monospace';
    ctx.fillText('Final Score', BASE_SIZE / 2, 275);

    ctx.fillStyle = C.YELLOW;
    ctx.font = 'bold 48px monospace';
    ctx.fillText(score.toString(), BASE_SIZE / 2, 330);

    if (score >= bestScore && score > 0) {
        ctx.fillStyle = C.ORANGE;
        ctx.font = 'bold 18px monospace';
        ctx.fillText('★ NEW BEST! ★', BASE_SIZE / 2, 375);
    } else {
        ctx.fillStyle = C.GRAY;
        ctx.font = '16px monospace';
        ctx.fillText('Best: ' + bestScore, BASE_SIZE / 2, 375);
    }

    // Play again
    const pulse = 0.6 + 0.4 * Math.sin(frameCount * 0.06);
    ctx.fillStyle = `rgba(178, 220, 239, ${pulse})`;
    ctx.font = '22px monospace';
    ctx.fillText('Press SPACE / TAP to Play Again', BASE_SIZE / 2, 490);

    ctx.fillStyle = C.GRAY;
    ctx.font = '16px monospace';
    ctx.fillText('Press ESC for Title Screen', BASE_SIZE / 2, 530);
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ─── Main Draw ───
function draw() {
    ctx.save();

    // Screen shake
    if (shakeTimer > 0) {
        const sx = (Math.random() - 0.5) * shakeIntensity * (shakeTimer / 0.4);
        const sy = (Math.random() - 0.5) * shakeIntensity * (shakeTimer / 0.4);
        ctx.translate(sx, sy);
    }

    if (gameState === STATE.TITLE) {
        drawTitleScreen();
    } else if (gameState === STATE.COUNTDOWN) {
        drawCountdown();
    } else if (gameState === STATE.PLAYING) {
        drawSky();
        drawDecorations();
        drawPlatforms();
        drawSpikes();
        drawEnemies();
        drawParticles();
        if (player) drawPlayer();
        drawHUD();
    } else if (gameState === STATE.PAUSED) {
        drawSky();
        drawDecorations();
        drawPlatforms();
        drawSpikes();
        drawEnemies();
        if (player) drawPlayer();
        drawHUD();
        drawPauseScreen();
    } else if (gameState === STATE.GAMEOVER) {
        drawGameOverScreen();
    }

    ctx.restore();
}

// ─── Game Loop ───
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// ─── Start ───
bestScore = 0;
requestAnimationFrame(gameLoop);
