// ============================================================
// Mario2 
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screens / HUD
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const winScreen = document.getElementById('winScreen');
const coinCountEl = document.getElementById('coinCount');
const gameOverScoreEl = document.getElementById('gameOverScore');
const winScoreEl = document.getElementById('winScore');

const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const muteBtn = document.getElementById('muteBtn');
const invincibleBar = document.getElementById('invincibleBar');
const invincibleFill = document.getElementById('invincibleFill');
const bossBar = document.getElementById('bossBar');
const bossFill = document.getElementById('bossFill');

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const GRAVITY = 0.7;
const MAX_FALL_SPEED = 16;
const MOVE_SPEED = 4.6;
const JUMP_FORCE = 14.5;
const DEATH_Y = 720
let lastTime = 0;
// ------------------------------------------------------------
// Level definition (world coordinates)
// ------------------------------------------------------------
const levelWidth = 4900;

// Ground segments, floating brick platforms, and pipes.
// type: 'ground' | 'brick' | 'pipe' - all solid, only rendering differs.
const platforms = [
  // ground segments (with pits between them)
  { x: 0,    y: 460, w: 500, h: 80, type: 'ground' },
  { x: 620,  y: 460, w: 380, h: 80, type: 'ground' },
  { x: 1100, y: 460, w: 300, h: 80, type: 'ground' },
  { x: 1500, y: 460, w: 500, h: 80, type: 'ground' },
  { x: 2100, y: 460, w: 200, h: 80, type: 'ground' },
  { x: 2400, y: 460, w: 400, h: 80, type: 'ground' },
  { x: 2900, y: 460, w: 400, h: 80, type: 'ground' },
  { x: 3460, y: 460, w: 200, h: 80, type: 'ground' },
  { x: 3820, y: 460, w: 1000, h: 80, type: 'ground' }, 

  // floating brick platforms
  { x: 720,  y: 360, w: 110, h: 24, type: 'brick' },
  { x: 920,  y: 290, w: 110, h: 24, type: 'brick' },
  { x: 1150, y: 370, w: 110, h: 24, type: 'brick' },
  { x: 1620, y: 340, w: 120, h: 24, type: 'brick' },
  { x: 1830, y: 260, w: 110, h: 24, type: 'brick' },
  { x: 2000, y: 380, w: 90,  h: 24, type: 'brick' },
  { x: 2320, y: 370, w: 90,  h: 24, type: 'brick' },
  { x: 2820, y: 360, w: 90,  h: 24, type: 'brick' },
  { x: 3660, y: 380, w: 110, h: 24, type: 'brick' },

  // pipes - classic obstacles you can also stand on top of
  { x: 150,  y: 380, w: 70,  h: 80,  type: 'pipe' },
  { x: 1300, y: 340, w: 70,  h: 120, type: 'pipe' },
  { x: 1900, y: 360, w: 70,  h: 100, type: 'pipe' },
  { x: 2700, y: 320, w: 70,  h: 140, type: 'pipe' },
];

// Triangular spikes - touching one is instant game over
const spikes = [
  { x: 300,  y: 420, w: 40, h: 40 },
  { x: 850,  y: 420, w: 40, h: 40 },
  { x: 1220, y: 420, w: 40, h: 40 },
  { x: 1700, y: 420, w: 40, h: 40 },
  { x: 1745, y: 420, w: 40, h: 40 },
  { x: 2470, y: 420, w: 40, h: 40 },
  { x: 2600, y: 420, w: 40, h: 40 },
  { x: 3050, y: 420, w: 40, h: 40 },
  { x: 3530, y: 420, w: 40, h: 40 }, 
];

// Coins (source data, cloned into `coins` on (re)start)
const coinsData = [
  { x: 185,  y: 330, r: 12 }, // bonus above pipe 1
  { x: 400,  y: 400, r: 12 },
  { x: 770,  y: 320, r: 12 },
  { x: 970,  y: 250, r: 12 },
  { x: 1200, y: 330, r: 12 },
  { x: 1335, y: 300, r: 12 }, // bonus above pipe 2
  { x: 1550, y: 420, r: 12 },
  { x: 1670, y: 300, r: 12 },
  { x: 1880, y: 220, r: 12 },
  { x: 1935, y: 320, r: 12 }, // bonus above pipe 3
  { x: 2040, y: 340, r: 12 },
  { x: 2150, y: 420, r: 12 },
  { x: 2360, y: 330, r: 12 },
  { x: 2450, y: 420, r: 12 },
  { x: 2650, y: 420, r: 12 },
  { x: 2735, y: 280, r: 12 }, // bonus above pipe 4
  { x: 2860, y: 320, r: 12 },
  { x: 3000, y: 420, r: 12 },
  { x: 3150, y: 420, r: 12 },
  { x: 3250, y: 420, r: 12 },
];

