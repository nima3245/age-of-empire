// ===== Main Application =====

let player = null;
let worldMap = null;
let gameLoop = null;

// Simple hash for demo password
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return 'h' + Math.abs(h);
}

function init() {
  // Loading animation
  let prog = 0;
  const fill = document.getElementById('load-progress');
  const text = document.getElementById('load-text');
  const steps = ['بارگذاری داده‌ها...', 'آماده‌سازی نقشه...', 'راه‌اندازی رابط...', 'تقریباً آماده...'];
  const interval = setInterval(() => {
    prog += 8 + Math.random() * 12;
    if (prog >= 100) {
      prog = 100;
      clearInterval(interval);
      setTimeout(showAuthOrGame, 400);
    }
    fill.style.width = prog + '%';
    text.textContent = steps[Math.min(3, Math.floor(prog / 30))];
  }, 180);
}

function showAuthOrGame() {
  document.getElementById('loading-screen').classList.remove('active');
  const saved = loadPlayer();
  if (saved && saved.username) {
    player = saved;
    startGame();
  } else {
    document.getElementById('auth-screen').classList.add('active');
  }
}

function startGame() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('game-shell').classList.add('active');

  document.getElementById('player-name').textContent = player.username;
  document.getElementById('village-name').textContent = player.villageName;

  // Initial render
  updateResourcesBar(player);
  renderVillageBuildings(player);
  renderArmy(player);
  renderResearch(player);
  renderReports(player);

  // Map
  const canvas = document.getElementById('world-map');
  // Make canvas responsive
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = Math.min(500, window.innerHeight * 0.55);
    if (worldMap) worldMap.draw();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  worldMap = new WorldMap(canvas, player);
  worldMap.centerOnPlayer();
  worldMap.draw();

  window.onVillageSelect = (v) => {
    showTargetInfo(v);
    renderAttackPanel(v, player);
  };

  // Game loop
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(() => {
    player.tick();
    updateResourcesBar(player);
    // Refresh queues if needed
    if (document.getElementById('view-army').classList.contains('active')) {
      renderArmy(player);
    }
    if (document.getElementById('view-research').classList.contains('active')) {
      renderResearch(player);
    }
    // Update build queue indicator if selected
    const selected = document.querySelector('.building.selected');
    if (selected) {
      // optionally refresh details
    }
    savePlayer(player);
  }, 1000);

  // Server time display
  setInterval(() => {
    document.getElementById('server-time').textContent = new Date().toLocaleTimeString('fa-IR');
  }, 1000);

  document.getElementById('status-text').textContent = 'بازی آماده است. موفق باشید فرمانده!';
}

// ===== Event Listeners =====

