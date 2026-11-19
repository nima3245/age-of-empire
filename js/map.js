// ===== World Map System =====

class WorldMap {
  constructor(canvas, player) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.player = player;
    this.villages = [];
    this.selected = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };

    this.generateWorld();
    this.bindEvents();
  }

  generateWorld() {
    this.villages = [];

    // Player
    this.villages.push({
      id: 'player',
      name: this.player.villageName,
      owner: this.player.username,
      x: this.player.x,
      y: this.player.y,
      type: 'me',
      population: this.player.getPopulation(),
      points: this.calcPoints(this.player.buildings)
    });

    // Generate AI / barbarian villages
    const names = [
      'دهکده تاریک', 'قلعه سنگی', 'روستای شمالی', 'پناهگاه گرگ', 'دژ آهنین',
      'مزرعه سبز', 'برج باد', 'دره خاموش', 'کوه آتش', 'ساحل طلایی',
      'جنگل ابدی', 'باتلاق مه‌آلود', 'قله عقاب', 'دره اژدها', 'چشمه مقدس',
      'ویرانه‌های کهن', 'اردوگاه بربر', 'قلعه گم‌شده', 'دهکده متروک', 'دژ مرزی'
    ];

    for (let i = 0; i < 35; i++) {
      let x, y, tries = 0;
      do {
        x = Math.floor(Math.random() * 60) - 30;
        y = Math.floor(Math.random() * 60) - 30;
        tries++;
      } while (this.isTooClose(x, y) && tries < 50);

      const isBarb = Math.random() < 0.4;
      const pop = isBarb ? Math.floor(Math.random() * 40) + 5 : Math.floor(Math.random() * 120) + 20;
      this.villages.push({
        id: 'v' + i,
        name: names[i % names.length] + (i > 19 ? ' ' + (i - 19) : ''),
        owner: isBarb ? 'بربرها' : 'بازیکن' + (1000 + i),
        x, y,
        type: isBarb ? 'barb' : (Math.random() < 0.15 ? 'ally' : 'enemy'),
        population: pop,
        points: Math.floor(pop * 3 + Math.random() * 200),
        // fake buildings for battle
        buildings: { wall: Math.floor(Math.random() * 8), main: Math.floor(Math.random() * 10) + 1 },
        units: this.generateFakeArmy(pop)
      });
    }
  }

  isTooClose(x, y) {
    return this.villages.some(v => Math.hypot(v.x - x, v.y - y) < 3.5);
  }

  generateFakeArmy(pop) {
    const army = { spearman: 0, swordsman: 0, archer: 0, cavalry: 0, catapult: 0 };
    let remaining = Math.floor(pop * 0.7);
    army.spearman = Math.min(remaining, Math.floor(Math.random() * 30) + 5);
    remaining -= army.spearman;
    if (remaining > 0) {
      army.swordsman = Math.min(remaining, Math.floor(Math.random() * 20));
      remaining -= army.swordsman;
    }
    if (remaining > 0) {
      army.archer = Math.min(remaining, Math.floor(Math.random() * 15));
      remaining -= army.archer;
    }
    if (remaining > 5) {
      army.cavalry = Math.min(Math.floor(remaining / 3), Math.floor(Math.random() * 8));
    }
    return army;
  }

  calcPoints(buildings) {
    let p = 0;
    for (const lvl of Object.values(buildings)) p += lvl * 10;
    return p;
  }

  bindEvents() {
    const c = this.canvas;

    c.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouse = { x: e.offsetX, y: e.offsetY };
    });

    window.addEventListener('mouseup', () => { this.isDragging = false; });

    c.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.offsetX += (e.offsetX - this.lastMouse.x);
        this.offsetY += (e.offsetY - this.lastMouse.y);
        this.lastMouse = { x: e.offsetX, y: e.offsetY };
        this.draw();
      } else {
        this.handleHover(e);
      }
    });

    c.addEventListener('click', (e) => {
      if (Math.hypot(e.offsetX - this.lastMouse.x, e.offsetY - this.lastMouse.y) > 5) return;
      this.handleClick(e);
    });

    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale = Math.max(0.5, Math.min(2.5, this.scale * delta));
      this.draw();
    });
  }

  worldToScreen(wx, wy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: cx + (wx * 28 * this.scale) + this.offsetX,
      y: cy + (wy * 28 * this.scale) + this.offsetY
    };
  }

  screenToWorld(sx, sy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    return {
      x: ((sx - cx - this.offsetX) / (28 * this.scale)),
      y: ((sy - cy - this.offsetY) / (28 * this.scale))
    };
  }

  handleHover(e) {
    const world = this.screenToWorld(e.offsetX, e.offsetY);
    let found = null;
    for (const v of this.villages) {
      if (Math.hypot(v.x - world.x, v.y - world.y) < 0.9 / this.scale) {
        found = v;
        break;
      }
    }
    const tip = document.getElementById('map-tooltip');
    if (found) {
      tip.innerHTML = `<strong>${found.name}</strong><br>${found.owner}<br>جمعیت: ${found.population}<br>امتیاز: ${found.points}`;
      tip.style.left = (e.offsetX + 12) + 'px';
      tip.style.top = (e.offsetY + 12) + 'px';
      tip.classList.remove('hidden');
    } else {
      tip.classList.add('hidden');
    }
  }

  handleClick(e) {
    const world = this.screenToWorld(e.offsetX, e.offsetY);
    let found = null;
    for (const v of this.villages) {
      if (Math.hypot(v.x - world.x, v.y - world.y) < 0.9 / this.scale) {
        found = v;
        break;
      }
    }
    this.selected = found;
    if (window.onVillageSelect) window.onVillageSelect(found);
    this.draw();
  }

  centerOnPlayer() {
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1.2;
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background
    ctx.fillStyle = '#15261e';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(60, 100, 70, 0.25)';
    ctx.lineWidth = 1;
    const step = 28 * this.scale;
    const startX = (w / 2 + this.offsetX) % step;
    const startY = (h / 2 + this.offsetY) % step;
    for (let x = startX; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = startY; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw villages
    for (const v of this.villages) {
      const pos = this.worldToScreen(v.x, v.y);
      if (pos.x < -30 || pos.x > w + 30 || pos.y < -30 || pos.y > h + 30) continue;

      const radius = v.type === 'me' ? 9 : 7;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * this.scale, 0, Math.PI * 2);

      if (v.type === 'me') {
        ctx.fillStyle = '#3b82f6';
        ctx.strokeStyle = '#93c5fd';
      } else if (v.type === 'ally') {
        ctx.fillStyle = '#22c55e';
        ctx.strokeStyle = '#86efac';
      } else if (v.type === 'barb') {
        ctx.fillStyle = '#a3a3a3';
        ctx.strokeStyle = '#d4d4d4';
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#fca5a5';
      }
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      // Selected highlight
      if (this.selected && this.selected.id === v.id) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (radius + 5) * this.scale, 0, Math.PI * 2);
        ctx.strokeStyle = '#e8c547';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Name
      if (this.scale > 0.8) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `${11 * this.scale}px Vazirmatn, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(v.name, pos.x, pos.y - 12 * this.scale);
      }
    }

    // Coordinates indicator
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8, h - 28, 110, 20);
    ctx.fillStyle = '#9bb0a0';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    const center = this.screenToWorld(w / 2, h / 2);
    ctx.fillText(`X:${center.x.toFixed(0)} Y:${center.y.toFixed(0)}`, 14, h - 14);
  }
}