const powerupsData = [
  { x: 950,  y: 250, r: 14 },
  { x: 1850, y: 220, r: 14 },
  { x: 2750, y: 240, r: 14 },
];

let powerups = [];

const INVINCIBLE_DURATION = 6000;
let invincibleUntil = 0;

const swordData = {
  x: 3560,
  y: 400,
  r: 15
};

let sword = null;

const BOSS_MAX_HP = 6;
const BOSS_W = 220, BOSS_H = 200;
const boss = {
  x: 4350, y: 460 - BOSS_H, w: BOSS_W, h: BOSS_H,
  hp: BOSS_MAX_HP,
  alive: true,
  awake: false,
  nextFireballAt: 0,
  lastHitAt: 0,
};

const ARENA_START_X = 3820;
const NEAR_DRAGON_RANGE = 450;
const HIT_COOLDOWN = 500;
const FIREBALL_MIN_GAP = 1200;
const FIREBALL_MAX_GAP = 2200;
const FIREBALL_SPEED =  5.5;
const FIREBALL_R = 16;
let fireballs = [];

// Flagpole goal (classic end-of-level marker) + a small castle behind it
const flagpole = { x: 4680, y: 300, w: 12, h: 160 };
const flagpoleTrigger = { x: flagpole.x - 15, y: flagpole.y, w: flagpole.w + 30, h: flagpole.h };
const castle = { x: 4710, y: 360, w: 90, h: 100 };

const totalCoins = coinsData.length;

// ------------------------------------------------------------
// Mutable game state
// ------------------------------------------------------------
let coins = [];
let score = 0;
let camera = { x: 0 };
let state = 'start'; // 'start' | 'playing' | 'gameover' | 'win'

const player = {
  x: 50, y: 380, w: 32, h: 48,
  vx: 0, vy: 0,
  grounded: false,
  facing: 1,
  hasSword: false,
  invulnUntil: 0,
};

const keys = {};
let animTimer = 0;
let animFrame = 0;
let particles = [];
const P_FRAME_W = 32;
const P_FRAME_H = 48;
let screenShake = {
  time: 0,
  intensity: 0
};

const ASSETS ={};
const ASSET_MANIFEST = {
  player:      'assets/mario2.png',
  groundTop:   'assets/ground_top.png',
  groundSub:   'assets/ground_sub.png',
  brickTile:   'assets/brick_tile.png',
  coin:        'assets/coin.png',
  spike:       'assets/spike.png',
  bgSky:       'assets/bg_sky.png',
  bgMountains: 'assets/bg_mountain.png',
  bgHills:     'assets/bg_hills.png',
  powerup:     'assets/powerup.png',
  dragon:      'assets/dragon.png',
  flame:       'assets/flame.png',
  sword:       'assets/sword.png',
};

function loadAssets(onComplete) {
  let loaded = 0;
  const total = Object.keys(ASSET_MANIFEST).length;
  for (const [key, src] of Object.entries(ASSET_MANIFEST)) {
    const img = new Image();
    img.onload = img.onerror = () => { if (++loaded === total) onComplete(); };
    img.src = src;
    ASSETS[key] = img;
  }
}
function imgOk(key) {
  const img = ASSETS[key];
  return img && img.complete && img.naturalWidth > 0;
}

