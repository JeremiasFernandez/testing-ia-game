import React from 'react';
import { Character, Tournament, TournamentMatch } from '@/types';

const diffPoints = (a: number, b: number) => Math.abs(a - b);
const computeStandings = (
  ids: string[],
  matches: TournamentMatch[],
  filter?: { stage?: TournamentMatch['stage']; groupId?: number }
) => {
  const scores = new Map<string, number>();
  ids.forEach(id => scores.set(id, 0));
  matches.forEach(m => {
    if (filter?.stage && m.stage !== filter.stage) return;
    if (filter?.groupId !== undefined && m.groupId !== filter.groupId) return;
    if (!m.winnerId || m.score1 === null || m.score2 === null) return;
    scores.set(m.winnerId, (scores.get(m.winnerId) || 0) + diffPoints(m.score1, m.score2));
  });
  return ids
    .map(id => ({ id, points: scores.get(id) || 0 }))
    .sort((a, b) => b.points - a.points);
};

const MatchCard = ({
  match,
  characters,
  onStart,
  onFavor,
  tournament,
  enabled = true,
}: {
  match: TournamentMatch;
  characters: Character[];
  tournament: Tournament;
  onStart: (c1: Character, c2: Character, tId: string, tName: string) => void;
  onFavor: (cId: string, char: Character, otherChar: Character | null, tId: string, tName: string) => void;
  enabled?: boolean;
}) => {
  const c1 = characters.find(c => c.id === match.char1Id);
  const c2 = characters.find(c => c.id === match.char2Id);
  const canBattle = enabled && c1 && c2 && !match.winnerId;
  return (
    <div className={`w-64 bg-slate-800 rounded-2xl border-2 p-4 shadow-xl ${match.winnerId ? 'border-amber-500/50' : enabled ? 'border-slate-700' : 'border-slate-800 opacity-70'}`}>
      {[c1, c2].map((char, idx) => (
        <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl mb-1 ${match.winnerId === char?.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'}`}>
          <img src={char?.avatarUrl || 'https://picsum.photos/seed/empty/100'} className="w-8 h-8 rounded-full border border-slate-600 object-cover" />
          <span className="text-xs font-bold truncate flex-1">{char?.name || '---'}</span>
          {canBattle && char && (
            <button onClick={(e) => { e.stopPropagation(); onFavor(char.id, char, (idx === 0 ? c2 : c1) || null, tournament.id, tournament.name); }} className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1 rounded text-[8px] font-black uppercase transition-all">Favorecer</button>
          )}
        </div>
      ))}
      {match.score1 !== null && match.score2 !== null && (
        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{match.score1} - {match.score2}</div>
      )}
      {canBattle ? (
        <button onClick={() => onStart(c1!, c2!, tournament.id, tournament.name)} className="mt-3 w-full bg-indigo-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-lg shadow-indigo-600/20">PELEAR</button>
      ) : !match.winnerId && (
        <div className="mt-3 w-full bg-slate-700/60 text-slate-400 font-black py-2 rounded-xl text-[10px] uppercase text-center">Bloqueado</div>
      )}
    </div>
  );
};

export default function TournamentsView({
  tournaments,
  selectedTournament,
  onSelectTournament,
  onCreateClick,
  characters,
  onFavorMatch,
  onStartTournamentBattle,
  onSimulateRound,
}: {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  onSelectTournament: (t: Tournament | null) => void;
  onCreateClick: () => void;
  characters: Character[];
  onFavorMatch: (cId: string, char: Character, otherChar: Character | null, tId: string, tName: string) => void;
  onStartTournamentBattle: (c1: Character, c2: Character, tId: string, tName: string) => void;
  onSimulateRound: (tId: string) => void;
}) {
  if (!selectedTournament) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h2 className="text-3xl font-black text-slate-100 uppercase italic">Torneos</h2>
          <button onClick={onCreateClick} className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg uppercase text-xs">
            <i className="fa-solid fa-trophy"></i> Organizar
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">{tournaments.map(t => (
          <div key={t.id} onClick={() => onSelectTournament(t)} className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl cursor-pointer hover:border-amber-500 transition-all group overflow-hidden">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-100 uppercase mb-2 italic">{t.name}</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl">{t.format}</span>
            </div>
            <p className="text-slate-500 text-sm font-bold">{t.participantIds.length} Gladiadores</p>
          </div>
        ))}</div>
      </div>
    );
  }

  const t = selectedTournament;

  const renderStandingsTable = (entries: { id: string; points: number }[], highlightTop?: number) => (
    <table className="w-full text-left min-w-[320px]">
      <thead>
        <tr className="text-[10px] uppercase text-slate-500">
          <th className="py-2">#</th>
          <th className="py-2">Jugador</th>
          <th className="py-2 text-right">Pts</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800">
        {entries.map((row, idx) => {
          const c = characters.find(ch => ch.id === row.id);
          const isQualified = highlightTop !== undefined && idx < highlightTop;
          return (
            <tr key={row.id} className={isQualified ? "bg-emerald-500/10 text-emerald-300" : "text-slate-200"}>
              <td className="py-2 text-xs font-black text-slate-500">{idx + 1}</td>
              <td className="py-2 flex items-center gap-2">
                <img src={c?.avatarUrl || 'https://picsum.photos/seed/empty/80'} className="w-6 h-6 rounded-full border border-slate-700" />
                <span className="text-xs font-bold truncate">{c?.name || '---'}</span>
              </td>
              <td className={"py-2 text-right font-black " + (isQualified ? "text-emerald-300" : "text-indigo-400")}>{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  if (t.format === 'liga' || t.format === 'copa_liga') {
    const leagueMatches = t.matches.filter(m => m.stage === 'league');
    const standings = computeStandings(t.participantIds, leagueMatches, { stage: 'league' });
    const rounds = [...new Set(leagueMatches.map(m => m.round))].sort((a, b) => a - b);
    const currentRound = rounds.find(r => !leagueMatches.filter(m => m.round === r).every(m => m.winnerId)) ?? rounds[rounds.length - 1];
    const roundMatches = leagueMatches.filter(m => m.round === currentRound);
    const knockoutMatches = t.matches.filter(m => m.stage === 'knockout');
    const playoffSize = t.format === 'copa_liga' ? Math.min(t.settings?.playoffRound || 2, t.participantIds.length) : undefined;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-left duration-300">
        <button onClick={() => onSelectTournament(null)} className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-lg"><i className="fa-solid fa-chevron-left"></i></button>
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-black text-slate-100 uppercase italic">{t.name}</h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl">{t.format}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2">Tabla</h4>
            {renderStandingsTable(standings, playoffSize)}
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black uppercase text-slate-500">Fecha {rounds.indexOf(currentRound) + 1} / {rounds.length}</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 font-black">Partidos: {roundMatches.length}</span>
                <button onClick={() => onSimulateRound(t.id)} className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl hover:bg-amber-500/20">Simular fecha</button>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {roundMatches.length === 0 && <p className="text-slate-600 text-xs">Fecha completa.</p>}
              {roundMatches.map(m => (
                <MatchCard key={m.id} match={m} characters={characters} tournament={t} onStart={onStartTournamentBattle} onFavor={onFavorMatch} enabled={!m.winnerId} />
              ))}
            </div>
          </div>
        </div>
        {knockoutMatches.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4">Eliminatoria</h4>
            <div className="overflow-x-auto pb-4"><div className="flex gap-16 min-w-max px-4 items-center">
              {[...new Set(knockoutMatches.map(m => m.round))].sort((a, b) => a - b).map(round => {
                const roundMatches = knockoutMatches.filter(m => m.round === round).sort((a, b) => a.position - b.position);
                return (
                  <div key={round} className="space-y-12">
                    <h4 className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Ronda {round + 1}</h4>
                    <div className="flex flex-col justify-around gap-8">
                      {roundMatches.map(match => (
                        <MatchCard key={match.id} match={match} characters={characters} tournament={t} onStart={onStartTournamentBattle} onFavor={onFavorMatch} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div></div>
          </div>
        )}
      </div>
    );
  }

  if (t.format === 'grupos') {
    const groupIds = Array.from(new Set(t.matches.filter(m => m.stage === 'group' && m.groupId !== undefined).map(m => m.groupId as number))).sort((a, b) => a - b);
    const knockoutMatches = t.matches.filter(m => m.stage === 'knockout');
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-left duration-300">
        <button onClick={() => onSelectTournament(null)} className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-lg"><i className="fa-solid fa-chevron-left"></i></button>
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-black text-slate-100 uppercase italic">{t.name}</h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl">{t.format}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 flex justify-end">
            <button onClick={() => onSimulateRound(t.id)} className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-xl hover:bg-amber-500/20">Simular fecha</button>
          </div>
          {groupIds.map(gId => {
            const members = Array.from(new Set(t.matches.filter(m => m.stage === 'group' && m.groupId === gId).flatMap(m => [m.char1Id, m.char2Id]).filter(Boolean) as string[]));
            const standings = computeStandings(members, t.matches, { stage: 'group', groupId: gId });
            const groupMatches = t.matches.filter(m => m.stage === 'group' && m.groupId === gId);
            const rounds = [...new Set(groupMatches.map(m => m.round))].sort((a, b) => a - b);
            const currentRound = rounds.find(r => !groupMatches.filter(m => m.round === r).every(m => m.winnerId)) ?? rounds[rounds.length - 1];
            const roundMatches = groupMatches.filter(m => m.round === currentRound);
            return (
              <div key={gId} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-slate-500">Grupo {gId + 1} • Fecha {rounds.indexOf(currentRound) + 1}/{rounds.length}</h4>
                </div>
                {renderStandingsTable(standings, t.settings?.advancePerGroup)}
                <div className="flex gap-2 flex-wrap">
                  {roundMatches.map(m => (
                    <MatchCard key={m.id} match={m} characters={characters} tournament={t} onStart={onStartTournamentBattle} onFavor={onFavorMatch} enabled={!m.winnerId} />
                  ))}
                  {roundMatches.length === 0 && <p className="text-slate-600 text-xs">Fecha completa.</p>}
                </div>
              </div>
            );
          })}
        </div>

        {knockoutMatches.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-4">Eliminatoria</h4>
            <div className="overflow-x-auto pb-4"><div className="flex gap-16 min-w-max px-4 items-center">
              {[...new Set(knockoutMatches.map(m => m.round))].sort((a, b) => a - b).map(round => {
                const roundMatches = knockoutMatches.filter(m => m.round === round).sort((a, b) => a.position - b.position);
                return (
                  <div key={round} className="space-y-12">
                    <h4 className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Ronda {round + 1}</h4>
                    <div className="flex flex-col justify-around gap-8">
                      {roundMatches.map(match => (
                        <MatchCard key={match.id} match={match} characters={characters} tournament={t} onStart={onStartTournamentBattle} onFavor={onFavorMatch} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div></div>
          </div>
        )}
      </div>
    );
  }

  // Copa knockout default
  const knockoutMatches = t.matches.filter(m => m.stage !== 'group');
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left duration-300">
      <button onClick={() => onSelectTournament(null)} className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-lg"><i className="fa-solid fa-chevron-left"></i></button>
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-black text-slate-100 uppercase italic">{t.name}</h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-1 rounded-xl">{t.format}</span>
      </div>
      <div className="overflow-x-auto pb-8"><div className="flex gap-16 min-w-max px-4 items-center">
        {[...new Set(knockoutMatches.map(m => m.round))].sort((a, b) => a - b).map(round => {
          const roundMatches = knockoutMatches.filter(m => m.round === round).sort((a, b) => a.position - b.position);
          if (roundMatches.length === 0) return null;
          return (
            <div key={round} className="space-y-12">
              <h4 className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Ronda {round + 1}</h4>
              <div className="flex flex-col justify-around gap-8">
                {roundMatches.map(match => (
                  <MatchCard key={match.id} match={match} characters={characters} tournament={t} onStart={onStartTournamentBattle} onFavor={onFavorMatch} />
                ))}
              </div>
            </div>
          );
        })}
      </div></div>
    </div>
  );
}
