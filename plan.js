/* Farm Plan logic that is not about recipes: coordinates, the AFK range check, what built farms
   produce, Litematica material lists, the build order and the plan link. Plain script like
   recipes.js: window.FarmPlan in the browser, module.exports in Node (tests in tools/farm-plan). */
(function (root) {
  'use strict';

  /* ---------- coordinates ---------- */
  const DIM_IDS = { 'minecraft:overworld': 'overworld', 'minecraft:the_nether': 'nether', 'minecraft:the_end': 'end' };
  const NUM = '(-?\\d+(?:\\.\\d+)?)';
  const F3C = new RegExp(`/execute in (\\S+) run tp @s ${NUM} ${NUM} ${NUM}`);
  /* F3+C output, "x y z", "x, y, z" or "X: 1 Y: 2 Z: 3". Returns { x, y, z, dim? } in whole blocks, or null. */
  function parseCoords(text) {
    const s = String(text == null ? '' : text).trim();
    if (!s) return null;
    const m = s.match(F3C);
    if (m) {
      const dim = DIM_IDS[m[1]] || '';
      return Object.assign({ x: Math.floor(+m[2]), y: Math.floor(+m[3]), z: Math.floor(+m[4]) }, dim ? { dim } : {});
    }
    const nums = s.replace(/[xyz]\s*[:=]/gi, ' ').match(/-?\d+(?:\.\d+)?/g);
    if (!nums || nums.length !== 3) return null;
    const [x, y, z] = nums.map((n) => Math.floor(+n));
    if (y < -64 || y > 320) return null;
    return { x, y, z };
  }
  /* The matching spot in the other dimension, for the portal. The End has none. */
  function otherSide(p) {
    if (!p || !Number.isFinite(p.x)) return null;
    if (p.dim === 'nether') return { dim: 'overworld', x: p.x * 8, y: p.y, z: p.z * 8 };
    if (p.dim === 'end') return null;
    return { dim: 'nether', x: Math.floor(p.x / 8), y: p.y, z: Math.floor(p.z / 8) };
  }

  /* ---------- AFK range ----------
     Mob farms need their spawning spaces inside the 128-block sphere around you (mobs further away
     despawn at once) and nothing spawns within 24 blocks. Everything else (villagers, golems,
     crops, redstone) only needs its chunks inside the simulation distance. Rules from the Minecraft
     wiki (Spawn, Chunk); the farm's coordinates are one point, so a big farm near a limit is
     shown as "edge". */
  const MOB_FARMS = new Set(['enderman-farm', 'witch-farm', 'slime-farm', 'creeper-farm', 'raid-farm',
    'wither-skeleton-farm', 'hoglin-farm', 'gold-farm']);
  const DESPAWN = 128, NO_SPAWN = 24, EDGE_BLOCKS = 16;
  function afkCheck(farmId, at, afk, sim) {
    if (!at || !afk) return null;
    sim = Math.max(2, Math.min(32, Math.round(Number(sim) || 12)));
    if ((at.dim || 'overworld') !== (afk.dim || 'overworld')) return { state: 'stops', why: 'Other dimension: not loaded while you stand here' };
    const dx = at.x - afk.x, dy = at.y - afk.y, dz = at.z - afk.z;
    const dist = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
    const chunks = Math.max(Math.abs(Math.floor(at.x / 16) - Math.floor(afk.x / 16)), Math.abs(Math.floor(at.z / 16) - Math.floor(afk.z / 16)));
    const base = { dist, chunks, mob: MOB_FARMS.has(farmId) };
    if (chunks > sim) return Object.assign(base, { state: 'stops', why: `${chunks} chunks away, past your simulation distance of ${sim}` });
    if (base.mob) {
      if (dist > DESPAWN) return Object.assign(base, { state: 'stops', why: `${dist} blocks away: mobs despawn past 128` });
      if (dist > DESPAWN - EDGE_BLOCKS) return Object.assign(base, { state: 'edge', why: `${dist} blocks away: part of it may be past 128` });
      if (dist < NO_SPAWN) return Object.assign(base, { state: 'edge', why: `${dist} blocks away: nothing spawns within 24 of you` });
    }
    if (chunks >= sim - 1) return Object.assign(base, { state: 'edge', why: `${chunks} chunks away, at the edge of your simulation distance` });
    return Object.assign(base, { state: 'runs', why: base.mob ? `${dist} blocks away, inside 128` : `${chunks} chunk${chunks === 1 ? '' : 's'} away` });
  }

  /* ---------- what farms produce ----------
     Keys are farm ids in farms.json, or build ids in world.json for builds that are not one of
     the 19 farms. A trailing or leading * matches any colour or kind. */
  const PRODUCES = {
    'iron-farm': ['iron_ingot', 'raw_iron', 'iron_nugget', 'poppy'],
    'cobblestone-farm': ['cobblestone'],
    'enderman-farm': ['ender_pearl'],
    'witch-farm': ['redstone', 'glowstone_dust', 'sugar', 'gunpowder', 'glass_bottle', 'spider_eye', 'stick'],
    'slime-farm': ['slime_ball'],
    'creeper-farm': ['gunpowder'],
    'sugarcane-farm': ['sugar_cane'],
    'raid-farm': ['emerald', 'totem_of_undying', 'redstone', 'glowstone_dust', 'gunpowder', 'sugar'],
    'bamboo-farm': ['bamboo'],
    'wool-farm': ['*_wool'],
    'moss-farm': ['moss_block'],
    'sand-duper': ['sand'],
    'concrete-powder-duper': ['*_concrete_powder'],
    'honey-farm': ['honey_bottle', 'honeycomb'],
    'shulker-farm': ['shulker_shell'],
    'wither-skeleton-farm': ['coal', 'bone', 'wither_skeleton_skull'],
    'hoglin-farm': ['porkchop', 'cooked_porkchop', 'leather'],
    'gold-farm': ['gold_nugget', 'gold_ingot', 'rotten_flesh'],
    'mob-farm': ['string', 'bone', 'bone_meal', 'gunpowder', 'arrow', 'rotten_flesh', 'spider_eye'],
    'snow-farm': ['snowball', 'snow_block'],
    'cactus-farm': ['cactus', 'green_dye'],
    'crop-farm': ['carrot', 'potato', 'nether_wart'],
  };
  const matches = (pat, id) => pat === id || (pat.startsWith('*') && id.endsWith(pat.slice(1))) || (pat.endsWith('*') && id.startsWith(pat.slice(0, -1)));
  /* producers: [{ id, name }] of builds he has. Returns item id → [names], or [] when none. */
  function suppliersOf(itemId, producers) {
    return producers.filter((p) => (PRODUCES[p.id] || []).some((pat) => matches(pat, itemId))).map((p) => p.name);
  }

  /* ---------- Litematica's material list ----------
     "Write to file" writes an ASCII table (| Item | Total | Missing | Available |), the CSV option
     writes "Item","Total",…. Also takes "64 x Hopper" and "Hopper: 64" lines. normalize turns a
     name into an item id (FarmRecipes.normalize). */
  function itemIdOf(name, normalize) {
    let s = String(name).trim().toLowerCase().replace(/['’]/g, ' ').replace(/\s+/g, ' ');
    const block = s.match(/^block of (.+)$/);
    if (block) s = `${block[1]} block`;
    if (s === 'redstone dust') s = 'redstone';
    return normalize(s);
  }
  function parseMaterialList(text, normalize) {
    const out = new Map();
    const put = (name, n) => {
      const c = Math.round(Number(String(n).replace(/[,\s]/g, '')));
      if (!name || !Number.isFinite(c) || c <= 0) return;
      const id = itemIdOf(name, normalize);
      if (!id || /^(item|total|items?)$/.test(id)) return;
      out.set(id, (out.get(id) || 0) + c);
    };
    String(text || '').split(/\r?\n/).forEach((line) => {
      const l = line.trim();
      if (!l || /^[+\-=|\s]+$/.test(l)) return;
      if (l.startsWith('|')) { const c = l.split('|').map((x) => x.trim()); put(c[1], c[2]); return; }
      const csv = l.match(/^"?([^",]+)"?\s*,\s*"?([\d,]+)"?/);
      if (csv) { put(csv[1], csv[2]); return; }
      const times = l.match(/^([\d,]+)\s*[x×]\s+(.+?)(\s*\(.*\))?$/i);
      if (times) { put(times[2], times[1]); return; }
      const colon = l.match(/^(.+?)\s*[:=]\s*([\d,]+)\b/);
      if (colon) put(colon[1], colon[2]);
    });
    return [...out].map(([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count);
  }

  /* ---------- build order ----------
     A default order for a survival world: villagers and iron first, the simple resource farms,
     then the Nether farms once the Nether is open and the End farms once the End is. */
  const ORDER = [
    ['villager-breeder', 'Villagers run the iron farm and every trading hall, so they come first.'],
    ['iron-farm', 'Hoppers, rails and anvils all need iron, and most farms need hoppers.'],
    ['sugarcane-farm', 'Paper for rockets and for trading with librarians.'],
    ['cobblestone-farm', 'Stone for every build and smooth stone for slabs.'],
    ['bamboo-farm', 'Fuel for the smelters and bamboo for scaffolding.'],
    ['creeper-farm', 'Gunpowder for rockets, so you can fly.'],
    ['witch-farm', 'Redstone and glowstone for everything after this.'],
    ['slime-farm', 'Slime for sticky pistons and slime blocks.'],
    ['gold-farm', 'Gold and the fastest XP in the game.', 'nether'],
    ['hoglin-farm', 'Food and leather without a crop farm.', 'nether'],
    ['wither-skeleton-farm', 'Skulls for the Wither and a beacon.', 'nether'],
    ['enderman-farm', 'Ender pearls and XP for enchanting.', 'end'],
    ['shulker-farm', 'Shulker boxes: a whole chest in one slot.', 'end'],
    ['raid-farm', 'Totems and emeralds, once you can take on a raid.'],
    ['honey-farm', 'Honey blocks for flying machines.'],
    ['moss-farm', 'Moss and bone meal for building and composters.'],
    ['wool-farm', 'Wool for beds and banners.'],
    ['sand-duper', 'Sand for glass and concrete.'],
    ['concrete-powder-duper', 'Concrete powder for colourful builds.'],
  ];
  /* opts: { status(id) → '' | planned | building | built | skip, skip: [ids for "not now"],
     open: { nether: bool, end: bool }, known: Set of farm ids }. Returns { id, why } or null. */
  function nextFarm(opts) {
    const st = opts.status; const skip = new Set(opts.skip || []); const open = opts.open || {};
    const known = opts.known;
    const ok = (id) => (!known || known.has(id)) && !skip.has(id);
    const building = ORDER.find(([id]) => ok(id) && st(id) === 'building');
    if (building) return { id: building[0], why: `You started it. ${building[1]}` };
    const pick = ORDER.find(([id, , needs]) => ok(id) && !['built', 'skip'].includes(st(id)) && (!needs || open[needs]));
    if (pick) return { id: pick[0], why: pick[1] };
    const later = ORDER.find(([id]) => ok(id) && !['built', 'skip'].includes(st(id)));
    if (later) return { id: later[0], why: `${later[1]} Needs ${later[2] === 'end' ? 'the End' : 'the Nether'} open first.` };
    return null;
  }

  /* ---------- the plan link ----------
     The plan is a plain object of the stored keys. It travels as base64url JSON, deflated when
     the browser can (prefix "z"), plain otherwise (prefix "j"). */
  const PLAN_KEYS = ['status', 'got', 'design', 'installed', 'coords', 'afk', 'rates', 'mats', 'notNow', 'cmds'];
  const b64 = (bytes) => { let s = ''; bytes.forEach((b) => { s += String.fromCharCode(b); }); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const unb64 = (s) => { const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(bin, (c) => c.charCodeAt(0)); };
  async function pipe(bytes, Stream, mode) {
    const out = new Blob([bytes]).stream().pipeThrough(new Stream(mode));
    return new Uint8Array(await new Response(out).arrayBuffer());
  }
  function cleanPlan(p) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    const out = {};
    PLAN_KEYS.forEach((k) => {
      const v = p[k];
      if (v == null) return;
      if (k === 'cmds' || k === 'notNow') { if (Array.isArray(v)) out[k] = v; return; }
      if (typeof v === 'object' && !Array.isArray(v)) out[k] = v;
    });
    return Object.keys(out).length ? out : null;
  }
  async function packPlan(plan) {
    const bytes = new TextEncoder().encode(JSON.stringify(cleanPlan(plan) || {}));
    if (typeof CompressionStream === 'function') {
      try { return 'z' + b64(await pipe(bytes, CompressionStream, 'deflate-raw')); } catch (e) { /* fall through */ }
    }
    return 'j' + b64(bytes);
  }
  async function unpackPlan(code) {
    try {
      const s = String(code || '').trim();
      if (s.length < 2 || s.length > 200000) return null;
      let bytes = unb64(s.slice(1));
      if (s[0] === 'z') bytes = await pipe(bytes, DecompressionStream, 'deflate-raw');
      else if (s[0] !== 'j') return null;
      return cleanPlan(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e) { return null; }
  }

  const api = { parseCoords, otherSide, afkCheck, MOB_FARMS, PRODUCES, suppliersOf, parseMaterialList, itemIdOf, ORDER, nextFarm, PLAN_KEYS, packPlan, unpackPlan, cleanPlan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FarmPlan = api;
})(typeof window !== 'undefined' ? window : globalThis);