function spawnParticles(x, y, count, opts = {}) {
  const {
    color = '#FFD700',
    speed = 3,
    life = 30,
    size = 3,
    gravity = 0.15,
  } = opts;
  for (let i =0; i< count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = Math.random() * speed + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 1,
      life, maxLife: life,
      size: Math.random() * size + 1,
      color,
      gravity,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length -1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.gravity * dt;
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function triggerShake(intensity = 8, time = 15) {
  screenShake = {
    time, intensity
  };
}



// audio engine using files

const SFX = [];
const SFX_MANIFEST = {
  jump:    'music/jump.mp3',
  coin:    'music/coin.mp3',
  death:   'music/death.mp3',
  win:     'music/win.mp3',
  powerup: 'music/powerup.mp3',
};

let bgm = null;
let bossBgm = null;
let currentBgm = null;
let audioUnlocked = false;
let muted = false;

function loadAudio() {
  for (const [key, src] of Object.entries(SFX_MANIFEST)) {
    const a = new Audio(src);
    a.preload = 'auto';
    SFX[key] = a;
  }
  bgm = new Audio('music/bgm.mp3');
  bgm.loop = true;
  bgm.volume = 0.35;

  bossBgm = new Audio('music/boss.mp3');
  bossBgm.loop = true;
  bossBgm.volume = 0.35;
}


function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
}

function playSfx(key) {
  if (muted || !SFX[key]) return;
  const s = SFX[key].cloneNode();
  s.volume = 0.6;
  s.play().catch(() => {});
}

function sfxJump()  { playSfx('jump'); }
function sfxCoin()  { playSfx('coin'); }
function sfxDeath() { playSfx('death'); }
function sfxWin()   { playSfx('win'); }
function sfxPowerup() { playSfx('powerup'); }
function sfxHit()   { playSfx('coin'); }


function startMusic() {
  playTrack(bgm);
}

function startBossMusic() {
  playTrack(bossBgm);
}

function playTrack(track) {
  if (!track || currentBgm === track) return;
  if (currentBgm) fadeOutTrack(currentBgm);
  currentBgm = track;
  if (muted) return;
  track.currentTime = 0;
  track.play().catch(() => {});
}

function fadeOutTrack(track, fadeMs= 250) {
  const startVol = track.volume;
  const steps = 10;
  const stepTime = fadeMs/steps;
  let i = 0;
  const fade = setInterval(() => {
    i++;
    track.volume = Math.max(0, startVol * (1 - i / steps));
    if (i >= steps) {
      clearInterval(fade);
      track.pause();
      track.currentTime = 0;
      track.volume = startVol;
    }
  }, stepTime);
}

function stopMusic() {
  if (!currentBgm) return;
  fadeOutTrack(currentBgm);
  currentBgm = null;
}

// ------------------------------------------------------------
// Input
// ------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === ' ' || e.code === 'Space') e.preventDefault();
  keys[k] = true;
});
window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = false;
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
playAgainBtn.addEventListener('click', restartGame);
const iconUnmuted = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const iconMuted = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

