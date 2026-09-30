/**
 * MindForge: 15 Modüler Bilişsel Mini-Oyun Kütüphanesi
 * Standart Modül Yaşam Döngüsü: createInstance(api) -> { start(), destroy(), handleKeyDown?(e) }
 */

const MindForgeGames = (() => {
  const REGISTRY = [];

  // ==========================================
  // KATEGORİ 1: BELLEK & UZAMSAL HAFIZA (MEMORY)
  // ==========================================

  // 1. HAFIZA MATRİSİ (MEMORY MATRIX)
  REGISTRY.push({
    id: "memory-matrix",
    name: "Hafıza Matrisi",
    category: "memory",
    categoryLabel: "Bellek",
    badgeColor: "blue",
    icon: "🧩",
    desc: "Ekranda kısa süre parlayan mavi karelerin yerini hatırla.",
    instruction: "Mavi yanan kareleri aklında tut. Işıklar söndüğünde aynı karelere dokun.",
    createInstance: (api) => {
      let level = 1, score = 0, totalTrials = 0, correctTrials = 0;
      let reactionTimes = [], targets = new Set(), userSelections = new Set();
      let isLocked = true, startTime = 0;

      function startRound() {
        isLocked = true;
        userSelections.clear();
        targets.clear();

        const gridSize = level >= 4 ? 4 : 3;
        const targetCount = level >= 5 ? 5 : (level >= 3 ? 4 : 3);
        api.setTimer(`Aşama ${level}`, "Aşama");

        const totalTiles = gridSize * gridSize;
        while (targets.size < targetCount) {
          targets.add(Math.floor(Math.random() * totalTiles));
        }

        renderGrid(gridSize, false);

        setTimeout(() => {
          renderGrid(gridSize, true);
          api.playSound("tap");
          setTimeout(() => {
            renderGrid(gridSize, false);
            isLocked = false;
            startTime = performance.now();
          }, 1100);
        }, 350);
      }

      function renderGrid(size, showTargets) {
        api.stage.innerHTML = "";
        const grid = document.createElement("div");
        grid.className = "memory-grid";
        grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

        for (let i = 0; i < size * size; i++) {
          const tile = document.createElement("div");
          tile.className = "memory-tile";
          if (showTargets && targets.has(i)) tile.classList.add("target-active");
          tile.onclick = () => onTileClick(i, tile, size);
          grid.appendChild(tile);
        }
        api.stage.appendChild(grid);
      }

      function onTileClick(i, tile, size) {
        if (isLocked || userSelections.has(i)) return;
        userSelections.add(i);
        reactionTimes.push(performance.now() - startTime);

        if (targets.has(i)) {
          tile.classList.add("revealed-correct");
          api.playSound("tap");
          if (userSelections.size === targets.size) {
            isLocked = true;
            totalTrials++; correctTrials++;
            score += targets.size * 35;
            api.updateScore(score);
            api.playSound("correct");
            level++;
            setTimeout(() => (level > 6 ? finish() : startRound()), 800);
          }
        } else {
          tile.classList.add("revealed-wrong");
          api.playSound("wrong");
          isLocked = true; totalTrials++;
          setTimeout(() => {
            api.stage.querySelectorAll(".memory-tile").forEach(t => {
              if (targets.has(parseInt(t.dataset.index))) t.classList.add("revealed-correct");
            });
          }, 250);
          setTimeout(() => (totalTrials >= 5 ? finish() : startRound()), 1200);
        }
      }

      function finish() {
        const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 100;
        const avgReaction = reactionTimes.length ? Math.round(reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length) : 480;
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: `${avgReaction} ms`,
          difficulty: `Aşama ${level}`,
          advice: "Çalışma belleğiniz uzamsal bilgiyi mükemmel kodluyor. Asla seviyeniz silinmez!"
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Kareler kapandıktan sonra doğru olanları sırayla seçin.</span>");
          startRound();
        },
        destroy: () => {}
      };
    }
  });

  // 2. SAYI DİZİSİ (DIGIT SPAN)
  REGISTRY.push({
    id: "digit-span",
    name: "Sayı Dizisi (Digit Span)",
    category: "memory",
    categoryLabel: "Bellek",
    badgeColor: "blue",
    icon: "🔢",
    desc: "Ekranda tek tek beliren rakamları aklında tut ve doğru sırayla tuşla.",
    instruction: "Rakamlar ekranda sırayla görünecektir. Dizi bittiğinde tuş takımından aynı sırayla gir.",
    createInstance: (api) => {
      let digitLength = 3, score = 0, currentSequence = [], userInput = [];
      let totalTrials = 0, correctTrials = 0;

      function playSequence() {
        currentSequence = [];
        userInput = [];
        for (let i = 0; i < digitLength; i++) {
          currentSequence.push(Math.floor(Math.random() * 9) + 1);
        }
        api.setTimer(`${digitLength} Basamak`, "Uzunluk");

        api.stage.innerHTML = `<div class="digit-display-box" id="digit-box">Hazır...</div>`;
        api.setControlsTray("<span>👀 Rakamları dikkatle takip edin...</span>");

        let step = 0;
        const interval = setInterval(() => {
          const box = document.getElementById("digit-box");
          if (!box) { clearInterval(interval); return; }

          if (step < currentSequence.length) {
            box.textContent = currentSequence[step];
            api.playSound("tap");
            step++;
          } else {
            clearInterval(interval);
            showKeypad();
          }
        }, 850);
      }

      function showKeypad() {
        api.stage.innerHTML = `
          <div style="text-align:center; margin-bottom:14px;">
            <div style="font-size:1rem; color:var(--text-muted);">Girdiğin Rakamlar:</div>
            <div id="entered-digits" style="font-size:2rem; font-weight:800; color:var(--accent-blue); min-height:40px;">-</div>
          </div>
          <div class="keypad-grid" id="keypad"></div>
        `;
        api.setControlsTray("<span>⌨️ Tuş takımına basarak diziyi sırayla tamamlayın.</span>");

        const keypad = document.getElementById("keypad");
        for (let i = 1; i <= 9; i++) {
          const btn = document.createElement("button");
          btn.className = "keypad-btn";
          btn.textContent = i;
          btn.onclick = () => onDigitPress(i);
          keypad.appendChild(btn);
        }
      }

      function onDigitPress(d) {
        userInput.push(d);
        api.playSound("tap");
        document.getElementById("entered-digits").textContent = userInput.join(" ");

        if (userInput.length === currentSequence.length) {
          totalTrials++;
          const isCorrect = userInput.every((val, idx) => val === currentSequence[idx]);
          if (isCorrect) {
            correctTrials++;
            score += digitLength * 40;
            api.updateScore(score);
            api.playSound("correct");
            digitLength++;
            setTimeout(() => (digitLength > 7 ? finish() : playSequence()), 800);
          } else {
            api.playSound("wrong");
            setTimeout(() => (totalTrials >= 4 ? finish() : playSequence()), 900);
          }
        }
      }

      function finish() {
        const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 100;
        api.finishGame({
          xp: Math.max(130, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Ardışık Bellek",
          difficulty: `${digitLength - 1} Basamak Belleği`,
          advice: "Sayı dizisi antrenmanı kısa süreli fonolojik döngüyü (phonological loop) güçlendirir."
        });
      }

      return {
        start: () => playSequence(),
        destroy: () => {}
      };
    }
  });

  // 3. EŞ KARTLAR (PAIR MATCH)
  REGISTRY.push({
    id: "pair-match",
    name: "Eş Kartlar (Pair Match)",
    category: "memory",
    categoryLabel: "Bellek",
    badgeColor: "blue",
    icon: "🃏",
    desc: "Kapalı kartları çevirerek aynı sembolleri eşleştir.",
    instruction: "Kartların arkasındaki emojileri aklında tut ve çiftleri en az hamleyle bul.",
    createInstance: (api) => {
      const symbols = ["🚀", "🪐", "💎", "⭐", "⚡", "🍀"];
      let deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
      let flipped = [], matched = new Set(), moves = 0, startTime = performance.now();

      function render() {
        api.stage.innerHTML = `<div class="pairs-grid" id="pairs-grid"></div>`;
        const grid = document.getElementById("pairs-grid");
        deck.forEach((sym, idx) => {
          const card = document.createElement("div");
          card.className = "pair-card";
          card.dataset.index = idx;
          card.textContent = "❓";
          card.onclick = () => onCardClick(idx, sym, card);
          grid.appendChild(card);
        });
      }

      function onCardClick(idx, sym, cardEl) {
        if (flipped.length >= 2 || matched.has(idx) || (flipped.length === 1 && flipped[0].idx === idx)) return;

        cardEl.textContent = sym;
        cardEl.classList.add("flipped");
        api.playSound("tap");
        flipped.push({ idx, sym, el: cardEl });

        if (flipped.length === 2) {
          moves++;
          api.setTimer(`${moves} Hamle`, "Hamle");
          const [c1, c2] = flipped;
          if (c1.sym === c2.sym) {
            matched.add(c1.idx); matched.add(c2.idx);
            c1.el.classList.add("matched");
            c2.el.classList.add("matched");
            api.playSound("correct");
            flipped = [];
            if (matched.size === deck.length) {
              setTimeout(finish, 600);
            }
          } else {
            api.playSound("wrong");
            setTimeout(() => {
              c1.el.textContent = "❓"; c1.el.classList.remove("flipped");
              c2.el.textContent = "❓"; c2.el.classList.remove("flipped");
              flipped = [];
            }, 800);
          }
        }
      }

      function finish() {
        const durationSec = Math.round((performance.now() - startTime) / 1000);
        const accuracy = Math.min(100, Math.round((symbols.length / moves) * 100));
        api.finishGame({
          xp: Math.max(150, 400 - moves * 15),
          accuracy: `${accuracy}%`,
          reactionTime: `${durationSec} saniye`,
          difficulty: "6 Çift (12 Kart)",
          advice: "Görsel ilişkilendirme ve mekan hafızanız başarıyla test edildi."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Kartları çevirerek çiftleri eşleştirin.</span>");
          api.setTimer("0 Hamle", "Hamle");
          render();
        },
        destroy: () => {}
      };
    }
  });

  // 4. DESEN TAKİBİ (SIMON SAYS / PATH MEMORY)
  REGISTRY.push({
    id: "simon-path",
    name: "Desen Takibi (Simon Path)",
    category: "memory",
    categoryLabel: "Bellek",
    badgeColor: "blue",
    icon: "💡",
    desc: "Renkli butonların yandığı sırayı hafızanda tut ve tekrar et.",
    instruction: "Yanan renklerin oluşturduğu ritmi izle, sıra sana geldiğinde aynı sırayla bas.",
    createInstance: (api) => {
      let sequence = [], userIndex = 0, round = 1, isShowing = false;

      function nextRound() {
        sequence.push(Math.floor(Math.random() * 4));
        userIndex = 0;
        api.setTimer(`Adım ${round}`, "Seviye");
        playSequence();
      }

      function render() {
        api.stage.innerHTML = `
          <div class="simon-board">
            <div class="simon-pad pad-0" id="pad-0" data-id="0"></div>
            <div class="simon-pad pad-1" id="pad-1" data-id="1"></div>
            <div class="simon-pad pad-2" id="pad-2" data-id="2"></div>
            <div class="simon-pad pad-3" id="pad-3" data-id="3"></div>
          </div>
        `;
        for (let i = 0; i < 4; i++) {
          document.getElementById(`pad-${i}`).onclick = () => onPadClick(i);
        }
      }

      function playSequence() {
        isShowing = true;
        api.setControlsTray("<span>👀 Deseni dikkatle izleyin...</span>");
        let idx = 0;
        const interval = setInterval(() => {
          if (idx < sequence.length) {
            flashPad(sequence[idx]);
            idx++;
          } else {
            clearInterval(interval);
            isShowing = false;
            api.setControlsTray("<span>👉 Şimdi sıra sende! Aynı sırayla bas.</span>");
          }
        }, 650);
      }

      function flashPad(id) {
        const el = document.getElementById(`pad-${id}`);
        if (!el) return;
        el.classList.add("active");
        api.playSound("tap");
        setTimeout(() => el.classList.remove("active"), 350);
      }

      function onPadClick(id) {
        if (isShowing) return;
        flashPad(id);

        if (id === sequence[userIndex]) {
          userIndex++;
          if (userIndex === sequence.length) {
            api.playSound("correct");
            round++;
            api.updateScore(round * 50);
            setTimeout(() => (round > 6 ? finish() : nextRound()), 700);
          }
        } else {
          api.playSound("wrong");
          setTimeout(finish, 800);
        }
      }

      function finish() {
        api.finishGame({
          xp: Math.max(120, round * 40),
          accuracy: `${Math.min(100, round * 16)}%`,
          reactionTime: "Sıralı Kodlama",
          difficulty: `${round - 1} Adımlı Rota`,
          advice: "İşitsel ve görsel sıra hafızası antrenmanı tamamlandı!"
        });
      }

      return {
        start: () => { render(); nextRound(); },
        destroy: () => {}
      };
    }
  });

  // ==========================================
  // KATEGORİ 2: DİKKAT, ODAK & ESNEKLİK (FOCUS)
  // ==========================================

  // 5. RENK ÇATIŞMASI (STROOP)
  REGISTRY.push({
    id: "stroop",
    name: "Renk Çatışması (Stroop)",
    category: "focus",
    categoryLabel: "Odak & Esneklik",
    badgeColor: "purple",
    icon: "🎨",
    desc: "Yazının rengi ile kelimenin anlamı arasındaki çelişkiyi hızlıca çöz.",
    instruction: "Kelimenin yazıldığı MÜREKKEP RENGİ ile kelimenin ANLAMI uyuşuyorsa EVET, uyuşmuyorsa HAYIR de.",
    createInstance: (api) => {
      let score = 0, timeLeft = 30, timer = null, total = 0, correct = 0;
      let reactionTimes = [], qStart = 0, isMatch = false, lastTap = 0;
      const colors = [
        { name: "KIRMIZI", color: "#f87171" },
        { name: "MAVİ", color: "#38bdf8" },
        { name: "YEŞİL", color: "#34d399" },
        { name: "SARI", color: "#fbbf24" }
      ];

      function nextQuestion() {
        const wordObj = colors[Math.floor(Math.random() * colors.length)];
        isMatch = Math.random() < 0.5;
        const inkObj = isMatch ? wordObj : colors.filter(c => c.name !== wordObj.name)[Math.floor(Math.random() * 3)];
        qStart = performance.now();

        api.stage.innerHTML = `
          <div class="stroop-stage">
            <div class="stroop-prompt">Yazının RENGİ ile kelimenin ANLAMI aynı mı?</div>
            <div class="stroop-word-card">
              <span class="stroop-word" style="color:${inkObj.color};">${wordObj.name}</span>
            </div>
            <div class="decision-actions">
              <button class="decision-btn btn-no" id="btn-no"><span>HAYIR</span><span class="kbd-hint">[← Sol Ok]</span></button>
              <button class="decision-btn btn-yes" id="btn-yes"><span>EVET</span><span class="kbd-hint">[→ Sağ Ok]</span></button>
            </div>
          </div>
        `;
        document.getElementById("btn-no").onclick = () => answer(false);
        document.getElementById("btn-yes").onclick = () => answer(true);
      }

      function answer(userSaysYes) {
        const now = performance.now();
        if (now - lastTap < 120) return; // 120ms debounce
        lastTap = now;
        total++;
        const reaction = Math.round(now - qStart);
        reactionTimes.push(reaction);

        if (userSaysYes === isMatch) {
          correct++;
          score += 50 + Math.max(10, Math.round((1200 - reaction) / 20));
          api.playSound("tap");
        } else {
          api.playSound("wrong");
        }
        api.updateScore(score);
        nextQuestion();
      }

      function finish() {
        clearInterval(timer);
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
        const avgReaction = reactionTimes.length ? Math.round(reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length) : 550;
        api.finishGame({
          xp: Math.max(150, Math.round(score * 0.8)),
          accuracy: `${accuracy}%`,
          reactionTime: `${avgReaction} ms`,
          difficulty: `${total} Karar`,
          advice: "Seçici dikkat (selective attention) mekanizmanız mükemmel bir zihinsel esneklik sergiledi."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>⌨️ Klavye: [←] Hayır | [→] Evet</span>");
          timer = setInterval(() => {
            timeLeft--;
            api.setTimer(`${timeLeft}s`, "Süre");
            if (timeLeft <= 0) finish();
          }, 1000);
          nextQuestion();
        },
        destroy: () => clearInterval(timer),
        handleKeyDown: (e) => {
          if (e.key === "ArrowLeft" || e.key === "a") answer(false);
          if (e.key === "ArrowRight" || e.key === "d") answer(true);
        }
      };
    }
  });

  // 6. FARKI BUL (ODD ONE OUT)
  REGISTRY.push({
    id: "odd-one-out",
    name: "Farkı Bul (Odd One Out)",
    category: "focus",
    categoryLabel: "Odak & Esneklik",
    badgeColor: "purple",
    icon: "🔍",
    desc: "Birbirine çok benzeyen semboller arasından farklı olanı en hızlı seç.",
    instruction: "Izgaradaki nesnelerden biri yön veya şekil olarak farklıdır. Hemen onu bul ve tıkla!",
    createInstance: (api) => {
      let score = 0, rounds = 0, correct = 0, timer = null, timeLeft = 25;
      const sets = [
        { normal: "🔺", odd: "🔻" },
        { normal: "➡️", odd: "⬅️" },
        { normal: "🌙", odd: "⭐" },
        { normal: "🔵", odd: "🟢" },
        { normal: "⬆️", odd: "⬇️" }
      ];

      function nextGrid() {
        rounds++;
        const currentSet = sets[Math.floor(Math.random() * sets.length)];
        const count = 9; // 3x3
        const oddIndex = Math.floor(Math.random() * count);

        api.stage.innerHTML = `<div class="odd-grid" id="odd-grid" style="grid-template-columns: repeat(3, 1fr);"></div>`;
        const grid = document.getElementById("odd-grid");

        for (let i = 0; i < count; i++) {
          const item = document.createElement("div");
          item.className = "odd-item";
          item.textContent = (i === oddIndex) ? currentSet.odd : currentSet.normal;
          item.onclick = () => {
            if (i === oddIndex) {
              correct++;
              score += 60;
              api.playSound("correct");
            } else {
              api.playSound("wrong");
            }
            api.updateScore(score);
            nextGrid();
          };
          grid.appendChild(item);
        }
      }

      function finish() {
        clearInterval(timer);
        const accuracy = rounds > 0 ? Math.round((correct / rounds) * 100) : 100;
        api.finishGame({
          xp: Math.max(140, score + accuracy),
          accuracy: `${accuracy}%`,
          reactionTime: "Görsel Tarama",
          difficulty: `${rounds} Görsel Matris`,
          advice: "Görsel arama (visual search) ve filtreleme yeteneğiniz keskinleşti."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Farklı olan tek sembole dokunun!</span>");
          timer = setInterval(() => {
            timeLeft--;
            api.setTimer(`${timeLeft}s`, "Süre");
            if (timeLeft <= 0) finish();
          }, 1000);
          nextGrid();
        },
        destroy: () => clearInterval(timer)
      };
    }
  });

  // 7. KURAL DEĞİŞİMİ (SWITCHEROO)
  REGISTRY.push({
    id: "switcheroo",
    name: "Kural Değişimi (Switcheroo)",
    category: "focus",
    categoryLabel: "Odak & Esneklik",
    badgeColor: "purple",
    icon: "🔀",
    desc: "Kuralın sürekli değiştiği yüksek odak ve adaptasyon testi.",
    instruction: "Üst mavi kuralda: Sayı ÇİFT mi? Alt mor kuralda: Harf SESLİ mi? Kuralı takip et!",
    createInstance: (api) => {
      let score = 0, timeLeft = 30, timer = null, total = 0, correct = 0;
      let isRuleNumber = true, currentItem = null, isTargetYes = false;

      const vowels = ["A", "E", "İ", "O", "U"];
      const consonants = ["B", "C", "D", "K", "M", "T"];

      function nextQuestion() {
        isRuleNumber = Math.random() < 0.5;

        if (isRuleNumber) {
          const num = Math.floor(Math.random() * 90) + 10;
          currentItem = num;
          isTargetYes = (num % 2 === 0);
        } else {
          const isVowel = Math.random() < 0.5;
          currentItem = isVowel ? vowels[Math.floor(Math.random() * vowels.length)] : consonants[Math.floor(Math.random() * consonants.length)];
          isTargetYes = isVowel;
        }

        api.stage.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:480px;">
            <div class="rule-header-banner ${isRuleNumber ? 'rule-top' : 'rule-bottom'}">
              KURAL: ${isRuleNumber ? "SAYI ÇİFT Mİ?" : "HARF SESLİ Mİ?"}
            </div>
            <div class="switch-target-box">${currentItem}</div>
            <div class="decision-actions">
              <button class="decision-btn btn-no" id="btn-no"><span>HAYIR</span><span class="kbd-hint">[← Sol Ok]</span></button>
              <button class="decision-btn btn-yes" id="btn-yes"><span>EVET</span><span class="kbd-hint">[→ Sağ Ok]</span></button>
            </div>
          </div>
        `;
        document.getElementById("btn-no").onclick = () => answer(false);
        document.getElementById("btn-yes").onclick = () => answer(true);
      }

      function answer(val) {
        total++;
        if (val === isTargetYes) {
          correct++;
          score += 65;
          api.playSound("tap");
        } else {
          api.playSound("wrong");
        }
        api.updateScore(score);
        nextQuestion();
      }

      function finish() {
        clearInterval(timer);
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Görev Değişimi",
          difficulty: `${total} Karar`,
          advice: "Kural değiştirme (task switching) zihinsel paslanmayı önleyen en kritik egzersizdir."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>⌨️ Klavye: [←] Hayır | [→] Evet</span>");
          timer = setInterval(() => {
            timeLeft--;
            api.setTimer(`${timeLeft}s`, "Süre");
            if (timeLeft <= 0) finish();
          }, 1000);
          nextQuestion();
        },
        destroy: () => clearInterval(timer),
        handleKeyDown: (e) => {
          if (e.key === "ArrowLeft" || e.key === "a") answer(false);
          if (e.key === "ArrowRight" || e.key === "d") answer(true);
        }
      };
    }
  });

  // 8. HEDEF AVCISI (TARGET TRACKING)
  REGISTRY.push({
    id: "target-tracking",
    name: "Hedef Avcısı (Target Tracking)",
    category: "focus",
    categoryLabel: "Odak & Esneklik",
    badgeColor: "purple",
    icon: "🎯",
    desc: "Hareket eden birden çok nesneden hedefleri gözünle takip et.",
    instruction: "Başlangıçta sarı yanan hedefleri aklında tut. Toplar durduğunda hedefleri tıkla!",
    createInstance: (api) => {
      let balls = [], targets = new Set(), userSelected = new Set();
      let animId = null, round = 1, isLocked = true;

      function startRound() {
        isLocked = true;
        targets.clear();
        userSelected.clear();
        api.setTimer(`Tur ${round}`, "Tur");

        api.stage.innerHTML = `<div class="tracking-canvas-wrap" id="canvas-wrap"></div>`;
        const wrap = document.getElementById("canvas-wrap");
        const totalBalls = 5;
        const targetCount = 2;

        while (targets.size < targetCount) {
          targets.add(Math.floor(Math.random() * totalBalls));
        }

        balls = [];
        for (let i = 0; i < totalBalls; i++) {
          const bEl = document.createElement("div");
          bEl.className = "tracking-ball" + (targets.has(i) ? " highlight" : "");
          bEl.textContent = targets.has(i) ? "★" : "";
          wrap.appendChild(bEl);

          const bObj = {
            id: i,
            el: bEl,
            x: Math.random() * 380 + 20,
            y: Math.random() * 240 + 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4
          };
          bEl.onclick = () => onBallClick(bObj);
          balls.push(bObj);
          updateBallPos(bObj);
        }

        api.setControlsTray("<span>👀 Sarı parlayan hedefleri gözünüzle takip edin!</span>");

        // 1.5 sn sonra sarı işareti kaldır ve hareket ettir
        setTimeout(() => {
          balls.forEach(b => {
            b.el.classList.remove("highlight");
            b.el.textContent = "";
          });
          startMovement();
        }, 1500);
      }

      function updateBallPos(b) {
        b.el.style.left = `${b.x}px`;
        b.el.style.top = `${b.y}px`;
      }

      function startMovement() {
        let frames = 0;
        function move() {
          frames++;
          balls.forEach(b => {
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < 10 || b.x > 420) b.vx *= -1;
            if (b.y < 10 || b.y > 260) b.vy *= -1;
            updateBallPos(b);
          });

          if (frames < 140) {
            animId = requestAnimationFrame(move);
          } else {
            isLocked = false;
            api.setControlsTray("<span>👉 Durdu! Başlangıçtaki hedefleri seçin.</span>");
          }
        }
        animId = requestAnimationFrame(move);
      }

      function onBallClick(b) {
        if (isLocked || userSelected.has(b.id)) return;
        userSelected.add(b.id);

        if (targets.has(b.id)) {
          b.el.classList.add("highlight");
          b.el.textContent = "✓";
          api.playSound("tap");
          if (userSelected.size === targets.size) {
            isLocked = true;
            api.playSound("correct");
            round++;
            api.updateScore(round * 60);
            setTimeout(() => (round > 4 ? finish() : startRound()), 900);
          }
        } else {
          b.el.style.background = "#ef4444";
          b.el.textContent = "✕";
          api.playSound("wrong");
          setTimeout(() => (round > 4 ? finish() : startRound()), 1000);
        }
      }

      function finish() {
        cancelAnimationFrame(animId);
        api.finishGame({
          xp: Math.max(140, round * 50),
          accuracy: "92%",
          reactionTime: "Uzamsal İzleme",
          difficulty: `${round} Tur Tamamlandı`,
          advice: "Çoklu nesne takibi (multiple object tracking) görsel dikkatin sınırlarını genişletir."
        });
      }

      return {
        start: () => startRound(),
        destroy: () => cancelAnimationFrame(animId)
      };
    }
  });

  // ==========================================
  // KATEGORİ 3: HIZ & TEPKİ SÜRESİ (SPEED)
  // ==========================================

  // 9. ŞİMŞEK MANTIK (SPEED MATH)
  REGISTRY.push({
    id: "speed-math",
    name: "Şimşek Mantık",
    category: "speed",
    categoryLabel: "Hız & Tepki",
    badgeColor: "green",
    icon: "⚡",
    desc: "Zamana karşı hızlı aritmetik ve basit mantık kararları ver.",
    instruction: "Ekranda beliren denklem doğru ise DOĞRU, yanlış ise YANLIŞ butonuna bas.",
    createInstance: (api) => {
      let score = 0, timeLeft = 30, timer = null, total = 0, correct = 0;
      let reactionTimes = [], qStart = 0, isCurrentRight = false, lastTap = 0;

      function nextEquation() {
        const a = Math.floor(Math.random() * 20) + 3;
        const b = Math.floor(Math.random() * 20) + 2;
        const isAdd = Math.random() < 0.6;
        const real = isAdd ? (a + b) : (a - b);
        isCurrentRight = Math.random() < 0.5;
        const display = isCurrentRight ? real : real + (Math.random() < 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1);

        qStart = performance.now();
        api.stage.innerHTML = `
          <div class="stroop-stage">
            <div class="stroop-prompt">Denklemi hızlıca kontrol et:</div>
            <div class="math-equation-card">
              <span class="math-equation">${a} ${isAdd ? '+' : '-'} ${b} = ${display}</span>
            </div>
            <div class="decision-actions">
              <button class="decision-btn btn-no" id="btn-no"><span>YANLIŞ</span><span class="kbd-hint">[← Sol Ok]</span></button>
              <button class="decision-btn btn-yes" id="btn-yes"><span>DOĞRU</span><span class="kbd-hint">[→ Sağ Ok]</span></button>
            </div>
          </div>
        `;
        document.getElementById("btn-no").onclick = () => answer(false);
        document.getElementById("btn-yes").onclick = () => answer(true);
      }

      function answer(val) {
        const now = performance.now();
        if (now - lastTap < 120) return;
        lastTap = now;
        total++;
        const reaction = Math.round(now - qStart);
        reactionTimes.push(reaction);

        if (val === isCurrentRight) {
          correct++;
          score += 55 + Math.max(10, Math.round((1000 - reaction) / 25));
          api.playSound("tap");
        } else {
          api.playSound("wrong");
        }
        api.updateScore(score);
        nextEquation();
      }

      function finish() {
        clearInterval(timer);
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
        const avgReaction = reactionTimes.length ? Math.round(reactionTimes.reduce((a,b)=>a+b,0)/reactionTimes.length) : 600;
        api.finishGame({
          xp: Math.max(150, Math.round(score * 0.85)),
          accuracy: `${accuracy}%`,
          reactionTime: `${avgReaction} ms`,
          difficulty: `${total} Denklem Çözüldü`,
          advice: "Hızlı hesaplama refleksi prefrontal korteksi sürekli diri tutar."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>⌨️ Klavye: [←] Yanlış | [→] Doğru</span>");
          timer = setInterval(() => {
            timeLeft--;
            api.setTimer(`${timeLeft}s`, "Süre");
            if (timeLeft <= 0) finish();
          }, 1000);
          nextEquation();
        },
        destroy: () => clearInterval(timer),
        handleKeyDown: (e) => {
          if (e.key === "ArrowLeft" || e.key === "a") answer(false);
          if (e.key === "ArrowRight" || e.key === "d") answer(true);
        }
      };
    }
  });

  // 10. IŞIK HIZI (TAP REACTION)
  REGISTRY.push({
    id: "tap-reaction",
    name: "Işık Hızı (Tap Reaction)",
    category: "speed",
    categoryLabel: "Hız & Tepki",
    badgeColor: "green",
    icon: "⚡",
    desc: "Ekran yeşile döndüğü anda milisaniye hassasiyetinde en hızlı dokunuşu yap.",
    instruction: "Kırmızı ekranda bekle. EKRAN YEŞİLE DÖNDÜĞÜ AN hemen tıkla!",
    createInstance: (api) => {
      let trials = 0, times = [], stateMode = "waiting", triggerTime = 0, timeoutId = null;

      function nextTrial() {
        trials++;
        stateMode = "waiting";
        api.setTimer(`Deneme ${trials}/5`, "Aşama");

        api.stage.innerHTML = `
          <div class="reaction-area waiting" id="react-box">
            <h2>KIRMIZI: BEKLE...</h2>
            <p>Yeşile döndüğü anda dokun!</p>
          </div>
        `;
        api.setControlsTray("<span>⚠️ Erken basarsanız deneme baştan başlar.</span>");

        const box = document.getElementById("react-box");
        box.onclick = handleBoxClick;

        const delay = Math.random() * 2500 + 1500;
        timeoutId = setTimeout(() => {
          stateMode = "ready";
          triggerTime = performance.now();
          box.className = "reaction-area ready";
          box.innerHTML = `<h2>YEŞİL! ŞİMDİ DOKUN! ⚡</h2>`;
          api.playSound("tap");
        }, delay);
      }

      function handleBoxClick() {
        if (stateMode === "waiting") {
          clearTimeout(timeoutId);
          api.playSound("wrong");
          alert("Çok erken dokundunuz! Lütfen yeşili bekleyin.");
          nextTrial();
        } else if (stateMode === "ready") {
          const ms = Math.round(performance.now() - triggerTime);
          times.push(ms);
          api.playSound("correct");
          api.updateScore(Math.max(100, 1000 - ms));

          if (trials >= 5) {
            finish();
          } else {
            nextTrial();
          }
        }
      }

      function finish() {
        const avg = Math.round(times.reduce((a,b)=>a+b,0)/times.length);
        api.finishGame({
          xp: Math.max(150, Math.round(800 - avg)),
          accuracy: "100%",
          reactionTime: `${avg} ms`,
          difficulty: "5 Refleks Ölçümü",
          advice: avg < 300 ? "İnanılmaz! Refleksleriniz profesyonel bir esporcu seviyesinde." : "Tepki süreniz gayet iyi, düzenli antrenmanla daha da hızlanacaktır."
        });
      }

      return {
        start: () => nextTrial(),
        destroy: () => clearTimeout(timeoutId)
      };
    }
  });

  // 11. AKIŞ YÖNÜ (ARROW FLOW / FLANKER TEST)
  REGISTRY.push({
    id: "arrow-flow",
    name: "Akış Yönü (Arrow Flow)",
    category: "speed",
    categoryLabel: "Hız & Tepki",
    badgeColor: "green",
    icon: "💨",
    desc: "Yandaki oklara aldanma; sadece ortadaki hedefin yönüne hızla bas.",
    instruction: "Ekranda beliren 5 oktan sadece ORTADAKİ okun yönünü (Sol veya Sağ) seç.",
    createInstance: (api) => {
      let score = 0, timeLeft = 25, timer = null, total = 0, correct = 0;
      let currentDir = "left", qStart = 0, lastTap = 0;

      function nextArrows() {
        currentDir = Math.random() < 0.5 ? "left" : "right";
        const flankerMatch = Math.random() < 0.5;
        const flankerDir = flankerMatch ? currentDir : (currentDir === "left" ? "right" : "left");

        const arrowChar = (dir) => (dir === "left" ? "⬅️" : "➡️");

        qStart = performance.now();
        api.stage.innerHTML = `
          <div class="stroop-stage">
            <div class="stroop-prompt">SADECE ortadaki okun yönüne bas:</div>
            <div class="flanker-row">
              <span class="flanker-arrow">${arrowChar(flankerDir)}</span>
              <span class="flanker-arrow">${arrowChar(flankerDir)}</span>
              <span class="flanker-arrow target">${arrowChar(currentDir)}</span>
              <span class="flanker-arrow">${arrowChar(flankerDir)}</span>
              <span class="flanker-arrow">${arrowChar(flankerDir)}</span>
            </div>
            <div class="decision-actions">
              <button class="decision-btn btn-no" id="btn-left"><span>SOL [←]</span></button>
              <button class="decision-btn btn-yes" id="btn-right"><span>SAĞ [→]</span></button>
            </div>
          </div>
        `;
        document.getElementById("btn-left").onclick = () => answer("left");
        document.getElementById("btn-right").onclick = () => answer("right");
      }

      function answer(dir) {
        const now = performance.now();
        if (now - lastTap < 120) return;
        lastTap = now;
        total++;

        if (dir === currentDir) {
          correct++;
          score += 60;
          api.playSound("tap");
        } else {
          api.playSound("wrong");
        }
        api.updateScore(score);
        nextArrows();
      }

      function finish() {
        clearInterval(timer);
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Flanker Filtreleme",
          difficulty: `${total} Karar`,
          advice: "Eriksen Flanker testi periferal uyaranları baskılama gücünüzü doğrudan artırır."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>⌨️ Klavye: [←] Sol Ok | [→] Sağ Ok</span>");
          timer = setInterval(() => {
            timeLeft--;
            api.setTimer(`${timeLeft}s`, "Süre");
            if (timeLeft <= 0) finish();
          }, 1000);
          nextArrows();
        },
        destroy: () => clearInterval(timer),
        handleKeyDown: (e) => {
          if (e.key === "ArrowLeft" || e.key === "a") answer("left");
          if (e.key === "ArrowRight" || e.key === "d") answer("right");
        }
      };
    }
  });

  // ==========================================
  // KATEGORİ 4: PROBLEM ÇÖZME & MANTIK (LOGIC)
  // ==========================================

  // 12. EKSİK PARÇA (PATTERN MATRIX)
  REGISTRY.push({
    id: "pattern-matrix",
    name: "Eksik Parça (Pattern Matrix)",
    category: "logic",
    categoryLabel: "Mantık & Problem Çözme",
    badgeColor: "amber",
    icon: "📐",
    desc: "Sayısal veya mantıksal örüntüdeki soru işaretinin yerine gelmesi gereken kuralı bul.",
    instruction: "Dizideki artış veya azalış mantığını çöz ve seçeneklerden doğru sayıyı işaretle.",
    createInstance: (api) => {
      let score = 0, rounds = 0, correct = 0;

      function nextPattern() {
        rounds++;
        api.setTimer(`Soru ${rounds}/6`, "İlerleme");

        const start = Math.floor(Math.random() * 8) + 2;
        const step = Math.floor(Math.random() * 5) + 2;
        const sequence = [start, start + step, start + step * 2, "?"];
        const answerVal = start + step * 3;

        const options = [answerVal, answerVal + step, answerVal - 1, answerVal + 2].sort(() => Math.random() - 0.5);

        api.stage.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:440px;">
            <div style="color:var(--text-muted); margin-bottom:12px;">Örüntüyü tamamlayan sayı hangisi?</div>
            <div class="pattern-sequence">
              <span>${sequence[0]}</span> ➜ <span>${sequence[1]}</span> ➜ <span>${sequence[2]}</span> ➜ <span style="color:var(--accent-amber);">${sequence[3]}</span>
            </div>
            <div class="pattern-options-grid" id="opt-grid"></div>
          </div>
        `;

        const optGrid = document.getElementById("opt-grid");
        options.forEach(opt => {
          const btn = document.createElement("button");
          btn.className = "pattern-opt-btn";
          btn.textContent = opt;
          btn.onclick = () => {
            if (opt === answerVal) {
              correct++;
              score += 70;
              api.playSound("correct");
            } else {
              api.playSound("wrong");
            }
            api.updateScore(score);
            if (rounds >= 6) finish();
            else nextPattern();
          };
          optGrid.appendChild(btn);
        });
      }

      function finish() {
        const accuracy = Math.round((correct / 6) * 100);
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Endüktif Muhakeme",
          difficulty: "6 Örüntü Matrisi",
          advice: "Örüntü tanıma ve tümevarımsal mantık yürütme devreleriniz harika çalışıyor."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Kuralı çöz ve doğru seçeneği işaretle.</span>");
          nextPattern();
        },
        destroy: () => {}
      };
    }
  });

  // 13. HIZLI 24 / MATH SPRINT
  REGISTRY.push({
    id: "math-sprint",
    name: "Hedef Sayı (Math Sprint)",
    category: "logic",
    categoryLabel: "Mantık & Problem Çözme",
    badgeColor: "amber",
    icon: "🎯",
    desc: "Verilen işlemde hedef sayıya ulaşmak için eksik olan çarpanı veya sayıyı bul.",
    instruction: "Eşitliği sağlayan soru işaretli sayıyı seçenekler arasından hemen seç.",
    createInstance: (api) => {
      let score = 0, rounds = 0, correct = 0;

      function nextQuestion() {
        rounds++;
        api.setTimer(`Soru ${rounds}/6`, "İlerleme");

        const target = Math.floor(Math.random() * 30) + 15;
        const num1 = Math.floor(Math.random() * 12) + 2;
        const missing = target - num1;

        const options = [missing, missing + 2, Math.max(1, missing - 3), missing + 5].sort(() => Math.random() - 0.5);

        api.stage.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:440px;">
            <div style="color:var(--text-muted); margin-bottom:12px;">Eşitliği sağlayan '?' sayısı hangisi?</div>
            <div class="pattern-sequence">
              <span>${num1} + <strong style="color:var(--accent-amber);">?</strong> = ${target}</span>
            </div>
            <div class="pattern-options-grid" id="opt-grid"></div>
          </div>
        `;

        const optGrid = document.getElementById("opt-grid");
        options.forEach(opt => {
          const btn = document.createElement("button");
          btn.className = "pattern-opt-btn";
          btn.textContent = opt;
          btn.onclick = () => {
            if (opt === missing) {
              correct++;
              score += 70;
              api.playSound("correct");
            } else {
              api.playSound("wrong");
            }
            api.updateScore(score);
            if (rounds >= 6) finish();
            else nextQuestion();
          };
          optGrid.appendChild(btn);
        });
      }

      function finish() {
        const accuracy = Math.round((correct / 6) * 100);
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Aritmetik Mantık",
          difficulty: "6 Matematiksel Hedef",
          advice: "Hedef sayıya hızla ulaşma stratejiniz zihinsel esnekliği pekiştirdi."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Denklemdeki eksik sayıyı tamamlayın.</span>");
          nextQuestion();
        },
        destroy: () => {}
      };
    }
  });

  // 14. TARTI DENGESİ (SCALE BALANCE)
  REGISTRY.push({
    id: "scale-balance",
    name: "Tartı Dengesi (Scale Balance)",
    category: "logic",
    categoryLabel: "Mantık & Problem Çözme",
    badgeColor: "amber",
    icon: "⚖️",
    desc: "Kıyaslama ipuçlarına göre en ağır olan sembolü mantık yürüterek seç.",
    instruction: "Verilen terazi ipuçlarını incele (örn. 🍎 > 🍌 ve 🍌 > 🍇 ise en ağır 🍎'dır).",
    createInstance: (api) => {
      let score = 0, rounds = 0, correct = 0;
      const fruits = ["💎", "🏆", "👑", "⭐"];

      function nextScale() {
        rounds++;
        api.setTimer(`Soru ${rounds}/5`, "İlerleme");

        // 3 nesne seç: A > B ve B > C => en ağır A
        const shuffled = [...fruits].sort(() => Math.random() - 0.5).slice(0, 3);
        const [a, b, c] = shuffled; // a en ağır

        api.stage.innerHTML = `
          <div class="scale-wrap">
            <div style="color:var(--text-muted); font-size:1.1rem; font-weight:700;">EN AĞIR OLAN HANGİSİ?</div>
            <div class="scale-clues">
              <div class="clue-badge">${a} > ${b}</div>
              <div class="clue-badge">${b} > ${c}</div>
            </div>
            <div class="pattern-options-grid" style="grid-template-columns: repeat(3, 1fr);" id="scale-opts"></div>
          </div>
        `;

        const opts = [a, b, c].sort(() => Math.random() - 0.5);
        const optGrid = document.getElementById("scale-opts");

        opts.forEach(opt => {
          const btn = document.createElement("button");
          btn.className = "pattern-opt-btn";
          btn.textContent = opt;
          btn.onclick = () => {
            if (opt === a) {
              correct++;
              score += 75;
              api.playSound("correct");
            } else {
              api.playSound("wrong");
            }
            api.updateScore(score);
            if (rounds >= 5) finish();
            else nextScale();
          };
          optGrid.appendChild(btn);
        });
      }

      function finish() {
        const accuracy = Math.round((correct / 5) * 100);
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Dedüktif Mantık",
          difficulty: "5 Karşılaştırma",
          advice: "Tümdengelim (deductive reasoning) yeteneğinizle karmaşık ilişkileri hızla çözdünüz."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Terazideki kıyaslamalara göre en ağırı seçin.</span>");
          nextScale();
        },
        destroy: () => {}
      };
    }
  });

  // ==========================================
  // KATEGORİ 5: DİL & ALGISAL HIZ (LANGUAGE)
  // ==========================================

  // 15. KELİME AVI (ANAGRAM / WORD SCRAMBLE)
  REGISTRY.push({
    id: "word-scramble",
    name: "Kelime Avı (Anagram)",
    category: "language",
    categoryLabel: "Dil & Algı",
    badgeColor: "indigo",
    icon: "📖",
    desc: "Karışık verilen harflerden geçerli Türkçe kelimeyi en kısa sürede bul.",
    instruction: "Harfleri birleştirerek anlamlı kelimeyi seçenekler arasından hemen işaretle.",
    createInstance: (api) => {
      let score = 0, rounds = 0, correct = 0;
      const wordBank = [
        { word: "KİTAP", scrambled: "P A K İ T", decoys: ["TAKİP", "KATİP", "PATİK"] },
        { word: "BEYİN", scrambled: "Y N B İ E", decoys: ["BİREY", "YEMİN", "BESİN"] },
        { word: "ODAK", scrambled: "K D O A", decoys: ["DOKU", "KOTA", "KORU"] },
        { word: "GÜNEŞ", scrambled: "Ş E N G Ü", decoys: ["GENİŞ", "GÜVEN", "GÜREŞ"] },
        { word: "ZAMAN", scrambled: "M N Z A A", decoys: ["NAMAZ", "KAZAN", "YALAN"] }
      ];

      function nextWord() {
        rounds++;
        api.setTimer(`Kelime ${rounds}/5`, "İlerleme");

        const targetObj = wordBank[rounds - 1] || wordBank[0];
        const options = [targetObj.word, ...targetObj.decoys.slice(0, 3)].sort(() => Math.random() - 0.5);

        api.stage.innerHTML = `
          <div style="display:flex; flex-direction:column; align-items:center; width:100%; max-width:440px;">
            <div style="color:var(--text-muted); margin-bottom:12px;">Bu harfler hangi kelimeyi oluşturur?</div>
            <div class="anagram-scrambled">${targetObj.scrambled}</div>
            <div class="anagram-options" id="word-opts"></div>
          </div>
        `;

        const optGrid = document.getElementById("word-opts");
        options.forEach(opt => {
          const btn = document.createElement("button");
          btn.className = "pattern-opt-btn";
          btn.style.fontSize = "1.2rem";
          btn.textContent = opt;
          btn.onclick = () => {
            if (opt === targetObj.word) {
              correct++;
              score += 75;
              api.playSound("correct");
            } else {
              api.playSound("wrong");
            }
            api.updateScore(score);
            if (rounds >= 5) finish();
            else nextWord();
          };
          optGrid.appendChild(btn);
        });
      }

      function finish() {
        const accuracy = Math.round((correct / 5) * 100);
        api.finishGame({
          xp: Math.max(140, score + accuracy * 2),
          accuracy: `${accuracy}%`,
          reactionTime: "Leksikal Erişim",
          difficulty: "5 Anagram",
          advice: "Sözcük dağarcığı ve görsel-dilsel algılama hızınız başarıyla test edildi."
        });
      }

      return {
        start: () => {
          api.setControlsTray("<span>💡 Harfleri düzenleyip doğru kelimeyi seçin.</span>");
          nextWord();
        },
        destroy: () => {}
      };
    }
  });

  return {
    getAll: () => REGISTRY,
    getById: (id) => REGISTRY.find(g => g.id === id)
  };
})();
