// ===== Game Data: Buildings, Units, Research =====

const BUILDINGS = {
  main: {
    id: 'main',
    name: 'تالار اصلی',
    icon: '🏛️',
    desc: 'مرکز دهکده. سطح آن سرعت ساخت و ارتقای همه ساختمان‌ها را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 70, clay: 40, iron: 60, crop: 20 },
    costFactor: 1.5,
    baseTime: 30, // seconds
    effect: (lvl) => ({ buildSpeed: 1 + (lvl - 1) * 0.05 })
  },
  barracks: {
    id: 'barracks',
    name: 'سربازخانه',
    icon: '⚔️',
    desc: 'آموزش نیروهای پیاده و کماندار. سطح بالاتر = آموزش سریع‌تر.',
    maxLevel: 20,
    baseCost: { wood: 120, clay: 100, iron: 150, crop: 40 },
    costFactor: 1.55,
    baseTime: 45,
    effect: (lvl) => ({ trainSpeed: 1 + (lvl - 1) * 0.06 })
  },
  academy: {
    id: 'academy',
    name: 'آکادمی',
    icon: '🔬',
    desc: 'پژوهش فناوری‌ها و ارتقای نیروهای نظامی.',
    maxLevel: 15,
    baseCost: { wood: 150, clay: 180, iron: 200, crop: 80 },
    costFactor: 1.6,
    baseTime: 60,
    effect: (lvl) => ({ researchSpeed: 1 + (lvl - 1) * 0.07 })
  },
  warehouse: {
    id: 'warehouse',
    name: 'انبار',
    icon: '📦',
    desc: 'ظرفیت نگهداری چوب، خاک و آهن را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 80, clay: 100, iron: 70, crop: 20 },
    costFactor: 1.45,
    baseTime: 35,
    effect: (lvl) => ({ storage: 800 + lvl * 400 })
  },
  granary: {
    id: 'granary',
    name: 'انبار غلات',
    icon: '🏪',
    desc: 'ظرفیت نگهداری غذا را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 80, clay: 100, iron: 70, crop: 20 },
    costFactor: 1.45,
    baseTime: 35,
    effect: (lvl) => ({ cropStorage: 800 + lvl * 400 })
  },
  wall: {
    id: 'wall',
    name: 'دیوار دفاعی',
    icon: '🧱',
    desc: 'قدرت دفاعی دهکده را به شدت افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 50, clay: 100, iron: 50, crop: 20 },
    costFactor: 1.5,
    baseTime: 40,
    effect: (lvl) => ({ defenseBonus: lvl * 8 })
  },
  market: {
    id: 'market',
    name: 'بازار / خزانه',
    icon: '💰',
    desc: 'خرید و فروش منابع با طلا. سطح بالاتر تخفیف می‌دهد.',
    maxLevel: 15,
    baseCost: { wood: 100, clay: 100, iron: 100, crop: 50 },
    costFactor: 1.5,
    baseTime: 50,
    effect: (lvl) => ({ marketDiscount: Math.min(0.3, lvl * 0.02) })
  },
  woodcutter: {
    id: 'woodcutter',
    name: 'چوب‌بُر',
    icon: '🪓',
    desc: 'تولید چوب را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 40, clay: 100, iron: 50, crop: 60 },
    costFactor: 1.5,
    baseTime: 25,
    effect: (lvl) => ({ woodProd: 10 + lvl * 8 })
  },
  claypit: {
    id: 'claypit',
    name: 'معدن خاک',
    icon: '⛏️',
    desc: 'تولید خاک رس را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 80, clay: 40, iron: 80, crop: 50 },
    costFactor: 1.5,
    baseTime: 25,
    effect: (lvl) => ({ clayProd: 10 + lvl * 8 })
  },
  ironmine: {
    id: 'ironmine',
    name: 'معدن آهن',
    icon: '🔩',
    desc: 'تولید آهن را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 100, clay: 80, iron: 30, crop: 60 },
    costFactor: 1.5,
    baseTime: 25,
    effect: (lvl) => ({ ironProd: 10 + lvl * 8 })
  },
  farm: {
    id: 'farm',
    name: 'مزرعه',
    icon: '🌾',
    desc: 'تولید غذا و ظرفیت جمعیت را افزایش می‌دهد.',
    maxLevel: 20,
    baseCost: { wood: 70, clay: 90, iron: 70, crop: 20 },
    costFactor: 1.5,
    baseTime: 25,
    effect: (lvl) => ({ cropProd: 10 + lvl * 8, popCap: 10 + lvl * 5 })
  },
  residence: {
    id: 'residence',
    name: 'اقامتگاه',
    icon: '🏠',
    desc: 'ظرفیت جمعیت را افزایش می‌دهد و امکان ساخت دهکده جدید را فراهم می‌کند.',
    maxLevel: 20,
    baseCost: { wood: 120, clay: 150, iron: 150, crop: 80 },
    costFactor: 1.55,
    baseTime: 55,
    effect: (lvl) => ({ popCap: 20 + lvl * 15 })
  },
  tower: {
    id: 'tower',
    name: 'برج مراقبت',
    icon: '🗼',
    desc: 'محدوده دید روی نقشه و هشدار حمله را افزایش می‌دهد.',
    maxLevel: 15,
    baseCost: { wood: 100, clay: 80, iron: 120, crop: 40 },
    costFactor: 1.55,
    baseTime: 40,
    effect: (lvl) => ({ vision: 3 + lvl })
  }
};

