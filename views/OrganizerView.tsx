import React from 'react';
import { BattleRecord } from '@/types';
import { getStadiumByLevel, STADIUMS } from '@/utils/game';

export default function OrganizerView({
  stadiumLevel,
  reputation,
  coins,
  history,
  onUpgradeStadium,
}: {
  stadiumLevel: number;
  reputation: number;
  coins: number;
  history: BattleRecord[];
  onUpgradeStadium: () => void;
}) {
  const stadium = getStadiumByLevel(stadiumLevel);
  const next = getStadiumByLevel(stadiumLevel + 1);
  const lastAudiences = history
    .filter(h => typeof h.audience === 'number')
    .slice(0, 10)
    .map(h => h.audience as number);
  const avgAudience = lastAudiences.length
    ? Math.floor(lastAudiences.reduce((a, b) => a + b, 0) / lastAudiences.length)
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-100 uppercase italic border-b border-slate-800 pb-4 flex items-center gap-3">
        <i className="fa-solid fa-clipboard-list text-indigo-400"></i>
        Organizador
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-black text-slate-200 uppercase italic mb-4">Estadio</h3>
          <div className="space-y-2 text-slate-300 font-bold">
            <div><span className="text-slate-400">Nombre:</span> {stadium.name}</div>
            <div><span className="text-slate-400">Capacidad:</span> {stadium.capacity === Number.MAX_SAFE_INTEGER ? 'Ilimitada' : stadium.capacity}</div>
            <div className="mt-4 flex items-center gap-3">
              {next && next.level !== stadium.level ? (
                <button
                  onClick={onUpgradeStadium}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black uppercase italic hover:bg-indigo-500 transition-colors"
                  title={`Costo: ${next.cost} monedas`}
                  disabled={coins < next.cost}
                >
                  Mejorar a {next.name} ({next.cost} monedas)
                </button>
              ) : (
                <span className="text-slate-400">Nivel máximo alcanzado</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-black text-slate-200 uppercase italic mb-4">Reputación</h3>
          <div className="space-y-2 text-slate-300 font-bold">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-star text-amber-400"></i>
              <span>Reputación actual: {reputation}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-users text-indigo-400"></i>
              <span>Audiencia promedio (últimos 10 duelos): {avgAudience}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-black text-slate-200 uppercase italic mb-4">Niveles de Estadio</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STADIUMS.map(s => (
            <div key={s.level} className={`p-4 rounded-xl border ${s.level === stadiumLevel ? 'border-indigo-500 bg-indigo-950/30' : 'border-slate-700 bg-slate-900'}`}>
              <div className="font-black text-slate-200">{s.name}</div>
              <div className="text-slate-400 text-sm">Nivel {s.level}</div>
              <div className="text-slate-300 text-sm mt-1">Capacidad: {s.capacity === Number.MAX_SAFE_INTEGER ? 'Ilimitada' : s.capacity}</div>
              <div className="text-slate-300 text-sm">Costo: {s.cost}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