muteBtn.innerHTML = iconUnmuted;
muteBtn.addEventListener('click', () => {
  muted = !muted;
  if (bgm) bgm.muted = muted;
  if (bossBgm) bossBgm.muted = muted;
  muteBtn.innerHTML = muted ? iconMuted : iconUnmuted;
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRectOverlap(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return (dx * dx + dy * dy) < circle.r * circle.r;
}

function updateHUD() {
  const s = String(score).padStart(2, '0');
  const t = String(totalCoins).padStart(2, '0');
  coinCountEl.innerHTML = `${s}<small>/${t}</small>`;
}

function updateBossHUD() {
  if (boss.awake && boss.alive) {
    bossBar.classList.remove('hidden');
    bossFill.style.width = `${Math.max(0, boss.hp / BOSS_MAX_HP) * 100}%`;
  } else {
    bossBar.classList.add('hidden');
  }
}

// ------------------------------------------------------------
// Game state transitions
// ------------------------------------------------------------
function initLevel() {
  player.x = 50;
  player.y = 380;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.facing = 1;

  coins = coinsData.map(c => ({ ...c }));
  powerups = powerupsData.map(p => ({ ...p }));
  invincibleUntil = 0;
  score = 0;
  camera.x = 0;
  player.hasSword = false;
  player.invulnUntil = 0;
  sword = { ...swordData };
  fireballs = [],
  boss.hp = BOSS_MAX_HP;
  boss.alive = true;
  boss.awake = false;
  boss.nextFireballAt= 0;
  boss.lastHitAt = 0;
  updateHUD();
  updateBossHUD();
}

function startGame() {
  unlockAudio();
  startMusic();
  initLevel();
  state = 'playing';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  winScreen.classList.add('hidden');
}

function restartGame() {
  startGame();
}

function gameOver() {
  if (state !== 'playing') return;
  state = 'gameover';
  stopMusic();
  sfxDeath();
  spawnParticles(player.x + player.w / 2, player.y + player.h / 2, 20, {
    color: '#E52521', speed: 6, life: 35, size: 4, gravity: 0.2,
  });
  triggerShake(10, 20);
  gameOverScoreEl.textContent = `You collected ${score} / ${totalCoins} coins.`;
  gameOverScreen.classList.remove('hidden');
}

function winGame() {
  if (state !== 'playing') return;
  state = 'win';
  stopMusic();
  sfxWin();
  spawnParticles(player.x + player.w / 2, player.y, 25, {
    color: '#FFD700', speed: 5, life: 40, size: 4, gravity: 0.08,
  });
  winScoreEl.textContent = `You collected ${score} / ${totalCoins} coins!`;
  winScreen.classList.remove('hidden');
}

// ------------------------------------------------------------
// Update
// ------------------------------------------------------------
function updatePlayer(dt) {
  player.vx = 0;
  if (keys['a']) { player.vx = -MOVE_SPEED; player.facing = -1; }
  if (keys['d']) { player.vx = MOVE_SPEED; player.facing = 1; }

  player.x += player.vx * dt;

  for (const p of platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
    }
  }

  player.x = clamp(player.x, 0, levelWidth - player.w);

  if (keys[' '] && player.grounded) {
    player.vy = -JUMP_FORCE;
    player.grounded = false;
    sfxJump();
    spawnParticles(player.x + player.w / 2, player.y + player.h, 6,{
      color: '#D8D8D8', speed: 2, life: 18, size: 3, gravity: 0.05,
    });
  }

  // --- gravity ---
  player.vy += GRAVITY * dt; ;
  player.vy = Math.min(player.vy, MAX_FALL_SPEED);

  player.grounded = false;
  player.y += player.vy * dt;

  for (const p of platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0) {
        player.y = p.y + p.h;
        player.vy = 0;
      }
    }
  }

  // --- fell into a pit ---
  if (player.y > DEATH_Y) {
    gameOver();
    return;
  }

  // --- spikes ---
  for (const s of spikes) {
    const hitbox = { x: s.x + 8, y: s.y + 12, w: s.w - 16, h: s.h - 12 };
    if (rectsOverlap(player, hitbox)) {
      if (Date.now() < invincibleUntil) continue;
      gameOver();
      return;
    }
  }

  for (let i = coins.length - 1; i >= 0; i--) {
    if (circleRectOverlap(coins[i], player)) {
      spawnParticles(coins[i].x, coins[i].y, 10, {
        color: '#FFD700', speed:4, life: 25, size: 3, gravity: 0.1,
      });
      coins.splice(i, 1);
      score++;
      updateHUD();
      sfxCoin();
    }
  }

  for (let i = powerups.length - 1; i >= 0; i--) {
    if (circleRectOverlap(powerups[i], player)) {
      powerups.splice(i, 1);
      invincibleUntil = Date.now() + INVINCIBLE_DURATION; 
      sfxPowerup();
    }
  }

  //sword
  if (sword && circleRectOverlap(sword, player)) {
    sword = null;
    player.hasSword = true;
    sfxPowerup();
    spawnParticles(player.x + player.w / 2, player.y, 12, {
      color: '#E8E8E8', speed: 4, life: 25, size: 3, gravity: 0.1,
    });
  }

  updateBoss(dt);

  // --- flagpole / goal ---
  if (rectsOverlap(player, flagpoleTrigger)) {
    winGame();
  }
}

