import React from 'react';
import { Character } from '@/types';

export const LeagueSection: React.FC<{ characters: Character[]; div: number }> = ({ characters, div }) => {
  const table = [...characters].filter(c => c.division === div).sort((a,b) => b.stats.leaguePoints - a.stats.leaguePoints);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <h3 className="text-2xl font-black text-slate-100 uppercase italic">División {div}</h3>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Puntos de Diferencia</span>
      </div>
      <div className="bg-slate-800/30 rounded-3xl overflow-hidden border border-slate-800">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-6 py-4">Rango</th>
              <th className="px-6 py-4">Héroe</th>
              <th className="px-6 py-4">Raridad</th>
              <th className="px-6 py-4 text-right">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {table.map((char, idx) => (
              <tr key={char.id} className="hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-4">
                  <span className={`w-6 h-6 rounded flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>{idx+1}</span>
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <img src={char.avatarUrl} className="w-8 h-8 rounded-full border border-slate-700" />
                  <span className="font-bold text-slate-100">{char.name}</span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{char.rarity}</td>
                <td className="px-6 py-4 text-right"><span className="font-black text-indigo-400">{char.stats.leaguePoints}</span></td>
              </tr>
            ))}
            {table.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-600 italic font-bold">Sin participantes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeagueSection;
