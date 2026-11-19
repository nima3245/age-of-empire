// ===== Player State Management =====

class Player {
  constructor(data = null) {
    if (data) {
      Object.assign(this, data);
    } else {
      this.username = '';
      this.villageName = '';
      this.passwordHash = ''; // simple for demo
      this.x = Math.floor(Math.random() * 40) - 20;
      this.y = Math.floor(Math.random() * 40) - 20;
      this.resources = { wood: 750, clay: 750, iron: 750, crop: 750, gold: 20 };
      this.buildings = {
        main: 1,
        barracks: 1,
        academy: 0,
        warehouse: 1,
        granary: 1,
        wall: 0,
        market: 0,
        woodcutter: 1,
        claypit: 1,
        ironmine: 1,
        farm: 1,
        residence: 1,
        tower: 0
      };
      this.units = {
        spearman: 5,
        swordsman: 0,
        archer: 0,
        cavalry: 0,
        catapult: 0
      };
      this.research = {};
      this.queues = {
        build: [],
        train: [],
        research: []
      };
      this.reports = [];
      this.lastTick = Date.now();
      this.settings = { sound: true, anim: true, lang: 'fa', speed: 1 };
      this.createdAt = Date.now();
    }
  }

  getPopulation() {
    let used = 0;
    for (const [id, count] of Object.entries(this.units)) {
      used += (UNITS[id]?.pop || 0) * count;
    }
    // buildings also use some pop conceptually, but simplify
    return used;
  }

  getMaxPopulation() {
    let max = 20;
    for (const [id, lvl] of Object.entries(this.buildings)) {
      if (lvl > 0 && BUILDINGS[id]?.effect) {
        const e = BUILDINGS[id].effect(lvl);
        if (e.popCap) max += e.popCap;
      }
    }
    return max;
  }

  getProduction() {
    const prod = { wood: 5, clay: 5, iron: 5, crop: 5 }; // base
    for (const [id, lvl] of Object.entries(this.buildings)) {
      if (lvl > 0 && BUILDINGS[id]?.effect) {
        const e = BUILDINGS[id].effect(lvl);
        if (e.woodProd) prod.wood += e.woodProd;
        if (e.clayProd) prod.clay += e.clayProd;
        if (e.ironProd) prod.iron += e.ironProd;
        if (e.cropProd) prod.crop += e.cropProd;
      }
    }
    // crop consumption by units
    const pop = this.getPopulation();
    prod.crop -= Math.floor(pop * 0.5);
    return prod;
  }

  getStorage() {
    let storage = 800;
    let cropStorage = 800;
    if (this.buildings.warehouse > 0) {
      storage = BUILDINGS.warehouse.effect(this.buildings.warehouse).storage;
    }
    if (this.buildings.granary > 0) {
      cropStorage = BUILDINGS.granary.effect(this.buildings.granary).cropStorage;
    }
    return { storage, cropStorage };
  }

  canAfford(cost) {
    return (
      this.resources.wood >= cost.wood &&
      this.resources.clay >= cost.clay &&
      this.resources.iron >= cost.iron &&
      this.resources.crop >= (cost.crop || 0)
    );
  }

  spend(cost) {
    if (!this.canAfford(cost)) return false;
    this.resources.wood -= cost.wood;
    this.resources.clay -= cost.clay;
    this.resources.iron -= cost.iron;
    this.resources.crop -= (cost.crop || 0);
    return true;
  }

  getDefensePower() {
    let def = 10; // base
    for (const [id, count] of Object.entries(this.units)) {
      const u = UNITS[id];
      if (!u) continue;
      def += (u.defenseInf * 0.6 + u.defenseCav * 0.4) * count;
    }
    if (this.buildings.wall > 0) {
      def += BUILDINGS.wall.effect(this.buildings.wall).defenseBonus * 10;
    }
    // research bonus
    if (this.research.armor) def *= 1.12;
    return Math.floor(def);
  }

  getAttackPower() {
    let atk = 0;
    for (const [id, count] of Object.entries(this.units)) {
      const u = UNITS[id];
      if (!u) continue;
      atk += u.attack * count;
    }
    if (this.research.iron_weapons) atk *= 1.1;
    return Math.floor(atk);
  }

