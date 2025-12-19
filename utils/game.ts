import { CharacterRarity } from '@/types';

export const FAVOR_PROB_BOOST = 0.05;
export const INSPIRED_PROB_BOOST = 0.05;
export const WORLD_DUEL_COST = 20;
export const WORLD_DUEL_REWARD = 80;
export const FAVOR_COST = 20;
export const CHAR_COST = 50;
export const TOURNEY_COST = 300;
export const LEAGUE_RESET_LIMIT = 100;

export const DIV2_COST = 1000;
export const DIV3_COST = 2000;

export const SHOP_OFFERS = [
  { level: 3, price: 300 },
  { level: 4, price: 600 },
  { level: 5, price: 1200 },
  { level: 6, price: 3200 },
  { level: 7, price: 6400 },
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