function updateBoss(dt) {
  if (!boss.alive) return;
  if (!boss.awake) {
    const nearDragon = boss.x - (player.x + player.w) < NEAR_DRAGON_RANGE;
    if (player.hasSword || nearDragon) {
      boss.awake = true;
      boss.nextFireballAt = Date.now() + FIREBALL_MIN_GAP;
      startBossMusic();
      updateBossHUD();
    }
  }
  if (!boss.awake) return;

  const now = Date.now();
  if (now >= boss.nextFireballAt) {
    const targetY = player.y + player.h / 2;
    const originX = boss.x + (player.x < boss.x ? 0 : boss.w);
    const originY = boss.y + boss.h * 0.35;
    const dx = (player.x + player.w / 2) - originX;
    const dy = targetY - originY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    fireballs.push({
      x: originX, y: originY,
      vx: (dx / dist) * FIREBALL_SPEED,
      vy: (dy / dist) * FIREBALL_SPEED,
      r: FIREBALL_R,
    });
    boss.nextFireballAt = now + FIREBALL_MIN_GAP + Math.random() * (FIREBALL_MAX_GAP - FIREBALL_MIN_GAP);
  }

  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    if (f.x < camera.x - 60 || f.x > camera.x + canvas.width + 60) {
      fireballs.splice(i, 1);
      continue;
    }
    if (circleRectOverlap(f, player)) {
      fireballs.splice(i, 1);
      if (now >= player.invulnUntil && now >= invincibleUntil) {
        gameOver();
        return;
      }
    }
  }

  if (rectsOverlap(player, boss)) {
    if (player.hasSword) {
      if (now >= boss.lastHitAt + HIT_COOLDOWN) {
        boss.lastHitAt = now;
        boss.hp--;
        player.invulnUntil = now + HIT_COOLDOWN;
        sfxHit();
        triggerShake(6, 10);
        spawnParticles(player.x + (boss.x > player.x ? player.w : 0), boss.y + boss.h * 0.5, 14, {
          color: '#FF6A00', speed: 5, life: 25, size: 4, gravity: 0.1,
        });
        updateBossHUD();
        if (boss.hp <= 0) {
          boss.alive = false;
          fireballs = [];
          spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, 40, {
            color: '#FF6A00', speed: 7, life: 45, size: 5, gravity: 0.05,
          });
          triggerShake(12, 25);
          updateBossHUD();
          winGame();
        }
      }
    } else if (now >= invincibleUntil) {
      gameOver();
    }
  }
}

function updateCamera() {
  const target = player.x + player.w / 2 - canvas.width / 2;
  camera.x = clamp(target, 0, levelWidth - canvas.width);
}

// ------------------------------------------------------------
// Render - flat colors only, no gradients
// ------------------------------------------------------------
function drawBackground() {
  if (imgOk('bgSky')) {
    ctx.drawImage(ASSETS.bgSky, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#4A90D9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 110, 78, 40, 0, Math.PI * 2);
    ctx.fill();
    const cloudOff = camera.x * 0.13;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 10; i++) {
      drawCloud((i * 290 + 90) - (cloudOff % 2900), 52 + (i % 3) * 38);
    }
  }
  drawParallaxLayer('bgMountains', 0.07, canvas.height - 300);
  drawParallaxLayer('bgHills',     0.25, canvas.height - 200);
}

function drawParallaxLayer(key, speed, destY) {
  if (!imgOk(key)) return;
  const img = ASSETS[key];
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const offset = (camera.x * speed) % iw;
  for (let x = -offset; x < canvas.width + iw; x += iw) {
    ctx.drawImage(img, x, destY, iw, ih);
  }
} 

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x,      y,      18, 0, Math.PI * 2);
  ctx.arc(x + 20, y - 9,  22, 0, Math.PI * 2);
  ctx.arc(x + 44, y - 3,  16, 0, Math.PI * 2);
  ctx.fill();
}

// Brick-block style used for ground and floating platforms
function drawBrickBlock(x, y, w, h) {
  const T = 32;
  if (imgOk('brickTile')) {
    for (let ty = y; ty < y + h; ty += T) {
      for (let tx = x; tx < x + w; tx += T) {
        ctx.drawImage(ASSETS.brickTile,
          0, 0, Math.min(T, x+w-tx), Math.min(T, y+h-ty),
          tx, ty, Math.min(T, x+w-tx), Math.min(T, y+h-ty));
      }
    }
  } else {
    ctx.fillStyle = '#C84C0C';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#7A2E00';
    ctx.lineWidth = 2;
    for (let gx = x; gx <= x+w; gx += T) { ctx.beginPath(); ctx.moveTo(gx,y); ctx.lineTo(gx,y+h); ctx.stroke(); }
    for (let gy = y; gy <= y+h; gy += T) { ctx.beginPath(); ctx.moveTo(x,gy); ctx.lineTo(x+w,gy); ctx.stroke(); }
  }
}