  tick(now = Date.now()) {
    const speed = this.settings.speed || 1;
    const elapsed = ((now - this.lastTick) / 1000) * speed; // seconds
    if (elapsed < 0.5) return;

    const prod = this.getProduction();
    const stor = this.getStorage();

    this.resources.wood = Math.min(stor.storage, this.resources.wood + prod.wood * (elapsed / 3600));
    this.resources.clay = Math.min(stor.storage, this.resources.clay + prod.clay * (elapsed / 3600));
    this.resources.iron = Math.min(stor.storage, this.resources.iron + prod.iron * (elapsed / 3600));
    this.resources.crop = Math.min(stor.cropStorage, this.resources.crop + prod.crop * (elapsed / 3600));

    // process queues
    this.processQueues(elapsed);

    this.lastTick = now;
  }

  processQueues(elapsed) {
    // Build queue
    if (this.queues.build.length > 0) {
      const job = this.queues.build[0];
      job.remaining -= elapsed;
      if (job.remaining <= 0) {
        this.buildings[job.buildingId] = (this.buildings[job.buildingId] || 0) + 1;
        this.queues.build.shift();
        this.addReport(`ساختمان ${BUILDINGS[job.buildingId].name} به سطح ${this.buildings[job.buildingId]} ارتقا یافت.`, 'success');
      }
    }

    // Train queue
    if (this.queues.train.length > 0) {
      const job = this.queues.train[0];
      job.remaining -= elapsed;
      if (job.remaining <= 0) {
        this.units[job.unitId] = (this.units[job.unitId] || 0) + job.amount;
        this.queues.train.shift();
        this.addReport(`${job.amount} ${UNITS[job.unitId].name} آموزش داده شد.`, 'success');
      }
    }

    // Research queue
    if (this.queues.research.length > 0) {
      const job = this.queues.research[0];
      job.remaining -= elapsed;
      if (job.remaining <= 0) {
        this.research[job.researchId] = true;
        this.queues.research.shift();
        this.addReport(`پژوهش ${RESEARCH[job.researchId].name} کامل شد!`, 'success');
      }
    }
  }

  startUpgrade(buildingId) {
    const current = this.buildings[buildingId] || 0;
    const b = BUILDINGS[buildingId];
    if (!b || current >= b.maxLevel) return { ok: false, msg: 'حداکثر سطح رسیده است' };
    if (this.queues.build.length >= 2) return { ok: false, msg: 'صف ساخت پر است (حداکثر ۲)' };

    const cost = getBuildingCost(buildingId, current + 1);
    if (!this.canAfford(cost)) return { ok: false, msg: 'منابع کافی نیست' };

    this.spend(cost);
    const mainLvl = this.buildings.main || 1;
    const time = getBuildingTime(buildingId, current + 1, mainLvl);
    this.queues.build.push({
      buildingId,
      level: current + 1,
      remaining: time,
      total: time
    });
    return { ok: true, msg: `ارتقای ${b.name} شروع شد` };
  }

  startTrain(unitId, amount) {
    amount = Math.max(1, Math.min(50, parseInt(amount) || 1));
    const u = UNITS[unitId];
    if (!u) return { ok: false, msg: 'نیرو نامعتبر' };

    // check requirements
    if (u.req.barracks && (this.buildings.barracks || 0) < u.req.barracks) {
      return { ok: false, msg: `نیاز به سربازخانه سطح ${u.req.barracks}` };
    }
    if (u.req.research && !this.research[u.req.research]) {
      return { ok: false, msg: 'پژوهش مورد نیاز انجام نشده' };
    }

    const totalCost = {
      wood: u.cost.wood * amount,
      clay: u.cost.clay * amount,
      iron: u.cost.iron * amount,
      crop: u.cost.crop * amount
    };
    if (!this.canAfford(totalCost)) return { ok: false, msg: 'منابع کافی نیست' };
    if (this.getPopulation() + u.pop * amount > this.getMaxPopulation()) {
      return { ok: false, msg: 'ظرفیت جمعیت کافی نیست' };
    }
    if (this.queues.train.length >= 3) return { ok: false, msg: 'صف آموزش پر است' };

    this.spend(totalCost);
    const barracksBonus = 1 + ((this.buildings.barracks || 1) - 1) * 0.06;
    const time = Math.floor((u.time * amount) / barracksBonus);
    this.queues.train.push({
      unitId,
      amount,
      remaining: time,
      total: time
    });
    return { ok: true, msg: `آموزش ${amount} ${u.name} شروع شد` };
  }

