import React, { useMemo, useEffect, useState } from 'react';
import { Character } from '@/types';
import { FAVOR_PROB_BOOST, INSPIRED_PROB_BOOST } from '@/utils/game';
import { LEVEL_PROB_BOOST, SKILL_PROB_BOOST } from '@/constants';

type Opponent = Character | { name: string, level: number, avatarUrl: string, skills: any[] };

export const BattleModal: React.FC<{
  char1: Character;
  char2: Opponent;
  onFinish: (winnerId: string, score1: number, score2: number) => void;
  onClose: () => void;
  title?: string;
  favorId?: string | null;
}> = ({ char1, char2, onFinish, onClose, title = '¡Enfrentamiento!', favorId }) => {
  const [rounds, setRounds] = useState<{ winner: 1 | 2 }[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  const inspiredSide = useMemo(() => {
    if (Math.random() < 0.05) return Math.random() < 0.5 ? 1 : 2;
    return null;
  }, []);

  const prob1 = useMemo(() => {
    const levelDiff = (char1.level - char2.level) * LEVEL_PROB_BOOST;
    const skillDiff = (char1.skills.length - (char2 as any)?.skills?.length || 0) * SKILL_PROB_BOOST;
    let prob = 0.5 + levelDiff + skillDiff;

    if (favorId === char1.id) prob += FAVOR_PROB_BOOST;
    if (favorId && 'id' in char2 && favorId === (char2 as Character).id) prob -= FAVOR_PROB_BOOST;

    if (inspiredSide === 1) prob += INSPIRED_PROB_BOOST;
    if (inspiredSide === 2) prob -= INSPIRED_PROB_BOOST;

    return Math.max(0.1, Math.min(0.9, prob));
  }, [char1, char2, favorId, inspiredSide]);

  useEffect(() => {
    let wins1 = 0;
    let wins2 = 0;
    const results: { winner: 1 | 2 }[] = [];

    const simulate = async () => {
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 600));
        const roundWinner = Math.random() < prob1 ? 1 : 2;
        results.push({ winner: roundWinner });
        if (roundWinner === 1) wins1++; else wins2++;
        setRounds([...results]);
        setCurrentRound(i + 1);
        if (wins1 === 3 || wins2 === 3) break;
      }
      await new Promise(r => setTimeout(r, 800));
      const winnerId = wins1 > wins2 ? char1.id : ('id' in char2 ? (char2 as Character).id : 'NPC_PLAYER');
      onFinish(winnerId, wins1, wins2);
    };
    simulate();
  }, []);

  const wins1 = rounds.filter(r => r.winner === 1).length;
  const wins2 = rounds.filter(r => r.winner === 2).length;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 text-center">
          <h2 className="text-3xl font-black mb-8 text-indigo-400 italic uppercase tracking-widest">{title}</h2>

          <div className="flex justify-between items-center gap-4">
            <div className={`flex-1 transition-all duration-500 ${wins1 > wins2 ? 'scale-110' : 'opacity-60'}`}>
              <div className="relative inline-block">
                <img src={char1.avatarUrl} className="w-24 h-24 rounded-full mx-auto border-4 border-indigo-500 mb-3 shadow-lg shadow-indigo-500/20" />
                {inspiredSide === 1 && <span className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-lg animate-pulse">¡INSPIRADO!</span>}
              </div>
              <h4 className="font-bold text-xl text-white">{char1.name}</h4>
              <p className="text-indigo-400 font-black text-2xl mt-2">{wins1}</p>
              {favorId === char1.id && <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-black uppercase">Favorecido</span>}
            </div>
            <div className="text-5xl font-black text-slate-800 animate-pulse italic">VS</div>
            <div className={`flex-1 transition-all duration-500 ${wins2 > wins1 ? 'scale-110' : 'opacity-60'}`}>
              <div className="relative inline-block">
                <img src={(char2 as any).avatarUrl} className="w-24 h-24 rounded-full mx-auto border-4 border-rose-500 mb-3 shadow-lg shadow-rose-500/20" />
                {inspiredSide === 2 && <span className="absolute -top-2 -right-2 bg-yellow-500 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-lg animate-pulse">¡INSPIRADO!</span>}
              </div>
              <h4 className="font-bold text-xl text-white">{(char2 as any).name}</h4>
              <p className="text-rose-400 font-black text-2xl mt-2">{wins2}</p>
              {favorId && 'id' in char2 && favorId === (char2 as Character).id && <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-black uppercase">Favorecido</span>}
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-4">
            {[0, 1, 2, 3, 4].map(idx => (
              <div key={idx} className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black border-2 transition-all duration-500 ${
                  rounds[idx] 
                    ? rounds[idx].winner === 1 
                      ? 'bg-indigo-600 border-indigo-400 text-white rotate-3 shadow-lg shadow-indigo-600/30' 
                      : 'bg-rose-600 border-rose-400 text-white -rotate-3 shadow-lg shadow-rose-600/30'
                    : idx === currentRound && idx < 5
                      ? 'border-indigo-500/50 animate-pulse bg-indigo-500/10'
                      : 'border-slate-800 bg-slate-900 text-slate-800'
                }`}
              > {idx + 1} </div>
            ))}
          </div>

          {(wins1 >= 3 || wins2 >= 3) && (
            <div className="mt-10 animate-in slide-in-from-bottom duration-500">
              <span className="bg-amber-500 text-slate-900 px-8 py-3 rounded-2xl font-black text-xl shadow-xl shadow-amber-500/20 uppercase italic">
                {wins1 > wins2 ? char1.name : (char2 as any).name} VICTORIA
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleModal;