function drawGroundBlock(x, y, w, h) {
  const topImg = ASSETS.groundTop;
  const subImg = ASSETS.groundSub;
  const T = (imgOk('groundTop') && topImg.naturalWidth) || 32;
  for (let row = 0, ty = y; ty < y + h; ty += T, row++) {
    const key  = row === 0 ? 'groundTop' : 'groundSub';
    const img  = ASSETS[key];
    const rowH = Math.min(T, y + h - ty);
    for (let tx = x; tx < x + w; tx += T) {
      const colW = Math.min(T, x + w - tx);
      if (imgOk(key)) {
        ctx.drawImage(img,
          0, 0, img.naturalWidth * (colW / T), img.naturalHeight * (rowH / T),
          tx, ty, colW, rowH);
      } else {
        ctx.fillStyle = row === 0 ? '#3DB520' : '#8B5E3C';
        ctx.fillRect(tx, ty, colW, rowH);
      }
    }
  }
}

// Green pipe obstacle/platform
function drawPipe(x, y, w, h) {
  const body = '#00A800';
  const dark = '#046B04';
  const light = '#4FE24F';
  const lipH = 22;

  ctx.fillStyle = body;
  ctx.fillRect(x - 8, y, w + 16, lipH);
  ctx.fillRect(x, y + lipH, w, h - lipH);

  ctx.strokeStyle = dark;
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 8, y, w + 16, lipH);
  ctx.strokeRect(x, y + lipH, w, h - lipH);

  ctx.fillStyle = light;
  ctx.fillRect(x + 8, y + lipH + 6, 8, h - lipH - 12);
}

function drawCastle() {
  ctx.fillStyle = '#9B9B9B';
  ctx.fillRect(castle.x, castle.y, castle.w, castle.h);

  ctx.fillStyle = '#6E6E6E';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(castle.x + i * 24, castle.y - 14, 16, 14);
  }

  ctx.fillStyle = '#3A2A1A';
  ctx.fillRect(castle.x + castle.w / 2 - 12, castle.y + castle.h - 46, 24, 46);
}

