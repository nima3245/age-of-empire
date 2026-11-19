// ===== UI Rendering & Helpers =====

function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3200);
}

function formatNumber(n) {
  return Math.floor(n).toLocaleString('fa-IR');
}

function formatTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 60) {
    const h = Math.floor(m / 60);
    return `${h}س ${m % 60}د`;
  }
  return m > 0 ? `${m}د ${s}ث` : `${s}ث`;
}

function updateResourcesBar(player) {
  const prod = player.getProduction();
  document.getElementById('res-wood').textContent = formatNumber(player.resources.wood);
  document.getElementById('res-clay').textContent = formatNumber(player.resources.clay);
  document.getElementById('res-iron').textContent = formatNumber(player.resources.iron);
  document.getElementById('res-crop').textContent = formatNumber(player.resources.crop);
  document.getElementById('res-gold').textContent = formatNumber(player.resources.gold);

  document.getElementById('prod-wood').textContent = `+${formatNumber(prod.wood)}/س`;
  document.getElementById('prod-clay').textContent = `+${formatNumber(prod.clay)}/س`;
  document.getElementById('prod-iron').textContent = `+${formatNumber(prod.iron)}/س`;
  document.getElementById('prod-crop').textContent = `${prod.crop >= 0 ? '+' : ''}${formatNumber(prod.crop)}/س`;

  document.getElementById('treasury-gold').textContent = formatNumber(player.resources.gold);

  document.getElementById('pop-current').textContent = formatNumber(player.getPopulation());
  document.getElementById('pop-max').textContent = formatNumber(player.getMaxPopulation());
  document.getElementById('defense-power').textContent = formatNumber(player.getDefensePower());
  document.getElementById('wall-level').textContent = player.buildings.wall || 0;
  document.getElementById('attack-power').textContent = formatNumber(player.getAttackPower());
  document.getElementById('army-defense').textContent = formatNumber(player.getDefensePower());
}

function renderVillageBuildings(player) {
  const map = document.getElementById('village-map');
  // Clear old buildings
  map.querySelectorAll('.building').forEach(el => el.remove());

  for (const [id, pos] of Object.entries(BUILDING_POSITIONS)) {
    const lvl = player.buildings[id] || 0;
    const b = BUILDINGS[id];
    if (!b) continue;

    const el = document.createElement('div');
    el.className = 'building' + (lvl === 0 ? ' locked' : '');
    el.style.left = pos.x + '%';
    el.style.top = pos.y + '%';
    el.style.transform = 'translate(-50%, -50%)';
    el.dataset.id = id;

    el.innerHTML = `
      <div class="b-icon">${b.icon}</div>
      <div class="b-level">${lvl > 0 ? lvl : '—'}</div>
      <div class="b-name">${b.name}</div>
    `;

    if (lvl === 0) {
      el.style.opacity = '0.45';
      el.style.filter = 'grayscale(0.7)';
    }

    el.addEventListener('click', () => selectBuilding(id, player));
    map.appendChild(el);
  }
}

function selectBuilding(id, player) {
  document.querySelectorAll('.building').forEach(b => b.classList.remove('selected'));
  const el = document.querySelector(`.building[data-id="${id}"]`);
  if (el) el.classList.add('selected');

  const b = BUILDINGS[id];
  const lvl = player.buildings[id] || 0;
  const details = document.getElementById('building-details');

  if (lvl >= b.maxLevel) {
    details.innerHTML = `
      <h4>${b.icon} ${b.name}</h4>
      <div class="level-badge">سطح ${lvl} (حداکثر)</div>
      <p>${b.desc}</p>
    `;
    return;
  }

  const nextLevel = lvl + 1;
  const cost = getBuildingCost(id, nextLevel);
  const time = getBuildingTime(id, nextLevel, player.buildings.main || 1);
  const can = player.canAfford(cost);

  let costHtml = '';
  for (const [res, val] of Object.entries(cost)) {
    const has = player.resources[res] >= val;
    const icons = { wood: '🪵', clay: '🧱', iron: '⚙️', crop: '🌾' };
    costHtml += `<span class="cost-item ${has ? '' : 'missing'}">${icons[res]} ${formatNumber(val)}</span>`;
  }

  details.innerHTML = `
    <h4>${b.icon} ${b.name}</h4>
    <div class="level-badge">سطح فعلی: ${lvl} → ${nextLevel}</div>
    <p>${b.desc}</p>
    <div class="cost-list">${costHtml}</div>
    <p style="font-size:0.85rem;color:var(--text-muted)">زمان ساخت: ${formatTime(time)}</p>
    <button class="btn btn-primary btn-upgrade" id="btn-do-upgrade" ${can ? '' : 'disabled'}>
      ${can ? '⬆️ ارتقا به سطح ' + nextLevel : 'منابع کافی نیست'}
    </button>
  `;

  const btn = document.getElementById('btn-do-upgrade');
  if (btn && can) {
    btn.onclick = () => {
      const res = player.startUpgrade(id);
      showToast(res.msg, res.ok ? 'success' : 'error');
      if (res.ok) {
        updateResourcesBar(player);
        renderVillageBuildings(player);
        selectBuilding(id, player);
        savePlayer(player);
      }
    };
  }
}

