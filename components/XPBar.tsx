import React from 'react';
import { Character } from '@/types';
import { BASE_XP_NEEDED, XP_INCREMENT_PER_LEVEL } from '@/constants';

export const XPBar: React.FC<{ character: Character; themeBar?: string }> = ({ character, themeBar }) => {
  const xpNeeded = BASE_XP_NEEDED + (character.level - 1) * XP_INCREMENT_PER_LEVEL;
  const progress = (character.xp / xpNeeded) * 100;
  const barGradient = themeBar || 'from-indigo-500 to-purple-600';
  
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold">
        <span>XP: {character.xp} / {xpNeeded}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-600">
        <div 
          className={`bg-gradient-to-r ${barGradient} h-full transition-all duration-700 ease-out`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default XPBar;
