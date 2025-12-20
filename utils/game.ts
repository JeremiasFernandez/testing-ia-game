import { CharacterRarity, Cosmetic } from '@/types';

export const FAVOR_PROB_BOOST = 0.05;
export const INSPIRED_PROB_BOOST = 0.05;
export const WORLD_DUEL_COST = 20;
export const WORLD_DUEL_REWARD = 80;
export const FAVOR_COST = 20;
export const CHAR_COST = 50;
export const TOURNEY_COST = 300;
export const TOWER_COST = 100;
export const LEAGUE_RESET_LIMIT = 50;

export const DIV2_COST = 1000;
export const DIV3_COST = 2000;

export const SHOP_OFFERS = [
  { level: 3, price: 300 },
  { level: 4, price: 600 },
  { level: 5, price: 1200 },
  { level: 6, price: 3200 },
  { level: 7, price: 6400 },
];

export const COSMETICS: Cosmetic[] = [
  { id: 'helm_gold', name: 'Casco de Oro', type: 'helm', description: 'Un casco brillante y majestuoso', price: 500, emoji: '👑' },
  { id: 'helm_iron', name: 'Casco de Hierro', type: 'helm', description: 'Protección pesada y resistente', price: 300, emoji: '🛡️' },
  { id: 'helm_dragon', name: 'Cuerno de Dragón', type: 'helm', description: 'Intimidante y poderoso', price: 1200, emoji: '🐉' },
  { id: 'armor_gold', name: 'Armadura Dorada', type: 'armor', description: 'Brilla como el sol', price: 800, emoji: '✨' },
  { id: 'armor_shadow', name: 'Armadura Sombría', type: 'armor', description: 'Oscura y misteriosa', price: 700, emoji: '🌑' },
  { id: 'armor_crystal', name: 'Armadura de Cristal', type: 'armor', description: 'Transparente y mágica', price: 1500, emoji: '💎' },
  { id: 'weapon_flame', name: 'Espada Ardiente', type: 'weapon', description: 'Fuego envolvente', price: 900, emoji: '🔥' },
  { id: 'weapon_ice', name: 'Espada de Hielo', type: 'weapon', description: 'Frío abrasador', price: 900, emoji: '❄️' },
  { id: 'weapon_lightning', name: 'Espada de Rayo', type: 'weapon', description: 'Energía eléctrica', price: 1100, emoji: '⚡' },
  { id: 'cloak_crimson', name: 'Capa Carmesí', type: 'cloak', description: 'Dramática y elegante', price: 400, emoji: '🩸' },
  { id: 'cloak_royal', name: 'Capa Real', type: 'cloak', description: 'De la realeza', price: 600, emoji: '👸' },
  { id: 'cloak_void', name: 'Capa del Vacío', type: 'cloak', description: 'Borde del infinito', price: 1300, emoji: '🌀' },
  { id: 'aura_glory', name: 'Aura de Gloria', type: 'aura', description: 'Resplandor sagrado', price: 1000, emoji: '🌟' },
  { id: 'aura_shadow', name: 'Aura Oscura', type: 'aura', description: 'Poder maligno', price: 1000, emoji: '👹' },
  { id: 'aura_nature', name: 'Aura Natural', type: 'aura', description: 'Vínculo con la naturaleza', price: 800, emoji: '🌿' },
];

const REWARDS_BY_LEVEL: Record<number, number> = {
  1: 5, 2: 8, 3: 10, 4: 15, 5: 20, 6: 25, 7: 35, 8: 50, 9: 60, 10: 100, 11: 150, 12: 200
};

export const getRewardForLevel = (lv: number) => REWARDS_BY_LEVEL[lv] || (lv > 12 ? 200 + (lv - 12) * 20 : 5);

export const getRarityMultiplier = (rarity: CharacterRarity) => {
  switch (rarity) {
    case 'Excentrico': return 2;
    case 'Supremo': return 3;
    case 'Legendario': return 4;
    default: return 1;
  }
};

export const getRarityColor = (rarity: CharacterRarity) => {
  switch (rarity) {
    case 'Excentrico': return 'from-cyan-400 to-blue-500';
    case 'Supremo': return 'from-purple-400 to-pink-600';
    case 'Legendario': return 'from-amber-300 via-yellow-500 to-orange-600';
    default: return 'from-slate-400 to-slate-500';
  }
};

// Stadiums: capacity and costs per level
export const STADIUMS: Array<{ level: number; name: string; capacity: number; cost: number }> = [
  { level: 1, name: 'Campo', capacity: 200, cost: 0 },
  { level: 2, name: 'Plaza', capacity: 500, cost: 100 },
  { level: 3, name: 'Escenario', capacity: 1000, cost: 500 },
  { level: 4, name: 'Iglesia', capacity: 2000, cost: 600 },
  { level: 5, name: 'Estadio Libertador', capacity: 5000, cost: 1500 },
  { level: 6, name: 'Coliseo', capacity: 10000, cost: 5000 },
  { level: 7, name: 'Coliseo Definitivo', capacity: Number.MAX_SAFE_INTEGER, cost: 20000 }
];

export const getStadiumByLevel = (lv: number) => STADIUMS.find(s => s.level === lv) || STADIUMS[0];
