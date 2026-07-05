// ============================================================
// RECTANGLE RUNNER — a tiny canvas-only platformer
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

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------
const GRAVITY = 0.7;
const MAX_FALL_SPEED = 16;
const MOVE_SPEED = 4.6;
const JUMP_FORCE = 14.5;
const DEATH_Y = 720; // falling below this = dead (fell into a pit)

// ------------------------------------------------------------
// Level definition (world coordinates)
// ------------------------------------------------------------
const levelWidth = 3460;

// Ground segments, floating brick platforms, and pipes.
// type: 'ground' | 'brick' | 'pipe' — all solid, only rendering differs.
const platforms = [
  // ground segments (with pits between them)
  { x: 0,    y: 460, w: 500, h: 80, type: 'ground' },
  { x: 620,  y: 460, w: 380, h: 80, type: 'ground' },
  { x: 1100, y: 460, w: 300, h: 80, type: 'ground' },
  { x: 1500, y: 460, w: 500, h: 80, type: 'ground' },
  { x: 2100, y: 460, w: 200, h: 80, type: 'ground' },
  { x: 2400, y: 460, w: 400, h: 80, type: 'ground' },
  { x: 2900, y: 460, w: 560, h: 80, type: 'ground' },

  // floating brick platforms
  { x: 720,  y: 360, w: 110, h: 24, type: 'brick' },
  { x: 920,  y: 290, w: 110, h: 24, type: 'brick' },
  { x: 1150, y: 370, w: 110, h: 24, type: 'brick' },
  { x: 1620, y: 340, w: 120, h: 24, type: 'brick' },
  { x: 1830, y: 260, w: 110, h: 24, type: 'brick' },
  { x: 2000, y: 380, w: 90,  h: 24, type: 'brick' },
  { x: 2320, y: 370, w: 90,  h: 24, type: 'brick' },
  { x: 2820, y: 360, w: 90,  h: 24, type: 'brick' },

  // pipes — classic obstacles you can also stand on top of
  { x: 150,  y: 380, w: 70,  h: 80,  type: 'pipe' },
  { x: 1300, y: 340, w: 70,  h: 120, type: 'pipe' },
  { x: 1900, y: 360, w: 70,  h: 100, type: 'pipe' },
  { x: 2700, y: 320, w: 70,  h: 140, type: 'pipe' },
];

// Triangular spikes — touching one is instant game over
const spikes = [
  { x: 300,  y: 420, w: 40, h: 40 },
  { x: 850,  y: 420, w: 40, h: 40 },
  { x: 1220, y: 420, w: 40, h: 40 },
  { x: 1700, y: 420, w: 40, h: 40 },
  { x: 1745, y: 420, w: 40, h: 40 },
  { x: 2470, y: 420, w: 40, h: 40 },
  { x: 2600, y: 420, w: 40, h: 40 },
  { x: 3050, y: 420, w: 40, h: 40 },
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

// Flagpole goal (classic end-of-level marker) + a small castle behind it
const flagpole = { x: 3340, y: 300, w: 12, h: 160 };
const flagpoleTrigger = { x: flagpole.x - 15, y: flagpole.y, w: flagpole.w + 30, h: flagpole.h };
const castle = { x: 3370, y: 360, w: 90, h: 100 };

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
};

const keys = {};

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
  coinCountEl.textContent = `Coins: ${score} / ${totalCoins}`;
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
  score = 0;
  camera.x = 0;
  updateHUD();
}

function startGame() {
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
  gameOverScoreEl.textContent = `You collected ${score} / ${totalCoins} coins.`;
  gameOverScreen.classList.remove('hidden');
}

function winGame() {
  if (state !== 'playing') return;
  state = 'win';
  winScoreEl.textContent = `You collected ${score} / ${totalCoins} coins!`;
  winScreen.classList.remove('hidden');
}

// ------------------------------------------------------------
// Update
// ------------------------------------------------------------
function updatePlayer() {
  // --- horizontal movement ---
  player.vx = 0;
  if (keys['a']) { player.vx = -MOVE_SPEED; player.facing = -1; }
  if (keys['d']) { player.vx = MOVE_SPEED; player.facing = 1; }

  player.x += player.vx;

  for (const p of platforms) {
    if (rectsOverlap(player, p)) {
      if (player.vx > 0) player.x = p.x - player.w;
      else if (player.vx < 0) player.x = p.x + p.w;
    }
  }

  player.x = clamp(player.x, 0, levelWidth - player.w);

  // --- jump ---
  if (keys[' '] && player.grounded) {
    player.vy = -JUMP_FORCE;
    player.grounded = false;
  }

  // --- gravity ---
  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, MAX_FALL_SPEED);

  player.grounded = false;
  player.y += player.vy;

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
      gameOver();
      return;
    }
  }

  // --- coins ---
  for (let i = coins.length - 1; i >= 0; i--) {
    if (circleRectOverlap(coins[i], player)) {
      coins.splice(i, 1);
      score++;
      updateHUD();
    }
  }

  // --- flagpole / goal ---
  if (rectsOverlap(player, flagpoleTrigger)) {
    winGame();
  }
}