document.addEventListener('DOMContentLoaded', () => {
  init();

  // Auth tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab + '-form').classList.add('active');
    });
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value;
    const saved = loadPlayer();
    if (saved && saved.username === user && saved.passwordHash === simpleHash(pass)) {
      player = saved;
      showToast('خوش آمدید فرمانده!', 'success');
      startGame();
    } else if (saved && saved.username === user) {
      showToast('رمز عبور اشتباه است', 'error');
    } else {
      showToast('حسابی با این نام یافت نشد. ثبت‌نام کنید.', 'error');
    }
  });

  // Register
  document.getElementById('register-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('reg-username').value.trim();
    const village = document.getElementById('reg-village').value.trim();
    const pass = document.getElementById('reg-password').value;

    if (user.length < 3) return showToast('نام کاربری خیلی کوتاه است', 'error');
    if (village.length < 3) return showToast('نام دهکده خیلی کوتاه است', 'error');
    if (pass.length < 6) return showToast('رمز عبور حداقل ۶ کاراکتر', 'error');

    player = new Player();
    player.username = user;
    player.villageName = village;
    player.passwordHash = simpleHash(pass);
    savePlayer(player);
    showToast('حساب ساخته شد! امپراتوری خود را بسازید.', 'success');
    startGame();
  });

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const view = document.getElementById('view-' + btn.dataset.view);
      view.classList.add('active');

      // Special render
      if (btn.dataset.view === 'army') renderArmy(player);
      if (btn.dataset.view === 'research') renderResearch(player);
      if (btn.dataset.view === 'reports') renderReports(player);
      if (btn.dataset.view === 'map' && worldMap) {
        worldMap.draw();
      }
    });
  });

  // Settings
  document.getElementById('btn-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').classList.remove('hidden');
    document.getElementById('setting-sound').checked = player.settings.sound;
    document.getElementById('setting-anim').checked = player.settings.anim;
    document.getElementById('setting-lang').value = player.settings.lang || 'fa';
    document.getElementById('setting-speed').value = player.settings.speed || 1;
  });

  document.getElementById('btn-close-settings').addEventListener('click', () => {
    player.settings.sound = document.getElementById('setting-sound').checked;
    player.settings.anim = document.getElementById('setting-anim').checked;
    player.settings.lang = document.getElementById('setting-lang').value;
    player.settings.speed = parseInt(document.getElementById('setting-speed').value) || 1;
    savePlayer(player);
    document.getElementById('settings-modal').classList.add('hidden');
    showToast('تنظیمات ذخیره شد', 'success');
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('آیا می‌خواهید از حساب خارج شوید؟ (داده ذخیره می‌ماند)')) {
      clearInterval(gameLoop);
      document.getElementById('game-shell').classList.remove('active');
      document.getElementById('auth-screen').classList.add('active');
      player = null;
    }
  });

  // Map controls
  document.getElementById('btn-center-me').addEventListener('click', () => {
    if (worldMap) worldMap.centerOnPlayer();
  });

  document.getElementById('btn-goto').addEventListener('click', () => {
    const x = parseInt(document.getElementById('map-x').value) || 0;
    const y = parseInt(document.getElementById('map-y').value) || 0;
    if (worldMap) {
      worldMap.offsetX = -x * 28 * worldMap.scale;
      worldMap.offsetY = -y * 28 * worldMap.scale;
      worldMap.draw();
    }
  });

  // Attack
  document.getElementById('btn-send-attack').addEventListener('click', () => {
    if (!worldMap || !worldMap.selected || worldMap.selected.type === 'me') {
      return showToast('هدف معتبری انتخاب نشده', 'error');
    }
    const inputs = document.querySelectorAll('#attack-units input');
    const army = {};
    let total = 0;
    inputs.forEach(inp => {
      const cnt = parseInt(inp.value) || 0;
      if (cnt > 0) {
        army[inp.dataset.unit] = cnt;
        total += cnt;
      }
    });
    if (total === 0) return showToast('هیچ نیرویی انتخاب نشده', 'error');

    // Check ownership
    for (const [id, cnt] of Object.entries(army)) {
      if ((player.units[id] || 0) < cnt) {
        return showToast('نیروی کافی ندارید', 'error');
      }
    }

    // Deduct units temporarily (they go to attack)
    for (const [id, cnt] of Object.entries(army)) {
      player.units[id] -= cnt;
    }

    const target = worldMap.selected;
    // Simulate travel time (very short for demo)
    showToast(`حمله به ${target.name} ارسال شد...`, 'info');

    setTimeout(() => {
      // Fake defender
      const defender = {
        getDefensePower() {
          let d = 20 + target.population * 1.5;
          if (target.buildings?.wall) d += target.buildings.wall * 15;
          return d;
        }
      };

      const battle = player.resolveAttack(army, defender);

      // Return survivors
      for (const [id, cnt] of Object.entries(battle.survived)) {
        player.units[id] = (player.units[id] || 0) + cnt;
      }

      // Loot
      if (battle.result === 'win') {
        player.resources.wood += battle.loot.wood;
        player.resources.clay += battle.loot.clay;
        player.resources.iron += battle.loot.iron;
        player.resources.crop += battle.loot.crop;
      }

      const resultText = battle.result === 'win'
        ? `پیروزی! حمله به ${target.name} موفق بود. غنیمت: 🪵${battle.loot.wood} 🧱${battle.loot.clay} ⚙️${battle.loot.iron}`
        : `شکست در حمله به ${target.name}. نیروهای زیادی از دست رفت.`;

      player.addReport(resultText, battle.result === 'win' ? 'win' : 'lose');
      showToast(battle.result === 'win' ? 'پیروزی در نبرد!' : 'نبرد شکست خورد', battle.result === 'win' ? 'success' : 'error');

      updateResourcesBar(player);
      renderArmy(player);
      renderReports(player);
      savePlayer(player);
    }, 1500 + Math.random() * 1000);
  });

  // Treasury buy/sell
  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = btn.dataset.buy;
      const amount = parseInt(btn.dataset.amount);
      const cost = parseInt(btn.dataset.cost);
      if (player.resources.gold < cost) {
        return showToast('طلای کافی ندارید', 'error');
      }
      player.resources.gold -= cost;
      player.resources[res] += amount;
      updateResourcesBar(player);
      savePlayer(player);
      showToast(`${formatNumber(amount)} ${res} خریداری شد`, 'success');
    });
  });

  document.querySelectorAll('[data-sell]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = btn.dataset.sell;
      const amount = parseInt(btn.dataset.amount);
      const gain = parseInt(btn.dataset.gain);
      if (player.resources[res] < amount) {
        return showToast('منابع کافی برای فروش ندارید', 'error');
      }
      player.resources[res] -= amount;
      player.resources.gold += gain;
      updateResourcesBar(player);
      savePlayer(player);
      showToast(`فروش انجام شد. +${gain} طلا`, 'success');
    });
  });

  // Export / Import
  document.getElementById('btn-export').addEventListener('click', () => {
    const data = JSON.stringify(player.toJSON());
    navigator.clipboard.writeText(data).then(() => {
      showToast('کد ذخیره در کلیپ‌بورد کپی شد', 'success');
    }).catch(() => {
      const area = document.getElementById('import-area');
      area.classList.remove('hidden');
      area.value = data;
      showToast('کد را کپی کنید', 'info');
    });
  });

  document.getElementById('btn-import').addEventListener('click', () => {
    const area = document.getElementById('import-area');
    area.classList.toggle('hidden');
    if (!area.classList.contains('hidden')) {
      area.placeholder = 'کد ذخیره را اینجا بچسبانید و دوباره روی دکمه بزنید...';
      area.focus();
    } else if (area.value.trim()) {
      try {
        const data = JSON.parse(area.value.trim());
        player = new Player(data);
        savePlayer(player);
        location.reload(); // simple refresh
      } catch {
        showToast('کد ذخیره نامعتبر است', 'error');
      }
    }
  });
});
