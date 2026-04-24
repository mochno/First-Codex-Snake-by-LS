    /* ── Setup ─────────────────────────────────────── */
    const board   = document.getElementById("board");
    const ctx     = board.getContext("2d");
    const scoreEl = document.getElementById("score");
    const hiEl    = document.getElementById("hiScore");
    const hiNameEl= document.getElementById("hiName");
    const comboEl = document.getElementById("comboValue");
    const multiplierEl = document.getElementById("multiplierValue");
    const waveEl = document.getElementById("waveValue");
    const statusEl = document.getElementById("statusValue");
    const overlay = document.getElementById("overlay");
    const finalEl = document.getElementById("finalScore");
    const wrap    = document.getElementById("canvasWrap");
    const gameWrap= document.getElementById("gameWrap");
    const timerHud = document.getElementById("timerHud");
    const eventBanner = document.getElementById("eventBanner");
    const saveHiToggle = document.getElementById("saveHiToggle");
    const soundToggle = document.getElementById("soundToggle");
    const playerNameInput = document.getElementById("playerName");
    const modeButtons = [...document.querySelectorAll(".mode-btn")];
    const joystickToggle = document.getElementById("joystickToggle");
    const joystick = document.getElementById("joystick");
    const challengeTitleEl = document.getElementById("challengeTitle");
    const challengeProgressEl = document.getElementById("challengeProgress");

    const BASE_GRID_SIZE = 20;
    let gridSize = BASE_GRID_SIZE;
    let tileSize = board.width / gridSize;
    const APPLE_BONUS_THRESHOLD = 15;
    const BASE_STEP_MS = 500;
    const BASE_APPLE_SPAWN_INTERVAL_MS = 5000;
    const SPEEDUP_PER_APPLE = 0.9;
    const SLOWDOWN_ON_MEDKIT = 1.15;
    const MIN_STEP_MS = 50;
    const MAX_STEP_MS = 3000;
    const RED_CROSS_LIFETIME_MS = 10000;
    const RED_CROSS_SPAWN_CHANCE = 0.025;
    const AMBULANCE_SIZE = 2; // 2x2 cells = 4 squares
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
    const POWERUP_SIZE = 2;
    const POWERUP_VISIBLE_MS = 9000;
    const POWERUP_RESPAWN_MIN_MS = 12000;
    const POWERUP_RESPAWN_MAX_MS = 17000;
    const SHIELD_DURATION_MS = 18000;
    const MAGNET_DURATION_MS = 12000;
    const DASH_DURATION_MS = 15000;
    const DASH_COOLDOWN_MS = 2500;
    const DASH_STEPS = 2;
    const SLOW_TIME_DURATION_MS = 8000;
    const SLOW_TIME_FACTOR = 1.35;
    const COMBO_WINDOW_MS = 4000;
    const COMBO_STEP = 3;
    const COMBO_MAX_MULTIPLIER = 5;
    const HELPER_KILL_SCORE = 3;
    const HELPER_DROP_COUNT = 2;
    const TRIANGLE_SURVIVAL_SCORE_MS = 1000;
    const TRIANGLE_SURVIVAL_SCORE = 1;
    const TRIANGLE_COMPLETION_SCORE = 6;
    const BIG_HARVEST_MIN_APPLES = 5;
    const BIG_HARVEST_DURATION_MS = 9000;
    const HELPER_RUSH_DURATION_MS = 9000;
    const EVENT_BANNER_MS = 1800;
    const HI_SCORE_KEY = "snake_neon_hi_score";
    const HI_NAME_KEY = "snake_neon_hi_name";
    const CHALLENGE_REWARD_POINTS = 5;
    const CHALLENGE_TEMPLATES = [
      { id: "apple_rush", label: "Task: Apple Sprint", target: 8, metric: "apples" },
      { id: "medic_run", label: "Task: Ambulance Pickup", target: 1, metric: "medkits" },
      { id: "helper_hunter", label: "Task: Helper Hunter", target: 2, metric: "helperHits" },
      { id: "flower_touch", label: "Task: Petal Run", target: 1, metric: "flowers" },
      { id: "egg_quest", label: "Task: Egg Rescue", target: 1, metric: "eggs" },
      { id: "survive", label: "Task: Stay Alive", target: 45, metric: "seconds" }
    ];

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
    let powerup = null;
    let helperSnakes = [];
    let helperMoveToggle = false;
    let nextEggSpawnAt = 0;
    let nextFlowerSpawnAt = 0;
    let nextGunSpawnAt = 0;
    let nextPowerupSpawnAt = 0;
    let triangleBlinkUntil = 0;
    let triangleModeUntil = 0;
    let triangleChallengeActive = false;
    let triangleRewardTickAt = 0;
    let hasGun = false;
    let bullets = [];
    let nextPlaygroundResizeAt = 0;
    let lastManualControlAt = 0;
    let joystickEnabled = false;
    let snakeCells = new Set();
    let foodCells = new Set();
    let helperCells = new Set();
    let currentModeKey = "chaos";
    let comboCount = 0;
    let comboMultiplier = 1;
    let comboEndsAt = 0;
    let shieldUntil = 0;
    let magnetUntil = 0;
    let dashUntil = 0;
    let dashRequested = false;
    let nextDashReadyAt = 0;
    let slowTimeUntil = 0;
    let waveState = null;
    let nextWaveScore = 0;
    let bigHarvestUntil = 0;
    let helperRushUntil = 0;
    let nextPowerupTypeIndex = 0;
    let nextSurvivalScoreAt = 0;
    let eventMessage = "";
    let eventMessageUntil = 0;
    let eventTone = "reward";
    let timerNodes = new Map();
    let audioCtx = null;
    let challenge = null;
    let challengeProgress = 0;
    let gameStartedAt = 0;

    const HELPER_PALETTE = [
      { body: "#38bdf8", head: "#7dd3fc" },
      { body: "#f97316", head: "#fdba74" },
      { body: "#22c55e", head: "#86efac" },
      { body: "#a855f7", head: "#d8b4fe" },
      { body: "#e11d48", head: "#fda4af" }
    ];

    const POWERUP_TYPES = ["shield", "magnet", "dash", "slow"];

    const GAME_MODES = {
      classic: {
        key: "classic",
        label: "Classic",
        wallBounce: false,
        helpers: false,
        triangle: false,
        gun: false,
        medkit: false,
        fieldResize: false,
        chaosTurns: false,
        powerups: true,
        waves: true,
        wavePool: ["bigHarvest"],
        appleSpawnInterval: 6500,
        waveScoreStep: 18,
        helperRushCount: 0,
        survivalPulseMs: 0
      },
      chaos: {
        key: "chaos",
        label: "Chaos",
        wallBounce: true,
        helpers: true,
        triangle: true,
        gun: true,
        medkit: true,
        fieldResize: true,
        chaosTurns: true,
        powerups: true,
        waves: true,
        wavePool: ["helperRush", "triangleTrial", "bigHarvest"],
        appleSpawnInterval: BASE_APPLE_SPAWN_INTERVAL_MS,
        waveScoreStep: 12,
        helperRushCount: 3,
        survivalPulseMs: 0
      },
      survival: {
        key: "survival",
        label: "Survival",
        wallBounce: false,
        helpers: true,
        triangle: true,
        gun: true,
        medkit: true,
        fieldResize: true,
        chaosTurns: false,
        powerups: true,
        waves: true,
        wavePool: ["helperRush", "triangleTrial", "bigHarvest"],
        appleSpawnInterval: 4200,
        waveScoreStep: 10,
        helperRushCount: 4,
        survivalPulseMs: 6000
      }
    };

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
    function showScorePop(cellX, cellY, text = "+1", color = "#4ade80") {
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

    function currentMode() {
      return GAME_MODES[currentModeKey];
    }

    function ensureAudioContext() {
      if (!soundToggle.checked) return null;
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioCtx) audioCtx = new AudioCtor();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      return audioCtx;
    }

    function playTone(ctx, when, frequency, duration, type = "sine", gainValue = 0.035, endFrequency = frequency) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, when);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), when + duration);
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(gainValue, when + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + duration + 0.02);
    }

    function playSound(kind) {
      const ctx = ensureAudioContext();
      if (!ctx) return;
      const when = ctx.currentTime + 0.01;
      switch (kind) {
        case "eat":
          playTone(ctx, when, 540, 0.08, "triangle", 0.04, 760);
          break;
        case "bonus":
          playTone(ctx, when, 420, 0.12, "sawtooth", 0.03, 680);
          playTone(ctx, when + 0.05, 760, 0.12, "triangle", 0.025, 980);
          break;
        case "danger":
          playTone(ctx, when, 280, 0.16, "square", 0.03, 160);
          break;
        case "helper":
          playTone(ctx, when, 360, 0.12, "square", 0.03, 220);
          playTone(ctx, when + 0.04, 520, 0.08, "triangle", 0.02, 340);
          break;
        case "power":
          playTone(ctx, when, 520, 0.1, "sine", 0.03, 860);
          playTone(ctx, when + 0.03, 780, 0.14, "triangle", 0.02, 1080);
          break;
        case "dash":
          playTone(ctx, when, 240, 0.1, "sawtooth", 0.03, 520);
          break;
        case "shield":
          playTone(ctx, when, 620, 0.12, "triangle", 0.03, 360);
          break;
        case "wave":
          playTone(ctx, when, 240, 0.12, "triangle", 0.025, 420);
          playTone(ctx, when + 0.06, 420, 0.18, "sawtooth", 0.025, 720);
          break;
        case "dead":
          playTone(ctx, when, 220, 0.2, "sawtooth", 0.04, 70);
          break;
        default:
          break;
      }
    }

    function showBanner(text, tone = "reward", duration = EVENT_BANNER_MS) {
      eventMessage = text;
      eventTone = tone;
      eventMessageUntil = Date.now() + duration;
    }

    function shieldActive(now = Date.now()) {
      return now < shieldUntil;
    }

    function magnetActive(now = Date.now()) {
      return now < magnetUntil;
    }

    function dashActive(now = Date.now()) {
      return now < dashUntil;
    }

    function slowTimeActive(now = Date.now()) {
      return now < slowTimeUntil;
    }

    function refreshCombo(now) {
      if (comboCount > 0 && now >= comboEndsAt) {
        comboCount = 0;
        comboMultiplier = 1;
        comboEndsAt = 0;
      }
    }

    function extendCombo(now) {
      comboCount += 1;
      comboEndsAt = now + COMBO_WINDOW_MS;
      comboMultiplier = Math.min(COMBO_MAX_MULTIPLIER, 1 + Math.floor((comboCount - 1) / COMBO_STEP));
    }

    function addScore(basePoints, cellX, cellY, options = {}) {
      const multiplier = options.useMultiplier === false ? 1 : comboMultiplier;
      const total = Math.max(1, Math.round(basePoints * multiplier));
      score += total;
      if (Number.isFinite(cellX) && Number.isFinite(cellY)) {
        showScorePop(cellX, cellY, `+${total}`, options.color || "#4ade80");
      }
      return total;
    }

    function currentStatusText(now) {
      if (triangleActive(now)) return "Triangle";
      if (triangleBlinkActive(now)) return "Warning";
      if (shieldActive(now)) return "Shielded";
      if (dashActive(now) && now >= nextDashReadyAt) return "Dash Ready";
      if (dashActive(now)) return "Dash Cooldown";
      if (magnetActive(now)) return "Magnet";
      if (slowTimeActive(now)) return "Slow Time";
      if (waveState && now < waveState.until) return waveState.label;
      if (hasGun) return "Armed";
      return "Normal";
    }

    function createTimerNode(id) {
      const root = document.createElement("div");
      root.className = "timer-pill";
      root.dataset.timer = id;
      const top = document.createElement("div");
      top.className = "timer-pill-top";
      const label = document.createElement("span");
      const value = document.createElement("strong");
      top.appendChild(label);
      top.appendChild(value);
      const track = document.createElement("div");
      track.className = "timer-track";
      const fill = document.createElement("div");
      fill.className = "timer-fill";
      track.appendChild(fill);
      root.appendChild(top);
      root.appendChild(track);
      return { root, label, value, fill };
    }

    function syncTimerHud(now) {
      const timers = [];

      if (comboCount > 0 && comboEndsAt > now) {
        timers.push({
          id: "combo",
          label: "Combo Window",
          value: `x${comboMultiplier}`,
          progress: (comboEndsAt - now) / COMBO_WINDOW_MS,
          color: "#22c55e"
        });
      }
      if (triangleBlinkActive(now)) {
        timers.push({
          id: "triangle-warning",
          label: "Triangle Warning",
          value: `${Math.ceil((triangleBlinkUntil - now) / 1000)}s`,
          progress: (triangleBlinkUntil - now) / FLOWER_TRIANGLE_BLINK_MS,
          color: "#f472b6"
        });
      }
      if (triangleActive(now)) {
        timers.push({
          id: "triangle-active",
          label: "Triangle Active",
          value: `${Math.ceil((triangleModeUntil - now) / 1000)}s`,
          progress: (triangleModeUntil - now) / FLOWER_TRIANGLE_ACTIVE_MS,
          color: "#fb7185"
        });
      }
      if (waveState && now < waveState.until) {
        timers.push({
          id: "wave",
          label: waveState.label,
          value: `${Math.ceil((waveState.until - now) / 1000)}s`,
          progress: (waveState.until - now) / waveState.duration,
          color: waveState.color
        });
      }
      if (shieldActive(now)) {
        timers.push({
          id: "shield",
          label: "Shield",
          value: `${Math.ceil((shieldUntil - now) / 1000)}s`,
          progress: (shieldUntil - now) / SHIELD_DURATION_MS,
          color: "#38bdf8"
        });
      }
      if (magnetActive(now)) {
        timers.push({
          id: "magnet",
          label: "Magnet",
          value: `${Math.ceil((magnetUntil - now) / 1000)}s`,
          progress: (magnetUntil - now) / MAGNET_DURATION_MS,
          color: "#f97316"
        });
      }
      if (dashActive(now)) {
        timers.push({
          id: "dash",
          label: "Dash Power",
          value: now >= nextDashReadyAt ? "Ready" : `${Math.ceil((nextDashReadyAt - now) / 1000)}s`,
          progress: (dashUntil - now) / DASH_DURATION_MS,
          color: "#a855f7"
        });
      }
      if (slowTimeActive(now)) {
        timers.push({
          id: "slow",
          label: "Slow Time",
          value: `${Math.ceil((slowTimeUntil - now) / 1000)}s`,
          progress: (slowTimeUntil - now) / SLOW_TIME_DURATION_MS,
          color: "#fde047"
        });
      }

      const activeIds = new Set();
      timers.forEach(timer => {
        let node = timerNodes.get(timer.id);
        if (!node) {
          node = createTimerNode(timer.id);
          timerNodes.set(timer.id, node);
          timerHud.appendChild(node.root);
        }
        node.label.textContent = timer.label;
        node.value.textContent = timer.value;
        node.fill.style.width = `${Math.max(0, Math.min(100, timer.progress * 100))}%`;
        node.fill.style.background = timer.color;
        node.fill.style.color = timer.color;
        activeIds.add(timer.id);
      });

      [...timerNodes.keys()].forEach(id => {
        if (activeIds.has(id)) return;
        const node = timerNodes.get(id);
        node.root.remove();
        timerNodes.delete(id);
      });
    }

    function renderHud(now) {
      refreshCombo(now);
      comboEl.textContent = comboCount ? `${comboCount} chain` : "0";
      multiplierEl.textContent = `x${comboMultiplier}`;
      waveEl.textContent = waveState && now < waveState.until ? waveState.label : "Calm";
      statusEl.textContent = currentStatusText(now);
      eventBanner.textContent = eventMessage;
      eventBanner.dataset.tone = eventTone;
      eventBanner.classList.toggle("show", Boolean(eventMessage) && now < eventMessageUntil);
      syncTimerHud(now);
    }

    function updateModeButtons() {
      modeButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.mode === currentModeKey));
    }

    function setMode(nextModeKey, shouldReset = true) {
      if (!GAME_MODES[nextModeKey]) return;
      currentModeKey = nextModeKey;
      updateModeButtons();
      showBanner(`${currentMode().label} mode`, "power", 1400);
      if (shouldReset) reset();
    }

    /* ── Screen shake ──────────────────────────────── */
    // Trigger a short container shake for collision feedback.
    function screenShake() {
      gameWrap.classList.add("shake");
      gameWrap.addEventListener("animationend", () => gameWrap.classList.remove("shake"), { once: true });
    }

    /* ── Helpers ────────────────────────────────────── */
    function cellKey(x, y) {
      return `${x},${y}`;
    }

    function rebuildSnakeCells() {
      snakeCells = new Set(snake.map(seg => cellKey(seg.x, seg.y)));
    }

    function rebuildFoodCells() {
      foodCells = new Set(foods.map(food => cellKey(food.x, food.y)));
    }

    function rebuildHelperCells() {
      helperCells = new Set();
      helperSnakes.forEach(helper => {
        helper.segments.forEach(seg => helperCells.add(cellKey(seg.x, seg.y)));
      });
    }

    function getEffectiveStepMs(now = Date.now()) {
      let effective = stepMs;
      if (slowTimeActive(now)) effective *= SLOW_TIME_FACTOR;
      return Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, effective));
    }

    function scheduleNextStep() {
      clearTimeout(loopId);
      if (!dead) loopId = setTimeout(step, getEffectiveStepMs());
    }

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

    function isCellInsidePowerup(x, y) {
      if (!powerup) return false;
      return x >= powerup.x && x < powerup.x + POWERUP_SIZE && y >= powerup.y && y < powerup.y + POWERUP_SIZE;
    }

    function isCellOccupiedByHelpers(x, y) {
      return helperCells.has(cellKey(x, y));
    }

    function endGameAt(x, y, particleColor = "#f43f5e", particleCount = 20) {
      dead = true;
      clearTimeout(loopId);
      clearInterval(appleSpawnLoopId);
      playSound("dead");
      screenShake();
      spawnParticles(x, y, particleColor, particleCount);
      finalEl.textContent = score;
      setTimeout(() => overlay.classList.add("visible"), 350);
      updateUI();
    }

    function randomMs(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    }

    function triangleBlinkActive(now) {
      return now < triangleBlinkUntil;
    }

    function triangleActive(now) {
      return now >= triangleBlinkUntil && now < triangleModeUntil;
    }

    function inTriangle(x, y) {
      const center = (gridSize - 1) / 2;
      const maxHalf = (gridSize - 1) / 2;
      const half = (y / Math.max(1, gridSize - 1)) * maxHalf;
      return x >= Math.ceil(center - half) && x <= Math.floor(center + half);
    }

    function isPlayableCell(x, y) {
      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;
      if (triangleActive(Date.now()) && !inTriangle(x, y)) return false;
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
      if (powerup) { powerup.x = Math.min(powerup.x, gridSize - POWERUP_SIZE); powerup.y = Math.min(powerup.y, gridSize - POWERUP_SIZE); }
      rebuildSnakeCells();
      rebuildFoodCells();
      rebuildHelperCells();
    }

    // Place one apple on a free cell.
    function placeOneFood() {
      let tries = 0;
      while (tries < 400) {
        const f = randCell();
        const key = cellKey(f.x, f.y);
        if (!snakeCells.has(key) && !foodCells.has(key) && !isCellInsideMedkit(f.x, f.y) && !isCellInsideEgg(f.x, f.y) && !isCellInsideFlower(f.x, f.y) && !isCellInsideGun(f.x, f.y) && !isCellInsidePowerup(f.x, f.y) && !isCellOccupiedByHelpers(f.x, f.y) && isPlayableCell(f.x, f.y)) {
          foods.push({ x: f.x, y: f.y });
          foodCells.add(key);
          return;
        }
        tries++;
      }
    }

    // Add one apple every fixed interval while game is active.
    function startAppleSpawner() {
      clearInterval(appleSpawnLoopId);
      const interval = currentMode().appleSpawnInterval || BASE_APPLE_SPAWN_INTERVAL_MS;
      appleSpawnLoopId = setInterval(() => {
        if (dead || paused) return;
        placeOneFood();
      }, interval);
    }

    // Check whether a cell is free of snake, food, and medkit.
    function isFreeCell(x, y) {
      const key = cellKey(x, y);
      if (snakeCells.has(key)) return false;
      if (foodCells.has(key)) return false;
      if (isCellInsideMedkit(x, y)) return false;
      if (isCellInsideEgg(x, y)) return false;
      if (isCellInsideFlower(x, y)) return false;
      if (isCellInsideGun(x, y)) return false;
      if (isCellInsidePowerup(x, y)) return false;
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

    function maybeSpawnEgg(now) {
      if (!currentMode().helpers) return;
      if (egg) return;
      if (nextEggSpawnAt && now >= nextEggSpawnAt) {
        placeEgg();
        nextEggSpawnAt = 0;
      }
    }

    function clearExpiredEgg(now) {
      if (egg && now > egg.expiresAt) {
        egg = null;
        nextEggSpawnAt = now + randomMs(EGG_RESPAWN_MIN_MS, EGG_RESPAWN_MAX_MS);
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

    function maybeSpawnFlower(now) {
      if (!currentMode().triangle) return;
      if (flower) return;
      if (nextFlowerSpawnAt && now >= nextFlowerSpawnAt) {
        placeFlower();
        nextFlowerSpawnAt = 0;
      }
    }

    function clearExpiredFlower(now) {
      if (flower && now > flower.expiresAt) {
        flower = null;
        nextFlowerSpawnAt = now + randomMs(FLOWER_RESPAWN_MIN_MS, FLOWER_RESPAWN_MAX_MS);
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

    function maybeSpawnGun(now) {
      if (!currentMode().gun) return;
      if (gunItem) return;
      if (nextGunSpawnAt && now >= nextGunSpawnAt) {
        placeGun();
        nextGunSpawnAt = 0;
      }
    }

    function clearExpiredGun(now) {
      if (gunItem && now > gunItem.expiresAt) {
        gunItem = null;
        nextGunSpawnAt = now + GUN_RESPAWN_MS;
      }
    }

    function placePowerup() {
      let tries = 0;
      while (tries < 400) {
        const c = {
          x: Math.floor(Math.random() * (gridSize - POWERUP_SIZE + 1)),
          y: Math.floor(Math.random() * (gridSize - POWERUP_SIZE + 1))
        };
        let ok = true;
        for (let dx = 0; dx < POWERUP_SIZE && ok; dx++) {
          for (let dy = 0; dy < POWERUP_SIZE; dy++) {
            if (!isFreeCell(c.x + dx, c.y + dy)) { ok = false; break; }
          }
        }
        if (ok) {
          powerup = {
            x: c.x,
            y: c.y,
            type: POWERUP_TYPES[nextPowerupTypeIndex % POWERUP_TYPES.length],
            expiresAt: Date.now() + POWERUP_VISIBLE_MS
          };
          nextPowerupTypeIndex += 1;
          return;
        }
        tries++;
      }
    }

    function maybeSpawnPowerup(now) {
      if (!currentMode().powerups) return;
      if (powerup) return;
      if (nextPowerupSpawnAt && now >= nextPowerupSpawnAt) {
        placePowerup();
        nextPowerupSpawnAt = 0;
      }
    }

    function clearExpiredPowerup(now) {
      if (powerup && now > powerup.expiresAt) {
        powerup = null;
        nextPowerupSpawnAt = now + randomMs(POWERUP_RESPAWN_MIN_MS, POWERUP_RESPAWN_MAX_MS);
      }
    }

    function dropApplesAround(centerX, centerY, count = HELPER_DROP_COUNT) {
      const candidates = [];
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          candidates.push({ x: centerX + dx, y: centerY + dy });
        }
      }
      shuffle(candidates);
      let placed = 0;
      for (const cell of candidates) {
        if (placed >= count) break;
        if (!isFreeCell(cell.x, cell.y)) continue;
        foods.push({ x: cell.x, y: cell.y });
        foodCells.add(cellKey(cell.x, cell.y));
        placed++;
      }
    }

    function destroyHelperSnake(index, now, cause = "shot") {
      const helper = helperSnakes[index];
      if (!helper) return false;
      const head = helper.segments[0];
      spawnParticles(head.x, head.y, "#22d3ee", 28, 1.9, 1.8, -0.007);
      helperSnakes.splice(index, 1);
      rebuildHelperCells();
      extendCombo(now);
      addScore(HELPER_KILL_SCORE, head.x, head.y, { color: "#22d3ee" });
      dropApplesAround(head.x, head.y);
      advanceChallenge("helperHits", 1, head.x, head.y);
      showTextPop(head.x, head.y, cause === "dash" ? "DASH DROP" : "APPLE DROP", "#22d3ee");
      triggerFlash(0.24);
      playSound("helper");
      return true;
    }

    function triggerTriangleChallenge(now, warningMs = FLOWER_TRIANGLE_BLINK_MS, activeMs = FLOWER_TRIANGLE_ACTIVE_MS) {
      triangleBlinkUntil = now + warningMs;
      triangleModeUntil = triangleBlinkUntil + activeMs;
      triangleChallengeActive = true;
      triangleRewardTickAt = triangleBlinkUntil + TRIANGLE_SURVIVAL_SCORE_MS;
      showBanner("Triangle warning", "danger", Math.min(warningMs, 2400));
      playSound("danger");
    }

    function updateTriangleChallenge(now) {
      if (!triangleChallengeActive) return;

      while (triangleActive(now) && triangleRewardTickAt && now >= triangleRewardTickAt) {
        extendCombo(now);
        addScore(TRIANGLE_SURVIVAL_SCORE, snake[0].x, snake[0].y, { color: "#f472b6" });
        showTextPop(snake[0].x, snake[0].y, "HOLD", "#f472b6");
        triangleRewardTickAt += TRIANGLE_SURVIVAL_SCORE_MS;
      }

      if (triangleChallengeActive && now >= triangleModeUntil) {
        triangleChallengeActive = false;
        triangleRewardTickAt = 0;
        extendCombo(now);
        addScore(TRIANGLE_COMPLETION_SCORE, snake[0].x, snake[0].y, { color: "#fde68a" });
        showTextPop(snake[0].x, snake[0].y, "CLEARED", "#fde68a");
        showBanner("Triangle cleared", "reward", 1500);
        playSound("bonus");
      }
    }

    function activatePowerup(type, now, cellX, cellY) {
      if (type === "shield") {
        shieldUntil = now + SHIELD_DURATION_MS;
        showTextPop(cellX, cellY, "SHIELD", "#38bdf8");
        showBanner("Shield online", "power");
      } else if (type === "magnet") {
        magnetUntil = now + MAGNET_DURATION_MS;
        showTextPop(cellX, cellY, "MAGNET", "#f97316");
        showBanner("Magnet active", "power");
      } else if (type === "dash") {
        dashUntil = now + DASH_DURATION_MS;
        nextDashReadyAt = now;
        dashRequested = false;
        showTextPop(cellX, cellY, "DASH", "#a855f7");
        showBanner("Dash charged", "power");
      } else if (type === "slow") {
        slowTimeUntil = now + SLOW_TIME_DURATION_MS;
        showTextPop(cellX, cellY, "SLOW TIME", "#fde047");
        showBanner("Time stretched", "power");
      }
      triggerFlash(0.25);
      playSound("power");
    }

    function maybeAwardSurvivalScore(now) {
      if (!currentMode().survivalPulseMs || now < nextSurvivalScoreAt) return;
      addScore(1, snake[0].x, snake[0].y, { useMultiplier: false, color: "#93c5fd" });
      showTextPop(snake[0].x, snake[0].y, "SURVIVE", "#93c5fd");
      nextSurvivalScoreAt = now + currentMode().survivalPulseMs;
    }

    function startWave(type, now) {
      if (type === "helperRush") {
        spawnHelperSnakes(currentMode().helperRushCount);
        helperRushUntil = now + HELPER_RUSH_DURATION_MS;
        waveState = {
          type,
          label: "Helper Rush",
          until: helperRushUntil,
          duration: HELPER_RUSH_DURATION_MS,
          color: "#fb7185"
        };
      } else if (type === "triangleTrial") {
        triggerTriangleChallenge(now, Math.max(2500, FLOWER_TRIANGLE_BLINK_MS - 1500), FLOWER_TRIANGLE_ACTIVE_MS);
        waveState = {
          type,
          label: "Triangle Trial",
          until: triangleModeUntil,
          duration: triangleModeUntil - now,
          color: "#f472b6"
        };
      } else if (type === "bigHarvest") {
        bigHarvestUntil = now + BIG_HARVEST_DURATION_MS;
        while (foods.length < BIG_HARVEST_MIN_APPLES) placeOneFood();
        waveState = {
          type,
          label: "Big Harvest",
          until: bigHarvestUntil,
          duration: BIG_HARVEST_DURATION_MS,
          color: "#22c55e"
        };
      } else {
        return false;
      }

      showBanner(waveState.label, type === "helperRush" ? "danger" : "reward");
      playSound("wave");
      return true;
    }

    function maintainWaveState(now) {
      if (bigHarvestUntil && now < bigHarvestUntil) {
        while (foods.length < BIG_HARVEST_MIN_APPLES) placeOneFood();
      } else {
        bigHarvestUntil = 0;
      }

      if (helperRushUntil && now >= helperRushUntil) helperRushUntil = 0;
      if (waveState && now >= waveState.until) waveState = null;
    }

    function maybeStartWave(now) {
      if (!currentMode().waves || score < nextWaveScore) return;
      const pool = currentMode().wavePool.filter(type => {
        if (type === "helperRush") return currentMode().helpers;
        if (type === "triangleTrial") return currentMode().triangle && !triangleBlinkActive(now) && !triangleActive(now);
        return true;
      });
      if (pool.length === 0) return;
      const nextType = pool[Math.floor(Math.random() * pool.length)];
      if (startWave(nextType, now)) {
        nextWaveScore += currentMode().waveScoreStep;
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

    function updateHelperSnakes(now) {
      for (let i = helperSnakes.length - 1; i >= 0; i--) {
        const helper = helperSnakes[i];
        if (now > helper.expiresAt) {
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
          foodCells.delete(cellKey(eaten.x, eaten.y));
          spawnParticles(eaten.x, eaten.y, "#22d3ee", 16, 1.2, 0.8, -0.003);
          applyStepMs(stepMs * SPEEDUP_PER_APPLE);
          if (foods.length === 0) placeOneFood();
        }
      }
      rebuildHelperCells();
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
      rebuildHelperCells();
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
      playSound("power");
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
          destroyHelperSnake(hitHelper, Date.now(), "shot");
          bullets.splice(i, 1);
        }
      }
    }

    function maybeResizePlayground(now) {
      if (!currentMode().fieldResize) return;
      if (!nextPlaygroundResizeAt || now < nextPlaygroundResizeAt) return;
      if (gridSize >= BASE_GRID_SIZE * PLAYGROUND_MAX_MULTIPLIER) {
        shrinkFieldBy(PLAYGROUND_REDUCE_FACTOR);
      } else {
        growFieldBy(PLAYGROUND_GROWTH);
      }
      nextPlaygroundResizeAt = now + PLAYGROUND_GROW_INTERVAL_MS;
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
      if (!currentMode().medkit) return;
      if (medkit) return;
      if (Math.random() < RED_CROSS_SPAWN_CHANCE) placeMedkit();
    }

    // Remove medkit when its 10-second lifetime ends.
    function clearExpiredMedkit(now) {
      if (medkit && now > medkit.expiresAt) medkit = null;
    }

    // Apply and clamp movement interval, then restart step timer.
    function applyStepMs(nextMs) {
      stepMs = Math.max(MIN_STEP_MS, Math.min(MAX_STEP_MS, nextMs));
      scheduleNextStep();
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

    function startNewChallenge() {
      const candidates = CHALLENGE_TEMPLATES.filter(candidate => !challenge || candidate.id !== challenge.id);
      challenge = { ...candidates[Math.floor(Math.random() * candidates.length)] };
      challengeProgress = 0;
      refreshChallengeUI();
    }

    function refreshChallengeUI() {
      if (!challenge || !challengeTitleEl || !challengeProgressEl) return;
      challengeTitleEl.textContent = challenge.label;
      challengeProgressEl.textContent = `${Math.floor(challengeProgress)} / ${challenge.target}`;
    }

    function completeChallenge(x, y) {
      score += CHALLENGE_REWARD_POINTS;
      showTextPop(x, y, `TASK +${CHALLENGE_REWARD_POINTS}`, "#38bdf8");
      triggerFlash(0.28);
      showBanner("Task complete", "reward", 1400);
      playSound("bonus");
      startNewChallenge();
      updateUI();
    }

    function advanceChallenge(metric, amount, x, y) {
      if (!challenge || challenge.metric !== metric || dead) return;
      challengeProgress = Math.min(challenge.target, challengeProgress + amount);
      refreshChallengeUI();
      if (challengeProgress >= challenge.target) completeChallenge(x, y);
    }

    function updateTimedChallenge(now) {
      if (!challenge || challenge.metric !== "seconds") return;
      challengeProgress = Math.min(challenge.target, Math.floor((now - gameStartedAt) / 1000));
      refreshChallengeUI();
      if (challengeProgress >= challenge.target) {
        const head = snake[0];
        completeChallenge(head.x, head.y);
      }
    }

    /* ── Game logic ────────────────────────────────── */
    // Start a new game round with base speed and fresh state.
    function reset() {
      const now = Date.now();
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
      powerup = null;
      helperSnakes = [];
      hasGun = false;
      bullets = [];
      snakeCells = new Set();
      foodCells = new Set();
      helperCells = new Set();
      triangleBlinkUntil = 0;
      triangleModeUntil = 0;
      triangleChallengeActive = false;
      triangleRewardTickAt = 0;
      comboCount = 0;
      comboMultiplier = 1;
      comboEndsAt = 0;
      shieldUntil = 0;
      magnetUntil = 0;
      dashUntil = 0;
      dashRequested = false;
      nextDashReadyAt = 0;
      slowTimeUntil = 0;
      waveState = null;
      nextWaveScore = currentMode().waveScoreStep;
      bigHarvestUntil = 0;
      helperRushUntil = 0;
      nextPowerupTypeIndex = Math.floor(Math.random() * POWERUP_TYPES.length);
      lastManualControlAt = now;
      nextEggSpawnAt = currentMode().helpers ? now + FIRST_EGG_DELAY_MS : 0;
      nextFlowerSpawnAt = currentMode().triangle ? now + randomMs(FLOWER_RESPAWN_MIN_MS, FLOWER_RESPAWN_MAX_MS) : 0;
      nextGunSpawnAt = currentMode().gun ? now + GUN_RESPAWN_MS : 0;
      nextPowerupSpawnAt = currentMode().powerups ? now + randomMs(POWERUP_RESPAWN_MIN_MS, POWERUP_RESPAWN_MAX_MS) : 0;
      nextPlaygroundResizeAt = currentMode().fieldResize ? now + PLAYGROUND_GROW_INTERVAL_MS : 0;
      nextSurvivalScoreAt = currentMode().survivalPulseMs ? now + currentMode().survivalPulseMs : 0;
      challenge = null;
      challengeProgress = 0;
      gameStartedAt = now;
      rebuildSnakeCells();
      placeOneFood();
      startNewChallenge();
      overlay.classList.remove("visible");
      updateUI();
      clearTimeout(loopId);
      scheduleNextStep();
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
      refreshChallengeUI();
    }

    function opposite(a, b) { return a.x === -b.x && a.y === -b.y; }

    // Queue a valid next movement direction.
    function queueDir(next) {
      ensureAudioContext();
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

    function hitsSnake(x, y) { return snakeCells.has(cellKey(x, y)); }
    function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

    function findHelperSnakeIndexAt(x, y) {
      return helperSnakes.findIndex(helper => helper.segments.some(seg => seg.x === x && seg.y === y));
    }

    function findSafeDir(fromHead, currentDir, options = {}) {
      const candidates = shuffle(ALL_DIRS.filter(d => {
        if (!options.allowReverse && currentDir && d.x === -currentDir.x && d.y === -currentDir.y) return false;
        const nx = fromHead.x + d.x;
        const ny = fromHead.y + d.y;
        if (!isPlayableCell(nx, ny)) return false;
        if (hitsSnake(nx, ny)) return false;
        if (!options.allowHelperCollision && isCellOccupiedByHelpers(nx, ny)) return false;
        return true;
      }));
      return candidates.length > 0 ? candidates[0] : null;
    }

    // Pick a random safe direction used by bounce behavior.
    function pickRandomSafeDir(fromHead, options = {}) {
      return findSafeDir(fromHead, dir, { ...options, allowReverse: true });
    }

    function pickChaosDir(fromHead, currentDir) {
      return findSafeDir(fromHead, currentDir, { allowReverse: false });
    }

    function consumeShield(now, cellX, cellY, text = "BLOCK") {
      if (!shieldActive(now)) return false;
      shieldUntil = 0;
      showTextPop(cellX, cellY, text, "#38bdf8");
      showBanner("Shield saved you", "power", 1500);
      triggerFlash(0.28);
      playSound("shield");
      screenShake();
      return true;
    }

    function snapHeadIntoTriangle() {
      const y = snake[0].y;
      const center = (gridSize - 1) / 2;
      const maxHalf = (y / Math.max(1, gridSize - 1)) * ((gridSize - 1) / 2);
      const minX = Math.ceil(center - maxHalf);
      const maxX = Math.floor(center + maxHalf);
      snake[0].x = Math.max(minX, Math.min(maxX, snake[0].x));
      rebuildSnakeCells();
    }

    function rescueMove(now, fromHead) {
      if (!consumeShield(now, fromHead.x, fromHead.y)) return null;
      const rescueDir = pickRandomSafeDir(fromHead);
      if (!rescueDir) return null;
      dir = rescueDir;
      qDir = { ...dir };
      return { x: fromHead.x + dir.x, y: fromHead.y + dir.y };
    }

    function consumeAppleAtIndex(index, now) {
      const eaten = foods[index];
      foods.splice(index, 1);
      foodCells.delete(cellKey(eaten.x, eaten.y));
      extendCombo(now);
      addScore(1, eaten.x, eaten.y, { color: "#4ade80" });
      applesEaten++;
      spawnParticles(eaten.x, eaten.y, "#4ade80", 30, 1.7, 1.5, -0.005);
      spawnParticles(eaten.x, eaten.y, "#facc15", 24, 2.1, 2.0, -0.004);
      spawnParticles(eaten.x, eaten.y, "#ffffff", 10, 2.5, 1.8, -0.008);
      triggerFlash(0.45);
      playSound("eat");
      applyStepMs(stepMs * SPEEDUP_PER_APPLE);

      if (applesEaten % APPLE_BONUS_THRESHOLD === 0) {
        const tail = snake[snake.length - 1];
        const bonusGrowth = Math.max(1, Math.round(snake.length * 0.1));
        for (let i = 0; i < bonusGrowth; i++) {
          snake.push({ x: tail.x, y: tail.y });
        }
        showTextPop(eaten.x, eaten.y, "+10% SIZE", "#34d399");
        showBanner("Growth burst", "reward", 1400);
        playSound("bonus");
      }

      advanceChallenge("apples", 1, eaten.x, eaten.y);
      if (foods.length === 0) placeOneFood();
    }

    function collectMagnetApples(head, now) {
      if (!magnetActive(now)) return;
      for (let i = foods.length - 1; i >= 0; i--) {
        const apple = foods[i];
        const dist = Math.abs(apple.x - head.x) + Math.abs(apple.y - head.y);
        if (dist === 0 || dist > 2) continue;
        spawnParticles(apple.x, apple.y, "#fb923c", 18, 1.5, 0.8, -0.004);
        consumeAppleAtIndex(i, now);
      }
    }

    function collectBoardPickup(head, now) {
      if (medkit && isCellInsideMedkit(head.x, head.y)) {
        const mx = medkit.x + 0.5;
        const my = medkit.y + 0.5;
        spawnParticles(mx, my, "#f87171", 20, 1.4, 1.2, -0.004);
        showTextPop(mx, my, "SLOW", "#f87171");
        triggerFlash(0.22);
        applyStepMs(stepMs * SLOWDOWN_ON_MEDKIT);
        advanceChallenge("medkits", 1, mx, my);
        medkit = null;
        playSound("danger");
      }

      if (egg && isCellInsideEgg(head.x, head.y)) {
        const ex = egg.x + EGG_SIZE / 2;
        const ey = egg.y + EGG_SIZE / 2;
        spawnParticles(ex, ey, "#fde047", 34, 2.2, 2, -0.007);
        showTextPop(ex, ey, "EGG!", "#fde047");
        triggerFlash(0.35);
        egg = null;
        spawnHelperSnakes(HELPER_SNAKE_COUNT);
        nextEggSpawnAt = now + HELPER_LIFETIME_MS + randomMs(EGG_RESPAWN_MIN_MS, EGG_RESPAWN_MAX_MS);
        growFieldBy(0.2);
        advanceChallenge("eggs", 1, ex, ey);
        playSound("wave");
      }

      if (flower && isCellInsideFlower(head.x, head.y)) {
        const fx = flower.x + FLOWER_SIZE / 2;
        const fy = flower.y + FLOWER_SIZE / 2;
        spawnParticles(fx, fy, "#f472b6", 26, 1.8, 1.3, -0.006);
        showTextPop(fx, fy, "TRIANGLE!", "#f472b6");
        triggerTriangleChallenge(now);
        flower = null;
        nextFlowerSpawnAt = now + randomMs(FLOWER_RESPAWN_MIN_MS, FLOWER_RESPAWN_MAX_MS);
        advanceChallenge("flowers", 1, fx, fy);
      }

      if (gunItem && isCellInsideGun(head.x, head.y)) {
        const gx = gunItem.x + GUN_SIZE / 2;
        const gy = gunItem.y + GUN_SIZE / 2;
        spawnParticles(gx, gy, "#eab308", 22, 1.6, 1.1, -0.005);
        showTextPop(gx, gy, "GUN", "#eab308");
        hasGun = true;
        gunItem = null;
        nextGunSpawnAt = now + GUN_RESPAWN_MS;
        showBanner("Gun equipped", "power", 1400);
        playSound("power");
      }

      if (powerup && isCellInsidePowerup(head.x, head.y)) {
        const px = powerup.x + POWERUP_SIZE / 2;
        const py = powerup.y + POWERUP_SIZE / 2;
        spawnParticles(px, py, "#c084fc", 30, 1.9, 1.6, -0.006);
        activatePowerup(powerup.type, now, px, py);
        powerup = null;
        nextPowerupSpawnAt = now + randomMs(POWERUP_RESPAWN_MIN_MS, POWERUP_RESPAWN_MAX_MS);
      }
    }

    function moveSnakeOneCell(now, allowDashSmash = false) {
      let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      let safetyAttempts = 0;

      while (safetyAttempts < 3) {
        if (!isPlayableCell(head.x, head.y)) {
          spawnParticles(
            Math.max(0, Math.min(gridSize - 1, head.x)),
            Math.max(0, Math.min(gridSize - 1, head.y)),
            "#38bdf8",
            8
          );

          if (currentMode().wallBounce) {
            const safeDir = pickRandomSafeDir(snake[0], { allowHelperCollision: allowDashSmash });
            if (safeDir) {
              dir = safeDir;
              qDir = { ...dir };
              head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
              if (currentMode().chaosTurns) {
                postBounceRandomTurnAt = now + BOUNCE_RANDOM_TURN_INTERVAL_MS;
              }
              safetyAttempts++;
              continue;
            }
          }

          const rescued = rescueMove(now, snake[0]);
          if (rescued) {
            head = rescued;
            safetyAttempts++;
            continue;
          }

          endGameAt(snake[0].x, snake[0].y);
          return false;
        }

        const helperIndex = findHelperSnakeIndexAt(head.x, head.y);
        if (helperIndex >= 0) {
          if (allowDashSmash) {
            destroyHelperSnake(helperIndex, now, "dash");
          } else {
            const rescued = rescueMove(now, snake[0]);
            if (rescued) {
              head = rescued;
              safetyAttempts++;
              continue;
            }
            endGameAt(head.x, head.y, "#fb7185", 24);
            return false;
          }
        }

        if (hitsSnake(head.x, head.y)) {
          const rescued = rescueMove(now, snake[0]);
          if (rescued) {
            head = rescued;
            safetyAttempts++;
            continue;
          }
          endGameAt(head.x, head.y);
          return false;
        }

        break;
      }

      const oldTail = snake[snake.length - 1];
      snake.unshift(head);
      snakeCells.add(cellKey(head.x, head.y));

      const eatenFoodIndex = foods.findIndex(a => head.x === a.x && head.y === a.y);
      if (eatenFoodIndex >= 0) {
        consumeAppleAtIndex(eatenFoodIndex, now);
      } else {
        snake.pop();
        snakeCells.delete(cellKey(oldTail.x, oldTail.y));
      }

      collectMagnetApples(head, now);
      collectBoardPickup(head, now);

      if (triangleActive(now) && !inTriangle(snake[0].x, snake[0].y)) {
        if (consumeShield(now, snake[0].x, snake[0].y)) {
          snapHeadIntoTriangle();
        } else {
          endGameAt(snake[0].x, snake[0].y, "#f43f5e", 24);
          return false;
        }
      }

      return true;
    }

    // Main game tick: movement, collisions, pickups, speed updates.
    function step() {
      if (dead) return;
      if (paused) {
        scheduleNextStep();
        return;
      }
      const now = Date.now();
      refreshCombo(now);
      clearExpiredMedkit(now);
      clearExpiredEgg(now);
      clearExpiredFlower(now);
      clearExpiredGun(now);
      clearExpiredPowerup(now);
      maintainWaveState(now);
      maybeResizePlayground(now);
      helperMoveToggle = !helperMoveToggle;
      if (currentMode().helpers && helperMoveToggle) updateHelperSnakes(now);
      updateBullets();

      if (triangleActive(now) && !inTriangle(snake[0].x, snake[0].y)) {
        if (consumeShield(now, snake[0].x, snake[0].y)) {
          snapHeadIntoTriangle();
        } else {
          endGameAt(snake[0].x, snake[0].y, "#f43f5e", 24);
          return;
        }
      }

      updateTriangleChallenge(now);
      updateTimedChallenge(now);
      maybeAwardSurvivalScore(now);

      dir = qDir;

      /* ── After wall bounce: random direction every 4 seconds ── */
      if (currentMode().chaosTurns && postBounceRandomTurnAt && now >= postBounceRandomTurnAt) {
        const rnd = pickRandomSafeDir(snake[0]);
        if (rnd) {
          dir = rnd;
          qDir = { ...dir };
          spawnParticles(snake[0].x, snake[0].y, "#a78bfa", 8);
        }
        postBounceRandomTurnAt = Date.now() + BOUNCE_RANDOM_TURN_INTERVAL_MS;
      }

      // If player leaves snake unattended, add occasional safe random turns.
      if (currentMode().chaosTurns && now - lastManualControlAt > CHAOS_IDLE_MS && Math.random() < CHAOS_TURN_CHANCE) {
        const chaos = pickChaosDir(snake[0], dir);
        if (chaos) {
          dir = chaos;
          qDir = { ...dir };
          spawnParticles(snake[0].x, snake[0].y, "#f472b6", 6, 1.05, 0.2, 0);
        }
      }

      const useDash = dashRequested && dashActive(now) && now >= nextDashReadyAt;
      if (useDash) {
        dashRequested = false;
        nextDashReadyAt = now + DASH_COOLDOWN_MS;
        showBanner("Dash!", "power", 800);
        triggerFlash(0.18);
        playSound("dash");
      }

      const moveCount = useDash ? DASH_STEPS : 1;
      for (let stepIndex = 0; stepIndex < moveCount; stepIndex++) {
        if (!moveSnakeOneCell(now, useDash)) return;
      }

      maybeStartWave(now);
      maybeSpawnMedkit();
      maybeSpawnEgg(now);
      maybeSpawnFlower(now);
      maybeSpawnGun(now);
      maybeSpawnPowerup(now);
      updateUI();
      scheduleNextStep();
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

    function drawPowerup() {
      if (!powerup) return;
      const x = powerup.x * tileSize + 2;
      const y = powerup.y * tileSize + 2;
      const w = tileSize * POWERUP_SIZE - 4;
      const h = tileSize * POWERUP_SIZE - 4;
      const cx = x + w / 2;
      const cy = y + h / 2;

      ctx.save();
      if (powerup.type === "shield") {
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = Math.max(2, tileSize * 0.08);
        ctx.shadowColor = "rgba(56, 189, 248, 0.45)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(w, h) * 0.32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#bfdbfe";
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(w, h) * 0.12, 0, Math.PI * 2);
        ctx.fill();
      } else if (powerup.type === "magnet") {
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = Math.max(2, tileSize * 0.09);
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(251, 146, 60, 0.45)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.18, cy - h * 0.18);
        ctx.lineTo(cx - w * 0.18, cy + h * 0.18);
        ctx.arc(cx, cy + h * 0.18, w * 0.18, Math.PI, 0, true);
        ctx.lineTo(cx + w * 0.18, cy - h * 0.18);
        ctx.stroke();
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(cx - w * 0.24, cy - h * 0.2, w * 0.09, h * 0.08);
        ctx.fillRect(cx + w * 0.15, cy - h * 0.2, w * 0.09, h * 0.08);
      } else if (powerup.type === "dash") {
        ctx.fillStyle = "#c084fc";
        ctx.shadowColor = "rgba(192, 132, 252, 0.5)";
        ctx.shadowBlur = 14;
        for (let i = 0; i < 2; i++) {
          const off = i * w * 0.18;
          ctx.beginPath();
          ctx.moveTo(cx - w * 0.22 + off, cy - h * 0.16);
          ctx.lineTo(cx + off, cy);
          ctx.lineTo(cx - w * 0.22 + off, cy + h * 0.16);
          ctx.lineTo(cx - w * 0.12 + off, cy);
          ctx.closePath();
          ctx.fill();
        }
      } else if (powerup.type === "slow") {
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = Math.max(2, tileSize * 0.07);
        ctx.shadowColor = "rgba(253, 224, 71, 0.45)";
        ctx.shadowBlur = 12;
        ctx.strokeRect(cx - w * 0.15, cy - h * 0.22, w * 0.3, h * 0.44);
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.15, cy - h * 0.2);
        ctx.lineTo(cx + w * 0.12, cy - h * 0.02);
        ctx.lineTo(cx - w * 0.12, cy + h * 0.16);
        ctx.stroke();
      }
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

      drawActiveAuras(snake[0]);

      // Eyes on head
      drawEyes(snake[0], dir);
    }

    function drawActiveAuras(head) {
      const now = Date.now();
      const cx = head.x * tileSize + tileSize / 2;
      const cy = head.y * tileSize + tileSize / 2;

      if (shieldActive(now)) {
        ctx.save();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = Math.max(2, tileSize * 0.08);
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.44, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (magnetActive(now)) {
        ctx.save();
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = Math.max(2, tileSize * 0.06);
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (dashActive(now)) {
        ctx.save();
        ctx.fillStyle = "rgba(192, 132, 252, 0.45)";
        ctx.beginPath();
        ctx.arc(cx - dir.x * tileSize * 0.5, cy - dir.y * tileSize * 0.5, tileSize * 0.16, 0, Math.PI * 2);
        ctx.arc(cx - dir.x * tileSize * 0.82, cy - dir.y * tileSize * 0.82, tileSize * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (slowTimeActive(now)) {
        ctx.save();
        ctx.fillStyle = "rgba(253, 224, 71, 0.8)";
        for (let i = 0; i < 3; i++) {
          const angle = now / 220 + i * ((Math.PI * 2) / 3);
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * tileSize * 0.45, cy + Math.sin(angle) * tileSize * 0.45, tileSize * 0.06, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
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
      const now = Date.now();
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
      drawPowerup();
      drawMedkit();
      drawHelperSnakes();
      drawSnake();
      drawBullets();
      updateParticles();
      drawParticles();

      if (triangleBlinkActive(now)) {
        const blinkOn = Math.floor(now / 220) % 2 === 0;
        if (blinkOn) {
          ctx.save();
          ctx.fillStyle = "rgba(244,114,182,0.14)";
          ctx.beginPath();
          ctx.moveTo(board.width / 2, 0);
          ctx.lineTo(board.width, board.height);
          ctx.lineTo(0, board.height);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#fce7f3";
          ctx.font = "900 24px 'Orbitron', monospace";
          ctx.textAlign = "center";
          ctx.fillText(`TRIANGLE IN ${Math.max(1, Math.ceil((triangleBlinkUntil - now) / 1000))}`, board.width / 2, 40);
          ctx.restore();
        }
      } else if (triangleActive(now)) {
        ctx.save();
        ctx.fillStyle = "rgba(244,114,182,0.2)";
        ctx.beginPath();
        ctx.moveTo(board.width / 2, 0);
        ctx.lineTo(board.width, board.height);
        ctx.lineTo(0, board.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fde68a";
        ctx.font = "900 22px 'Orbitron', monospace";
        ctx.textAlign = "center";
        ctx.fillText("STAY INSIDE", board.width / 2, 38);
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

      renderHud(now);
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

      ensureAudioContext();
      const k = e.key.toLowerCase();
      if (k === "arrowup"    || k === "w") { queueDir({ x: 0, y: -1 }); e.preventDefault(); }
      if (k === "arrowdown"  || k === "s") { queueDir({ x: 0, y: 1  }); e.preventDefault(); }
      if (k === "arrowleft"  || k === "a") { queueDir({ x: -1, y: 0 }); e.preventDefault(); }
      if (k === "arrowright"  || k === "d") { queueDir({ x: 1, y: 0  }); e.preventDefault(); }
      if (k === "f") { shoot(); e.preventDefault(); }
      if (k === "shift") {
        if (dashActive()) {
          dashRequested = true;
          showBanner(Date.now() >= nextDashReadyAt ? "Dash primed" : "Dash cooling", "power", 700);
        }
        e.preventDefault();
      }
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
        ensureAudioContext();
        handleJoystickDirection(btn.dataset.dir);
      }, { passive: false });
      btn.addEventListener("click", e => {
        e.preventDefault();
        ensureAudioContext();
        handleJoystickDirection(btn.dataset.dir);
      });
    });

    modeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        ensureAudioContext();
        setMode(btn.dataset.mode);
      });
    });

    document.getElementById("restartBtn").addEventListener("click", reset);
    document.getElementById("overlayRestart").addEventListener("click", reset);
    saveHiToggle.addEventListener("change", () => {
      if (!saveHiToggle.checked) return;
      persistHiIfEnabled();
    });
    soundToggle.addEventListener("change", () => {
      if (soundToggle.checked) ensureAudioContext();
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
    updateModeButtons();
    reset();
    render();
