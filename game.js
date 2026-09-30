/**
 * MindForge: Bilişsel Spor Salonu Ana Orkestrasyon Motoru
 * Mimari: 100% Offline-First, Local-First, Zero-Login, Non-Punitive Progression.
 */

const MindForge = (() => {
  const STORAGE_KEY = "mindforge_player_state_v2";

  const defaultState = {
    totalXp: 0,
    level: 1,
    streakDays: 1,
    lastPlayDate: new Date().toISOString().split("T")[0],
    streakFreezes: 2,
    soundEnabled: true,
    categories: {
      memory: { plays: 0, xp: 0, level: 1 },
      focus: { plays: 0, xp: 0, level: 1 },
      speed: { plays: 0, xp: 0, level: 1 },
      logic: { plays: 0, xp: 0, level: 1 },
      language: { plays: 0, xp: 0, level: 1 }
    }
  };

  let state = loadState();
  let currentGameMeta = null;
  let activeGameInstance = null;
  let currentFilter = "all";

  // ==========================================
  // 1. LOCALSTORAGE & STATE
  // ==========================================
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          categories: { ...defaultState.categories, ...(parsed.categories || {}) }
        };
      }
    } catch (e) {
      console.warn("Depolama okuma hatası, varsayılan profil yükleniyor:", e);
    }
    return { ...defaultState };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Yerel depolama yazma hatası:", e);
    }
    renderHeaderStats();
    renderDashboardMetrics();
  }

  // ==========================================
  // 2. SES SİSTEMİ (Web Audio API - 0 Harici Dosya)
  // ==========================================
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioClass = window.AudioContext || window.webkitAudioContext;
      if (AudioClass) audioCtx = new AudioClass();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function playTone(freq, type = "sine", duration = 0.15, gainVal = 0.1) {
    if (!state.soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function playSound(type) {
    if (!state.soundEnabled) return;
    if (type === "tap") {
      playTone(480, "sine", 0.08, 0.08);
    } else if (type === "correct") {
      playTone(523.25, "sine", 0.1, 0.12);
      setTimeout(() => playTone(659.25, "sine", 0.12, 0.12), 80);
      setTimeout(() => playTone(783.99, "sine", 0.2, 0.12), 160);
    } else if (type === "wrong") {
      playTone(220, "triangle", 0.22, 0.1);
    } else if (type === "level-up") {
      [440, 554, 659, 880].forEach((f, i) => setTimeout(() => playTone(f, "triangle", 0.25, 0.15), i * 100));
    }
  }

  // ==========================================
  // 3. UI RENDER VE FİLTRELEME
  // ==========================================
  function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const target = document.getElementById(viewId);
    if (target) target.classList.add("active");
  }

  function renderHeaderStats() {
    const xpEl = document.getElementById("header-xp");
    const lvlEl = document.getElementById("header-level");
    const streakEl = document.getElementById("header-streak");
    const soundBtn = document.getElementById("sound-toggle");

    if (xpEl) xpEl.textContent = state.totalXp.toLocaleString();
    if (lvlEl) lvlEl.textContent = state.level;
    if (streakEl) streakEl.textContent = `${state.streakDays} Gün`;
    if (soundBtn) soundBtn.textContent = state.soundEnabled ? "🔊" : "🔇";
  }

  function renderDashboardMetrics() {
    const cats = state.categories;

    const setLvl = (id, cat) => {
      const el = document.getElementById(`stat-${id}-lvl`);
      const fill = document.getElementById(`fill-${id}`);
      if (el && cats[cat]) {
        el.textContent = `Sv. ${cats[cat].level} (XP: ${cats[cat].xp})`;
      }
      if (fill && cats[cat]) {
        fill.style.width = `${Math.min(100, (cats[cat].xp % 500) / 5)}%`;
      }
    };

    setLvl("memory", "memory");
    setLvl("focus", "focus");
    setLvl("speed", "speed");
    setLvl("logic", "logic");
    setLvl("lang", "language");
  }

  function renderGamesGrid() {
    const container = document.getElementById("games-grid-container");
    if (!container) return;

    container.innerHTML = "";
    const allGames = MindForgeGames.getAll();

    allGames.forEach(game => {
      const card = document.createElement("article");
      card.className = "game-card";
      card.dataset.category = game.category;
      card.dataset.id = game.id;

      if (currentFilter !== "all" && game.category !== currentFilter) {
        card.classList.add("hidden");
      }

      const categoryData = state.categories[game.category] || { plays: 0 };

      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="game-badge ${game.badgeColor}">${game.categoryLabel}</span>
            <span class="play-count-badge">${categoryData.plays} Seans</span>
          </div>
          <div class="game-icon-large">${game.icon}</div>
          <h4>${game.name}</h4>
          <p>${game.desc}</p>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary start-btn" onclick="MindForge.launchGame('${game.id}')">
            <span>Başla</span> ➜
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function setupFilters() {
    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentFilter = tab.dataset.filter;

        document.querySelectorAll(".game-card").forEach(card => {
          if (currentFilter === "all" || card.dataset.category === currentFilter) {
            card.classList.remove("hidden");
          } else {
            card.classList.add("hidden");
          }
        });
      });
    });
  }

  // ==========================================
  // 4. OYUN BAŞLATMA & YAŞAM DÖNGÜSÜ
  // ==========================================
  function launchGame(gameId) {
    if (activeGameInstance) {
      activeGameInstance.destroy();
      activeGameInstance = null;
    }

    currentGameMeta = MindForgeGames.getById(gameId);
    if (!currentGameMeta) return;

    // 1-2 Cümlelik Net "Nasıl Oynanır?" Modalı
    const modal = document.getElementById("tutorial-modal");
    document.getElementById("tut-title").textContent = currentGameMeta.name;
    document.getElementById("tut-body").innerHTML = `
      <div style="font-size:1.05rem; font-weight:600; color:#fff; margin-bottom:12px;">${currentGameMeta.instruction}</div>
      <p style="color:var(--text-muted); font-size:0.85rem;">
        ⚡ <strong>Etik Kuralımız:</strong> Günlük limit yoktur, hata yaptığınızda puanınız düşmez. Rahatça zihninizi test edin!
      </p>
    `;
    modal.classList.add("active");
  }

  function closeTutorialAndStart() {
    document.getElementById("tutorial-modal").classList.remove("active");
    showView("view-game");

    document.getElementById("current-game-title").textContent = currentGameMeta.name;
    document.getElementById("current-game-subtitle").textContent = currentGameMeta.instruction;
    document.getElementById("game-live-score").textContent = "0";

    const stageEl = document.getElementById("game-stage");
    const controlsTrayEl = document.getElementById("game-controls-tray");

    // Standard Game API Köprüsü
    const api = {
      stage: stageEl,
      playSound: (t) => playSound(t),
      updateScore: (s) => {
        document.getElementById("game-live-score").textContent = s;
      },
      setTimer: (txt, label = "Süre") => {
        const timerLabel = document.getElementById("timer-stat-label");
        if (timerLabel) timerLabel.textContent = `${label}:`;
        document.getElementById("game-live-timer").textContent = txt;
      },
      setControlsTray: (html) => {
        controlsTrayEl.innerHTML = html;
      },
      finishGame: (summary) => {
        recordGameEnd(summary);
      }
    };

    activeGameInstance = currentGameMeta.createInstance(api);
    if (activeGameInstance && activeGameInstance.start) {
      activeGameInstance.start();
    }
  }

  function recordGameEnd(data) {
    if (activeGameInstance) {
      activeGameInstance.destroy();
      activeGameInstance = null;
    }

    // İlerleme hesaplama (Anti-Decay: Asla geriye gitmez!)
    state.totalXp += data.xp;
    const oldLevel = state.level;
    state.level = Math.floor(state.totalXp / 500) + 1;

    // Kategori verilerini güncelle
    if (currentGameMeta && state.categories[currentGameMeta.category]) {
      const cat = state.categories[currentGameMeta.category];
      cat.plays++;
      cat.xp += data.xp;
      cat.level = Math.floor(cat.xp / 400) + 1;
    }

    // Günlük seri koruması
    const today = new Date().toISOString().split("T")[0];
    if (state.lastPlayDate !== today) {
      state.streakDays++;
      state.lastPlayDate = today;
    }

    saveState();

    if (state.level > oldLevel) {
      playSound("level-up");
    } else {
      playSound("correct");
    }

    // Özet ekranını doldur
    document.getElementById("summary-game-name").textContent = currentGameMeta ? currentGameMeta.name : "Antrenman";
    document.getElementById("summary-xp-gained").textContent = data.xp;
    document.getElementById("summary-accuracy").textContent = data.accuracy;
    document.getElementById("summary-reaction").textContent = data.reactionTime;
    document.getElementById("summary-difficulty").textContent = data.difficulty;
    document.getElementById("summary-advice").textContent = data.advice;

    showView("view-summary");
  }

  function quitToMenu() {
    if (activeGameInstance) {
      activeGameInstance.destroy();
      activeGameInstance = null;
    }
    showDashboard();
  }

  function replayCurrentGame() {
    if (currentGameMeta) {
      launchGame(currentGameMeta.id);
    } else {
      showDashboard();
    }
  }

  function showDashboard() {
    showView("view-dashboard");
    renderDashboardMetrics();
    renderHeaderStats();
    renderGamesGrid();
  }

  function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `mindforge_15oyun_yedek_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function resetData() {
    if (confirm("Tüm yerel ilerlemenizi sıfırlamak istediğinize emin misiniz?")) {
      localStorage.removeItem(STORAGE_KEY);
      state = { ...defaultState };
      saveState();
      renderGamesGrid();
      alert("Tüm yerel veriler sıfırlandı.");
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    saveState();
  }

  // Global Klavye Dinleyicisi
  window.addEventListener("keydown", (e) => {
    if (activeGameInstance && activeGameInstance.handleKeyDown) {
      activeGameInstance.handleKeyDown(e);
    }
  });

  function init() {
    renderHeaderStats();
    renderDashboardMetrics();
    renderGamesGrid();
    setupFilters();

    const soundBtn = document.getElementById("sound-toggle");
    if (soundBtn) soundBtn.onclick = toggleSound;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {
    launchGame,
    closeTutorialAndStart,
    quitToMenu,
    replayCurrentGame,
    showDashboard,
    exportData,
    resetData,
    toggleSound
  };
})();
