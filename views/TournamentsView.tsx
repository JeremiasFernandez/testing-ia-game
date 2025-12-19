import React from 'react';
import { Character, Tournament } from '@/types';

export default function TournamentsView({
  tournaments,
  selectedTournament,
  onSelectTournament,
  onCreateClick,
  characters,
  onFavorMatch,
  onStartTournamentBattle,
}: {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  onSelectTournament: (t: Tournament | null) => void;
  onCreateClick: () => void;
  characters: Character[];
  onFavorMatch: (cId: string, char: Character, otherChar: Character | null, tId: string, tName: string) => void;
  onStartTournamentBattle: (c1: Character, c2: Character, tId: string, tName: string) => void;
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
            <h3 className="text-2xl font-black text-slate-100 uppercase mb-2 italic">{t.name}</h3>
            <p className="text-slate-500 text-sm font-bold">{t.participantIds.length} Gladiadores</p>
          </div>
        ))}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left duration-300">
      <button onClick={() => onSelectTournament(null)} className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-lg"><i className="fa-solid fa-chevron-left"></i></button>
      <div className="overflow-x-auto pb-8"><div className="flex gap-16 min-w-max px-4 items-center">
        {[0, 1, 2, 3].map(round => {
          const roundMatches = selectedTournament.matches.filter(m => m.round === round);
          if (roundMatches.length === 0) return null;
          return (
            <div key={round} className="space-y-12">
              <h4 className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Ronda {round+1}</h4>
              <div className="flex flex-col justify-around gap-8">
                {roundMatches.sort((a,b) => a.position - b.position).map(match => {
                  const c1 = characters.find(c => c.id === match.char1Id);
                  const c2 = characters.find(c => c.id === match.char2Id);
                  const canBattle = c1 && c2 && !match.winnerId;
                  return (
                    <div key={match.id} className="relative">
                      <div className={`w-64 bg-slate-800 rounded-2xl border-2 p-4 shadow-xl ${match.winnerId ? 'border-amber-500/50' : 'border-slate-700'}`}>
                        {[c1, c2].map((char, idx) => (
                          <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl mb-1 ${match.winnerId === char?.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-200'}`}>
                            <img src={char?.avatarUrl || 'https://picsum.photos/seed/empty/100'} className="w-8 h-8 rounded-full border border-slate-600 object-cover" />
                            <span className="text-xs font-bold truncate flex-1">{char?.name || '---'}</span>
                            {canBattle && char && (
                              <button onClick={(e) => { e.stopPropagation(); onFavorMatch(char.id, char, (idx === 0 ? c2 : c1) || null, selectedTournament.id, selectedTournament.name); }} className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white px-2 py-1 rounded text-[8px] font-black uppercase transition-all">Favorecer</button>
                            )}
                          </div>
                        ))}
                        {canBattle && (
                          <button onClick={() => onStartTournamentBattle(c1!, c2!, selectedTournament.id, selectedTournament.name)} className="mt-3 w-full bg-indigo-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-lg shadow-indigo-600/20">PELEAR</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div></div>
    </div>
  );
}
