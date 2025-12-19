import React from 'react';
import { Character, BattleRecord } from '@/types';

export default function StatsView({ characters, history }: { characters: Character[], history: BattleRecord[] }) {
  const calculateWinrate = (c: Character) => {
    const total = c.stats.wins + c.stats.losses;
    if (total === 0) return 0;
    return ((c.stats.wins / total) * 100).toFixed(1);
  };

  const calculateInvincibleStreak = (charId: string) => {
    let streak = 0;
    let maxStreak = 0;
    for (const record of [...history].reverse()) {
      if (record.char1Id === charId || record.char2Id === charId) {
        const won = record.winnerId === charId;
        if (won) {
          streak++;
          maxStreak = Math.max(maxStreak, streak);
        } else {
          streak = 0;
        }
      }
    }
    return maxStreak;
  };

  const getTopRivalVictories = () => {
    const rivalVictories: { [key: string]: { [key: string]: number } } = {};
    
    characters.forEach(c => {
      rivalVictories[c.id] = {};
      characters.forEach(opp => {
        if (opp.id !== c.id) {
          rivalVictories[c.id][opp.id] = 0;
        }
      });
    });

    history.forEach(record => {
      if (record.winnerId && record.char1Id && record.char2Id) {
        const loser = record.winnerId === record.char1Id ? record.char2Id : record.char1Id;
        const winner = record.winnerId;
        if (rivalVictories[winner] && rivalVictories[winner][loser] !== undefined) {
          rivalVictories[winner][loser]++;
        }
      }
    });

    return characters.map(c => {
      const maxVictoriesAgainst = Math.max(...Object.values(rivalVictories[c.id] || {}), 0);
      const rival = Object.entries(rivalVictories[c.id] || {}).find(([_, count]) => count === maxVictoriesAgainst)?.[0];
      const rivalName = characters.find(ch => ch.id === rival)?.name || '---';
      return { char: c, maxVictoriesAgainst, rivalName };
    });
  };

  const statTables = [
    { 
      title: 'Más Campeones', 
      data: [...characters].sort((a,b) => b.stats.championshipsWon - a.stats.championshipsWon), 
      stat: (c: Character) => c.stats.championshipsWon 
    },
    { 
      title: 'Más Victorias', 
      data: [...characters].sort((a,b) => b.stats.wins - a.stats.wins), 
      stat: (c: Character) => c.stats.wins 
    },
    { 
      title: 'Más Derrotas', 
      data: [...characters].sort((a,b) => b.stats.losses - a.stats.losses), 
      stat: (c: Character) => c.stats.losses 
    },
    { 
      title: 'Más Puntos Acumulados', 
      data: [...characters].sort((a,b) => b.stats.leaguePoints - a.stats.leaguePoints), 
      stat: (c: Character) => c.stats.leaguePoints 
    },
    { 
      title: 'Mayor Winrate', 
      data: [...characters].filter(c => c.stats.wins + c.stats.losses > 0).sort((a,b) => Number(calculateWinrate(b)) - Number(calculateWinrate(a))), 
      stat: (c: Character) => `${calculateWinrate(c)}%` 
    },
    { 
      title: 'Racha Invicta Más Larga', 
      data: [...characters].sort((a,b) => calculateInvincibleStreak(b.id) - calculateInvincibleStreak(a.id)), 
      stat: (c: Character) => `${calculateInvincibleStreak(c.id)} victorias` 
    },
    { 
      title: 'Torre del Terror', 
      data: [...characters].filter(c => c.stats.towerLevel > 0).sort((a,b) => b.stats.towerLevel - a.stats.towerLevel), 
      stat: (c: Character) => `Nivel ${c.stats.towerLevel}/10` 
    },
    { 
      title: 'Favorecido', 
      data: [...characters].sort((a,b) => b.stats.favoredCount - a.stats.favoredCount), 
      stat: (c: Character) => c.stats.favoredCount 
    },
  ];

  const topRivalVictories = getTopRivalVictories();

  const topPoints = [...characters]
    .sort((a, b) => b.stats.leaguePoints - a.stats.leaguePoints)
    .slice(0, 10);

  const totalFans = characters.reduce((sum, c) => sum + (c.stats.fans || 0), 0);

  return (
    <div className="space-y-12">
      <h2 className="text-3xl font-black text-slate-100 uppercase italic border-b border-slate-800 pb-4">Estadísticas</h2>

      {/* Stat Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statTables.map((table, i) => (
          <div key={i} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl">
            <h4 className="text-indigo-400 font-black text-[9px] uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">{table.title}</h4>
            <div className="space-y-1">
              {table.data.slice(0, 5).map((c, idx) => (
                <div key={c.id} className="flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-600 font-black text-[8px] w-3">#{idx+1}</span>
                  <img src={c.avatarUrl} className="w-5 h-5 rounded-full border border-slate-700" />
                  <span className="text-[10px] font-bold text-slate-300 truncate flex-1">{c.name}</span>
                  <span className="text-indigo-400 font-black text-[9px]">{(table.stat as any)(c)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top 10 Por Puntos con Últimos 5 Duelos */}
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <h4 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-6 border-b border-slate-700 pb-3">Top 10 - Puntos Acumulados</h4>
        <div className="space-y-3">
          {topPoints.map((c, idx) => (
            <div key={c.id} className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-black text-lg min-w-8">#{idx+1}</span>
              <img src={c.avatarUrl} className="w-10 h-10 rounded-full border-2 border-slate-700" />
              <div className="flex-1">
                <div className="font-bold text-slate-200">{c.name}</div>
                <div className="text-xs text-slate-400">Lv {c.level}</div>
              </div>
              
              {/* Últimos 5 duelos */}
              <div className="flex gap-1">
                {(c.stats.lastBattleResults || []).map((result, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded border border-slate-600 ${
                      result === 'win' ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  />
                ))}
              </div>

              <div className="text-right">
                <div className="font-black text-indigo-400 text-lg">{c.stats.leaguePoints}</div>
                <div className="text-xs text-slate-400">Puntos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Más Veces Venció a Su Rival */}
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <h4 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-6 border-b border-slate-700 pb-3">Más Veces Venció a Su Rival</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topRivalVictories
            .filter(r => r.maxVictoriesAgainst > 0)
            .sort((a, b) => b.maxVictoriesAgainst - a.maxVictoriesAgainst)
            .slice(0, 10)
            .map((r, idx) => (
              <div key={r.char.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <span className="text-slate-500 font-black text-lg min-w-6">#{idx+1}</span>
                <img src={r.char.avatarUrl} className="w-8 h-8 rounded-full border border-slate-700" />
                <div className="flex-1">
                  <div className="font-bold text-slate-200 text-sm">{r.char.name}</div>
                  <div className="text-xs text-slate-400">vs {r.rivalName}</div>
                </div>
                <div className="font-black text-amber-400">{r.maxVictoriesAgainst}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Más Famoso */}
      <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
        <h4 className="text-indigo-400 font-black text-sm uppercase tracking-widest mb-6 border-b border-slate-700 pb-3">⭐ Más Famoso</h4>
        <div className="space-y-3">
          {[...characters]
            .sort((a, b) => (b.stats.fans || 0) - (a.stats.fans || 0))
            .slice(0, 10)
            .map((c, idx) => (
              <div key={c.id} className="flex items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-500 font-black text-lg min-w-8">#{idx+1}</span>
                <img src={c.avatarUrl} className="w-10 h-10 rounded-full border-2 border-slate-700" />
                <div className="flex-1">
                  <div className="font-bold text-slate-200">{c.name}</div>
                  <div className="text-xs text-slate-400">Lv {c.level}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-amber-400 text-lg">⭐ {c.stats.fans || 0}</div>
                  <div className="text-xs text-slate-400">Fans</div>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-6 border-t border-slate-700 pt-4 flex items-center justify-between">
          <span className="text-slate-400 text-sm font-bold uppercase">Total de público:</span>
          <span className="text-amber-400 font-black text-lg">{totalFans.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