  startResearch(researchId) {
    const r = RESEARCH[researchId];
    if (!r) return { ok: false, msg: 'پژوهش نامعتبر' };
    if (this.research[researchId]) return { ok: false, msg: 'قبلاً پژوهش شده' };
    if (this.queues.research.length >= 1) return { ok: false, msg: 'در حال پژوهش دیگری هستید' };

    if (r.req.academy && (this.buildings.academy || 0) < r.req.academy) {
      return { ok: false, msg: `نیاز به آکادمی سطح ${r.req.academy}` };
    }
    if (r.req.iron_weapons && !this.research.iron_weapons) {
      return { ok: false, msg: 'نیاز به پژوهش سلاح‌های آهنی' };
    }

    if (!this.canAfford(r.cost)) return { ok: false, msg: 'منابع کافی نیست' };

    this.spend(r.cost);
    const academyBonus = 1 + ((this.buildings.academy || 1) - 1) * 0.07;
    const time = Math.floor(r.time / academyBonus);
    this.queues.research.push({
      researchId,
      remaining: time,
      total: time
    });
    return { ok: true, msg: `پژوهش ${r.name} شروع شد` };
  }

  addReport(text, type = 'info') {
    this.reports.unshift({
      text,
      type,
      time: Date.now()
    });
    if (this.reports.length > 50) this.reports.pop();
  }

  // Simple battle resolution
  resolveAttack(attackerUnits, defender) {
    let atkPower = 0;
    let atkPop = 0;
    for (const [id, count] of Object.entries(attackerUnits)) {
      if (count <= 0) continue;
      const u = UNITS[id];
      atkPower += u.attack * count;
      atkPop += u.pop * count;
    }
    if (this.research.iron_weapons) atkPower *= 1.1;

    const defPower = defender.getDefensePower ? defender.getDefensePower() : 50;

    // Simple formula
    const ratio = atkPower / (defPower + 1);
    let result;
    if (ratio > 1.3) {
      result = 'win';
    } else if (ratio < 0.7) {
      result = 'lose';
    } else {
      result = Math.random() > 0.45 ? 'win' : 'lose';
    }

    // Casualties
    const casualtyRate = result === 'win' ? 0.15 + Math.random() * 0.25 : 0.5 + Math.random() * 0.4;
    const survived = {};
    let loot = { wood: 0, clay: 0, iron: 0, crop: 0 };

    for (const [id, count] of Object.entries(attackerUnits)) {
      const lost = Math.floor(count * casualtyRate * (0.7 + Math.random() * 0.6));
      survived[id] = Math.max(0, count - lost);
    }

    if (result === 'win') {
      const carry = Object.entries(attackerUnits).reduce((s, [id, c]) => {
        return s + (UNITS[id]?.carry || 0) * c;
      }, 0);
      const bonus = this.research.logistics ? 1.2 : 1;
      const totalCarry = carry * bonus;
      // steal some resources
      const steal = Math.min(totalCarry, 800 + Math.random() * 1200);
      loot.wood = Math.floor(steal * 0.3);
      loot.clay = Math.floor(steal * 0.25);
      loot.iron = Math.floor(steal * 0.25);
      loot.crop = Math.floor(steal * 0.2);
      this.resources.gold += Math.floor(2 + Math.random() * 5);
    }

    return { result, survived, loot, atkPower: Math.floor(atkPower), defPower };
  }

  toJSON() {
    return {
      username: this.username,
      villageName: this.villageName,
      passwordHash: this.passwordHash,
      x: this.x,
      y: this.y,
      resources: this.resources,
      buildings: this.buildings,
      units: this.units,
      research: this.research,
      queues: this.queues,
      reports: this.reports,
      lastTick: this.lastTick,
      settings: this.settings,
      createdAt: this.createdAt
    };
  }
}

// Storage helpers
const STORAGE_KEY = 'village_wars_save_v1';

function savePlayer(player) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player.toJSON()));
}

function loadPlayer() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return new Player(data);
  } catch {
    return null;
  }
}

function clearSave() {
  localStorage.removeItem(STORAGE_KEY);
}
