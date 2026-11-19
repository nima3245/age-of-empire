// Units related UI helpers (mostly used by ui.js and app.js)
// This file mainly provides utility functions for army display

function formatUnitCost(unit) {
  return `🪵${unit.cost.wood} 🧱${unit.cost.clay} ⚙️${unit.cost.iron} 🌾${unit.cost.crop}`;
}

function canTrainUnit(player, unitId) {
  const u = UNITS[unitId];
  if (!u) return false;
  if (u.req.barracks && (player.buildings.barracks || 0) < u.req.barracks) return false;
  if (u.req.research && !player.research[u.req.research]) return false;
  return true;
}
