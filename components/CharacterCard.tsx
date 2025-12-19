import React from 'react';
import { Character } from '@/types';
import XPBar from '@/components/XPBar';
import { getRarityColor } from '@/utils/game';

export const CharacterCard: React.FC<{ 
  character: Character, 
  onClick: (c: Character) => void,
  compact?: boolean 
}> = ({ character, onClick, compact }) => {
  const rarityClass = getRarityColor(character.rarity);
  const isSpecial = character.rarity !== 'Normal';

  return (
    <div 
      onClick={() => onClick(character)}
      className={`relative bg-slate-800 rounded-xl overflow-hidden border ${isSpecial ? 'border-2' : 'border'} border-slate-700 shadow-lg transition-all hover:scale-[1.03] hover:border-indigo-500 cursor-pointer group ${compact ? 'p-3' : 'p-5'}`}
    >
      {isSpecial && (
        <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-gradient-to-r ${rarityClass} text-[8px] font-black text-white uppercase tracking-widest shadow-lg`}>
          {character.rarity}
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img 
            src={character.avatarUrl} 
            alt={character.name} 
            className={`${compact ? 'w-12 h-12' : 'w-20 h-20'} rounded-full border-2 ${isSpecial ? 'border-indigo-300 shadow-glow' : 'border-indigo-500'} object-cover group-hover:border-indigo-400 transition-colors`}
          />
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-slate-800">
            Lv{character.level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-lg truncate ${isSpecial ? 'text-white' : 'text-slate-200'}`}>{character.name}</h3>
          <p className="text-slate-500 text-xs truncate italic">División {character.division}</p>
          <XPBar character={character} />
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
