import React from 'react';
import { BattleRecord, Character } from '@/types';
import { getStadiumByLevel, STADIUMS } from '@/utils/game';

interface Celebrity {
  id: string;
  nombre: string;
  fama: number;
}

const getSeasonSentiment = (
  lastAudiences: number[],
  totalDuels: number,
  charWinStreaks: number,
  reputation: number
): string => {
  const avgAudience = lastAudiences.length
    ? lastAudiences.reduce((a, b) => a + b, 0) / lastAudiences.length
    : 0;

  const avgStreak = charWinStreaks / Math.max(1, lastAudiences.length);
  
  // Combinar métricas para el sentimiento
  const score = (avgAudience / 100) + (avgStreak / 2) + (reputation / 500);

  if (score < 1.5) return '❌ La temporada esta siendo aburrida para el público';
  if (score < 2.5) return '😕 La gente cuestiona el campeonato';
  if (score < 3.5) return '😐 La temporada esta siendo regular';
  if (score < 4.5) return '😊 Esta siendo una buena temporada';
  if (score < 5.5) return '🎉 Esta siendo una excelente temporada';
  return '🔥 La euforia es total';
};

export default function OrganizerView({
  stadiumLevel,
  reputation,
  coins,
  history,
  onUpgradeStadium,
  celebrities,
  totalDuelsCount,
  characters,
}: {
  stadiumLevel: number;
  reputation: number;
  coins: number;
  history: BattleRecord[];
  onUpgradeStadium: () => void;
  celebrities: Celebrity[];
  totalDuelsCount: number;
  characters: Character[];
}) {
  const stadium = getStadiumByLevel(stadiumLevel);
  const currentIndex = STADIUMS.findIndex(s => s.level === stadium.level);
  const isMaxLevel = currentIndex >= STADIUMS.length - 1;
  const next = !isMaxLevel ? STADIUMS[currentIndex + 1] : null;
  const lastAudiences = history
    .filter(h => typeof h.audience === 'number')
    .slice(0, 10)
    .map(h => h.audience as number);
  const avgAudience = lastAudiences.length
    ? Math.floor(lastAudiences.reduce((a, b) => a + b, 0) / lastAudiences.length)
    : 0;

  const charWinStreaks = characters.reduce((sum, c) => sum + (c.stats.currentWinStreak || 0), 0);
  const sentiment = getSeasonSentiment(lastAudiences, totalDuelsCount, charWinStreaks, reputation);
  const topCelebrities = totalDuelsCount > 0
    ? [...celebrities].sort((a, b) => b.fama - a.fama).filter(c => c.fama > 0)
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-100 uppercase italic border-b border-slate-800 pb-4 flex items-center gap-3">
        <i className="fa-solid fa-clipboard-list text-indigo-400"></i>
        Organizador
      </h2>

      <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 p-6 rounded-2xl border border-purple-700/50">
        <h3 className="text-2xl font-black text-slate-100 uppercase italic mb-3 flex items-center gap-2">
          <i className="fa-solid fa-chart-line text-purple-400"></i>
          Sentimiento de la Temporada
        </h3>
        <p className="text-lg font-bold text-purple-200">{sentiment}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-black text-slate-200 uppercase italic mb-4">Estadio</h3>
          <div className="space-y-2 text-slate-300 font-bold">
            <div><span className="text-slate-400">Nombre:</span> {stadium.name}</div>
            <div><span className="text-slate-400">Capacidad:</span> {stadium.capacity === Number.MAX_SAFE_INTEGER ? 'Ilimitada' : stadium.capacity}</div>
            <div className="mt-4 flex items-center gap-3">
                {(!isMaxLevel && next) ? (
                <>
                  <button
                    onClick={coins >= next.cost ? onUpgradeStadium : undefined}
                    className={`px-4 py-2 rounded-xl font-black uppercase italic transition-colors ${
                      coins >= next.cost
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                    title={coins >= next.cost ? `Costo: ${next.cost} monedas` : `Necesitas ${next.cost - coins} monedas más`}
                  >
                    Mejorar a {next.name} ({next.cost} monedas)
                  </button>
                  {coins < next.cost && (
                    <span className="text-amber-400 text-xs">❌ Insuficientes monedas</span>
                  )}
                </>
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

      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-black text-slate-200 uppercase italic mb-4 flex items-center gap-2">
          <i className="fa-solid fa-star text-amber-400"></i>
          Famosos que Miran la Liga
        </h3>
        {topCelebrities.length === 0 ? (
          <p className="text-slate-500 italic">Aún no hay famosos siguiendo tu liga...</p>
        ) : (
          <div className="space-y-3">
            {topCelebrities.map((celeb, idx) => (
              <div key={celeb.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-white text-xs">
                    #{idx + 1}
                  </div>
                  <span className="font-black text-slate-200 truncate">{celeb.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-fire text-amber-400"></i>
                  <span className="font-black text-amber-400 text-lg min-w-[2rem] text-right">{celeb.fama}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
