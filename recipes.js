/* Farm Plan recipe engine. Plain script: in the browser it sets window.FarmRecipes, in Node it is
   module.exports. Recipes are Java Edition crafting/smelting recipes, written as data:
   id: { out: <items per craft>, in: { ingredient: count per craft }, smelt?: true }
   Anything without a recipe is a base material (gathered, mined, dropped or traded). */
(function (root) {
  'use strict';

  const R = {};
  const add = (id, out, ins, extra) => { R[id] = Object.assign({ out, in: ins }, extra || {}); };

  /* ---------- wood: generic "planks"/"log" for recipes that take any wood ---------- */
  add('planks', 4, { log: 1 });
  add('stick', 4, { planks: 2 });
  add('wooden_slab', 6, { planks: 3 });
  add('crafting_table', 1, { planks: 4 });
  add('chest', 1, { planks: 8 });
  add('trapped_chest', 1, { chest: 1, tripwire_hook: 1 });
  add('tripwire_hook', 2, { iron_ingot: 1, stick: 1, planks: 1 });
  add('barrel', 1, { planks: 6, wooden_slab: 2 });
  add('note_block', 1, { planks: 8, redstone: 1 });
  add('jukebox', 1, { planks: 8, diamond: 1 });
  add('composter', 1, { wooden_slab: 7 });
  add('bookshelf', 1, { planks: 6, book: 3 });
  add('book', 1, { paper: 3, leather: 1 });
  add('paper', 3, { sugar_cane: 3 });
  add('lectern', 1, { wooden_slab: 4, bookshelf: 1 });
  add('ladder', 3, { stick: 7 });
  add('item_frame', 1, { stick: 8, leather: 1 });
  add('glow_item_frame', 1, { item_frame: 1, glow_ink_sac: 1 });
  add('painting', 1, { stick: 8, white_wool: 1 });
  add('bowl', 4, { planks: 3 });
  add('daylight_detector', 1, { glass: 3, quartz: 3, wooden_slab: 3 });
  add('campfire', 1, { stick: 3, coal: 1, log: 3 });
  add('soul_campfire', 1, { stick: 3, soul_sand: 1, log: 3 });
  add('torch', 4, { coal: 1, stick: 1 });
  add('soul_torch', 4, { coal: 1, stick: 1, soul_sand: 1 });
  add('bow', 1, { stick: 3, string: 3 });
  add('fishing_rod', 1, { stick: 3, string: 2 });
  add('armor_stand', 1, { stick: 6, smooth_stone_slab: 1 });
  add('scaffolding', 6, { bamboo: 6, string: 1 });

  const WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'pale_oak'];
  const NETHER_WOODS = ['crimson', 'warped'];
  const woodSet = (w, logId) => {
    add(`${w}_planks`, 4, { [logId]: 1 });
    add(`${w}_slab`, 6, { [`${w}_planks`]: 3 });
    add(`${w}_stairs`, 4, { [`${w}_planks`]: 6 });
    add(`${w}_fence`, 3, { [`${w}_planks`]: 4, stick: 2 });
    add(`${w}_fence_gate`, 1, { [`${w}_planks`]: 2, stick: 4 });
    add(`${w}_trapdoor`, 2, { [`${w}_planks`]: 6 });
    add(`${w}_door`, 3, { [`${w}_planks`]: 6 });
    add(`${w}_sign`, 3, { [`${w}_planks`]: 6, stick: 1 });
    add(`${w}_button`, 1, { [`${w}_planks`]: 1 });
    add(`${w}_pressure_plate`, 1, { [`${w}_planks`]: 2 });
  };
  WOODS.forEach((w) => {
    woodSet(w, `${w}_log`);
    add(`${w}_boat`, 1, { [`${w}_planks`]: 5 });
  });
  NETHER_WOODS.forEach((w) => woodSet(w, `${w}_stem`));
  add('bamboo_block', 1, { bamboo: 9 });
  woodSet('bamboo', 'bamboo_block');
  R.bamboo_planks = { out: 2, in: { bamboo_block: 1 } }; // bamboo block gives 2, not 4

  /* ---------- stone ---------- */
  add('stone', 1, { cobblestone: 1 }, { smelt: true });
  add('smooth_stone', 1, { stone: 1 }, { smelt: true });
  add('stone_bricks', 4, { stone: 4 });
  add('cobblestone_slab', 6, { cobblestone: 3 });
  add('cobblestone_stairs', 4, { cobblestone: 6 });
  add('cobblestone_wall', 6, { cobblestone: 6 });
  add('stone_slab', 6, { stone: 3 });
  add('stone_stairs', 4, { stone: 6 });
  add('smooth_stone_slab', 6, { smooth_stone: 3 });
  add('stone_brick_slab', 6, { stone_bricks: 3 });
  add('stone_brick_stairs', 4, { stone_bricks: 6 });
  add('stone_brick_wall', 6, { stone_bricks: 6 });
  add('stone_button', 1, { stone: 1 });
  add('stone_pressure_plate', 1, { stone: 2 });
  add('furnace', 1, { cobblestone: 8 });
  add('smoker', 1, { furnace: 1, log: 4 });
  add('blast_furnace', 1, { iron_ingot: 5, furnace: 1, smooth_stone: 3 });
  add('lever', 1, { stick: 1, cobblestone: 1 });
  add('cobbled_deepslate_slab', 6, { cobbled_deepslate: 3 });
  add('blackstone_slab', 6, { blackstone: 3 });

  /* ---------- redstone ---------- */
  add('redstone_torch', 1, { stick: 1, redstone: 1 });
  add('repeater', 1, { stone: 3, redstone_torch: 2, redstone: 1 });
  add('comparator', 1, { stone: 3, redstone_torch: 3, quartz: 1 });
  add('observer', 1, { cobblestone: 6, redstone: 2, quartz: 1 });
  add('piston', 1, { planks: 3, cobblestone: 4, iron_ingot: 1, redstone: 1 });
  add('sticky_piston', 1, { piston: 1, slime_ball: 1 });
  add('dropper', 1, { cobblestone: 7, redstone: 1 });
  add('dispenser', 1, { cobblestone: 7, bow: 1, redstone: 1 });
  add('hopper', 1, { iron_ingot: 5, chest: 1 });
  add('crafter', 1, { iron_ingot: 5, redstone: 2, crafting_table: 1, dropper: 1 });
  add('target', 1, { redstone: 4, hay_block: 1 });
  add('redstone_lamp', 1, { redstone: 4, glowstone: 1 });
  add('redstone_block', 1, { redstone: 9 });
  add('tnt', 1, { gunpowder: 5, sand: 4 });
  add('slime_block', 1, { slime_ball: 9 });
  add('honey_block', 1, { honey_bottle: 4 });
  add('hay_block', 1, { wheat: 9 });
  add('lightning_rod', 1, { copper_ingot: 3 });

  /* ---------- iron, gold, rails, carts ---------- */
  add('iron_block', 1, { iron_ingot: 9 });
  add('gold_block', 1, { gold_ingot: 9 });
  add('copper_block', 1, { copper_ingot: 9 });
  add('iron_nugget', 9, { iron_ingot: 1 });
  add('gold_nugget', 9, { gold_ingot: 1 });
  add('iron_bars', 16, { iron_ingot: 6 });
  add('iron_trapdoor', 1, { iron_ingot: 4 });
  add('iron_door', 3, { iron_ingot: 6 });
  add('heavy_weighted_pressure_plate', 1, { iron_ingot: 2 });
  add('light_weighted_pressure_plate', 1, { gold_ingot: 2 });
  add('chain', 1, { iron_nugget: 2, iron_ingot: 1 });
  add('lantern', 1, { iron_nugget: 8, torch: 1 });
  add('soul_lantern', 1, { iron_nugget: 8, soul_torch: 1 });
  add('cauldron', 1, { iron_ingot: 7 });
  add('anvil', 1, { iron_block: 3, iron_ingot: 4 });
  add('shears', 1, { iron_ingot: 2 });
  add('bucket', 1, { iron_ingot: 3 });
  add('water_bucket', 1, { bucket: 1 }, { fill: 'water' });
  add('lava_bucket', 1, { bucket: 1 }, { fill: 'lava' });
  add('powder_snow_bucket', 1, { bucket: 1 }, { fill: 'powder snow' });
  add('minecart', 1, { iron_ingot: 5 });
  add('hopper_minecart', 1, { hopper: 1, minecart: 1 });
  add('chest_minecart', 1, { chest: 1, minecart: 1 });
  add('tnt_minecart', 1, { tnt: 1, minecart: 1 });
  add('furnace_minecart', 1, { furnace: 1, minecart: 1 });
  add('rail', 16, { iron_ingot: 6, stick: 1 });
  add('powered_rail', 6, { gold_ingot: 6, stick: 1, redstone: 1 });
  add('detector_rail', 6, { iron_ingot: 6, stone_pressure_plate: 1, redstone: 1 });
  add('activator_rail', 6, { iron_ingot: 6, stick: 2, redstone_torch: 1 });

  /* ---------- glass, sand, misc blocks ---------- */
  add('glass', 1, { sand: 1 }, { smelt: true });
  add('glass_pane', 16, { glass: 6 });
  add('glass_bottle', 3, { glass: 3 });
  add('glowstone', 1, { glowstone_dust: 4 });
  add('sea_lantern', 1, { prismarine_shard: 4, prismarine_crystals: 5 });
  add('dried_kelp', 1, { kelp: 1 }, { smelt: true });
  add('dried_kelp_block', 1, { dried_kelp: 9 });
  add('snow_block', 1, { snowball: 4 });
  add('shulker_box', 1, { shulker_shell: 2, chest: 1 });
  add('lead', 2, { string: 4, slime_ball: 1 });
  add('jack_o_lantern', 1, { carved_pumpkin: 1, torch: 1 });
  add('ender_chest', 1, { obsidian: 8, ender_eye: 1 });
  add('ender_eye', 1, { ender_pearl: 1, blaze_powder: 1 });
  add('blaze_powder', 2, { blaze_rod: 1 });
  add('respawn_anchor', 1, { crying_obsidian: 6, glowstone: 3 });
  add('beehive', 1, { planks: 6, honeycomb: 3 });
  add('brewing_stand', 1, { blaze_rod: 1, cobblestone: 3 });
  add('flint_and_steel', 1, { iron_ingot: 1, flint: 1 });
  add('smithing_table', 1, { iron_ingot: 2, planks: 4 });
  add('stonecutter', 1, { iron_ingot: 1, stone: 3 });
  add('packed_ice', 1, { ice: 9 });
  add('moss_carpet', 3, { moss_block: 2 });
  add('polished_andesite', 4, { andesite: 4 });
  add('andesite_wall', 6, { andesite: 6 });
  add('stone_bricks', 4, { stone: 4 });
  add('stone_brick_slab', 6, { stone_bricks: 3 });
  add('chiseled_stone_bricks', 1, { stone_brick_slab: 2 });
  add('nether_brick', 1, { netherrack: 1 }, { smelt: true });
  add('nether_bricks', 1, { nether_brick: 4 });
  add('nether_brick_slab', 6, { nether_bricks: 3 });
  add('nether_brick_wall', 6, { nether_bricks: 6 });
  add('quartz_block', 1, { quartz: 4 });
  add('smooth_quartz', 1, { quartz_block: 1 }, { smelt: true });
  add('smooth_quartz_slab', 6, { smooth_quartz: 3 });
  add('smooth_quartz_stairs', 4, { smooth_quartz: 6 });
  add('polished_blackstone', 4, { blackstone: 4 });
  add('polished_blackstone_slab', 6, { polished_blackstone: 3 });
  add('polished_blackstone_wall', 6, { polished_blackstone: 6 });
  add('polished_blackstone_button', 1, { polished_blackstone: 1 });

  /* ---------- 16 colours: wool is gathered, beds, carpets and concrete powder are crafted ---------- */
  const COLORS = ['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray',
    'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'];
  COLORS.forEach((c) => {
    add(`${c}_bed`, 1, { [`${c}_wool`]: 3, planks: 3 });
    add(`${c}_carpet`, 3, { [`${c}_wool`]: 2 });
    add(`${c}_concrete_powder`, 8, { sand: 4, gravel: 4, [`${c}_dye`]: 1 });
    add(`${c}_stained_glass`, 8, { glass: 8, [`${c}_dye`]: 1 });
    add(`${c}_stained_glass_pane`, 16, { [`${c}_stained_glass`]: 6 });
    add(`${c}_concrete`, 1, { [`${c}_concrete_powder`]: 1 }); // powder touching water
    add(`${c}_shulker_box`, 1, { shulker_box: 1, [`${c}_dye`]: 1 });
  });

  /* ---------- naming, aliases, stack sizes ---------- */
  const ALIASES = {
    logs: 'log', wood: 'log', any_log: 'log', any_planks: 'planks', wooden_planks: 'planks',
    redstone_dust: 'redstone', nether_quartz: 'quartz', slimeball: 'slime_ball',
    iron: 'iron_ingot', gold: 'gold_ingot', copper: 'copper_ingot',
    bed: 'white_bed', sign: 'oak_sign', fence: 'oak_fence', fence_gate: 'oak_fence_gate',
    trapdoor: 'oak_trapdoor', button: 'stone_button', slab: 'stone_slab', wood_slab: 'wooden_slab',
    concrete_powder: 'white_concrete_powder', wool: 'white_wool', carpet: 'white_carpet',
    minecart_with_hopper: 'hopper_minecart', minecart_with_chest: 'chest_minecart',
    redstone_repeater: 'repeater', redstone_comparator: 'comparator', bars: 'iron_bars',
  };

  function normalize(raw) {
    if (raw == null) return '';
    let id = String(raw).trim().toLowerCase().replace(/^minecraft:/, '').replace(/[\s-]+/g, '_');
    if (ALIASES[id]) return ALIASES[id];
    if (!R[id] && id.endsWith('s')) {
      const single = id.endsWith('es') && R[id.slice(0, -2)] ? id.slice(0, -2) : id.slice(0, -1);
      if (R[single]) return single;
      if (ALIASES[single]) return ALIASES[single];
    }
    return id;
  }

  const NAMES = {
    log: 'Logs (any wood)', planks: 'Planks (any wood)', wooden_slab: 'Wooden Slabs (any wood)',
    quartz: 'Nether Quartz', tnt: 'TNT', tnt_minecart: 'Minecart with TNT',
    hopper_minecart: 'Minecart with Hopper', chest_minecart: 'Minecart with Chest',
    furnace_minecart: 'Minecart with Furnace', repeater: 'Redstone Repeater',
    comparator: 'Redstone Comparator', fabric_api: 'Fabric API', malilib: 'MaLiLib', jack_o_lantern: "Jack o'Lantern", ender_eye: 'Eye of Ender',
  };
  const SMALL = new Set(['of', 'and', 'with', 'the', 'o']);
  function prettyName(id) {
    const n = normalize(id);
    if (!n) return 'Unknown item';
    if (NAMES[n]) return NAMES[n];
    return n.split('_').filter(Boolean)
      .map((w, i) => (i > 0 && SMALL.has(w)) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const STACK_16 = new Set(['ender_pearl', 'egg', 'snowball', 'bucket', 'honey_bottle', 'armor_stand',
    'written_book', 'sign']);
  const STACK_1_EXACT = new Set(['water_bucket', 'lava_bucket', 'powder_snow_bucket', 'milk_bucket',
    'minecart', 'hopper_minecart', 'chest_minecart', 'tnt_minecart', 'furnace_minecart', 'bow',
    'crossbow', 'fishing_rod', 'shears', 'saddle', 'totem_of_undying', 'trident', 'elytra', 'shield',
    'potion', 'splash_potion', 'lingering_potion', 'cake', 'shulker_box', 'name_tag_never']);
  function stackSize(id) {
    const n = normalize(id);
    if (STACK_1_EXACT.has(n) || /_bed$|_boat$|_shulker_box$|_bucket$|_(sword|pickaxe|axe|shovel|hoe|helmet|chestplate|leggings|boots)$/.test(n)) return 1;
    if (STACK_16.has(n) || /_sign$|_hanging_sign$|_banner$/.test(n)) return 16;
    return 64;
  }

  /* "448 = 7 stacks", "70 = 1 stack + 6". Returns '' when it fits in less than one stack. */
  function stackText(count, id) {
    const s = stackSize(id);
    if (!Number.isFinite(count) || s <= 1 || count < s) return '';
    const st = Math.floor(count / s), rest = count % s;
    return `${st} stack${st === 1 ? '' : 's'}${rest ? ' + ' + rest : ''}${s !== 64 ? ` (of ${s})` : ''}`;
  }

  function isBase(id) { return !R[normalize(id)]; }

  /* height: 0 for base items, else 1 + the tallest ingredient. Consumers always sit higher than
     what they consume, so processing the tallest demand first sums every need for an item before
     it gets crafted (whole-craft rounding happens once per item, on the total). */
  const heights = {};
  function height(id, seen) {
    if (heights[id] != null) return heights[id];
    const r = R[id];
    if (!r) return (heights[id] = 0);
    seen = seen || new Set();
    if (seen.has(id)) return 0; // cycle guard: treat as base
    seen.add(id);
    let h = 0;
    for (const ing of Object.keys(r.in)) h = Math.max(h, height(ing, seen));
    seen.delete(id);
    return (heights[id] = h + 1);
  }

  /* Normalise a material list from farms.json: [{item, count}] → Map id → count.
     A count that isn't a positive number is kept as null ("count unknown") and never expanded. */
  function toDemand(list) {
    const demand = new Map(), unknown = [], order = [];
    (Array.isArray(list) ? list : []).forEach((m) => {
      if (!m) return;
      const id = normalize(typeof m === 'string' ? m : m.item);
      if (!id) return;
      const c = typeof m === 'string' ? 1 : Number(m.count);
      if (!Number.isFinite(c) || c <= 0) { if (!unknown.includes(id)) unknown.push(id); return; }
      if (!demand.has(id)) order.push(id);
      demand.set(id, (demand.get(id) || 0) + Math.ceil(c));
    });
    return { demand, unknown, order };
  }

  /* depth: 'placed' | 'ingredients' | 'raw'.
     Returns { items: [{ id, count|null, name, stack, base }], smelted: [ids], filled: [ids],
               leftovers: [{ id, count }] } */
  function expand(list, depth) {
    const { demand, unknown, order } = toDemand(list);
    const smelted = new Set(), filled = new Set(), leftovers = new Map();
    /* Broken down, every wood's planks are just planks: a stick or chest takes any kind. */
    const anyWood = (id) => depth !== 'placed' && /_planks$/.test(id) ? 'planks' : id;
    const craft = (id, need, into) => {
      const r = R[id];
      const crafts = Math.ceil(need / r.out);
      const extra = crafts * r.out - need;
      if (extra > 0) leftovers.set(id, (leftovers.get(id) || 0) + extra);
      if (r.smelt) smelted.add(id);
      if (r.fill) filled.add(id);
      for (const [ing, n] of Object.entries(r.in)) into.set(anyWood(ing), (into.get(anyWood(ing)) || 0) + crafts * n);
    };

    /* ingredients: what goes into a crafting table. Everything crafted is broken down, but it stops
       at planks, smelted items and filled buckets. raw goes all the way down. */
    const stop = depth === 'ingredients' ? (id) => id === 'planks' || R[id].smelt || R[id].fill : () => false;
    let result;
    if (depth === 'ingredients' || depth === 'raw') {
      result = new Map();
      for (const [id, n] of demand) result.set(anyWood(id), (result.get(anyWood(id)) || 0) + n);
      for (;;) {
        let pick = null, ph = 0;
        for (const id of result.keys()) {
          if (!R[id] || stop(id)) continue;
          const h = height(id);
          if (h > ph) { ph = h; pick = id; }
        }
        if (!pick) break;
        const need = result.get(pick);
        result.delete(pick);
        craft(pick, need, result);
      }
      for (const id of result.keys()) {
        if (R[id] && R[id].smelt) smelted.add(id);
        if (R[id] && R[id].fill) filled.add(id);
      }
    } else {
      result = demand;
    }

    let ids = [...result.keys()];
    if (depth === 'placed') ids = order.filter((id) => result.has(id));
    else ids.sort((a, b) => result.get(b) - result.get(a) || prettyName(a).localeCompare(prettyName(b)));

    const items = ids.map((id) => ({ id, count: result.get(id), name: prettyName(id), stack: stackText(result.get(id), id), base: !R[id] }));
    unknown.filter((id) => !result.has(id)).forEach((id) => items.push({ id, count: null, name: prettyName(id), stack: '', base: !R[id] }));
    return {
      items,
      smelted: [...smelted],
      filled: [...filled],
      leftovers: [...leftovers].map(([id, count]) => ({ id, count, name: prettyName(id) })),
    };
  }

  const api = { RECIPES: R, expand, normalize, prettyName, stackSize, stackText, isBase, COLORS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FarmRecipes = api;
})(typeof window !== 'undefined' ? window : globalThis);
