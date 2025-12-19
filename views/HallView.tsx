import React from 'react';
import { Character } from '@/types';

export default function HallView({ characters }: { characters: Character[] }) {
  const calculateWinrate = (c: Character) => {
    const total = c.stats.wins + c.stats.losses;
    if (total === 0) return 0;
    return ((c.stats.wins / total) * 100).toFixed(1);
  };

  const tables = [
    { title: 'Campeonatos', data: [...characters].sort((a,b) => b.stats.championshipsWon - a.stats.championshipsWon).slice(0, 5), stat: (c: Character) => c.stats.championshipsWon },
    { title: 'Victorias', data: [...characters].sort((a,b) => b.stats.wins - a.stats.wins).slice(0, 5), stat: (c: Character) => c.stats.wins },
    { title: 'Nivel Máximo', data: [...characters].sort((a,b) => b.level === a.level ? b.xp - a.xp : b.level - a.level).slice(0, 5), stat: (c: Character) => `Lv ${c.level}` },
    { title: 'Winrate', data: [...characters].filter(c => c.stats.wins + c.stats.losses > 0).sort((a,b) => (Number(calculateWinrate(b))) - (Number(calculateWinrate(a)))).slice(0, 5), stat: (c: Character) => `${calculateWinrate(c)}%` },
  ];

  return (
    <div className="space-y-12">
      <h2 className="text-3xl font-black text-slate-100 uppercase italic border-b border-slate-800 pb-4">Salón de la Fama</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tables.map((table, i) => (
          <div key={i} className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
            <h4 className="text-indigo-400 font-black text-[10px] uppercase tracking-widest mb-4 border-b border-slate-700 pb-2">{table.title}</h4>
            <div className="space-y-2">
              {table.data.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-600 font-black text-[10px] w-4">#{idx+1}</span>
                  <img src={c.avatarUrl} className="w-6 h-6 rounded-full border border-slate-700" />
                  <span className="text-[11px] font-bold text-slate-300 truncate flex-1">{c.name}</span>
                  <span className="text-indigo-400 font-black text-[11px]">{(table.stat as any)(c)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
