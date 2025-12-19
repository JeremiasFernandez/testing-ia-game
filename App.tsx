
import React, { useState, useEffect } from 'react';
import { Character, BattleRecord, Tournament, TournamentMatch, Skill, CharacterRarity } from './types';
import { 
  XP_PER_WIN, 
  BASE_XP_NEEDED, 
  XP_INCREMENT_PER_LEVEL, 
  SKILL_CHANCE_ON_LEVEL_UP,
  DEFAULT_AVATARS,
  SKILL_NAMES_POOL
} from './constants';
import { 
  WORLD_DUEL_COST,
  WORLD_DUEL_REWARD,
  FAVOR_COST,
  CHAR_COST,
  TOURNEY_COST,
  LEAGUE_RESET_LIMIT,
  DIV2_COST,
  DIV3_COST,
  SHOP_OFFERS,
  getRewardForLevel,
  getRarityMultiplier,
  getRarityColor
} from './utils/game';
import CharacterCard from './components/CharacterCard';
import BattleModal from './components/BattleModal';
import XPBar from './components/XPBar';
import CharsView from './views/CharsView';
import BattlesView from './views/BattlesView';
import ShopView from './views/ShopView';
import TournamentsView from './views/TournamentsView';
import HallView from './views/HallView';
import HistoryView from './views/HistoryView';

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'chars' | 'battles' | 'tournament' | 'shop' | 'hall' | 'history'>('chars');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [history, setHistory] = useState<BattleRecord[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [coins, setCoins] = useState<number>(0);
  const [totalDuelsCount, setTotalDuelsCount] = useState<number>(0);
  const [unlockedDivisions, setUnlockedDivisions] = useState<number>(1);
  const [cheatBuffer, setCheatBuffer] = useState<string>('');
  
  // UI Selection State
  const [isCreatingChar, setIsCreatingChar] = useState(false);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [isBattling, setIsBattling] = useState<{ 
    c1: Character, 
    c2: Character | { name: string, level: number, avatarUrl: string, skills: any[] }, 
    type: 'Normal' | 'Torneo' | 'Mundial', 
    tId?: string, 
    tName?: string,
    favorId?: string | null
  } | null>(null);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Persistence
  useEffect(() => {
    const savedChars = localStorage.getItem('arena_chars_v8');
    const savedHistory = localStorage.getItem('arena_history_v8');
    const savedTourneys = localStorage.getItem('arena_tournaments_v8');
    const savedCoins = localStorage.getItem('arena_coins_v8');
    const savedDuelCount = localStorage.getItem('arena_duel_count_v8');
    const savedDivs = localStorage.getItem('arena_divs_v8');
    if (savedChars) setCharacters(JSON.parse(savedChars));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedTourneys) setTournaments(JSON.parse(savedTourneys));
    if (savedCoins) setCoins(Number(savedCoins));
    if (savedDuelCount) setTotalDuelsCount(Number(savedDuelCount));
    if (savedDivs) setUnlockedDivisions(Number(savedDivs));
  }, []);

  useEffect(() => {
    localStorage.setItem('arena_chars_v8', JSON.stringify(characters));
    localStorage.setItem('arena_history_v8', JSON.stringify(history));
    localStorage.setItem('arena_tournaments_v8', JSON.stringify(tournaments));
    localStorage.setItem('arena_coins_v8', coins.toString());
    localStorage.setItem('arena_duel_count_v8', totalDuelsCount.toString());
    localStorage.setItem('arena_divs_v8', unlockedDivisions.toString());
  }, [characters, history, tournaments, coins, totalDuelsCount, unlockedDivisions]);

  // Cheat Code Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setCheatBuffer(prev => {
        const next = (prev + e.key.toLowerCase()).slice(-10);
        if (next.endsWith('motherlode')) {
          setCoins(99999999);
          return '';
        }
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const handleAddCharacter = (name: string, avatar: string, level: number = 1, skillsCount: number = 0, price?: number) => {
    const isLevel1 = level === 1;
    const cost = price !== undefined ? price : (isLevel1 ? (characters.length < 2 ? 0 : CHAR_COST) : 999999);

    if (coins < cost) return alert(`Necesitas ${cost} monedas.`);

    const newSkills: Skill[] = [];
    for (let i = 0; i < skillsCount; i++) {
        newSkills.push({ id: crypto.randomUUID(), name: SKILL_NAMES_POOL[Math.floor(Math.random() * SKILL_NAMES_POOL.length)] });
    }

    // Rarity determination
    const roll = Math.random();
    let rarity: CharacterRarity = 'Normal';
    if (roll < 0.01) rarity = 'Legendario';
    else if (roll < 0.03) rarity = 'Supremo';
    else if (roll < 0.08) rarity = 'Excentrico';

    const newChar: Character = {
      id: crypto.randomUUID(),
      name,
      description: "",
      avatarUrl: avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
      level, xp: 0, rarity, skills: newSkills,
      division: unlockedDivisions, // Always enters the lowest division
      stats: { wins: 0, losses: 0, championshipsWon: 0, worldDuelWins: 0, favoredCount: 0, leaguePoints: 0 }
    };

    setCoins(prev => prev - cost);
    setCharacters(prev => [...prev, newChar]);
    setIsCreatingChar(false);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selectedChar?.id === id) setSelectedChar(prev => prev ? ({...prev, ...updates}) : null);
  };

  const handleLevelUp = (charId: string, currentChars: Character[]) => {
    return currentChars.map(c => {
      if (c.id !== charId) return c;
      const xpNeeded = BASE_XP_NEEDED + (c.level - 1) * XP_INCREMENT_PER_LEVEL;
      if (c.xp >= xpNeeded) {
        const newLevel = c.level + 1;
        const remainingXp = c.xp - xpNeeded;
        const gainedSkill = Math.random() < SKILL_CHANCE_ON_LEVEL_UP;
        let newSkills = [...c.skills];
        if (gainedSkill) newSkills.push({ id: crypto.randomUUID(), name: SKILL_NAMES_POOL[Math.floor(Math.random() * SKILL_NAMES_POOL.length)] });
        return { ...c, level: newLevel, xp: remainingXp, skills: newSkills };
      }
      return c;
    });
  };

  const handleBuyDivision = (div: number) => {
    const cost = div === 2 ? DIV2_COST : DIV3_COST;
    if (coins < cost) return alert("Faltan monedas.");
    setCoins(prev => prev - cost);
    setUnlockedDivisions(div);
  };

  const handleRemoveDivision = () => {
    if (unlockedDivisions <= 1) return;
    const oldDiv = unlockedDivisions;
    const newDivLimit = unlockedDivisions - 1;
    setUnlockedDivisions(newDivLimit);
    setCharacters(prev => prev.map(c => c.division === oldDiv ? { ...c, division: newDivLimit } : c));
  };

  const onBattleFinish = (winnerId: string, s1: number, s2: number) => {
    if (!isBattling) return;
    const { c1, c2, type, tId, tName, favorId } = isBattling;

    const record: BattleRecord = {
      id: crypto.randomUUID(),
      char1Id: c1.id,
      char2Id: 'id' in c2 ? c2.id : 'NPC_PLAYER',
      char2Name: 'id' in c2 ? undefined : c2.name,
      score1: s1, score2: s2, winnerId,
      timestamp: Date.now(),
      battleType: type,
      tournamentId: tId, tournamentName: tName
    };

    setHistory(prev => [record, ...prev]);
    
    let reward = 0;
    if (type === 'Mundial' && winnerId === c1.id) {
      reward = WORLD_DUEL_REWARD;
    } else {
      reward = getRewardForLevel(c1.level) + getRewardForLevel(c2.level);
    }
    setCoins(prev => prev + reward);
    
    const pointsDiff = Math.abs(s1 - s2);
    const newDuelCount = totalDuelsCount + 1;
    setTotalDuelsCount(newDuelCount);

    setCharacters(prev => {
        let updated = prev.map(c => {
            if (c.id === winnerId) {
                const xpMultiplier = getRarityMultiplier(c.rarity);
                return { 
                  ...c, 
                  xp: c.xp + (XP_PER_WIN * xpMultiplier), 
                  stats: { 
                    ...c.stats, 
                    wins: c.stats.wins + 1, 
                    worldDuelWins: type === 'Mundial' ? c.stats.worldDuelWins + 1 : c.stats.worldDuelWins,
                    favoredCount: favorId === c.id ? c.stats.favoredCount + 1 : c.stats.favoredCount,
                    leaguePoints: c.stats.leaguePoints + pointsDiff
                  } 
                };
            } else if (c.id === c1.id || ('id' in c2 && c.id === c2.id)) {
                return { 
                  ...c, 
                  stats: { 
                    ...c.stats, 
                    losses: c.stats.losses + 1,
                    favoredCount: favorId === c.id ? c.stats.favoredCount + 1 : c.stats.favoredCount
                  } 
                };
            }
            return c;
        });

        if (newDuelCount >= LEAGUE_RESET_LIMIT) {
          // Division Management Logic at Season End
          const div1Chars = [...updated].filter(c => c.division === 1).sort((a,b) => b.stats.leaguePoints - a.stats.leaguePoints);
          const div2Chars = [...updated].filter(c => c.division === 2).sort((a,b) => b.stats.leaguePoints - a.stats.leaguePoints);
          const div3Chars = [...updated].filter(c => c.division === 3).sort((a,b) => b.stats.leaguePoints - a.stats.leaguePoints);

          const div1Winner = div1Chars[0];
          
          let nextGenChars = updated.map(c => ({
            ...c,
            stats: {
              ...c.stats,
              championshipsWon: c.id === div1Winner?.id ? c.stats.championshipsWon + 1 : c.stats.championshipsWon,
              leaguePoints: 0
            }
          }));

          // Swaps
          if (unlockedDivisions >= 2) {
            const promoteToDiv1 = div2Chars.slice(0, 2);
            const relegateToDiv2 = div1Chars.slice(-2);
            nextGenChars = nextGenChars.map(c => {
              if (promoteToDiv1.some(p => p.id === c.id)) return { ...c, division: 1 };
              if (relegateToDiv2.some(r => r.id === c.id)) return { ...c, division: 2 };
              return c;
            });
          }

          if (unlockedDivisions >= 3) {
            const promoteToDiv2 = div3Chars.slice(0, 2);
            const relegateToDiv3 = div2Chars.slice(-2);
            nextGenChars = nextGenChars.map(c => {
              if (promoteToDiv2.some(p => p.id === c.id)) return { ...c, division: 2 };
              if (relegateToDiv3.some(r => r.id === c.id)) return { ...c, division: 3 };
              return c;
            });
          }

          setTotalDuelsCount(0);
          alert(`¡Temporada Finalizada! Campeón: ${div1Winner?.name || '---'}`);
          return nextGenChars;
        }

        return handleLevelUp(winnerId, updated);
    });

    if (tId) {
        setTournaments(prevTourneys => prevTourneys.map(t => {
            if (t.id !== tId) return t;
            const updatedMatches = t.matches.map(m => {
                const isThisMatch = (m.char1Id === c1.id && m.char2Id === ('id' in c2 ? c2.id : null)) || (m.char1Id === ('id' in c2 ? c2.id : null) && m.char2Id === c1.id);
                if (isThisMatch && !m.winnerId) return { ...m, winnerId };
                return m;
            });
            const nextMatchId = updatedMatches.find(m => (m.char1Id === c1.id && m.char2Id === ('id' in c2 ? c2.id : null)) || (m.char1Id === ('id' in c2 ? c2.id : null) && m.char2Id === c1.id))?.nextMatchId;
            let nextMatches = updatedMatches;
            if (nextMatchId) {
                nextMatches = updatedMatches.map(nm => {
                    if (nm.id === nextMatchId) {
                        if (nm.char1Id === null) return { ...nm, char1Id: winnerId };
                        if (nm.char2Id === null) return { ...nm, char2Id: winnerId };
                    }
                    return nm;
                });
            }
            const finalMatch = nextMatches.find(m => m.nextMatchId === null);
            const isFinished = finalMatch?.winnerId !== null;
            if (isFinished) {
              setCharacters(chars => chars.map(c => c.id === winnerId ? { ...c, stats: { ...c.stats, championshipsWon: c.stats.championshipsWon + 1 } } : c));
            }
            const newT = { ...t, matches: nextMatches, status: isFinished ? 'finished' as const : 'active' as const, winnerId: isFinished ? finalMatch!.winnerId : null };
            if (selectedTournament?.id === tId) setSelectedTournament(newT);
            return newT;
        }));
    }
    setIsBattling(null);
  };

  const handleCreateTournament = (name: string, pIds: string[]) => {
    if (coins < TOURNEY_COST) return alert(`Necesitas ${TOURNEY_COST} monedas.`);
    const matches: TournamentMatch[] = [];
    const firstRoundMatches: TournamentMatch[] = [];
    for (let i = 0; i < pIds.length; i += 2) {
      const char1Id = pIds[i], char2Id = pIds[i+1] || null;
      firstRoundMatches.push({ id: crypto.randomUUID(), char1Id, char2Id, winnerId: char2Id === null ? char1Id : null, round: 0, position: i / 2, nextMatchId: null });
    }
    const allMatches: TournamentMatch[] = [...firstRoundMatches];
    let prevRoundMatches = firstRoundMatches;
    let r = 1;
    while (prevRoundMatches.length > 1) {
        const nextRoundMatches: TournamentMatch[] = [];
        for (let j = 0; j < prevRoundMatches.length; j += 2) {
            const mId = crypto.randomUUID();
            nextRoundMatches.push({ id: mId, char1Id: null, char2Id: null, winnerId: null, round: r, position: j / 2, nextMatchId: null });
            prevRoundMatches[j].nextMatchId = mId;
            if (prevRoundMatches[j+1]) prevRoundMatches[j+1].nextMatchId = mId;
        }
        allMatches.push(...nextRoundMatches);
        prevRoundMatches = nextRoundMatches;
        r++;
    }
    setCoins(prev => prev - TOURNEY_COST);
    setTournaments([{ id: crypto.randomUUID(), name, participantIds: pIds, matches: allMatches, status: 'active', winnerId: null }, ...tournaments]);
    setIsCreatingTournament(false); setActiveTab('tournament');
  };

  const startRandomDuel = () => {
    if (characters.length < 2) return alert("Mínimo 2 personajes.");
    const idx1 = Math.floor(Math.random() * characters.length);
    let idx2 = Math.floor(Math.random() * characters.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * characters.length);
    setIsBattling({ c1: characters[idx1], c2: characters[idx2], type: 'Normal' });
  };

  const startWorldDuel = () => {
    if (coins < WORLD_DUEL_COST) return alert(`Necesitas ${WORLD_DUEL_COST} monedas.`);
    if (characters.length === 0) return alert("Crea un personaje primero.");
    const c1 = characters[Math.floor(Math.random() * characters.length)];
    const npc = { 
      name: ["Sombra", "Golem", "Druida", "Arquero", "Viper", "Titan"][Math.floor(Math.random() * 6)] + " (Bot)", 
      level: Math.floor(Math.random() * 12) + 2, 
      avatarUrl: `https://picsum.photos/seed/${Math.random()}/200`,
      skills: Array(Math.floor(Math.random() * 3)).fill(0)
    };
    setCoins(prev => prev - WORLD_DUEL_COST);
    setIsBattling({ c1, c2: npc, type: 'Mundial' });
  };

  const handleFavorMatch = (cId: string, char: Character, otherChar: Character | null, tId: string, tName: string) => {
    if (coins < FAVOR_COST) return alert(`Necesitas ${FAVOR_COST} monedas.`);
    if (!otherChar) return alert("Pase directo.");
    setCoins(prev => prev - FAVOR_COST);
    setIsBattling({ c1: char, c2: otherChar, type: 'Torneo', tId, tName, favorId: cId });
  };

  

  return (
  <div className="min-h-screen pb-20 max-w-5xl mx-auto px-4">
      {/* Header */}
      <header className="py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="cursor-pointer" onClick={() => {setActiveTab('chars'); setSelectedTournament(null);}}>
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-tighter hover:scale-105 transition-transform">Arena de Leyendas</h1>
          <div className="flex items-center gap-4 mt-1">
             <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <i className="fa-solid fa-coins text-amber-500 text-xs"></i>
                <span className="text-amber-500 font-black text-sm">{coins.toLocaleString()}</span>
             </div>
             <div className="h-4 w-px bg-slate-700"></div>
             <p className="text-slate-500 text-xs font-bold uppercase">Liga: {totalDuelsCount}/{LEAGUE_RESET_LIMIT} Duelos</p>
          </div>
        </div>
        <nav className="flex flex-wrap justify-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700 shadow-xl gap-1">
          {[
            { id: 'chars', icon: 'fa-users', label: 'Héroes' },
            { id: 'battles', icon: 'fa-hand-fist', label: 'Duelos' },
            { id: 'tournament', icon: 'fa-trophy', label: 'Torneos' },
            { id: 'shop', icon: 'fa-cart-shopping', label: 'Tienda' },
            { id: 'hall', icon: 'fa-star', label: 'Salón' },
            { id: 'history', icon: 'fa-clock-rotate-left', label: 'Historial' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedTournament(null); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id && !selectedTournament ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
              <i className={`fa-solid ${tab.icon}`}></i> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main View */}
      <main className="mt-6">
        {activeTab === 'chars' && (
          <CharsView 
            characters={characters}
            onCreateClick={() => setIsCreatingChar(true)}
            onSelectChar={setSelectedChar}
          />
        )}

        {activeTab === 'battles' && (
          <BattlesView 
            characters={characters}
            unlockedDivisions={unlockedDivisions}
            onStartRandomDuel={startRandomDuel}
            onStartWorldDuel={startWorldDuel}
            onStartDuel={(c1, c2) => setIsBattling({ c1, c2, type: 'Normal' })}
            onBuyDivision={handleBuyDivision}
            onRemoveDivision={handleRemoveDivision}
          />
        )}

        {activeTab === 'shop' && (
          <ShopView onBuy={(n, level, skills, price) => handleAddCharacter(n, '', level, skills, price)} />
        )}

        {activeTab === 'tournament' && (
          <TournamentsView 
            tournaments={tournaments}
            selectedTournament={selectedTournament}
            onSelectTournament={setSelectedTournament}
            onCreateClick={() => setIsCreatingTournament(true)}
            characters={characters}
            onFavorMatch={handleFavorMatch}
            onStartTournamentBattle={(c1, c2, tId, tName) => setIsBattling({ c1, c2, type: 'Torneo', tId, tName })}
          />
        )}

        {/* Hall and History views omitted for brevity as they remain largely identical but are still present in full code if needed */}
        {activeTab === 'hall' && (
          <HallView characters={characters} />
        )}

        {activeTab === 'history' && (
          <HistoryView history={history} characters={characters} />
        )}
      </main>

      {/* Modals */}
      {isCreatingChar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-3xl font-black mb-8 uppercase italic text-slate-100">Invocar Guerrero</h2>
            <div className="space-y-6">
              <input type="text" id="new-char-name" placeholder="Nombre" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 outline-none font-bold text-white focus:ring-2 ring-indigo-500" />
              <input type="text" id="new-char-avatar" placeholder="URL Avatar (Opcional)" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 outline-none font-bold text-white focus:ring-2 ring-indigo-500" />
              <p className="text-center text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Coste: {characters.length < 2 ? "GRATIS" : `${CHAR_COST} Monedas`}</p>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setIsCreatingChar(false)} className="flex-1 px-4 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-xs border border-slate-700">Cancelar</button>
                <button onClick={() => {
                  const n = (document.getElementById('new-char-name') as HTMLInputElement).value;
                  const a = (document.getElementById('new-char-avatar') as HTMLInputElement).value;
                  if (n) handleAddCharacter(n, a);
                }} className="flex-1 px-4 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs shadow-lg active:scale-95">Invocar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedChar && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative">
            <div className={`h-40 bg-gradient-to-br ${getRarityColor(selectedChar.rarity)} relative overflow-hidden`}>
                 <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 <button onClick={() => setSelectedChar(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-20"><i className="fa-solid fa-xmark"></i></button>
                 <div className="absolute -bottom-16 left-10 p-2 bg-slate-900 rounded-full border-4 border-slate-900 shadow-2xl z-20"><img src={selectedChar.avatarUrl} className="w-32 h-32 rounded-full object-cover" /></div>
            </div>
            <div className="pt-20 px-10 pb-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 group border-b-2 border-slate-800 focus-within:border-indigo-500 transition-all">
                  <input type="text" defaultValue={selectedChar.name} onBlur={(e) => handleUpdateCharacter(selectedChar.id, { name: e.target.value })} className="text-4xl font-black bg-transparent text-white uppercase italic outline-none flex-1" />
                  <i className="fa-solid fa-pen text-slate-600 group-hover:text-indigo-500"></i>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${getRarityColor(selectedChar.rarity)} text-white`}>{selectedChar.rarity}</span>
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">División {selectedChar.division}</span>
                </div>
                <div className="flex items-center gap-2 group bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                  <i className="fa-solid fa-image text-slate-600"></i>
                  <input type="text" defaultValue={selectedChar.avatarUrl} onBlur={(e) => handleUpdateCharacter(selectedChar.id, { avatarUrl: e.target.value })} placeholder="URL de imagen..." className="text-[10px] bg-transparent text-slate-400 outline-none w-full" />
                </div>
              </div>
              <div className="space-y-3"><XPBar character={selectedChar} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-600 ml-1 tracking-widest">Leyenda</label>
                    <textarea defaultValue={selectedChar.description} onChange={(e) => handleUpdateCharacter(selectedChar.id, { description: e.target.value })} placeholder="..." className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-sm text-slate-300 min-h-[120px] resize-none outline-none focus:ring-1 ring-indigo-500" />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-600 ml-1 tracking-widest">Habilidades ({selectedChar.skills.length})</label>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3 max-h-[120px] overflow-y-auto">
                        {selectedChar.skills.map(skill => (
                            <input key={skill.id} type="text" defaultValue={skill.name} onBlur={(e) => {
                                const ns = selectedChar.skills.map(s => s.id === skill.id ? {...s, name: e.target.value} : s);
                                handleUpdateCharacter(selectedChar.id, { skills: ns });
                            }} className="bg-slate-900/50 border border-indigo-500/20 w-full p-2 rounded-xl text-xs font-black text-indigo-200 uppercase outline-none focus:ring-1 ring-indigo-500" />
                        ))}
                    </div>
                </div>
              </div>
              <div className="pt-6 border-t border-slate-800 flex justify-end"><button onClick={() => setSelectedChar(null)} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black uppercase text-xs shadow-lg active:scale-95">Cerrar</button></div>
            </div>
          </div>
        </div>
      )}

      {isCreatingTournament && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[110] p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
                <h2 className="text-3xl font-black mb-8 uppercase italic text-slate-100">Crear Torneo</h2>
                <div className="space-y-6">
                    <input type="text" id="new-tourney-name" placeholder="Nombre Torneo" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 outline-none font-bold text-white focus:ring-2 ring-amber-500" />
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 max-h-60 overflow-y-auto grid grid-cols-2 gap-3">
                        {characters.map(c => (
                            <div key={c.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-700">
                              <input type="checkbox" id={`p-${c.id}`} value={c.id} className="accent-amber-500 h-4 w-4" />
                              <label htmlFor={`p-${c.id}`} className="text-xs font-bold text-slate-400 truncate cursor-pointer">{c.name}</label>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-[10px] font-bold text-amber-500 uppercase tracking-widest">Coste: {TOURNEY_COST} Monedas</p>
                    <div className="flex gap-4 pt-2">
                        <button onClick={() => setIsCreatingTournament(false)} className="flex-1 px-4 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-xs border border-slate-700">Cancelar</button>
                        <button onClick={() => {
                            const n = (document.getElementById('new-tourney-name') as HTMLInputElement).value;
                            const s = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map((cb: any) => cb.value);
                            if (n && s.length >= 2) handleCreateTournament(n, s); else alert("Min. 2 gladiadores.");
                        }} className="flex-1 px-4 py-4 rounded-2xl bg-amber-500 text-slate-900 font-black uppercase text-xs shadow-lg active:scale-95">Organizar</button>
                    </div>
                </div>
            </div>
          </div>
      )}

      {isBattling && (
        <BattleModal 
          char1={isBattling.c1} 
          char2={isBattling.c2} 
          favorId={isBattling.favorId}
          title={isBattling.type === 'Torneo' ? `Torneo: ${isBattling.tName}` : isBattling.type === 'Mundial' ? 'Duelo Mundial' : 'Combate de Liga'}
          onFinish={onBattleFinish} 
          onClose={() => setIsBattling(null)}
        />
      )}
    </div>
  );
}