function updateCamera() {
  const target = player.x + player.w / 2 - canvas.width / 2;
  camera.x = clamp(target, 0, levelWidth - canvas.width);
}

// ------------------------------------------------------------
// Render — flat colors only, no gradients
// ------------------------------------------------------------
function drawBackground() {
  // flat sky
  ctx.fillStyle = '#5C94FC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // sun
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(canvas.width - 120 - camera.x * 0.05, 90, 44, 0, Math.PI * 2);
  ctx.fill();

  // parallax bushes/hills (slow scroll)
  const hillOffset = camera.x * 0.3;
  ctx.fillStyle = '#00A800';
  for (let i = -1; i < 6; i++) {
    const hx = i * 400 - (hillOffset % 400);
    ctx.beginPath();
    ctx.arc(hx, 480, 130, Math.PI, 0);
    ctx.fill();
  }

  // clouds (faster parallax) — classic puffy silhouette, flat white
  const cloudOffset = camera.x * 0.15;
  ctx.fillStyle = '#FFFFFF';
  for (let i = 0; i < 8; i++) {
    const cx = (i * 300 + 100) - (cloudOffset % 2400);
    const cy = 60 + (i % 3) * 40;
    drawCloud(cx, cy);
  }
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.arc(x + 18, y - 7, 18, 0, Math.PI * 2);
  ctx.arc(x + 38, y, 14, 0, Math.PI * 2);
  ctx.fill();
}

// Brick-block style used for ground and floating platforms
function drawBrickBlock(x, y, w, h) {
  const base = '#C84C0C';
  const line = '#7A2E00';
  const highlight = '#E8752E';
  const tile = 32;

  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  for (let gx = x; gx <= x + w; gx += tile) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += tile) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }

  ctx.fillStyle = highlight;
  for (let gx = x; gx < x + w; gx += tile) {
    for (let gy = y; gy < y + h; gy += tile) {
      ctx.fillRect(gx + 4, gy + 4, 5, 5);
      ctx.fillRect(gx + tile - 9, gy + tile - 9, 5, 5);
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
  ctx.fillStyle = '#D8D8D8';
  ctx.strokeStyle = '#8A8A8A';
  ctx.lineWidth = 2;
  for (const s of spikes) {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.h);
    ctx.lineTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x + s.w, s.y + s.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawCoins() {
  const bob = Date.now() / 300;
  for (const c of coins) {
    const by = c.y + Math.sin(bob + c.x * 0.1) * 4;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(c.x, by, c.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#FFF6C6';
    ctx.fillRect(c.x - 2, by - c.r + 3, 3, c.r * 2 - 6);
  }
}

// Simple two-tone rectangle character (red cap/shirt, blue overalls)
function drawPlayer() {
  const topH = player.h * 0.4;
  const botH = player.h - topH;

  // overalls (blue)
  ctx.fillStyle = '#2A55D8';
  ctx.fillRect(player.x, player.y + topH, player.w, botH);

  // shirt/cap (red)
  ctx.fillStyle = '#E52521';
  ctx.fillRect(player.x, player.y, player.w, topH);

  // eyes (show facing direction)
  ctx.fillStyle = '#fff';
  const eyeX = player.facing === 1 ? player.x + player.w - 12 : player.x + 4;
  ctx.fillRect(eyeX, player.y + topH - 2, 8, 8);
  ctx.fillStyle = '#222';
  ctx.fillRect(eyeX + (player.facing === 1 ? 3 : 1), player.y + topH, 4, 4);

  // mustache
  ctx.fillStyle = '#3A2A1A';
  ctx.fillRect(player.x + player.w / 2 - 6, player.y + topH + 8, 12, 4);
}

function drawWorld() {
  ctx.save();
  ctx.translate(-camera.x, 0);

  drawCastle();

  for (const p of platforms) {
    if (p.type === 'pipe') drawPipe(p.x, p.y, p.w, p.h);
    else drawBrickBlock(p.x, p.y, p.w, p.h);
  }

  drawSpikes();
  drawCoins();
  drawFlagpole();
  drawPlayer();

  ctx.restore();
}

function render() {
  drawBackground();
  drawWorld();
}

// ------------------------------------------------------------
// Main loop
// ------------------------------------------------------------
function loop() {
  if (state === 'playing') {
    updatePlayer();
    updateCamera();
  }
  render();
  requestAnimationFrame(loop);
}

// initial setup so the canvas isn't blank behind the start screen
initLevel();
requestAnimationFrame(loop);