function drawFlagpole() {
  ctx.fillStyle = '#EDEDED';
  ctx.fillRect(flagpole.x, flagpole.y, flagpole.w, flagpole.h);

  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(flagpole.x + flagpole.w / 2, flagpole.y - 8, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3FBF3F';
  ctx.beginPath();
  ctx.moveTo(flagpole.x + flagpole.w, flagpole.y + 8);
  ctx.lineTo(flagpole.x + flagpole.w + 38, flagpole.y + 20);
  ctx.lineTo(flagpole.x + flagpole.w, flagpole.y + 32);
  ctx.closePath();
  ctx.fill();
}

function drawSpikes() {
  for (const s of spikes) {
    if (imgOk('spike')) {
      ctx.drawImage(ASSETS.spike, s.x, s.y, s.w, s.h);
    } else {
      ctx.fillStyle = '#D8D8D8'; ctx.strokeStyle = '#8A8A8A'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.h);
      ctx.lineTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
}

const COIN_FRAME_W = 24;
const COIN_FRAMES = 6;

function drawCoins() {
  const bob = Math.sin(Date.now() / 300) * 4;
  for (const c of coins) {
    const by = c.y + Math.sin(Date.now() / 300 + c.x * 0.1) * 4;
    if (imgOk('coin')) {
      ctx.drawImage(ASSETS.coin, c.x - c.r, by - c.r, c.r * 2, c.r * 2);
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(c.x, by, c.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 3; ctx.stroke();
    }
  }
}

function drawPowerups() {
  for (const p of powerups) {
    const by = p.y + Math.sin(Date.now() / 250 + p.x * 0.1) * 5;
    if (imgOk('powerup')) {
      ctx.drawImage(ASSETS.powerup, p.x - p.r, by - p.r, p.r * 2, p.r * 2);
    } else {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const ang2 = ang + Math.PI / 5;
        ctx.lineTo(p.x + Math.cos(ang) * p.r, by + Math.sin(ang) * p.r);
        ctx.lineTo(p.x + Math.cos(ang2) * p.r * 0.45, by + Math.sin(ang2) * p.r * 0.45);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}


function drawPlayer() {
  const p = player;
  const isInvincible = Date.now() < invincibleUntil;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  if (player.facing === -1) ctx.scale(-1, 1);

  if (isInvincible) {
    const hue = (Date.now() / 4) % 360;
    ctx.filter = `hue-rotate(${hue}deg) saturate(3) brightness(1.2)`;
  }
  if (imgOk('player')) {
    ctx.drawImage(ASSETS.player, -p.w / 2, -p.h / 2, p.w, p.h);
  } else {
    ctx.translate(-p.w / 2, -p.h / 2);
    ctx.fillStyle = '#E52521'; ctx.fillRect(0, 0, p.w, p.h * 0.4);
    ctx.fillStyle = '#2A55D8'; ctx.fillRect(0, p.h * 0.4, p.w, p.h * 0.6);
  }
  ctx.filter = 'none';
  ctx.restore();
}

function drawSword() {
  if (!sword) return;
  const by = sword.y + Math.sin(Date.now() / 280) * 5;
  if (imgOk('sword')) {
    ctx.drawImage(ASSETS.sword, sword.x - sword.r, by - sword.r, sword.r * 2, sword.r * 2);
  } else {
    ctx.save();
    ctx.translate(sword.x, by);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#D8D8D8';
    ctx.fillRect(-3, -sword.r, 6, sword.r * 1.6);
    ctx.fillStyle = '#8A5A2B';
    ctx.fillRect(-6, sword.r * 0.5, 12, 6);
    ctx.restore();
  }
}

function drawBoss() {
  if (!boss.alive) return;
  const facingLeft = player.x < boss.x;
  ctx.save();
  if (imgOk('dragon')) {
    ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
    if (!facingLeft) ctx.scale(-1, 1);
    ctx.drawImage(ASSETS.dragon, -boss.w / 2, -boss.h / 2, boss.w, boss.h);
  } else {
    ctx.fillStyle = '#7A1FA2';
    ctx.fillRect(boss.x, boss.y, boss.w, boss.h);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(boss.x + (facingLeft ? boss.w * 0.2 : boss.w * 0.8), boss.y + boss.h * 0.25, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFireballs() {
  for (const f of fireballs) {
    if (imgOk('flame')) {
      ctx.drawImage(ASSETS.flame, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    } else {
      ctx.fillStyle = '#FF6A00';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFD23F';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawWorld() {
  ctx.save();
  ctx.translate(-camera.x, 0);

  drawCastle();

  for (const p of platforms) {
    if      (p.type === 'pipe')   drawPipe(p.x, p.y, p.w, p.h);
    else if (p.type === 'ground') drawGroundBlock(p.x, p.y, p.w, p.h);
    else                          drawBrickBlock(p.x, p.y, p.w, p.h);
  }

  drawSpikes();
  drawCoins();
  drawPowerups();
  drawSword();
  drawBoss();
  drawFireballs();
  drawFlagpole();
  drawPlayer();

  ctx.restore();
}

function render() {
  ctx.save();
  if (screenShake.time > 0) {
    const dx = (Math.random() - 0.5) * screenShake.intensity;
    const dy = (Math.random() - 0.5) * screenShake.intensity;
    ctx.translate(dx, dy);
  }
  drawBackground();
  drawWorld();

  ctx.save();
  ctx.translate(-camera.x, 0);
  drawParticles();
  ctx.restore();
  ctx.restore();
}

// ------------------------------------------------------------
// Main loop
// ------------------------------------------------------------
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  let dt = (timestamp - lastTime) / (1000 / 60);
  dt = Math.min(dt, 2);
  lastTime = timestamp;

  if (state === 'playing') {
    updatePlayer(dt);
    updateCamera();
    if (Math.abs(player.vx) > 0.1 && player.grounded) {
      if ((animTimer += dt) >= 6) {
        animTimer = 0; animFrame++;
      }
    } else {
      animTimer = 0; animFrame = 0;
    }
    const remaining = invincibleUntil - Date.now();
    if (remaining > 0) {
      invincibleBar.classList.remove('hidden');
      invincibleFill.style.width = `${(remaining / INVINCIBLE_DURATION) * 100}%`;
    } else {
      invincibleBar.classList.add('hidden');
    }
  }
  updateParticles(dt);
  if (screenShake.time > 0){
    screenShake.time -= dt;
  }
  render();
  requestAnimationFrame(loop);
}

// initial setup so the canvas isn't blank behind the start screen
loadAssets(() => {
  loadAudio();
  initLevel();
  requestAnimationFrame(loop);
});