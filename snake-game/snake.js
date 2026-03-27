    /* ── Setup ─────────────────────────────────────── */
    const board   = document.getElementById("board");
    const ctx     = board.getContext("2d");
    const scoreEl = document.getElementById("score");
    const hiEl    = document.getElementById("hiScore");
    const hiNameEl= document.getElementById("hiName");
    const overlay = document.getElementById("overlay");
    const finalEl = document.getElementById("finalScore");
    const wrap    = document.getElementById("canvasWrap");
    const gameWrap= document.getElementById("gameWrap");
    const saveHiToggle = document.getElementById("saveHiToggle");
    const playerNameInput = document.getElementById("playerName");
    const joystickToggle = document.getElementById("joystickToggle");
    const joystick = document.getElementById("joystick");

    const BASE_GRID_SIZE = 20;
    let gridSize = BASE_GRID_SIZE;
    let tileSize = board.width / gridSize;
    const APPLE_BONUS_THRESHOLD = 15;
    const BASE_STEP_MS = 500;
    const SPEEDUP_PER_APPLE = 0.9;
    const SLOWDOWN_ON_MEDKIT = 1.15;
    const MIN_STEP_MS = 50;
    const MAX_STEP_MS = 3000;
    const RED_CROSS_LIFETIME_MS = 10000;
    const RED_CROSS_SPAWN_CHANCE = 0.025;
    const AMBULANCE_SIZE = 2; // 2x2 cells = 4 squares
    const APPLE_SPAWN_INTERVAL_MS = 5000;
    const BOUNCE_RANDOM_TURN_INTERVAL_MS = 4000;
    const EGG_SIZE = 2;
    const EGG_VISIBLE_MS = 5000;
    const FIRST_EGG_DELAY_MS = 10000;
    const EGG_RESPAWN_MIN_MS = 10000;
    const EGG_RESPAWN_MAX_MS = 15000;
    const FLOWER_SIZE = 2;
    const FLOWER_VISIBLE_MS = 5000;
    const FLOWER_RESPAWN_MIN_MS = 8000;
    const FLOWER_RESPAWN_MAX_MS = 12000;
    const FLOWER_TRIANGLE_BLINK_MS = 5000;
    const FLOWER_TRIANGLE_ACTIVE_MS = 5000;
    const GUN_SIZE = 3;
    const GUN_VISIBLE_MS = 5000;
    const GUN_RESPAWN_MS = 20000;
    const PLAYGROUND_GROW_INTERVAL_MS = 15000;
    const PLAYGROUND_GROWTH = 0.1;
    const PLAYGROUND_MAX_MULTIPLIER = 2;
    const PLAYGROUND_REDUCE_FACTOR = 0.5;
    const CHAOS_IDLE_MS = 10000;
    const CHAOS_TURN_CHANCE = 0.28;
    const HELPER_SNAKE_COUNT = 5;
    const HELPER_SNAKE_LENGTH = 5;
    const HELPER_LIFETIME_MS = 10000;
    const HI_SCORE_KEY = "snake_neon_hi_score";
    const HI_NAME_KEY = "snake_neon_hi_name";

    let snake, dir, qDir, foods = [], score, hiScore = 0, hiName = "Player";
    let applesEaten = 0;
    let stepMs = BASE_STEP_MS;
    let loopId, paused, dead;
    let appleSpawnLoopId;
    let particles = [];
    let foodPulse = 0;
    let flashPower = 0;
    let postBounceRandomTurnAt = 0;
    let medkit = null;
    let egg = null;
    let flower = null;
    let gunItem = null;
    let helperSnakes = [];
    let helperMoveToggle = false;
    let nextEggSpawnAt = 0;
    let nextFlowerSpawnAt = 0;
    let nextGunSpawnAt = 0;
    let triangleBlinkUntil = 0;
    let triangleModeUntil = 0;
    let hasGun = false;
    let bullets = [];
    let nextPlaygroundResizeAt = 0;
    let lastManualControlAt = 0;
    let joystickEnabled = false;

    const HELPER_PALETTE = [
      { body: "#38bdf8", head: "#7dd3fc" },
      { body: "#f97316", head: "#fdba74" },
      { body: "#22c55e", head: "#86efac" },
      { body: "#a855f7", head: "#d8b4fe" },
      { body: "#e11d48", head: "#fda4af" }
    ];

    /* ── Particles ─────────────────────────────────── */
    // Spawn radial particles around a board cell for hit/eat effects.
    function spawnParticles(x, y, color, count = 12, speedScale = 1, sizeBoost = 0, decayBoost = 0) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4;
        const speed = (1.5 + Math.random() * 3) * speedScale;
        particles.push({
          x: x * tileSize + tileSize / 2,
          y: y * tileSize + tileSize / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: 0.02 + Math.random() * 0.02 + decayBoost,
          size: 2 + Math.random() * 3 + sizeBoost,
          color
        });
      }
    }

    // Advance particle movement and remove expired particles.
    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    // Draw all active particles with glow and fade.
    function drawParticles() {
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ── Floating +1 ───────────────────────────────── */
    // Show floating "+1" text at a given board cell.
    function showScorePop(cellX, cellY) {
      const pop = document.createElement("div");
      pop.className = "score-pop";
      pop.textContent = "+1";
      const rect = board.getBoundingClientRect();
      const scale = rect.width / board.width;
      pop.style.left = (cellX * tileSize + tileSize / 2) * scale + "px";
      pop.style.top  = (cellY * tileSize) * scale + "px";
      wrap.appendChild(pop);
      pop.addEventListener("animationend", () => pop.remove());
    }

    // Show floating custom status text (e.g. SLOW) at a board cell.
    function showTextPop(cellX, cellY, text, color = "#f87171") {
      const pop = document.createElement("div");
      pop.className = "score-pop";
      pop.textContent = text;
      pop.style.color = color;
      pop.style.textShadow = `0 0 8px ${color}`;
      const rect = board.getBoundingClientRect();
      const scale = rect.width / board.width;
      pop.style.left = (cellX * tileSize + tileSize / 2) * scale + "px";
      pop.style.top  = (cellY * tileSize) * scale + "px";
      wrap.appendChild(pop);
      pop.addEventListener("animationend", () => pop.remove());
    }

    // Trigger a brief full-screen flash for stronger pickup impact.
    function triggerFlash(amount = 0.35) {
      flashPower = Math.min(1, flashPower + amount);
    }

    /* ── Screen shake ──────────────────────────────── */
    // Trigger a short container shake for collision feedback.
    function screenShake() {
      gameWrap.classList.add("shake");
      gameWrap.addEventListener("animationend", () => gameWrap.classList.remove("shake"), { once: true });
    }

    /* ── Helpers ────────────────────────────────────── */
    // Return a random board coordinate.
    function randCell() {
      return { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    }

    // Increase the playable field by percentage and recalculate cell size.
    function growFieldBy(percent) {
      gridSize = Math.max(gridSize + 1, Math.round(gridSize * (1 + percent)));
      tileSize = board.width / gridSize;
      clampEntitiesToGrid();
    }

    function shrinkFieldBy(percent) {
      gridSize = Math.max(BASE_GRID_SIZE, Math.round(gridSize * (1 - percent)));
      tileSize = board.width / gridSize;
      clampEntitiesToGrid();
    }

    // Check whether a board cell is within the 2x2 ambulance footprint.
    function isCellInsideMedkit(x, y) {
      if (!medkit) return false;
      return x >= medkit.x && x < medkit.x + AMBULANCE_SIZE && y >= medkit.y && y < medkit.y + AMBULANCE_SIZE;
    }

    // Check whether a board cell is inside the egg footprint.
    function isCellInsideEgg(x, y) {
      if (!egg) return false;
      return x >= egg.x && x < egg.x + EGG_SIZE && y >= egg.y && y < egg.y + EGG_SIZE;
    }

    function isCellInsideFlower(x, y) {
      if (!flower) return false;
      return x >= flower.x && x < flower.x + FLOWER_SIZE && y >= flower.y && y < flower.y + FLOWER_SIZE;
    }

    function isCellInsideGun(x, y) {
      if (!gunItem) return false;
      return x >= gunItem.x && x < gunItem.x + GUN_SIZE && y >= gunItem.y && y < gunItem.y + GUN_SIZE;
    }

    function isCellOccupiedByHelpers(x, y) {
      return helperSnakes.some(h => h.segments.some(s => s.x === x && s.y === y));
    }

    function endGameAt(x, y, particleColor = "#f43f5e", particleCount = 20) {
      dead = true;
      clearInterval(loopId);
      clearInterval(appleSpawnLoopId);
      screenShake();
      spawnParticles(x, y, particleColor, particleCount);
      finalEl.textContent = score;
      setTimeout(() => overlay.classList.add("visible"), 350);
      updateUI();
    }

    function randomMs(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }

    function triangleBlinkActive() {
      return Date.now() < triangleBlinkUntil;
    }

    function triangleActive() {
      return Date.now() >= triangleBlinkUntil && Date.now() < triangleModeUntil;
    }

    function inTriangle(x, y) {
      const center = (gridSize - 1) / 2;
      const maxHalf = (gridSize - 1) / 2;
      const half = (y / Math.max(1, gridSize - 1)) * maxHalf;
      return x >= Math.ceil(center - half) && x <= Math.floor(center + half);
    }

    function isPlayableCell(x, y) {
      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;
      if (triangleActive() && !inTriangle(x, y)) return false;
      return true;
    }

    function clampPos(p) {
      p.x = Math.max(0, Math.min(gridSize - 1, p.x));
      p.y = Math.max(0, Math.min(gridSize - 1, p.y));
      return p;
    }

    function clampEntitiesToGrid() {
      snake.forEach(clampPos);
      foods.forEach(clampPos);
      helperSnakes.forEach(h => h.segments.forEach(clampPos));
      bullets = bullets.filter(b => isPlayableCell(Math.round(b.x), Math.round(b.y)));
      if (medkit) { medkit.x = Math.min(medkit.x, gridSize - AMBULANCE_SIZE); medkit.y = Math.min(medkit.y, gridSize - AMBULANCE_SIZE); }
      if (egg) { egg.x = Math.min(egg.x, gridSize - EGG_SIZE); egg.y = Math.min(egg.y, gridSize - EGG_SIZE); }
      if (flower) { flower.x = Math.min(flower.x, gridSize - FLOWER_SIZE); flower.y = Math.min(flower.y, gridSize - FLOWER_SIZE); }
      if (gunItem) { gunItem.x = Math.min(gunItem.x, gridSize - GUN_SIZE); gunItem.y = Math.min(gunItem.y, gridSize - GUN_SIZE); }
    }

    // Place one apple on a free cell.
    function placeOneFood() {
      let tries = 0;
      while (tries < 400) {
        const f = randCell();
        const overlapFood = foods.some(a => a.x === f.x && a.y === f.y);
        if (!snake.some(s => s.x === f.x && s.y === f.y) && !overlapFood && !isCellInsideMedkit(f.x, f.y) && !isCellInsideEgg(f.x, f.y) && !isCellInsideFlower(f.x, f.y) && !isCellInsideGun(f.x, f.y) && !isCellOccupiedByHelpers(f.x, f.y) && isPlayableCell(f.x, f.y)) {
          foods.push({ x: f.x, y: f.y });
          return;
        }
        tries++;
      }
    }

    // Add one apple every fixed interval while game is active.
    function startAppleSpawner() {
      clearInterval(appleSpawnLoopId);
      appleSpawnLoopId = setInterval(() => {
        if (dead || paused) return;
        placeOneFood();
      }, APPLE_SPAWN_INTERVAL_MS);
    }

    // Check whether a cell is free of snake, food, and medkit.
    function isFreeCell(x, y) {
      if (snake.some(s => s.x === x && s.y === y)) return false;
      if (foods.some(a => a.x === x && a.y === y)) return false;
      if (isCellInsideMedkit(x, y)) return false;
      if (isCellInsideEgg(x, y)) return false;
      if (isCellInsideFlower(x, y)) return false;
      if (isCellInsideGun(x, y)) return false;
      if (isCellOccupiedByHelpers(x, y)) return false;
      if (!isPlayableCell(x, y)) return false;
      return true;
    }

    function placeEgg() {
      let tries = 0;
      while (tries < 500) {
        const c = {
          x: Math.floor(Math.random() * (gridSize - EGG_SIZE + 1)),
          y: Math.floor(Math.random() * (gridSize - EGG_SIZE + 1))
        };
        let ok = true;
        for (let dx = 0; dx < EGG_SIZE && ok; dx++) {
          for (let dy = 0; dy < EGG_SIZE; dy++) {
            if (!isFreeCell(c.x + dx, c.y + dy)) { ok = false; break; }
          }
        }
        if (ok) {
          egg = { x: c.x, y: c.y };
          egg.expiresAt = Date.now() + EGG_VISIBLE_MS;
          return;
        }
        tries++;
      }
    }

    function maybeSpawnEgg() {
      if (egg) return;
      if (nextEggSpawnAt && Date.now() >= nextEggSpawnAt) {
        placeEgg();
        nextEggSpawnAt = 0;
      }
    }

    function clearExpiredEgg() {
      if (egg && Date.now() > egg.expiresAt) {
        egg = null;
        nextEggSpawnAt = Date.now() + randomMs(EGG_RESPAWN_MIN_MS, EGG_RESPAWN_MAX_MS);
      }
    }

    function placeFlower() {
      let tries = 0;
      while (tries < 400) {
        const c = {
          x: Math.floor(Math.random() * (gridSize - FLOWER_SIZE + 1)),
          y: Math.floor(Math.random() * (gridSize - FLOWER_SIZE + 1))
        };
        let ok = true;
        for (let dx = 0; dx < FLOWER_SIZE && ok; dx++) {
          for (let dy = 0; dy < FLOWER_SIZE; dy++) {
            if (!isFreeCell(c.x + dx, c.y + dy)) { ok = false; break; }
          }
        }
        if (ok) {
          flower = { x: c.x, y: c.y, expiresAt: Date.now() + FLOWER_VISIBLE_MS };
          return;
        }
        tries++;
      }
    }

    function maybeSpawnFlower() {
      if (flower) return;
      if (nextFlowerSpawnAt && Date.now() >= nextFlowerSpawnAt) {
        placeFlower();
        nextFlowerSpawnAt = 0;
      }
    }

    function clearExpiredFlower() {
      if (flower && Date.now() > flower.expiresAt) {
        flower = null;
        nextFlowerSpawnAt = Date.now() + randomMs(FLOWER_RESPAWN_MIN_MS, FLOWER_RESPAWN_MAX_MS);
      }
    }

    function placeGun() {
      let tries = 0;
      while (tries < 400) {
        const c = {
          x: Math.floor(Math.random() * (gridSize - GUN_SIZE + 1)),
          y: Math.floor(Math.random() * (gridSize - GUN_SIZE + 1))
        };
        let ok = true;
        for (let dx = 0; dx < GUN_SIZE && ok; dx++) {
          for (let dy = 0; dy < GUN_SIZE; dy++) {
            if (!isFreeCell(c.x + dx, c.y + dy)) { ok = false; break; }
          }
        }
        if (ok) {
          gunItem = { x: c.x, y: c.y, expiresAt: Date.now() + GUN_VISIBLE_MS };
          return;
        }
        tries++;
      }
    }

    function maybeSpawnGun() {
      if (gunItem) return;
      if (nextGunSpawnAt && Date.now() >= nextGunSpawnAt) {
        placeGun();
        nextGunSpawnAt = 0;
      }
    }

    function clearExpiredGun() {
      if (gunItem && Date.now() > gunItem.expiresAt) {
        gunItem = null;
        nextGunSpawnAt = Date.now() + GUN_RESPAWN_MS;
      }
    }

    function findNearestFood(from) {
      if (foods.length === 0) return null;
      let best = foods[0];
      let bestDist = Math.abs(best.x - from.x) + Math.abs(best.y - from.y);
      for (let i = 1; i < foods.length; i++) {
        const f = foods[i];
        const d = Math.abs(f.x - from.x) + Math.abs(f.y - from.y);
        if (d < bestDist) { best = f; bestDist = d; }
      }
      return best;
    }

    function findHelperDir(helper) {
      const head = helper.segments[0];
      const target = findNearestFood(head);
      const options = shuffle([...ALL_DIRS]).filter(d => !(d.x === -helper.dir.x && d.y === -helper.dir.y));
      let bestDir = helper.dir;
      let bestScore = Infinity;

      for (const d of options) {
        const nx = head.x + d.x;
        const ny = head.y + d.y;
        if (!isPlayableCell(nx, ny)) continue;
        const hitsPlayer = snake.some(s => s.x === nx && s.y === ny);
        const hitsHelper = helper.segments.some((s, idx) => idx < helper.segments.length - 1 && s.x === nx && s.y === ny);
        if (hitsPlayer || hitsHelper || isCellInsideMedkit(nx, ny) || isCellInsideEgg(nx, ny)) continue;
        const score = target ? Math.abs(target.x - nx) + Math.abs(target.y - ny) : 0;
        if (score < bestScore) {
          bestScore = score;
          bestDir = d;
        }
      }
      return bestDir;
    }

    function updateHelperSnakes() {
      for (let i = helperSnakes.length - 1; i >= 0; i--) {
        const helper = helperSnakes[i];
        if (Date.now() > helper.expiresAt) {
          const h = helper.segments[0];
          spawnParticles(h.x, h.y, "#fb7185", 20, 1.8, 1.6, -0.006);
          helperSnakes.splice(i, 1);
          continue;
        }
        helper.dir = findHelperDir(helper);
        const head = helper.segments[0];
        const next = { x: head.x + helper.dir.x, y: head.y + helper.dir.y };
        if (!isPlayableCell(next.x, next.y)) continue;
        helper.segments.unshift(next);
        helper.segments.pop();

        const foodIndex = foods.findIndex(a => a.x === next.x && a.y === next.y);
        if (foodIndex >= 0) {
          const eaten = foods[foodIndex];
          foods.splice(foodIndex, 1);
          spawnParticles(eaten.x, eaten.y, "#22d3ee", 16, 1.2, 0.8, -0.003);
          applyStepMs(stepMs * SPEEDUP_PER_APPLE);
          if (foods.length === 0) placeOneFood();
        }
      }
    }

    function spawnOneHelperSnake() {
      let tries = 0;
      while (tries < 500) {
        const head = randCell();
        const dirCandidate = ALL_DIRS[Math.floor(Math.random() * ALL_DIRS.length)];
        const segments = [];
        let ok = true;
        for (let i = 0; i < HELPER_SNAKE_LENGTH; i++) {
          const sx = head.x - dirCandidate.x * i;
          const sy = head.y - dirCandidate.y * i;
          if (!isPlayableCell(sx, sy) || !isFreeCell(sx, sy)) { ok = false; break; }
          segments.push({ x: sx, y: sy });
        }
        if (ok) {
          const palette = HELPER_PALETTE[helperSnakes.length % HELPER_PALETTE.length];
          helperSnakes.push({
            segments,
            dir: { ...dirCandidate },
            expiresAt: Date.now() + HELPER_LIFETIME_MS,
            colors: palette
          });
          return;
        }
        tries++;
      }
    }

    function spawnHelperSnakes(count = HELPER_SNAKE_COUNT) {
      for (let i = 0; i < count; i++) spawnOneHelperSnake();
    }

    function shoot() {
      if (!hasGun || dead || paused) return;
      const head = snake[0];
      bullets.push({
        x: head.x + dir.x * 0.6,
        y: head.y + dir.y * 0.6,
        dx: dir.x,
        dy: dir.y
      });
    }

    function updateBullets() {
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        const cx = Math.round(b.x);
        const cy = Math.round(b.y);
        if (!isPlayableCell(cx, cy)) {
          bullets.splice(i, 1);
          continue;
        }
        let hitHelper = -1;
        for (let h = 0; h < helperSnakes.length; h++) {
          if (helperSnakes[h].segments.some(s => s.x === cx && s.y === cy)) {
            hitHelper = h;
            break;
          }
        }
        if (hitHelper >= 0) {
          const head = helperSnakes[hitHelper].segments[0];
          spawnParticles(head.x, head.y, "#f43f5e", 28, 2.2, 2, -0.008);
          helperSnakes.splice(hitHelper, 1);
          bullets.splice(i, 1);
        }
      }
    }

    function maybeResizePlayground() {
      if (!nextPlaygroundResizeAt || Date.now() < nextPlaygroundResizeAt) return;
      if (gridSize >= BASE_GRID_SIZE * PLAYGROUND_MAX_MULTIPLIER) {
        shrinkFieldBy(PLAYGROUND_REDUCE_FACTOR);
      } else {
        growFieldBy(PLAYGROUND_GROWTH);
      }
      nextPlaygroundResizeAt = Date.now() + PLAYGROUND_GROW_INTERVAL_MS;
    }

    // Spawn the slowdown medkit on a free cell with expiration timestamp.
    function placeMedkit() {
      let tries = 0;
      while (tries < 400) {
        const c = {
          x: Math.floor(Math.random() * (gridSize - AMBULANCE_SIZE + 1)),
          y: Math.floor(Math.random() * (gridSize - AMBULANCE_SIZE + 1))
        };
        const footprintFree =
          isFreeCell(c.x, c.y) &&
          isFreeCell(c.x + 1, c.y) &&
          isFreeCell(c.x, c.y + 1) &&
          isFreeCell(c.x + 1, c.y + 1);
        if (footprintFree) {
          medkit = {
            x: c.x,
            y: c.y,
            expiresAt: Date.now() + RED_CROSS_LIFETIME_MS
          };
          return;
        }
        tries++;
      }
      medkit = null;
    }

    // Randomly spawn medkit if one is not already active.
    function maybeSpawnMedkit() {
      if (medkit) return;
      if (Math.random() < RED_CROSS_SPAWN_CHANCE) placeMedkit();
    }

    // Remove medkit when its 10-second lifetime ends.
    function clearExpiredMedkit() {
      if (medkit && Date.now() > medkit.expiresAt) medkit = null;
    }

    // Apply and clamp movement interval, then restart step timer.
    function applyStepMs(nextMs) {
      stepMs = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, nextMs));
      if (!dead) {
        clearInterval(loopId);
        loopId = setInterval(step, stepMs);
      }
    }

    // Load saved high score from local storage.
    function loadSavedHi() {
      const raw = localStorage.getItem(HI_SCORE_KEY);
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) hiScore = Math.floor(n);
      const savedName = localStorage.getItem(HI_NAME_KEY);
      if (savedName && savedName.trim()) hiName = savedName.trim();
    }

    // Persist high score only when user enabled Save HI.
    function persistHiIfEnabled() {
      if (!saveHiToggle.checked) return;
      localStorage.setItem(HI_SCORE_KEY, String(hiScore));
      localStorage.setItem(HI_NAME_KEY, hiName);
    }

    // Resolve active player name from input.
    function currentPlayerName() {
      const name = playerNameInput.value.trim();
      return name ? name.slice(0, 20) : "Player";
    }

    /* ── Game logic ────────────────────────────────── */
    // Start a new game round with base speed and fresh state.
    function reset() {
      gridSize = BASE_GRID_SIZE;
      tileSize = board.width / gridSize;
      const c = Math.floor(gridSize / 2);
      snake = [{ x: c, y: c }, { x: c - 1, y: c }, { x: c - 2, y: c }];
      dir  = { x: 1, y: 0 };
      qDir = { ...dir };
      score = 0;
      applesEaten = 0;
      stepMs = BASE_STEP_MS;
      paused = false;
      dead = false;
      particles = [];
      flashPower = 0;
      postBounceRandomTurnAt = 0;
      helperMoveToggle = false;
      foods = [];
      medkit = null;
      egg = null;
      flower = null;
      gunItem = null;
      helperSnakes = [];
      hasGun = false;
      bullets = [];
      triangleBlinkUntil = 0;
      triangleModeUntil = 0;
      lastManualControlAt = Date.now();
      nextEggSpawnAt = Date.now() + FIRST_EGG_DELAY_MS;
      nextFlowerSpawnAt = Date.now() + randomMs(FLOWER_RESPAWN_MIN_MS, FLOWER_RESPAWN_MAX_MS);
      nextGunSpawnAt = Date.now() + GUN_RESPAWN_MS;
      nextPlaygroundResizeAt = Date.now() + PLAYGROUND_GROW_INTERVAL_MS;
      placeOneFood();
      overlay.classList.remove("visible");
      updateUI();
      clearInterval(loopId);
      loopId = setInterval(step, stepMs);
      startAppleSpawner();
    }

    // Refresh score UI and maintain high score.
    function updateUI() {
      scoreEl.textContent = score;
      if (score > hiScore) {
        hiScore = score;
        hiName = currentPlayerName();
        persistHiIfEnabled();
      }
      hiEl.textContent = hiScore;
      hiNameEl.textContent = hiName;
    }

    function opposite(a, b) { return a.x === -b.x && a.y === -b.y; }

    // Queue a valid next movement direction.
    function queueDir(next) {
      if (dead || paused) return;
      if (opposite(next, dir)) return;
      qDir = next;
      postBounceRandomTurnAt = 0; // player takes control, cancel auto-random turns
      lastManualControlAt = Date.now();
    }

    const ALL_DIRS = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 }
    ];

    function hitsSnake(x, y) { return snake.some(s => s.x === x && s.y === y); }
    function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

    // Pick a random safe direction used by bounce behavior.
    function pickRandomSafeDir(fromHead) {
      const tail = snake[snake.length - 1];
      const candidates = shuffle(ALL_DIRS.filter(d => {
        const nx = fromHead.x + d.x;
        const ny = fromHead.y + d.y;
        if (!isPlayableCell(nx, ny)) return false;
        if (nx === tail.x && ny === tail.y) return true;
        return !hitsSnake(nx, ny);
      }));
      return candidates.length > 0 ? candidates[0] : null;
    }

    function pickChaosDir(fromHead, currentDir) {
      const tail = snake[snake.length - 1];
      const candidates = shuffle(ALL_DIRS.filter(d => {
        if (d.x === -currentDir.x && d.y === -currentDir.y) return false;
        const nx = fromHead.x + d.x;
        const ny = fromHead.y + d.y;
        if (!isPlayableCell(nx, ny)) return false;
        if (nx === tail.x && ny === tail.y) return true;
        return !hitsSnake(nx, ny);
      }));
      return candidates.length > 0 ? candidates[0] : null;
    }

    // Main game tick: movement, collisions, pickups, speed updates.
    function step() {
      if (paused || dead) return;
      clearExpiredMedkit();
      clearExpiredEgg();
      clearExpiredFlower();
      clearExpiredGun();
      maybeResizePlayground();
      helperMoveToggle = !helperMoveToggle;
      if (helperMoveToggle) updateHelperSnakes();
      updateBullets();

      if (triangleActive() && !inTriangle(snake[0].x, snake[0].y)) {
        endGameAt(snake[0].x, snake[0].y, "#f43f5e", 24);
        return;
      }

      dir = qDir;

      /* ── After wall bounce: random direction every 4 seconds ── */
      if (postBounceRandomTurnAt && Date.now() >= postBounceRandomTurnAt) {
        const rnd = pickRandomSafeDir(snake[0]);
        if (rnd) {
          dir = rnd;
          qDir = { ...dir };
          spawnParticles(snake[0].x, snake[0].y, "#a78bfa", 8);
        }
        postBounceRandomTurnAt = Date.now() + BOUNCE_RANDOM_TURN_INTERVAL_MS;
      }

      // If player leaves snake unattended, add occasional safe random turns.
      if (Date.now() - lastManualControlAt > CHAOS_IDLE_MS && Math.random() < CHAOS_TURN_CHANCE) {
        const chaos = pickChaosDir(snake[0], dir);
        if (chaos) {
          dir = chaos;
          qDir = { ...dir };
          spawnParticles(snake[0].x, snake[0].y, "#f472b6", 6, 1.05, 0.2, 0);
        }
      }

      let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      /* ── Wall bounce ─────────────────────────────── */
      if (!isPlayableCell(head.x, head.y)) {
        spawnParticles(
          Math.max(0, Math.min(gridSize - 1, head.x)),
          Math.max(0, Math.min(gridSize - 1, head.y)),
          "#38bdf8", 8
        );

        const safeDir = pickRandomSafeDir(snake[0]);

        if (!safeDir) {
          endGameAt(snake[0].x, snake[0].y);
          return;
        }

        dir = safeDir;
        qDir = { ...dir };
        head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // After bounce, keep randomizing direction every 4 seconds until user input.
        postBounceRandomTurnAt = Date.now() + BOUNCE_RANDOM_TURN_INTERVAL_MS;
      }

      /* ── Self-collision ──────────────────────────── */
      if (hitsSnake(head.x, head.y)) {
        endGameAt(head.x, head.y);
        return;
      }

      if (isCellOccupiedByHelpers(head.x, head.y)) {
        endGameAt(head.x, head.y, "#fb7185", 24);
        return;
      }

      snake.unshift(head);

      const eatenFoodIndex = foods.findIndex(a => head.x === a.x && head.y === a.y);
      if (eatenFoodIndex >= 0) {
        const eaten = foods[eatenFoodIndex];
        foods.splice(eatenFoodIndex, 1);
        score++;
        applesEaten++;
        spawnParticles(eaten.x, eaten.y, "#4ade80", 30, 1.7, 1.5, -0.005);
        spawnParticles(eaten.x, eaten.y, "#facc15", 24, 2.1, 2.0, -0.004);
        spawnParticles(eaten.x, eaten.y, "#ffffff", 10, 2.5, 1.8, -0.008);
        showScorePop(eaten.x, eaten.y);
        triggerFlash(0.45);
        applyStepMs(stepMs * SPEEDUP_PER_APPLE);
        if (applesEaten % APPLE_BONUS_THRESHOLD === 0) {
          const tail = snake[snake.length - 1];
          const bonusGrowth = Math.max(1, Math.round(snake.length * 0.1));
          for (let i = 0; i < bonusGrowth; i++) {
            snake.push({ x: tail.x, y: tail.y });
          }
          showTextPop(eaten.x, eaten.y, "+10% SIZE", "#34d399");
        }
        if (foods.length === 0) placeOneFood();
      } else {
        snake.pop();
      }

      if (medkit && isCellInsideMedkit(head.x, head.y)) {
        const mx = medkit.x + 0.5;
        const my = medkit.y + 0.5;
        spawnParticles(mx, my, "#f87171", 20, 1.4, 1.2, -0.004);
        showTextPop(mx, my, "SLOW", "#f87171");
        triggerFlash(0.22);
        applyStepMs(stepMs * SLOWDOWN_ON_MEDKIT);
        medkit = null;
      }

      if (egg && isCellInsideEgg(head.x, head.y)) {
        const ex = egg.x + EGG_SIZE / 2;
        const ey = egg.y + EGG_SIZE / 2;
        spawnParticles(ex, ey, "#fde047", 34, 2.2, 2, -0.007);
        showTextPop(ex, ey, "EGG!", "#fde047");
        triggerFlash(0.35);
        egg = null;
        spawnHelperSnakes(HELPER_SNAKE_COUNT);
        nextEggSpawnAt = Date.now() + HELPER_LIFETIME_MS + randomMs(EGG_RESPAWN_MIN_MS, EGG_RESPAWN_MAX_MS);
        growFieldBy(0.2);
      }

      if (flower && isCellInsideFlower(head.x, head.y)) {
        const fx = flower.x + FLOWER_SIZE / 2;
        const fy = flower.y + FLOWER_SIZE / 2;
        spawnParticles(fx, fy, "#f472b6", 26, 1.8, 1.3, -0.006);
        showTextPop(fx, fy, "TRIANGLE!", "#f472b6");
        triangleBlinkUntil = Date.now() + FLOWER_TRIANGLE_BLINK_MS;
        triangleModeUntil = triangleBlinkUntil + FLOWER_TRIANGLE_ACTIVE_MS;
        flower = null;
        nextFlowerSpawnAt = Date.now() + randomMs(FLOWER_RESPAWN_MIN_MS, FLOWER_RESPAWN_MAX_MS);
      }

      if (gunItem && isCellInsideGun(head.x, head.y)) {
        const gx = gunItem.x + GUN_SIZE / 2;
        const gy = gunItem.y + GUN_SIZE / 2;
        spawnParticles(gx, gy, "#eab308", 22, 1.6, 1.1, -0.005);
        showTextPop(gx, gy, "GUN", "#eab308");
        hasGun = true;
        gunItem = null;
        nextGunSpawnAt = Date.now() + GUN_RESPAWN_MS;
      }

      maybeSpawnMedkit();
      maybeSpawnEgg();
      maybeSpawnFlower();
      maybeSpawnGun();
      updateUI();
    }

    /* ── Drawing ───────────────────────────────────── */
    // Draw background grid lines.
    function drawGrid() {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.05)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        const p = i * tileSize;
        ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, board.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(board.width, p); ctx.stroke();
      }
    }

    // Draw pulsing apple with glow.
    function drawFood() {
      foodPulse += 0.06;
      foods.forEach((apple, i) => {
        const phase = foodPulse + i * 0.9;
        const pulse = 1 + Math.sin(phase) * 0.15;
        const cx = apple.x * tileSize + tileSize / 2;
        const cy = apple.y * tileSize + tileSize / 2;
        const r  = (tileSize / 2 - 2) * pulse;

        ctx.save();
        ctx.shadowColor = "rgba(244, 63, 94, 0.6)";
        ctx.shadowBlur  = 18 + Math.sin(phase) * 6;
        ctx.fillStyle   = "#f43f5e";
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.3, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function drawEgg() {
      if (!egg) return;
      const x = egg.x * tileSize + 2;
      const y = egg.y * tileSize + 2;
      const w = tileSize * EGG_SIZE - 4;
      const h = tileSize * EGG_SIZE - 4;

      ctx.save();
      ctx.shadowColor = "rgba(253, 224, 71, 0.55)";
      ctx.shadowBlur = 16;
      const grd = ctx.createRadialGradient(x + w * 0.4, y + h * 0.35, 2, x + w * 0.5, y + h * 0.6, w * 0.8);
      grd.addColorStop(0, "#fff7b3");
      grd.addColorStop(1, "#f59e0b");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w * 0.42, h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawFlower() {
      if (!flower) return;
      const x = flower.x * tileSize + 2;
      const y = flower.y * tileSize + 2;
      const w = tileSize * FLOWER_SIZE - 4;
      const h = tileSize * FLOWER_SIZE - 4;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) * 0.16;
      ctx.save();
      ctx.shadowColor = "rgba(244,114,182,0.45)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#f472b6";
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * w * 0.24, cy + Math.sin(a) * h * 0.24, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawGun() {
      if (!gunItem) return;
      const x = gunItem.x * tileSize + 2;
      const y = gunItem.y * tileSize + 2;
      const w = tileSize * GUN_SIZE - 4;
      const h = tileSize * GUN_SIZE - 4;

      ctx.save();
      ctx.translate(x + w * 0.08, y + h * 0.18);
      ctx.shadowColor = "rgba(196, 181, 253, 0.28)";
      ctx.shadowBlur = 10;

      const bodyGradient = ctx.createLinearGradient(0, 0, w * 0.7, h * 0.6);
      bodyGradient.addColorStop(0, "#eef2ff");
      bodyGradient.addColorStop(0.55, "#94a3b8");
      bodyGradient.addColorStop(1, "#475569");

      const gripGradient = ctx.createLinearGradient(0, h * 0.48, 0, h * 0.92);
      gripGradient.addColorStop(0, "#475569");
      gripGradient.addColorStop(1, "#0f172a");

      ctx.fillStyle = bodyGradient;

      ctx.beginPath();
      ctx.arc(w * 0.34, h * 0.42, w * 0.13, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(w * 0.28, h * 0.37, w * 0.34, h * 0.14, h * 0.05);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(w * 0.58, h * 0.35, w * 0.2, h * 0.08, h * 0.04);
      ctx.fill();

      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(w * 0.78, h * 0.375, w * 0.045, h * 0.02);

      ctx.fillStyle = gripGradient;
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.5);
      ctx.lineTo(w * 0.22, h * 0.86);
      ctx.lineTo(w * 0.35, h * 0.9);
      ctx.lineTo(w * 0.42, h * 0.58);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(15, 23, 42, 0.65)";
      ctx.lineWidth = Math.max(1, tileSize * 0.04);
      ctx.beginPath();
      ctx.arc(w * 0.34, h * 0.42, w * 0.065, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = Math.max(1, tileSize * 0.03);
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.36);
      ctx.lineTo(w * 0.52, h * 0.36);
      ctx.stroke();

      ctx.restore();
    }

    // Draw ambulance slowdown item.
    function drawMedkit() {
      if (!medkit) return;
      const x = medkit.x * tileSize + 2;
      const y = medkit.y * tileSize + 2;
      const w = tileSize * AMBULANCE_SIZE - 4;
      const h = tileSize * AMBULANCE_SIZE - 4;

      ctx.save();
      ctx.shadowColor = "rgba(248, 113, 113, 0.45)";
      ctx.shadowBlur = 10;

      // Body + cabin
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(x, y + h * 0.2, w * 0.65, h * 0.55);
      ctx.fillRect(x + w * 0.58, y + h * 0.32, w * 0.3, h * 0.43);

      // Red stripe
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x + w * 0.06, y + h * 0.42, w * 0.72, h * 0.14);

      // Medical cross
      ctx.fillStyle = "#dc2626";
      const cx = x + w * 0.34;
      const cy = y + h * 0.46;
      const arm = Math.max(2, w * 0.08);
      const thick = Math.max(2, w * 0.06);
      ctx.fillRect(cx - thick / 2, cy - arm, thick, arm * 2);
      ctx.fillRect(cx - arm, cy - thick / 2, arm * 2, thick);

      // Window + light
      ctx.fillStyle = "#93c5fd";
      ctx.fillRect(x + w * 0.66, y + h * 0.37, w * 0.17, h * 0.16);
      ctx.fillStyle = "#f87171";
      ctx.fillRect(x + w * 0.52, y + h * 0.12, w * 0.15, h * 0.08);

      // Wheels
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(x + w * 0.2, y + h * 0.82, h * 0.1, 0, Math.PI * 2);
      ctx.arc(x + w * 0.7, y + h * 0.82, h * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawHelperSnakes() {
      helperSnakes.forEach(helper => {
        helper.segments.forEach((seg, i) => {
          const cx = seg.x * tileSize + tileSize / 2;
          const cy = seg.y * tileSize + tileSize / 2;
          const radius = Math.max(3, (tileSize / 2 - 2) * (1 - i * 0.08));
          ctx.save();
          ctx.fillStyle = i === 0 ? helper.colors.head : helper.colors.body;
          if (i === 0) {
            ctx.shadowColor = helper.colors.head;
            ctx.shadowBlur = 10;
          }
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fill();
          if (i === 0) {
            const eye = Math.max(1.5, radius * 0.23);
            const eyeOff = radius * 0.35;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(cx - eyeOff, cy - eyeOff * 0.2, eye, 0, Math.PI * 2);
            ctx.arc(cx + eyeOff, cy - eyeOff * 0.2, eye, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#111827";
            ctx.beginPath();
            ctx.arc(cx - eyeOff + helper.dir.x, cy - eyeOff * 0.2 + helper.dir.y, eye * 0.45, 0, Math.PI * 2);
            ctx.arc(cx + eyeOff + helper.dir.x, cy - eyeOff * 0.2 + helper.dir.y, eye * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });
      });
    }

    function drawBullets() {
      bullets.forEach(b => {
        const x = b.x * tileSize + tileSize / 2;
        const y = b.y * tileSize + tileSize / 2;
        ctx.save();
        ctx.fillStyle = "#fef08a";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x, y, Math.max(2, tileSize * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Draw snake body, gradients, and head details.
    function drawSnake() {
      const len = snake.length;

      snake.forEach((seg, i) => {
        const t  = len > 1 ? i / (len - 1) : 0;
        const cx = seg.x * tileSize + tileSize / 2;
        const cy = seg.y * tileSize + tileSize / 2;

        // Interpolate head→tail color
        const r = Math.round(74 + (6 - 74) * t);
        const g = Math.round(222 + (95 - 222) * t);
        const b = Math.round(128 + (38 - 128) * t);
        const color = `rgb(${r},${g},${b})`;

        const radius = (tileSize / 2 - 1) * (1 - t * 0.3); // taper towards tail

        ctx.save();
        if (i === 0) {
          ctx.shadowColor = "rgba(74,222,128,0.45)";
          ctx.shadowBlur  = 14;
        }
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Connect segments with thick line for smooth body
      if (len > 1) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = tileSize - 6;
        const grad = ctx.createLinearGradient(
          snake[0].x * tileSize, snake[0].y * tileSize,
          snake[len - 1].x * tileSize, snake[len - 1].y * tileSize
        );
        grad.addColorStop(0, "rgba(74,222,128,0.45)");
        grad.addColorStop(1, "rgba(6,95,38,0.2)");
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(snake[0].x * tileSize + tileSize / 2, snake[0].y * tileSize + tileSize / 2);
        for (let i = 1; i < len; i++) {
          ctx.lineTo(snake[i].x * tileSize + tileSize / 2, snake[i].y * tileSize + tileSize / 2);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Re-draw circles on top of the line
      snake.forEach((seg, i) => {
        const t  = len > 1 ? i / (len - 1) : 0;
        const cx = seg.x * tileSize + tileSize / 2;
        const cy = seg.y * tileSize + tileSize / 2;
        const r2 = Math.round(74 + (6 - 74) * t);
        const g2 = Math.round(222 + (95 - 222) * t);
        const b2 = Math.round(128 + (38 - 128) * t);
        const radius = (tileSize / 2 - 1) * (1 - t * 0.3);
        ctx.fillStyle = `rgb(${r2},${g2},${b2})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Eyes on head
      drawEyes(snake[0], dir);
    }

    // Draw eyes oriented to current movement direction.
    function drawEyes(head, d) {
      const cx = head.x * tileSize + tileSize / 2;
      const cy = head.y * tileSize + tileSize / 2;
      const eyeOff = tileSize * 0.22;
      const eyeR   = tileSize * 0.13;
      const pupilR  = tileSize * 0.065;

      // Perpendicular to direction
      const px = -d.y;
      const py = d.x;

      // Two eye positions
      const eyes = [
        { x: cx + px * eyeOff + d.x * eyeOff * 0.6, y: cy + py * eyeOff + d.y * eyeOff * 0.6 },
        { x: cx - px * eyeOff + d.x * eyeOff * 0.6, y: cy - py * eyeOff + d.y * eyeOff * 0.6 }
      ];

      eyes.forEach(e => {
        // White
        ctx.fillStyle = "#e8f5e9";
        ctx.beginPath();
        ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
        ctx.fill();
        // Pupil (shifted toward direction)
        ctx.fillStyle = "#0a2e12";
        ctx.beginPath();
        ctx.arc(e.x + d.x * pupilR * 1.2, e.y + d.y * pupilR * 1.2, pupilR, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    /* ── Render loop ───────────────────────────────── */
    // Animation loop: draw scene and overlays every frame.
    function render() {
      ctx.clearRect(0, 0, board.width, board.height);

      // Subtle vignette
      const vig = ctx.createRadialGradient(
        board.width / 2, board.height / 2, board.width * 0.25,
        board.width / 2, board.height / 2, board.width * 0.7
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, board.width, board.height);

      drawGrid();
      drawFood();
      drawEgg();
      drawFlower();
      drawGun();
      drawMedkit();
      drawHelperSnakes();
      drawSnake();
      drawBullets();
      updateParticles();
      drawParticles();

      if (triangleBlinkActive()) {
        const blinkOn = Math.floor(Date.now() / 220) % 2 === 0;
        if (blinkOn) {
          ctx.save();
          ctx.fillStyle = "rgba(244,114,182,0.14)";
          ctx.beginPath();
          ctx.moveTo(board.width / 2, 0);
          ctx.lineTo(board.width, board.height);
          ctx.lineTo(0, board.height);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      } else if (triangleActive()) {
        ctx.save();
        ctx.fillStyle = "rgba(244,114,182,0.2)";
        ctx.beginPath();
        ctx.moveTo(board.width / 2, 0);
        ctx.lineTo(board.width, board.height);
        ctx.lineTo(0, board.height);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      if (flashPower > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.5, flashPower * 0.5);
        const flash = ctx.createRadialGradient(
          board.width / 2, board.height / 2, board.width * 0.08,
          board.width / 2, board.height / 2, board.width * 0.7
        );
        flash.addColorStop(0, "rgba(255,255,255,0.92)");
        flash.addColorStop(1, "rgba(248,113,113,0.18)");
        ctx.fillStyle = flash;
        ctx.fillRect(0, 0, board.width, board.height);
        ctx.restore();
        flashPower *= 0.86;
      } else {
        flashPower = 0;
      }

      // Pause text
      if (paused && !dead) {
        ctx.save();
        ctx.fillStyle = "rgba(5,10,24,0.6)";
        ctx.fillRect(0, 0, board.width, board.height);
        ctx.font = "900 42px 'Orbitron', monospace";
        ctx.fillStyle = "#e2e8f0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(34,197,94,0.4)";
        ctx.shadowBlur = 20;
        ctx.fillText("PAUSED", board.width / 2, board.height / 2);
        ctx.restore();
      }

      requestAnimationFrame(render);
    }

    /* ── Input ─────────────────────────────────────── */
    document.addEventListener("keydown", e => {
      const target = e.target;
      const isTypingContext =
        target &&
        (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        );
      if (isTypingContext) return;

      const k = e.key.toLowerCase();
      if (k === "arrowup"    || k === "w") { queueDir({ x: 0, y: -1 }); e.preventDefault(); }
      if (k === "arrowdown"  || k === "s") { queueDir({ x: 0, y: 1  }); e.preventDefault(); }
      if (k === "arrowleft"  || k === "a") { queueDir({ x: -1, y: 0 }); e.preventDefault(); }
      if (k === "arrowright"  || k === "d") { queueDir({ x: 1, y: 0  }); e.preventDefault(); }
      if (k === "f") { shoot(); e.preventDefault(); }
      if (k === " ") {
        e.preventDefault();
        if (!dead) { paused = !paused; }
      }
    });

    function handleJoystickDirection(dirName) {
      switch (dirName) {
        case "up":
          queueDir({ x: 0, y: -1 });
          break;
        case "down":
          queueDir({ x: 0, y: 1 });
          break;
        case "left":
          queueDir({ x: -1, y: 0 });
          break;
        case "right":
          queueDir({ x: 1, y: 0 });
          break;
        default:
          break;
      }
    }

    joystickToggle.addEventListener("click", () => {
      joystickEnabled = !joystickEnabled;
      joystick.classList.toggle("show", joystickEnabled);
      joystickToggle.textContent = joystickEnabled ? "Hide Joystick" : "Show Joystick";
    });

    joystick.querySelectorAll(".joy-btn").forEach(btn => {
      btn.addEventListener("touchstart", e => {
        e.preventDefault();
        handleJoystickDirection(btn.dataset.dir);
      }, { passive: false });
      btn.addEventListener("click", e => {
        e.preventDefault();
        handleJoystickDirection(btn.dataset.dir);
      });
    });

    document.getElementById("restartBtn").addEventListener("click", reset);
    document.getElementById("overlayRestart").addEventListener("click", reset);
    saveHiToggle.addEventListener("change", () => {
      if (!saveHiToggle.checked) return;
      persistHiIfEnabled();
    });
    playerNameInput.addEventListener("change", () => {
      hiName = currentPlayerName();
      hiNameEl.textContent = hiName;
      persistHiIfEnabled();
    });

    /* ── Start ─────────────────────────────────────── */
    loadSavedHi();
    hiEl.textContent = hiScore;
    hiNameEl.textContent = hiName;
    playerNameInput.value = hiName === "Player" ? "" : hiName;
    reset();
    render();