function renderArmy(player) {
  const list = document.getElementById('barracks-list');
  const myArmy = document.getElementById('my-army');
  const queue = document.getElementById('train-queue');

  list.innerHTML = '';
  myArmy.innerHTML = '';

  for (const [id, u] of Object.entries(UNITS)) {
    const can = canTrainUnit(player, id);
    const owned = player.units[id] || 0;

    // Barracks card
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <div class="icon">${u.icon}</div>
      <div class="info">
        <div class="name">${u.name}</div>
        <div class="meta">حمله: ${u.attack} | دفاع: ${u.defenseInf}/${u.defenseCav} | جمعیت: ${u.pop}</div>
        <div class="meta">${formatUnitCost(u)}</div>
      </div>
      <div class="actions">
        <input type="number" min="1" max="30" value="1" id="train-amt-${id}" style="width:50px;text-align:center;border-radius:4px;border:1px solid var(--border);background:var(--bg-dark);color:var(--text);padding:2px;" ${can ? '' : 'disabled'} />
        <button class="btn btn-sm btn-primary" data-train="${id}" ${can ? '' : 'disabled'}>آموزش</button>
      </div>
    `;
    list.appendChild(card);

    // My army
    if (owned > 0) {
      const mine = document.createElement('div');
      mine.className = 'unit-card';
      mine.innerHTML = `
        <div class="icon">${u.icon}</div>
        <div class="info">
          <div class="name">${u.name}</div>
          <div class="meta">تعداد: <strong>${owned}</strong></div>
        </div>
      `;
      myArmy.appendChild(mine);
    }
  }

  // Train buttons
  list.querySelectorAll('[data-train]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.train;
      const amt = document.getElementById('train-amt-' + id).value;
      const res = player.startTrain(id, amt);
      showToast(res.msg, res.ok ? 'success' : 'error');
      if (res.ok) {
        updateResourcesBar(player);
        renderArmy(player);
        savePlayer(player);
      }
    };
  });

  // Queue
  if (player.queues.train.length === 0) {
    queue.innerHTML = '<p class="empty">صف خالی است</p>';
  } else {
    queue.innerHTML = player.queues.train.map(job => `
      <div class="queue-item">
        <span>${UNITS[job.unitId].icon} ${job.amount}× ${UNITS[job.unitId].name}</span>
        <span class="time">${formatTime(job.remaining)}</span>
      </div>
    `).join('');
  }
}

function renderResearch(player) {
  const tree = document.getElementById('research-tree');
  const queue = document.getElementById('research-queue');

  tree.innerHTML = '';
  for (const [id, r] of Object.entries(RESEARCH)) {
    const done = !!player.research[id];
    const card = document.createElement('div');
    card.className = 'research-card';
    card.style.opacity = done ? '0.6' : '1';

    let reqText = '';
    if (r.req.academy) reqText += `آکادمی ${r.req.academy} `;
    if (r.req.iron_weapons) reqText += 'نیاز به سلاح آهنی ';

    card.innerHTML = `
      <div class="icon">${r.icon}</div>
      <div class="info">
        <div class="name">${r.name} ${done ? '✅' : ''}</div>
        <div class="meta">${r.desc}</div>
        <div class="meta">${reqText} | 🪵${r.cost.wood} 🧱${r.cost.clay} ⚙️${r.cost.iron}</div>
      </div>
      <div class="actions">
        <button class="btn btn-sm btn-primary" data-research="${id}" ${done ? 'disabled' : ''}>
          ${done ? 'کامل شده' : 'شروع پژوهش'}
        </button>
      </div>
    `;
    tree.appendChild(card);
  }

  tree.querySelectorAll('[data-research]').forEach(btn => {
    btn.onclick = () => {
      const res = player.startResearch(btn.dataset.research);
      showToast(res.msg, res.ok ? 'success' : 'error');
      if (res.ok) {
        updateResourcesBar(player);
        renderResearch(player);
        savePlayer(player);
      }
    };
  });

  if (player.queues.research.length === 0) {
    queue.innerHTML = '<p class="empty">در حال حاضر پژوهشی در جریان نیست</p>';
  } else {
    const job = player.queues.research[0];
    queue.innerHTML = `
      <div class="queue-item">
        <span>${RESEARCH[job.researchId].icon} ${RESEARCH[job.researchId].name}</span>
        <span class="time">${formatTime(job.remaining)}</span>
      </div>
    `;
  }
}

function renderReports(player) {
  const list = document.getElementById('reports-list');
  if (player.reports.length === 0) {
    list.innerHTML = '<p class="empty">هنوز گزارشی وجود ندارد</p>';
    return;
  }
  list.innerHTML = player.reports.map(r => {
    const date = new Date(r.time).toLocaleString('fa-IR');
    return `
      <div class="report-item ${r.type}">
        <div class="time">${date}</div>
        <div>${r.text}</div>
      </div>
    `;
  }).join('');
}

function renderAttackPanel(village, player) {
  const panel = document.getElementById('attack-panel');
  const unitsDiv = document.getElementById('attack-units');
  if (!village || village.type === 'me') {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');

  unitsDiv.innerHTML = '';
  for (const [id, u] of Object.entries(UNITS)) {
    const owned = player.units[id] || 0;
    if (owned <= 0) continue;
    const row = document.createElement('div');
    row.className = 'unit-row';
    row.innerHTML = `
      <span>${u.icon} ${u.name} (موجود: ${owned})</span>
      <input type="number" min="0" max="${owned}" value="0" data-unit="${id}" />
    `;
    unitsDiv.appendChild(row);
  }
}

function showTargetInfo(village) {
  const info = document.getElementById('target-info');
  if (!village) {
    info.innerHTML = '<p class="placeholder">روی یک دهکده در نقشه کلیک کنید</p>';
    return;
  }
  const typeLabel = { me: 'شما', ally: 'متحد', enemy: 'دشمن', barb: 'بربر' }[village.type] || village.type;
  info.innerHTML = `
    <h4>${village.name}</h4>
    <p>مالک: <strong>${village.owner}</strong></p>
    <p>نوع: ${typeLabel}</p>
    <p>جمعیت تقریبی: ${village.population}</p>
    <p>امتیاز: ${village.points}</p>
    <p>مختصات: (${village.x}, ${village.y})</p>
  `;
}