// Positions on the village map (percentage based, approximate from the image style)
const BUILDING_POSITIONS = {
  main:       { x: 48, y: 28 },
  barracks:   { x: 35, y: 22 },
  academy:    { x: 62, y: 20 },
  warehouse:  { x: 28, y: 38 },
  granary:    { x: 70, y: 35 },
  wall:       { x: 50, y: 8  }, // top
  market:     { x: 22, y: 25 },
  woodcutter: { x: 18, y: 55 },
  claypit:    { x: 32, y: 62 },
  ironmine:   { x: 55, y: 65 },
  farm:       { x: 72, y: 58 },
  residence:  { x: 45, y: 48 },
  tower:      { x: 78, y: 25 }
};

const UNITS = {
  spearman: {
    id: 'spearman',
    name: 'نیزه‌دار',
    icon: '🗡️',
    desc: 'نیروی پیاده پایه. خوب در دفاع در برابر سواره.',
    cost: { wood: 50, clay: 30, iron: 20, crop: 15 },
    time: 40, // base seconds
    attack: 10,
    defenseInf: 15,
    defenseCav: 45,
    speed: 7,
    carry: 25,
    pop: 1,
    req: { barracks: 1 }
  },
  swordsman: {
    id: 'swordsman',
    name: 'شمشیرزن',
    icon: '⚔️',
    desc: 'پیاده قوی در حمله.',
    cost: { wood: 40, clay: 50, iron: 60, crop: 20 },
    time: 55,
    attack: 25,
    defenseInf: 35,
    defenseCav: 15,
    speed: 6,
    carry: 20,
    pop: 1,
    req: { barracks: 3, research: 'iron_weapons' }
  },
  archer: {
    id: 'archer',
    name: 'کماندار',
    icon: '🏹',
    desc: 'حمله از فاصله. خوب در دفاع.',
    cost: { wood: 80, clay: 40, iron: 30, crop: 25 },
    time: 50,
    attack: 15,
    defenseInf: 25,
    defenseCav: 10,
    speed: 8,
    carry: 15,
    pop: 1,
    req: { barracks: 5, research: 'archery' }
  },
  cavalry: {
    id: 'cavalry',
    name: 'سواره‌نظام',
    icon: '🐴',
    desc: 'سریع و قدرتمند در حمله.',
    cost: { wood: 120, clay: 100, iron: 150, crop: 80 },
    time: 90,
    attack: 55,
    defenseInf: 20,
    defenseCav: 30,
    speed: 16,
    carry: 50,
    pop: 3,
    req: { barracks: 8, research: 'horse_breeding' }
  },
  catapult: {
    id: 'catapult',
    name: 'منجنیق',
    icon: '🏰',
    desc: 'برای تخریب ساختمان‌های دشمن.',
    cost: { wood: 300, clay: 250, iron: 200, crop: 100 },
    time: 150,
    attack: 5,
    defenseInf: 10,
    defenseCav: 5,
    speed: 4,
    carry: 0,
    pop: 6,
    siege: 40,
    req: { barracks: 10, research: 'siege' }
  }
};

const RESEARCH = {
  iron_weapons: {
    id: 'iron_weapons',
    name: 'سلاح‌های آهنی',
    icon: '⚒️',
    desc: 'باز کردن شمشیرزن و افزایش حمله پیاده‌نظام.',
    cost: { wood: 200, clay: 150, iron: 300, crop: 100 },
    time: 120,
    req: { academy: 1 },
    effect: { attackBonus: 0.1 }
  },
  archery: {
    id: 'archery',
    name: 'تیراندازی',
    icon: '🎯',
    desc: 'باز کردن کماندار.',
    cost: { wood: 250, clay: 180, iron: 150, crop: 80 },
    time: 100,
    req: { academy: 3 },
    effect: {}
  },
  horse_breeding: {
    id: 'horse_breeding',
    name: 'پرورش اسب',
    icon: '🐎',
    desc: 'باز کردن سواره‌نظام.',
    cost: { wood: 300, clay: 250, iron: 200, crop: 200 },
    time: 180,
    req: { academy: 5, iron_weapons: true },
    effect: { cavSpeed: 0.1 }
  },
  siege: {
    id: 'siege',
    name: 'مهندسی محاصره',
    icon: '💥',
    desc: 'باز کردن منجنیق.',
    cost: { wood: 400, clay: 350, iron: 300, crop: 150 },
    time: 240,
    req: { academy: 8 },
    effect: {}
  },
  armor: {
    id: 'armor',
    name: 'زره‌پوشی',
    icon: '🛡️',
    desc: 'افزایش دفاع همه نیروها.',
    cost: { wood: 200, clay: 250, iron: 280, crop: 120 },
    time: 150,
    req: { academy: 4 },
    effect: { defenseBonus: 0.12 }
  },
  logistics: {
    id: 'logistics',
    name: 'لجستیک',
    icon: '📦',
    desc: 'افزایش ظرفیت حمل غنیمت.',
    cost: { wood: 180, clay: 180, iron: 150, crop: 100 },
    time: 90,
    req: { academy: 2 },
    effect: { carryBonus: 0.2 }
  }
};

// Helper to calculate cost for a level
function getBuildingCost(buildingId, level) {
  const b = BUILDINGS[buildingId];
  if (!b) return null;
  const factor = Math.pow(b.costFactor, level - 1);
  return {
    wood: Math.floor(b.baseCost.wood * factor),
    clay: Math.floor(b.baseCost.clay * factor),
    iron: Math.floor(b.baseCost.iron * factor),
    crop: Math.floor(b.baseCost.crop * factor)
  };
}

function getBuildingTime(buildingId, level, mainLevel = 1) {
  const b = BUILDINGS[buildingId];
  const factor = Math.pow(1.5, level - 1);
  const mainBonus = 1 + (mainLevel - 1) * 0.05;
  return Math.floor((b.baseTime * factor) / mainBonus);
}
