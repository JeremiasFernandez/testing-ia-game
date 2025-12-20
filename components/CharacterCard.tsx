import React from 'react';
import { Character } from '@/types';
import XPBar from '@/components/XPBar';
import { getRarityColor, COSMETICS } from '@/utils/game';

export const CharacterCard: React.FC<{ 
  character: Character, 
  onClick: (c: Character) => void,
  compact?: boolean 
}> = ({ character, onClick, compact }) => {
  const rarityClass = getRarityColor(character.rarity);
  const isSpecial = character.rarity !== 'Normal';
  
  // Use character's theme or fallback to default
  const theme = character.theme || { 
    border: 'from-indigo-400 to-purple-500', 
    bar: 'from-indigo-500 to-purple-600', 
    badge: 'bg-indigo-600' 
  };

  // Get equipped cosmetics
  const equippedCosmetics = character.equippedCosmetics || [];
  const cosmeticEmojis = equippedCosmetics
    .map(id => COSMETICS.find(c => c.id === id)?.emoji)
    .filter(Boolean);

  return (
    <div 
      onClick={() => onClick(character)}
      className={`relative bg-slate-800 rounded-xl overflow-hidden border ${isSpecial ? 'border-2' : 'border'} border-slate-700 shadow-lg transition-all hover:scale-[1.03] cursor-pointer group ${compact ? 'p-3' : 'p-5'}`}
      style={{
        borderImage: `linear-gradient(135deg, var(--tw-gradient-stops)) 1`,
        borderImageSlice: 1,
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.border} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`}></div>
      {isSpecial && (
        <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-gradient-to-r ${rarityClass} text-[8px] font-black text-white uppercase tracking-widest shadow-lg z-10`}>
          {character.rarity}
        </div>
      )}
      <div className="flex items-center gap-4 relative z-[1]">
        <div className="relative">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${theme.border} opacity-60 blur-sm`}></div>
          <img 
            src={character.avatarUrl} 
            alt={character.name} 
            className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} rounded-full border-2 border-slate-700 object-cover relative z-[1]`}
          />
          {/* Cosméticos Equipados */}
          {cosmeticEmojis.length > 0 && (
            <div className={`absolute -top-2 -right-2 flex flex-wrap gap-0.5 max-w-[70px] z-[3]`}>
              {cosmeticEmojis.map((emoji, idx) => (
                <div
                  key={idx}
                  className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-[10px] border border-amber-300 shadow-lg"
                  title={`Cosmético equipado`}
                >
                  {emoji}
                </div>
              ))}
            </div>
          )}
          <div className={`absolute -bottom-1 -right-1 ${theme.badge} text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-slate-800 z-[2]`}>
            Lv{character.level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg truncate ${isSpecial ? 'text-white' : 'text-slate-200'}`}>{character.name}</h3>
          <p className="text-slate-500 text-xs truncate italic">División {character.division}</p>
          <XPBar character={character} themeBar={theme.bar} />
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
