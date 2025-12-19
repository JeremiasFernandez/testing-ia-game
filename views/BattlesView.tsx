import React, { useState } from 'react';
import { Character } from '@/types';
import LeagueSection from '@/components/LeagueSection';
import { WORLD_DUEL_COST } from '@/utils/game';

export default function BattlesView({
  characters,
  unlockedDivisions,
  onStartRandomDuel,
  onStartWorldDuel,
  onStartDuel,
  onBuyDivision,
  onRemoveDivision,
}: {
  characters: Character[];
  unlockedDivisions: number;
  onStartRandomDuel: () => void;
  onStartWorldDuel: () => void;
  onStartDuel: (c1: Character, c2: Character) => void;
  onBuyDivision: (div: number) => void;
  onRemoveDivision: () => void;
}) {
  const [sel1, setSel1] = useState<string>('');
  const [sel2, setSel2] = useState<string>('');

  const fireManual = () => {
    const c1 = characters.find(c => c.id === sel1);
    const c2 = characters.find(c => c.id === sel2);
    if (c1 && c2 && c1.id !== c2.id) onStartDuel(c1, c2);
    else alert('Selecciona héroes distintos.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 py-10">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-black italic uppercase text-slate-100 tracking-tighter">Arena</h2>
          <div className="flex justify-center gap-3">
            <button onClick={onStartRandomDuel} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest transition-all"><i className="fa-solid fa-shuffle"></i> Aleatorio</button>
            <button onClick={onStartWorldDuel} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest transition-all">
              <div className="flex items-center gap-2"><i className="fa-solid fa-earth-americas"></i> Mundial</div>
              <span className="text-[8px] opacity-70 mt-1">Coste: {WORLD_DUEL_COST}</span>
            </button>
          </div>
        </div>
        <div className="bg-slate-800/50 p-8 rounded-[2rem] border border-slate-700 shadow-2xl space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Azul</label>
              <select value={sel1} onChange={e => setSel1(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none appearance-none cursor-pointer">
                <option value="">Seleccionar...</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name} (Lv {c.level})</option>)}
              </select>
            </div>
            <div className="flex justify-center relative"><div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center font-black text-slate-600 border-4 border-slate-800 z-10 text-lg italic">VS</div><div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full"></div></div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-1">Rojo</label>
              <select value={sel2} onChange={e => setSel2(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4 text-white font-bold outline-none appearance-none cursor-pointer">
                <option value="">Seleccionar...</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name} (Lv {c.level})</option>)}
              </select>
            </div>
          </div>
          <button onClick={fireManual} className="w-full bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/30 transition-all text-xl uppercase tracking-widest italic active:scale-95">¡BATALLA!</button>
        </div>
      </div>

      <div className="space-y-16">
        <LeagueSection characters={characters} div={1} />
        {unlockedDivisions >= 2 && <LeagueSection characters={characters} div={2} />}
        {unlockedDivisions >= 3 && <LeagueSection characters={characters} div={3} />}

        <div className="flex flex-col items-center gap-6 pt-10 border-t border-slate-800">
          {unlockedDivisions === 1 && (
            <button onClick={() => onBuyDivision(2)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-8 py-4 rounded-2xl font-black text-indigo-400 uppercase text-xs tracking-widest shadow-xl flex items-center gap-3">
              <i className="fa-solid fa-lock-open"></i> Desbloquear Segunda División (1000)
            </button>
          )}
          {unlockedDivisions === 2 && (
            <>
              <button onClick={() => onBuyDivision(3)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-8 py-4 rounded-2xl font-black text-indigo-400 uppercase text-xs tracking-widest shadow-xl flex items-center gap-3">
                <i className="fa-solid fa-lock-open"></i> Desbloquear Tercera División (2000)
              </button>
              <button onClick={onRemoveDivision} className="text-slate-600 hover:text-rose-400 text-[10px] font-black uppercase underline decoration-dashed">Eliminar Segunda División</button>
            </>
          )}
          {unlockedDivisions === 3 && (
            <button onClick={onRemoveDivision} className="text-slate-600 hover:text-rose-400 text-[10px] font-black uppercase underline decoration-dashed">Eliminar Tercera División</button>
          )}
        </div>
      </div>
    </div>
  );
}
