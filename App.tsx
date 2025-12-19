
import React, { useState, useEffect, useRef } from 'react';
import { Character, BattleRecord, Tournament, TournamentMatch, Skill, CharacterRarity, TournamentFormat, TournamentSettings } from './types';
import { 
  XP_PER_WIN, 
  BASE_XP_NEEDED, 
  XP_INCREMENT_PER_LEVEL, 
  SKILL_CHANCE_ON_LEVEL_UP,
  DEFAULT_AVATARS,
  SKILL_NAMES_POOL,
  CHARACTER_THEMES
} from './constants';
import { 
  WORLD_DUEL_COST,
  WORLD_DUEL_REWARD,
  FAVOR_COST,
  CHAR_COST,
  TOURNEY_COST,
  TOWER_COST,
  LEAGUE_RESET_LIMIT,
  DIV2_COST,
  DIV3_COST,
  SHOP_OFFERS,
  getRewardForLevel,
  getRarityMultiplier,
  getRarityColor,
  getStadiumByLevel
} from './utils/game';
import { soundManager } from './utils/soundManager';
import CharacterCard from './components/CharacterCard';
import BattleModal from './components/BattleModal';
import XPBar from './components/XPBar';
import { Confetti } from './components/Confetti';
import { LevelUpNotification } from './components/LevelUpNotification';
import CharsView from './views/CharsView';
import BattlesView from './views/BattlesView';
import ShopView from './views/ShopView';
import TournamentsView from './views/TournamentsView';
import StatsView from './views/StatsView';
import OrganizerView from './views/OrganizerView';
import HistoryView from './views/HistoryView';
import TowerView from './views/TowerView';

// Helpers for tournament formats
const diffPoints = (a: number, b: number) => Math.abs(a - b);

const buildKnockoutMatches = (pIds: string[], stage: 'knockout' | 'league' | 'group' = 'knockout', twoLegs: boolean = false): TournamentMatch[] => {
  const matches: TournamentMatch[] = [];
  const firstRound: TournamentMatch[] = [];
  for (let i = 0; i < pIds.length; i += 2) {
    const char1Id = pIds[i];
    const char2Id = pIds[i + 1] || null;
    
    if (twoLegs && char2Id !== null) {
      // Ida
      firstRound.push({
        id: crypto.randomUUID(),
        char1Id,
        char2Id,
        winnerId: null,
        score1: null,
        score2: null,
        round: 0,
        position: i / 2,
        nextMatchId: null,
        stage,
        legNumber: 1
      });
      // Vuelta
      firstRound.push({
        id: crypto.randomUUID(),
        char1Id: char2Id,
        char2Id: char1Id,
        winnerId: null,
        score1: null,
        score2: null,
        round: 0,
        position: i / 2,
        nextMatchId: null,
        stage,
        legNumber: 2
      });
    } else {
      firstRound.push({
        id: crypto.randomUUID(),
        char1Id,
        char2Id,
        winnerId: char2Id === null ? char1Id : null,
        score1: null,
        score2: null,
        round: 0,
        position: i / 2,
        nextMatchId: null,
        stage
      });
    }
  }
  matches.push(...firstRound);
  
  if (twoLegs) {
    // For two legs, we need a tiebreaker logic when building next rounds
    let prevRound = firstRound.filter(m => m.legNumber === 2 || !m.legNumber);
    let r = 1;
    while (prevRound.length > 1) {
      const nextRound: TournamentMatch[] = [];
      for (let j = 0; j < prevRound.length; j += 2) {
        const char1Id = prevRound[j].winnerId;
        const char2Id = prevRound[j + 1]?.winnerId || null;
        
        // Ida
        nextRound.push({
          id: crypto.randomUUID(),
          char1Id,
          char2Id,
          winnerId: null,
          score1: null,
          score2: null,
          round: r,
          position: j / 2,
          nextMatchId: null,
          stage,
          legNumber: 1
        });
        // Vuelta
        if (char2Id !== null) {
          nextRound.push({
            id: crypto.randomUUID(),
            char1Id: char2Id,
            char2Id: char1Id,
            winnerId: null,
            score1: null,
            score2: null,
            round: r,
            position: j / 2,
            nextMatchId: null,
            stage,
            legNumber: 2
          });
        }
      }
      matches.push(...nextRound);
      prevRound = nextRound.filter(m => m.legNumber === 2 || !m.legNumber);
      r++;
    }
  } else {
    let prevRound = firstRound;
    let r = 1;
    while (prevRound.length > 1) {
      const nextRound: TournamentMatch[] = [];
      for (let j = 0; j < prevRound.length; j += 2) {
        const mId = crypto.randomUUID();
        nextRound.push({
          id: mId,
          char1Id: null,
          char2Id: null,
          winnerId: null,
          score1: null,
          score2: null,
          round: r,
          position: j / 2,
          nextMatchId: null,
          stage
        });
        prevRound[j].nextMatchId = mId;
        if (prevRound[j + 1]) prevRound[j + 1].nextMatchId = mId;
      }
      matches.push(...nextRound);
      prevRound = nextRound;
      r++;
    }
  }
  return matches;
};

const buildRoundRobinMatches = (
  ids: string[],
  roundsPerPair: number,
  stage: 'league' | 'group',
  groupId?: number
): TournamentMatch[] => {
  // Circle method to generate balanced round-robin by fechas
  const participants = [...ids];
  const needsBye = participants.length % 2 === 1;
  if (needsBye) participants.push('__BYE__');
  const n = participants.length;
  const half = n / 2;
  const baseRounds = n - 1; // number of fechas in a single round-robin
  const rounds: Array<Array<[string, string]>> = [];
  let arr = [...participants];
  for (let r = 0; r < baseRounds; r++) {
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];
      pairs.push([t1, t2]);
    }
    rounds.push(pairs);
    // rotate keeping first fixed
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [fixed, ...rest];
  }

  const matches: TournamentMatch[] = [];
  let position = 0;
  // First leg
  rounds.forEach((pairs, fecha) => {
    pairs.forEach(([a, b]) => {
      if (a === '__BYE__' || b === '__BYE__') return; // skip bye
      matches.push({
        id: crypto.randomUUID(),
        char1Id: a,
        char2Id: b,
        winnerId: null,
        score1: null,
        score2: null,
        round: fecha,
        position: position++,
        nextMatchId: null,
        stage,
        groupId,
      });
    });
  });

  // Additional legs (home/away swaps) if requested
  for (let leg = 2; leg <= Math.max(1, roundsPerPair); leg++) {
    const offset = (leg - 1) * baseRounds;
    rounds.forEach((pairs, fecha) => {
      pairs.forEach(([a, b]) => {
        if (a === '__BYE__' || b === '__BYE__') return;
        // Swap order for alternate legs
        const home = leg % 2 === 0 ? b : a;
        const away = leg % 2 === 0 ? a : b;
        matches.push({
          id: crypto.randomUUID(),
          char1Id: home,
          char2Id: away,
          winnerId: null,
          score1: null,
          score2: null,
          round: offset + fecha,
          position: position++,
          nextMatchId: null,
          stage,
          groupId,
        });
      });
    });
  }

  return matches;
};

const balanceGroups = (ids: string[], groups: number): string[][] => {
  const buckets: string[][] = Array.from({ length: groups }, () => []);
  ids.forEach((id, idx) => {
    buckets[idx % groups].push(id);
  });
  return buckets.filter(g => g.length > 0);
};

const computeStandings = (ids: string[], matches: TournamentMatch[], filter?: { stage?: TournamentMatch['stage']; groupId?: number }) => {
  const scores = new Map<string, number>();
  ids.forEach(id => scores.set(id, 0));
  matches.forEach(m => {
    if (filter?.stage && m.stage !== filter.stage) return;
    if (filter?.groupId !== undefined && m.groupId !== filter.groupId) return;
    if (!m.winnerId || m.score1 === null || m.score2 === null) return;
    const points = diffPoints(m.score1, m.score2);
    scores.set(m.winnerId, (scores.get(m.winnerId) || 0) + points);
  });
  return ids
    .map(id => ({ id, points: scores.get(id) || 0 }))
    .sort((a, b) => b.points - a.points);
};

const getGroupQualifiers = (
  matches: TournamentMatch[],
  groups: number,
  advancePerGroup: number
): string[] => {
  const groupIds = Array.from(new Set(matches.filter(m => m.stage === 'group' && m.groupId !== undefined).map(m => m.groupId as number))).sort((a, b) => a - b);
  const qualifiers: string[] = [];
  groupIds.forEach(gId => {
    const members = Array.from(new Set(
      matches
        .filter(m => m.stage === 'group' && m.groupId === gId)
        .flatMap(m => [m.char1Id, m.char2Id])
        .filter(Boolean) as string[]
    ));
    const standings = computeStandings(members, matches, { stage: 'group', groupId: gId });
    qualifiers.push(...standings.slice(0, advancePerGroup).map(s => s.id));
  });
  return qualifiers;
};

const getTwoLegsWinner = (legMatches: TournamentMatch[]): string | null => {
  if (legMatches.length < 2) return null;
  const leg1 = legMatches.find(m => m.legNumber === 1);
  const leg2 = legMatches.find(m => m.legNumber === 2);
  if (!leg1 || !leg2 || !leg1.winnerId || !leg2.winnerId) return null;
  if (!leg1.score1 || leg1.score2 === undefined || !leg2.score1 || leg2.score2 === undefined) return null;
  
  const totalDiff1 = Math.abs((leg1.score1 - leg1.score2) + (leg2.score2 - leg2.score1));
  const totalDiff2 = Math.abs((leg1.score2 - leg1.score1) + (leg2.score1 - leg2.score2));
  
  if (Math.abs(totalDiff1 - totalDiff2) > 0) {
    return totalDiff1 > totalDiff2 ? leg1.char1Id : leg1.char2Id;
  }
  // If tied, needs third match - for now just return null to trigger tiebreaker
  return null;
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'chars' | 'battles' | 'tournament' | 'shop' | 'tower' | 'organizer' | 'hall' | 'history'>('chars');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [history, setHistory] = useState<BattleRecord[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [coins, setCoins] = useState<number>(0);
  const [totalDuelsCount, setTotalDuelsCount] = useState<number>(0);
  const [unlockedDivisions, setUnlockedDivisions] = useState<number>(1);
  const [cheatBuffer, setCheatBuffer] = useState<string>('');
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [tower, setTower] = useState<{ charId: string; currentLevel: number; inProgress: boolean } | null>(null);
  const towerBattleProcessingRef = useRef(false);
  
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
  const [newTournamentFormat, setNewTournamentFormat] = useState<TournamentFormat>('copa');
  const [newRoundsPerPair, setNewRoundsPerPair] = useState<number>(1);
  const [newGroupsCount, setNewGroupsCount] = useState<number>(2);
  const [newAdvancePerGroup, setNewAdvancePerGroup] = useState<number>(2);
  const [newPlayoffRound, setNewPlayoffRound] = useState<number>(2);
  const [newTwoLegs, setNewTwoLegs] = useState<boolean>(false);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  const [bgmEnabled, setBgmEnabled] = useState(soundManager.isBgmEnabled());
  const [levelUpNotification, setLevelUpNotification] = useState<{ name: string; level: number } | null>(null);
  const [stadiumLevel, setStadiumLevel] = useState<number>(() => Number(localStorage.getItem('arena_stadium_level') || '1'));
  const [reputation, setReputation] = useState<number>(() => Number(localStorage.getItem('arena_reputation') || '100'));

  // Persistence
  useEffect(() => {
    const savedChars = localStorage.getItem('arena_chars_v8');
    const savedHistory = localStorage.getItem('arena_history_v8');
    const savedTourneys = localStorage.getItem('arena_tournaments_v8');
    const savedCoins = localStorage.getItem('arena_coins_v8');
    const savedDuelCount = localStorage.getItem('arena_duel_count_v8');
    const savedDivs = localStorage.getItem('arena_divs_v8');
    const savedFolders = localStorage.getItem('arena_folders_v8');
    if (savedChars) {
      const parsed: Character[] = JSON.parse(savedChars);
      // Backfill theme, folders, and new stats for older saves
      const normalized = parsed.map(c => ({
        theme: CHARACTER_THEMES[Math.floor(Math.random() * CHARACTER_THEMES.length)],
        folders: [],
        ...c,
        stats: {
          ...c.stats,
          towerLevel: c.stats?.towerLevel ?? 0,
          currentWinStreak: c.stats?.currentWinStreak ?? 0,
          maxWinStreak: c.stats?.maxWinStreak ?? 0,
          fans: c.stats?.fans ?? 0,
          lastBattleResults: c.stats?.lastBattleResults ?? [],
        },
      }));
      setCharacters(normalized);
    }
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedTourneys) {
      const parsed: Tournament[] = JSON.parse(savedTourneys);
      // Backfill format/settings for older saves
      const normalized = parsed.map(t => ({
        format: 'copa' as TournamentFormat,
        settings: undefined,
        ...t,
      }));
      setTournaments(normalized);
    }
    if (savedCoins) setCoins(Number(savedCoins));
    if (savedDuelCount) setTotalDuelsCount(Number(savedDuelCount));
    if (savedDivs) setUnlockedDivisions(Number(savedDivs));
    if (savedFolders) setFolders(JSON.parse(savedFolders));
  }, []);

  useEffect(() => {
    localStorage.setItem('arena_chars_v8', JSON.stringify(characters));
    localStorage.setItem('arena_history_v8', JSON.stringify(history));
    localStorage.setItem('arena_tournaments_v8', JSON.stringify(tournaments));
    localStorage.setItem('arena_coins_v8', coins.toString());
    localStorage.setItem('arena_duel_count_v8', totalDuelsCount.toString());
    localStorage.setItem('arena_divs_v8', unlockedDivisions.toString());
    localStorage.setItem('arena_folders_v8', JSON.stringify(folders));
    localStorage.setItem('arena_stadium_level', stadiumLevel.toString());
    localStorage.setItem('arena_reputation', reputation.toString());
  }, [characters, history, tournaments, coins, totalDuelsCount, unlockedDivisions, folders, stadiumLevel, reputation]);

  // Cheat Code Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setCheatBuffer(prev => {
        const next = (prev + e.key.toLowerCase()).slice(-10);
        if (next.endsWith('motherlode')) {
          setCoins(99999999);
          return '';
        }
        if (next.endsWith('antilode')) {
          setCoins(0);
          return '';
        }
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actions
  const handleUpgradeStadium = () => {
    const current = getStadiumByLevel(stadiumLevel);
    const next = getStadiumByLevel(stadiumLevel + 1);
    if (!next || next.level === current.level) return alert('Máximo nivel alcanzado.');
    if (coins < next.cost) return alert(`Necesitas ${next.cost} monedas.`);
    setCoins(prev => prev - next.cost);
    setStadiumLevel(prev => prev + 1);
  };

  // Export/Import data helpers
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleExportData = () => {
    const data = {
      version: 'v8',
      timestamp: Date.now(),
      characters,
      history,
      tournaments,
      coins,
      totalDuelsCount,
      unlockedDivisions,
      folders,
      stadiumLevel,
      reputation,
      soundEnabled,
      bgmEnabled,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arena-save-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleImportFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Basic validation and state restore
      if (parsed.characters) setCharacters(parsed.characters);
      if (parsed.history) setHistory(parsed.history);
      if (parsed.tournaments) setTournaments(parsed.tournaments);
      if (typeof parsed.coins === 'number') setCoins(parsed.coins);
      if (typeof parsed.totalDuelsCount === 'number') setTotalDuelsCount(parsed.totalDuelsCount);
      if (typeof parsed.unlockedDivisions === 'number') setUnlockedDivisions(parsed.unlockedDivisions);
      if (parsed.folders) setFolders(parsed.folders);
      if (typeof parsed.stadiumLevel === 'number') setStadiumLevel(parsed.stadiumLevel);
      if (typeof parsed.reputation === 'number') setReputation(parsed.reputation);
      if (typeof parsed.soundEnabled === 'boolean') {
        setSoundEnabled(parsed.soundEnabled);
        soundManager.setEnabled(parsed.soundEnabled);
      }
      if (typeof parsed.bgmEnabled === 'boolean') {
        setBgmEnabled(parsed.bgmEnabled);
        soundManager.setBgmEnabled(parsed.bgmEnabled);
      }
      alert('Datos importados correctamente.');
    } catch (err) {
      console.error(err);
      alert('Archivo inválido. Asegúrate de seleccionar un JSON exportado del juego.');
    }
  };

  const computeAudience = (c1: Character, c2: Character | { name: string; level: number; avatarUrl: string; skills: any[] }, type: 'Normal' | 'Torneo' | 'Mundial') => {
    const stadium = getStadiumByLevel(stadiumLevel);
    let base = type === 'Mundial' ? 600 : type === 'Torneo' ? 250 : 150;
    // Rivalry bonus: prior meetings count
    const rivalId = 'id' in c2 ? (c2 as Character).id : null;
    const rivalryCount = rivalId ? history.filter(h => (h.char1Id === c1.id && h.char2Id === rivalId) || (h.char2Id === c1.id && h.char1Id === rivalId)).length : 0;
    const rivalryBonus = Math.min(200, Math.floor(rivalryCount / 3) * 30);
    // Streak bonus
    const streakBonus = ((c1.stats.currentWinStreak || 0) + ('id' in c2 ? ((c2 as Character).stats.currentWinStreak || 0) : 0)) * 10;
    // Popularity
    const popularity = ((c1.stats.fans || 0) + ('id' in c2 ? ((c2 as Character).stats.fans || 0) : 0)) / 20;
    // Reputation factor
    const repFactor = 1 + Math.min(0.5, reputation / 1000);
    let audience = Math.floor((base + rivalryBonus + streakBonus + popularity) * repFactor);
    audience = Math.max(50, Math.min(stadium.capacity, audience));
    return audience;
  };
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

    // Random color theme
    const randomTheme = CHARACTER_THEMES[Math.floor(Math.random() * CHARACTER_THEMES.length)];

    const newChar: Character = {
      id: crypto.randomUUID(),
      name,
      description: "",
      avatarUrl: avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
      level, xp: 0, rarity, skills: newSkills,
      theme: randomTheme,
      folders: [],
      division: unlockedDivisions, // Always enters the lowest division
      stats: { 
        wins: 0, 
        losses: 0, 
        championshipsWon: 0, 
        worldDuelWins: 0, 
        favoredCount: 0, 
        leaguePoints: 0, 
        towerLevel: 0,
        currentWinStreak: 0,
        maxWinStreak: 0,
        fans: 0,
        lastBattleResults: []
      }
    };

    setCoins(prev => prev - cost);
    setCharacters(prev => [...prev, newChar]);
    setIsCreatingChar(false);
  };

  const handleUpdateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selectedChar?.id === id) setSelectedChar(prev => prev ? ({...prev, ...updates}) : null);
  };

  const handleCreateFolder = (name: string) => {
    if (folders.includes(name)) return alert('Ya existe una carpeta con ese nombre');
    setFolders(prev => [...prev, name]);
  };

  const handleAddToFolder = (charId: string, folder: string) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== charId) return c;
      const currentFolders = c.folders || [];
      if (currentFolders.includes(folder)) return c;
      return { ...c, folders: [...currentFolders, folder] };
    }));
  };

  const handleRemoveFromFolder = (charId: string, folder: string) => {
    setCharacters(prev => prev.map(c => {
      if (c.id !== charId) return c;
      const currentFolders = c.folders || [];
      return { ...c, folders: currentFolders.filter(f => f !== folder) };
    }));
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
        
        // Show level up notification and play sound
        setLevelUpNotification({ name: c.name, level: newLevel });
        soundManager.playLevelUp();
        
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

  // --- Tower of Terror ---
  const generateTowerBot = (level: number): Character => {
    const botNames = ['Sombra', 'Golem', 'Druida', 'Arquero', 'Víbora', 'Titán', 'Spectre', 'Behemoth', 'Phoenix', 'Reaper'];
    return {
      id: `TOWER_BOT_${level}`,
      name: botNames[Math.floor(Math.random() * botNames.length)] + ` Lv${level}`,
      description: '',
      avatarUrl: `https://picsum.photos/seed/${level}_tower/200`,
      level,
      xp: 0,
      rarity: 'Normal',
      division: 1,
      skills: level > 5 ? Array(Math.floor(level / 3)).fill(0).map(() => ({ 
        id: crypto.randomUUID(), 
        name: SKILL_NAMES_POOL[Math.floor(Math.random() * SKILL_NAMES_POOL.length)] 
      })) : [],
      theme: { border: 'from-red-400 to-red-600', bar: 'from-red-500 to-red-700', badge: 'bg-red-600' },
      folders: [],
      stats: { wins: 0, losses: 0, championshipsWon: 0, worldDuelWins: 0, favoredCount: 0, leaguePoints: 0, towerLevel: 0 }
    };
  };

  const handleStartTower = (charId: string) => {
    if (coins < TOWER_COST) return alert(`Necesitas ${TOWER_COST} monedas.`);
    setCoins(prev => prev - TOWER_COST);
    setTower({ charId, currentLevel: 1, inProgress: true });
    const c1 = characters.find(c => c.id === charId);
    if (c1) {
      const botOpponent = generateTowerBot(1);
      setIsBattling({ c1, c2: botOpponent, type: 'Normal', favorId: null });
    }
  };

  const handleTowerBattle = (result: 'win' | 'lose') => {
    if (!tower || towerBattleProcessingRef.current) return;
    towerBattleProcessingRef.current = true;
    
    const charId = tower.charId;
    const currentLevel = tower.currentLevel;
    
    if (result === 'win') {
      if (currentLevel === 10) {
        // Won the entire tower!
        alert('¡Completaste la Torre del Terror!');
        setCharacters(prev => prev.map(c => 
          c.id === charId 
            ? { ...c, stats: { ...c.stats, towerLevel: 10 } }
            : c
        ));
        setTower(null);
        setIsBattling(null);
        towerBattleProcessingRef.current = false;
      } else {
        // Move to next level
        const nextLevel = currentLevel + 1;
        const c1 = characters.find(c => c.id === charId);
        if (c1) {
          const botOpponent = generateTowerBot(nextLevel);
          setTower({ charId, currentLevel: nextLevel, inProgress: true });
          setIsBattling({ c1, c2: botOpponent, type: 'Normal', favorId: null });
          towerBattleProcessingRef.current = false;
        }
      }
    } else {
      // Lost
      setCharacters(prev => prev.map(c => 
        c.id === charId 
          ? { ...c, stats: { ...c.stats, towerLevel: Math.max(c.stats.towerLevel, currentLevel - 1) } }
          : c
      ));
      alert(`Llegaste hasta el nivel ${currentLevel}. Intenta de nuevo!`);
      setTower(null);
      setIsBattling(null);
      towerBattleProcessingRef.current = false;
    }
  };

  const onBattleFinish = (winnerId: string, s1: number, s2: number) => {
    if (!isBattling) return;
    const { c1, c2, type, tId, tName, favorId } = isBattling;

    // Play sounds
    if (winnerId === c1.id) {
      soundManager.playVictory();
    } else {
      soundManager.playDefeat();
    }

    // Compute audience for this duel
    const duelAudience = computeAudience(c1, c2, type);

    const record: BattleRecord = {
      id: crypto.randomUUID(),
      char1Id: c1.id,
      char2Id: 'id' in c2 ? c2.id : 'NPC_PLAYER',
      char2Name: 'id' in c2 ? undefined : c2.name,
      score1: s1, score2: s2, winnerId,
      timestamp: Date.now(),
      battleType: type,
      tournamentId: tId, tournamentName: tName,
      audience: duelAudience
    };

    setHistory(prev => [record, ...prev]);
    // Adjust reputation slightly based on audience and outcome, clamped
    setReputation(prev => {
      const delta = Math.floor(duelAudience / 100) + (winnerId === c1.id ? 3 : 1);
      const next = prev + delta;
      return Math.max(0, Math.min(5000, next));
    });
    
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
            const randomFans = Math.floor(Math.random() * 15) + 1; // 1-15 fans per battle for ALL participants
            
            if (c.id === winnerId) {
                const xpMultiplier = getRarityMultiplier(c.rarity);
                const newWinStreak = (c.stats.currentWinStreak || 0) + 1;
                const maxStreak = Math.max(c.stats.maxWinStreak || 0, newWinStreak);
                const lastResults = [...(c.stats.lastBattleResults || []), 'win' as const].slice(-5);
                
                return { 
                  ...c, 
                  xp: c.xp + (XP_PER_WIN * xpMultiplier), 
                  stats: { 
                    ...c.stats, 
                    wins: c.stats.wins + 1, 
                    worldDuelWins: type === 'Mundial' ? c.stats.worldDuelWins + 1 : c.stats.worldDuelWins,
                    favoredCount: favorId === c.id ? c.stats.favoredCount + 1 : c.stats.favoredCount,
                    leaguePoints: c.stats.leaguePoints + pointsDiff,
                    currentWinStreak: newWinStreak,
                    maxWinStreak: maxStreak,
                    fans: (c.stats.fans || 0) + randomFans,
                    lastBattleResults: lastResults
                  } 
                };
            } else if (c.id === c1.id || ('id' in c2 && c.id === c2.id)) {
                const lastResults = [...(c.stats.lastBattleResults || []), 'loss' as const].slice(-5);
                
                return { 
                  ...c, 
                  stats: { 
                    ...c.stats, 
                    losses: c.stats.losses + 1,
                    favoredCount: favorId === c.id ? c.stats.favoredCount + 1 : c.stats.favoredCount,
                    currentWinStreak: 0,
                    fans: (c.stats.fans || 0) + randomFans,
                    lastBattleResults: lastResults
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
            const relegateToDiv2 = div1Chars.slice(-1);
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

    // Handle Tower of Terror battle outcome AFTER state updates
    setTimeout(() => {
      if (tower && ('id' in c2 && c2.id.startsWith('TOWER_BOT_'))) {
        if (winnerId === c1.id) {
          handleTowerBattle('win');
        } else {
          handleTowerBattle('lose');
        }
        return;
      }
    }, 0);

    if (tId) {
        setTournaments(prevTourneys => prevTourneys.map(t => {
            if (t.id !== tId) return t;

            const updatedMatches = t.matches.map(m => {
                const isThisMatch = (m.char1Id === c1.id && m.char2Id === ('id' in c2 ? c2.id : null)) || (m.char1Id === ('id' in c2 ? c2.id : null) && m.char2Id === c1.id);
                if (isThisMatch && !m.winnerId) {
                  const score1 = m.char1Id === c1.id ? s1 : s2;
                  const score2 = m.char2Id === ('id' in c2 ? c2.id : null) ? s2 : s1;
                  return { ...m, winnerId, score1, score2 };
                }
                return m;
            });

            const playedMatch = updatedMatches.find(m => ((m.char1Id === c1.id && m.char2Id === ('id' in c2 ? c2.id : null)) || (m.char1Id === ('id' in c2 ? c2.id : null) && m.char2Id === c1.id)) && m.winnerId === winnerId);
            let nextMatches = updatedMatches;
            if (playedMatch?.nextMatchId) {
                nextMatches = updatedMatches.map(nm => {
                    if (nm.id === playedMatch.nextMatchId) {
                        if (nm.char1Id === null) return { ...nm, char1Id: winnerId };
                        if (nm.char2Id === null) return { ...nm, char2Id: winnerId };
                    }
                    return nm;
                });
            }

            if (t.format === 'liga' || t.format === 'copa_liga') {
              const leagueMatches = nextMatches.filter(m => m.stage === 'league');
              const playoffMatches = nextMatches.filter(m => m.stage === 'knockout');
              const allLeagueDone = leagueMatches.length > 0 && leagueMatches.every(m => m.winnerId);
              let newMatches = nextMatches;
              let status: 'active' | 'finished' = t.status;
              let winner: string | null = t.winnerId;

              if (t.format === 'liga') {
                if (allLeagueDone) {
                  const standings = computeStandings(t.participantIds, leagueMatches, { stage: 'league' });
                  winner = standings[0]?.id || null;
                  status = 'finished';
                }
              } else if (t.format === 'copa_liga') {
                // Liga phase: all-play-all
                if (allLeagueDone && playoffMatches.length === 0) {
                  // Generate playoff bracket with selected size
                  const playoffSize = Math.min(t.settings?.playoffRound || 2, t.participantIds.length);
                  const standings = computeStandings(t.participantIds, leagueMatches, { stage: 'league' });
                  const qualifiers = standings.slice(0, playoffSize).map(s => s.id);
                  if (qualifiers.length >= 2) {
                    const bracket = buildKnockoutMatches(qualifiers, 'knockout', t.settings?.twoLegs || false);
                    newMatches = [...leagueMatches, ...bracket];
                  } else if (qualifiers.length === 1) {
                    winner = qualifiers[0];
                    status = 'finished';
                  }
                }

                // Check playoff completion
                if (newMatches.filter(m => m.stage === 'knockout').length > 0) {
                  const knockouts = newMatches.filter(m => m.stage === 'knockout');
                  const twoLegsFormat = t.settings?.twoLegs || false;
                  
                  if (twoLegsFormat) {
                    // Group matches by position/round to identify leg pairs
                    const legPairs = new Map<string, TournamentMatch[]>();
                    knockouts.forEach(m => {
                      const key = `${m.round}-${m.position}`;
                      if (!legPairs.has(key)) legPairs.set(key, []);
                      legPairs.get(key)!.push(m);
                    });
                    
                    let allKnockoutsDone = true;
                    legPairs.forEach(legMatches => {
                      if (legMatches.length === 2 && (!legMatches[0].winnerId || !legMatches[1].winnerId)) {
                        allKnockoutsDone = false;
                      }
                    });
                    
                    if (allKnockoutsDone) {
                      const finalPair = Array.from(legPairs.values()).find(m => m[0]?.nextMatchId === null);
                      if (finalPair) {
                        const w1 = getTwoLegsWinner([...finalPair]);
                        if (w1) {
                          winner = w1;
                          status = 'finished';
                        }
                      }
                    }
                  } else {
                    const finalMatch = knockouts.find(m => m.nextMatchId === null);
                    if (finalMatch?.winnerId) {
                      winner = finalMatch.winnerId;
                      status = 'finished';
                    }
                  }
                }
              }

              const newT = { ...t, matches: newMatches, status, winnerId: winner };
              if (status === 'finished' && winner) {
                setCharacters(chars => chars.map(c => c.id === winner ? { ...c, stats: { ...c.stats, championshipsWon: c.stats.championshipsWon + 1 } } : c));
              }
              if (selectedTournament?.id === tId) setSelectedTournament(newT);
              return newT;
            }

            if (t.format === 'grupos') {
              const groupMatches = nextMatches.filter(m => m.stage === 'group');
              const knockoutMatches = nextMatches.filter(m => m.stage === 'knockout');
              const allGroupsDone = groupMatches.length > 0 && groupMatches.every(m => m.winnerId);
              let newMatches = nextMatches;
              let status: 'active' | 'finished' = t.status;
              let winner: string | null = t.winnerId;

              if (allGroupsDone && knockoutMatches.length === 0) {
                const groups = t.settings?.groups || 2;
                const advance = t.settings?.advancePerGroup || 2;
                const qualifiers = getGroupQualifiers(groupMatches, groups, advance);
                if (qualifiers.length >= 2) {
                  const bracket = buildKnockoutMatches(qualifiers, 'knockout', t.settings?.twoLegs || false);
                  newMatches = [...groupMatches, ...bracket];
                } else {
                  const groupedIds = Array.from(new Set(groupMatches.map(m => m.groupId).filter(g => g !== undefined))) as number[];
                  const standingsCombined = groupedIds.flatMap(gId => computeStandings(Array.from(new Set(groupMatches.filter(m => m.groupId === gId).flatMap(m => [m.char1Id, m.char2Id]).filter(Boolean) as string[])), groupMatches, { stage: 'group', groupId: gId }));
                  const top = standingsCombined.sort((a, b) => b.points - a.points)[0];
                  if (top) {
                    winner = top.id;
                    status = 'finished';
                  }
                }
              }

              if (newMatches.some(m => m.stage === 'knockout')) {
                const knockouts = newMatches.filter(m => m.stage === 'knockout');
                const twoLegsFormat = t.settings?.twoLegs || false;
                
                if (twoLegsFormat) {
                  const legPairs = new Map<string, TournamentMatch[]>();
                  knockouts.forEach(m => {
                    const key = `${m.round}-${m.position}`;
                    if (!legPairs.has(key)) legPairs.set(key, []);
                    legPairs.get(key)!.push(m);
                  });
                  
                  let allKnockoutsDone = true;
                  legPairs.forEach(legMatches => {
                    if (legMatches.length === 2 && (!legMatches[0].winnerId || !legMatches[1].winnerId)) {
                      allKnockoutsDone = false;
                    }
                  });
                  
                  if (allKnockoutsDone) {
                    const finalPair = Array.from(legPairs.values()).find(m => m[0]?.nextMatchId === null);
                    if (finalPair) {
                      const w1 = getTwoLegsWinner([...finalPair]);
                      if (w1) {
                        winner = w1;
                        status = 'finished';
                      }
                    }
                  }
                } else {
                  const finalMatch = knockouts.find(m => m.nextMatchId === null);
                  if (finalMatch?.winnerId) {
                    winner = finalMatch.winnerId;
                    status = 'finished';
                  }
                }
              }

              const newT = { ...t, matches: newMatches, status, winnerId: winner };
              if (status === 'finished' && winner) {
                setCharacters(chars => chars.map(c => c.id === winner ? { ...c, stats: { ...c.stats, championshipsWon: c.stats.championshipsWon + 1 } } : c));
              }
              if (selectedTournament?.id === tId) setSelectedTournament(newT);
              return newT;
            }

            // Copa (knockout)
            const knockoutMatches = nextMatches.filter(m => m.stage === 'knockout');
            const twoLegsFormat = t.settings?.twoLegs || false;
            let isFinished = false;
            let finalWinner: string | null = null;

            if (twoLegsFormat) {
              const legPairs = new Map<string, TournamentMatch[]>();
              knockoutMatches.forEach(m => {
                const key = `${m.round}-${m.position}`;
                if (!legPairs.has(key)) legPairs.set(key, []);
                legPairs.get(key)!.push(m);
              });
              
              let allDone = true;
              legPairs.forEach(legMatches => {
                if (legMatches.length === 2 && (!legMatches[0].winnerId || !legMatches[1].winnerId)) {
                  allDone = false;
                }
              });
              
              if (allDone) {
                const finalPair = Array.from(legPairs.values()).find(m => m[0]?.nextMatchId === null);
                if (finalPair) {
                  const w1 = getTwoLegsWinner([...finalPair]);
                  if (w1) {
                    finalWinner = w1;
                    isFinished = true;
                  }
                }
              }
            } else {
              const finalMatch = nextMatches.find(m => m.nextMatchId === null);
              isFinished = finalMatch?.winnerId !== null;
              if (isFinished) finalWinner = finalMatch!.winnerId;
            }

            if (isFinished) {
              setShowConfetti(true);
              soundManager.playTournamentWin();
              setTimeout(() => setShowConfetti(false), 3000);
              setCharacters(chars => chars.map(c => c.id === finalWinner ? { ...c, stats: { ...c.stats, championshipsWon: c.stats.championshipsWon + 1 } } : c));
            }
            const newT = { ...t, matches: nextMatches, status: isFinished ? 'finished' as const : 'active' as const, winnerId: isFinished ? finalWinner : null };
            if (selectedTournament?.id === tId) setSelectedTournament(newT);
            return newT;
        }));
    }
    setIsBattling(null);
  };

  const handleCreateTournament = (name: string, pIds: string[], format: TournamentFormat, settings: TournamentSettings) => {
    if (coins < TOURNEY_COST) return alert(`Necesitas ${TOURNEY_COST} monedas.`);
    if (pIds.length < 2) return alert("Min. 2 gladiadores.");

    let matches: TournamentMatch[] = [];
    if (format === 'copa') {
      matches = buildKnockoutMatches(pIds, 'knockout', settings.twoLegs || false);
    } else if (format === 'liga') {
      const rounds = settings.roundsPerPair || 1;
      matches = buildRoundRobinMatches(pIds, rounds, 'league');
    } else if (format === 'copa_liga') {
      const rounds = settings.roundsPerPair || 1;
      const playoffSize = settings.playoffRound || 2;
      // League phase: all-play-all
      const leagueMatches = buildRoundRobinMatches(pIds, rounds, 'league');
      // We'll generate playoff matches once league is done
      matches = [...leagueMatches];
      settings = { ...settings, playoffRound: playoffSize };
    } else if (format === 'grupos') {
      const groupsCount = Math.max(1, settings.groups || 2);
      const advance = Math.max(1, settings.advancePerGroup || 2);
      const rounds = settings.roundsPerPair || 1;
      const groups = balanceGroups(pIds, groupsCount);
      const groupMatches = groups.flatMap((g, idx) => buildRoundRobinMatches(g, rounds, 'group', idx));
      matches = [...groupMatches];
      // Knockout will be generated once grupos terminen
      settings = { ...settings, groups: groups.length, advancePerGroup: advance };
    }

    setCoins(prev => prev - TOURNEY_COST);
    setTournaments([{ id: crypto.randomUUID(), name, format, settings, participantIds: pIds, matches, status: 'active', winnerId: null }, ...tournaments]);
    setIsCreatingTournament(false);
    setSelectedParticipants(new Set());
    setActiveTab('tournament');
    setNewTournamentFormat('copa');
    setNewRoundsPerPair(1);
    setNewGroupsCount(2);
    setNewAdvancePerGroup(2);
    setNewPlayoffRound(2);
    setNewTwoLegs(false);
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

  // --- Simulate current round (fecha) for league/group stages ---
  const simulateBo5 = (c1: Character, c2: Character) => {
    const LEVEL_PROB_BOOST = 0.02;
    const SKILL_PROB_BOOST = 0.02;
    const FAVOR_PROB_BOOST_LOCAL = 0; // No favoritism in auto-sim
    const INSPIRED_PROB_BOOST_LOCAL = 0.05;

    const inspired = Math.random() < 0.05 ? (Math.random() < 0.5 ? 1 : 2) : 0;
    let prob1 = 0.5 + (c1.level - c2.level) * LEVEL_PROB_BOOST + (c1.skills.length - c2.skills.length) * SKILL_PROB_BOOST;
    prob1 += inspired === 1 ? INSPIRED_PROB_BOOST_LOCAL : 0;
    prob1 -= inspired === 2 ? INSPIRED_PROB_BOOST_LOCAL : 0;
    prob1 += FAVOR_PROB_BOOST_LOCAL; // zero by default
    prob1 = Math.max(0.1, Math.min(0.9, prob1));
    let w1 = 0, w2 = 0;
    for (let i = 0; i < 5; i++) {
      if (Math.random() < prob1) w1++; else w2++;
      if (w1 === 3 || w2 === 3) break;
    }
    const winnerId = w1 > w2 ? c1.id : c2.id;
    return { winnerId, s1: w1, s2: w2 };
  };

  const handleSimulateCurrentRound = (tId: string) => {
    // Collect simulated outcomes to grant XP/wins/losses (no league points)
    const xpResults: Array<{ winnerId: string; loserId: string }> = [];

    setTournaments(prev => prev.map(t => {
      if (t.id !== tId) return t;

      // Helper to set winner/score for a match id
      const applyResult = (matches: TournamentMatch[], m: TournamentMatch, winnerId: string, s1: number, s2: number) => {
        return matches.map(x => x.id === m.id ? ({ ...x, winnerId, score1: s1, score2: s2 }) : x);
      };

      let matches = [...t.matches];
      let status: 'active' | 'finished' = t.status;
      let winner: string | null = t.winnerId;

      if (t.format === 'liga' || t.format === 'copa_liga') {
        const leagueMatches = matches.filter(m => m.stage === 'league');
        if (leagueMatches.length === 0) return t;
        const rounds = Array.from(new Set(leagueMatches.map(m => m.round))).sort((a,b)=>a-b);
        const currentRound = rounds.find(r => !leagueMatches.filter(m => m.round === r).every(m => m.winnerId));
        if (currentRound === undefined) return t; // nothing to simulate
        const roundMatches = leagueMatches.filter(m => m.round === currentRound && !m.winnerId);
        roundMatches.forEach(m => {
          const c1 = characters.find(c => c.id === m.char1Id)!;
          const c2 = characters.find(c => c.id === m.char2Id)!;
          const { winnerId, s1, s2 } = simulateBo5(c1, c2);
          matches = applyResult(matches, m, winnerId, m.char1Id === c1.id ? s1 : s2, m.char2Id === c2.id ? s2 : s1);
          const loserId = winnerId === c1.id ? c2.id : c1.id;
          xpResults.push({ winnerId, loserId });
        });

        if (t.format === 'liga') {
          const allDone = matches.filter(m => m.stage === 'league').every(m => m.winnerId);
          if (allDone) {
            const standings = computeStandings(t.participantIds, matches, { stage: 'league' });
            winner = standings[0]?.id || null;
            status = 'finished';
          }
        } else {
          const leagueDone = matches.filter(m => m.stage === 'league').every(m => m.winnerId);
          const hasKnockout = matches.some(m => m.stage === 'knockout');
          if (leagueDone && !hasKnockout) {
            const size = Math.min(t.settings?.playoffRound || 2, t.participantIds.length);
            const standings = computeStandings(t.participantIds, matches, { stage: 'league' });
            const qualifiers = standings.slice(0, size).map(s => s.id);
            if (qualifiers.length >= 2) {
              const bracket = buildKnockoutMatches(qualifiers, 'knockout', t.settings?.twoLegs || false);
              matches = [...matches, ...bracket];
            } else if (qualifiers.length === 1) {
              winner = qualifiers[0];
              status = 'finished';
            }
          }
        }
      } else if (t.format === 'grupos') {
        // Simulate the current fecha for every group simultaneously
        const groupIds = Array.from(new Set(matches.filter(m => m.stage === 'group' && m.groupId !== undefined).map(m => m.groupId as number))).sort((a,b)=>a-b);
        groupIds.forEach(gId => {
          const groupMatches = matches.filter(m => m.stage === 'group' && m.groupId === gId);
          if (groupMatches.length === 0) return;
          const rounds = Array.from(new Set(groupMatches.map(m => m.round))).sort((a,b)=>a-b);
          const currentRound = rounds.find(r => !groupMatches.filter(m => m.round === r).every(m => m.winnerId));
          if (currentRound === undefined) return;
          const roundMatches = groupMatches.filter(m => m.round === currentRound && !m.winnerId);
          roundMatches.forEach(m => {
            const c1 = characters.find(c => c.id === m.char1Id)!;
            const c2 = characters.find(c => c.id === m.char2Id)!;
            const { winnerId, s1, s2 } = simulateBo5(c1, c2);
            matches = applyResult(matches, m, winnerId, m.char1Id === c1.id ? s1 : s2, m.char2Id === c2.id ? s2 : s1);
            const loserId = winnerId === c1.id ? c2.id : c1.id;
            xpResults.push({ winnerId, loserId });
          });
        });

        const groupMatchesAll = matches.filter(m => m.stage === 'group');
        const allGroupsDone = groupMatchesAll.length > 0 && groupMatchesAll.every(m => m.winnerId);
        const hasKnockout = matches.some(m => m.stage === 'knockout');
        if (allGroupsDone && !hasKnockout) {
          const groups = t.settings?.groups || 2;
          const advance = t.settings?.advancePerGroup || 2;
          const qualifiers = getGroupQualifiers(groupMatchesAll, groups, advance);
          if (qualifiers.length >= 2) {
            const bracket = buildKnockoutMatches(qualifiers, 'knockout', t.settings?.twoLegs || false);
            matches = [...matches, ...bracket];
          } else if (qualifiers.length === 1) {
            winner = qualifiers[0];
            status = 'finished';
          }
        }
      }

      const newT: Tournament = { ...t, matches, status, winnerId: winner };
      if (status === 'finished' && winner) {
        setCharacters(chars => chars.map(c => c.id === winner ? { ...c, stats: { ...c.stats, championshipsWon: c.stats.championshipsWon + 1 } } : c));
      }
      if (selectedTournament?.id === tId) setSelectedTournament(newT);
      return newT;
    }));

    if (xpResults.length > 0) {
      // Tally wins per character and grant XP and wins/losses (no league points)
      const winCount = new Map<string, number>();
      const lossCount = new Map<string, number>();
      xpResults.forEach(r => {
        winCount.set(r.winnerId, (winCount.get(r.winnerId) || 0) + 1);
        lossCount.set(r.loserId, (lossCount.get(r.loserId) || 0) + 1);
      });
      setCharacters(prev => prev.map(c => {
        const wins = winCount.get(c.id) || 0;
        const losses = lossCount.get(c.id) || 0;
        if (!wins && !losses) return c;
        const xpMultiplier = getRarityMultiplier(c.rarity);
        let newXp = c.xp + (wins * XP_PER_WIN * xpMultiplier);
        let newLevel = c.level;
        let newSkills = [...c.skills];
        // Apply level ups based on accumulated XP
        while (true) {
          const xpNeeded = BASE_XP_NEEDED + (newLevel - 1) * XP_INCREMENT_PER_LEVEL;
          if (newXp < xpNeeded) break;
          newXp -= xpNeeded;
          newLevel += 1;
          if (Math.random() < SKILL_CHANCE_ON_LEVEL_UP) {
            newSkills.push({ id: crypto.randomUUID(), name: SKILL_NAMES_POOL[Math.floor(Math.random() * SKILL_NAMES_POOL.length)] });
          }
        }
        
        // Add random fans (1-15) for each battle this character participated in (win + loss)
        const totalBattles = wins + losses;
        let totalFans = 0;
        for (let i = 0; i < totalBattles; i++) {
          totalFans += Math.floor(Math.random() * 15) + 1;
        }
        
        // Update last battle results
        let lastResults = [...(c.stats.lastBattleResults || [])];
        for (let i = 0; i < wins; i++) {
          lastResults.push('win');
        }
        for (let i = 0; i < losses; i++) {
          lastResults.push('loss');
        }
        lastResults = lastResults.slice(-5);
        
        // Update win streak (reset if there are losses)
        let newWinStreak = losses > 0 ? 0 : (c.stats.currentWinStreak || 0) + wins;
        let maxStreak = Math.max(c.stats.maxWinStreak || 0, newWinStreak);
        
        return {
          ...c,
          xp: newXp,
          level: newLevel,
          skills: newSkills,
          stats: {
            ...c.stats,
            wins: c.stats.wins + wins,
            losses: c.stats.losses + losses,
            fans: (c.stats.fans || 0) + totalFans,
            lastBattleResults: lastResults,
            currentWinStreak: newWinStreak,
            maxWinStreak: maxStreak
          }
        };
      }));
    }
  };

  

  return (
  <div className="min-h-screen pb-20 max-w-5xl mx-auto px-4">
      {/* Confetti Effect */}
      {showConfetti && <Confetti />}
      
      {/* Level Up Notification */}
      {levelUpNotification && <LevelUpNotification character={levelUpNotification} />}

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
             <button
               onClick={() => {
                  const nextSound = !soundEnabled;
                  soundManager.setEnabled(nextSound);
                  setSoundEnabled(nextSound);
                  if (!nextSound) {
                    soundManager.setBgmEnabled(false);
                    setBgmEnabled(false);
                  }
               }}
               className="ml-4 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors text-sm"
               title={soundEnabled ? 'Sonido ON' : 'Sonido OFF'}
             >
               <i className={`fas ${soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
             </button>
              <button
                onClick={() => {
                  const next = !bgmEnabled;
                  setBgmEnabled(next);
                  soundManager.setBgmEnabled(next);
                }}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors text-sm"
                title={bgmEnabled ? 'Música ON' : 'Música OFF'}
              >
                <i className={`fas ${bgmEnabled ? 'fa-music' : 'fa-music-slash'}`}></i>
              </button>
                <button
                  onClick={handleExportData}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors text-sm"
                  title="Exportar datos a archivo JSON"
                >
                  <i className="fa-solid fa-file-export"></i>
                </button>
                <button
                  onClick={handleImportClick}
                  className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600 transition-colors text-sm"
                  title="Importar datos desde archivo JSON"
                >
                  <i className="fa-solid fa-file-import"></i>
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
        </div>
        <nav className="flex flex-wrap justify-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700 shadow-xl gap-1">
          {[ 
            { id: 'chars', icon: 'fa-users', label: 'Héroes' },
            { id: 'battles', icon: 'fa-hand-fist', label: 'Duelos' },
            { id: 'tournament', icon: 'fa-trophy', label: 'Torneos' },
            { id: 'tower', icon: 'fa-chess-rook', label: 'Torre' },
            { id: 'shop', icon: 'fa-cart-shopping', label: 'Tienda' },
            { id: 'organizer', icon: 'fa-clipboard-list', label: 'Organizador' },
            { id: 'hall', icon: 'fa-chart-bar', label: 'Estadísticas' },
            { id: 'history', icon: 'fa-clock-rotate-left', label: 'Historial' }
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setSelectedTournament(null); }} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id && !selectedTournament ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700'}`}>
              <i className={`fa-solid ${tab.icon}`}></i> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main View */}
      <main className="mt-6 transition-all duration-300">
        {activeTab === 'chars' && (
          <CharsView 
            characters={characters}
            onCreateClick={() => setIsCreatingChar(true)}
            onSelectChar={setSelectedChar}
            folders={folders}
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
            onCreateFolder={handleCreateFolder}
            onAddToFolder={handleAddToFolder}
            onRemoveFromFolder={handleRemoveFromFolder}
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

        {activeTab === 'tower' && (
          <TowerView 
            characters={characters}
            tower={tower}
            onStartTower={handleStartTower}
          />
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
            onSimulateRound={handleSimulateCurrentRound}
          />
        )}

        {activeTab === 'organizer' && (
          <OrganizerView
            stadiumLevel={stadiumLevel}
            reputation={reputation}
            coins={coins}
            history={history}
            onUpgradeStadium={handleUpgradeStadium}
          />
        )}

        {/* Hall and History views omitted for brevity as they remain largely identical but are still present in full code if needed */}
        {activeTab === 'hall' && (
          <StatsView characters={characters} history={history} />
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
              <div className="relative">
                <input type="file" id="new-char-file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      (document.getElementById('new-char-avatar') as HTMLInputElement).value = ev.target?.result as string;
                    };
                    reader.readAsDataURL(file);
                  }
                }} className="hidden" />
                <label htmlFor="new-char-file" className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl px-5 py-4 font-bold text-slate-400 cursor-pointer transition-colors">
                  <i className="fa-solid fa-image"></i>
                  <span className="text-xs">Subir desde dispositivo</span>
                </label>
              </div>
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
                <div className="space-y-2">
                  <div className="flex items-center gap-2 group bg-slate-800/50 p-2 rounded-xl border border-slate-700">
                    <i className="fa-solid fa-image text-slate-600"></i>
                    <input type="text" id={`edit-avatar-${selectedChar.id}`} defaultValue={selectedChar.avatarUrl} onBlur={(e) => handleUpdateCharacter(selectedChar.id, { avatarUrl: e.target.value })} placeholder="URL de imagen..." className="text-[10px] bg-transparent text-slate-400 outline-none w-full" />
                  </div>
                  <div className="relative">
                    <input type="file" id={`edit-file-${selectedChar.id}`} accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          handleUpdateCharacter(selectedChar.id, { avatarUrl: dataUrl });
                          (document.getElementById(`edit-avatar-${selectedChar.id}`) as HTMLInputElement).value = dataUrl;
                        };
                        reader.readAsDataURL(file);
                      }
                    }} className="hidden" />
                    <label htmlFor={`edit-file-${selectedChar.id}`} className="flex items-center justify-center gap-2 w-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-400 cursor-pointer transition-colors">
                      <i className="fa-solid fa-upload text-xs"></i>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Subir imagen</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-3"><XPBar character={selectedChar} /></div>
              
              {/* Titles Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700">
                  <h4 className="text-[10px] font-black uppercase text-amber-500 mb-3 tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-trophy"></i> Títulos
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Campeonatos de Liga</span>
                      <span className="text-amber-400 font-black">{selectedChar.stats.championshipsWon}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Torneos Ganados</span>
                      <span className="text-amber-400 font-black">{tournaments.filter(t => t.winnerId === selectedChar.id).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">Duelos Mundiales</span>
                      <span className="text-amber-400 font-black">{selectedChar.stats.worldDuelWins}</span>
                    </div>
                  </div>
                </div>

                {/* Rivals Section */}
                <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700">
                  <h4 className="text-[10px] font-black uppercase text-rose-500 mb-3 tracking-widest flex items-center gap-2">
                    <i className="fa-solid fa-crosshairs"></i> Rivales
                  </h4>
                  {(() => {
                    const rivalCounts = new Map<string, number>();
                    history.forEach(record => {
                      if (record.char1Id === selectedChar.id && record.char2Id !== 'NPC_PLAYER') {
                        rivalCounts.set(record.char2Id, (rivalCounts.get(record.char2Id) || 0) + 1);
                      } else if (record.char2Id === selectedChar.id && record.char1Id !== 'NPC_PLAYER') {
                        rivalCounts.set(record.char1Id, (rivalCounts.get(record.char1Id) || 0) + 1);
                      }
                    });
                    const topRivals = Array.from(rivalCounts.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([id]) => characters.find(c => c.id === id))
                      .filter(Boolean);
                    
                    return topRivals.length > 0 ? (
                      <div className="flex items-center gap-3">
                        {topRivals[0] && (
                          <div className="group relative">
                            <img src={topRivals[0].avatarUrl} className="w-16 h-16 rounded-full border-2 border-rose-500 object-cover cursor-pointer hover:scale-110 transition-transform" />
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">{topRivals[0].name}</div>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          {topRivals[1] && (
                            <div className="group relative">
                              <img src={topRivals[1].avatarUrl} className="w-10 h-10 rounded-full border border-rose-500/50 object-cover cursor-pointer hover:scale-110 transition-transform" />
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">{topRivals[1].name}</div>
                            </div>
                          )}
                          {topRivals[2] && (
                            <div className="group relative">
                              <img src={topRivals[2].avatarUrl} className="w-10 h-10 rounded-full border border-rose-500/50 object-cover cursor-pointer hover:scale-110 transition-transform" />
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">{topRivals[2].name}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600 text-xs italic">Sin rivales aún</p>
                    );
                  })()}
                </div>
              </div>

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

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setNewTournamentFormat('copa')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${newTournamentFormat === 'copa' ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>Copa</button>
                        <button onClick={() => setNewTournamentFormat('liga')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${newTournamentFormat === 'liga' ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>Liga</button>
                        <button onClick={() => setNewTournamentFormat('copa_liga')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${newTournamentFormat === 'copa_liga' ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>Copa de liga</button>
                        <button onClick={() => setNewTournamentFormat('grupos')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${newTournamentFormat === 'grupos' ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>Grupos</button>
                      </div>

                      {(newTournamentFormat === 'liga' || newTournamentFormat === 'copa_liga' || newTournamentFormat === 'grupos') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-bold text-slate-300">
                          <label className="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2">
                            <span>Vueltas por cruce</span>
                            <input type="number" min={1} value={newRoundsPerPair} onChange={(e) => setNewRoundsPerPair(Math.max(1, Number(e.target.value)))} className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-white" />
                          </label>
                          {newTournamentFormat === 'copa_liga' && (
                            <label className="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2">
                              <span>Playoff</span>
                              <select value={newPlayoffRound} onChange={(e) => setNewPlayoffRound(Number(e.target.value))} className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-white">
                                <option value={2}>2</option>
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={16}>16</option>
                                <option value={32}>32</option>
                              </select>
                            </label>
                          )}
                          {newTournamentFormat === 'grupos' && (
                            <label className="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2">
                              <span>Grupos</span>
                              <input type="number" min={1} value={newGroupsCount} onChange={(e) => setNewGroupsCount(Math.max(1, Number(e.target.value)))} className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-white" />
                            </label>
                          )}
                          {newTournamentFormat === 'grupos' && (
                            <label className="flex items-center justify-between gap-2 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 sm:col-span-2">
                              <span>Clasifican por grupo</span>
                              <input type="number" min={1} value={newAdvancePerGroup} onChange={(e) => setNewAdvancePerGroup(Math.max(1, Number(e.target.value)))} className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-right text-xs text-white" />
                            </label>
                          )}
                        </div>
                      )}

                      {(newTournamentFormat === 'copa' || newTournamentFormat === 'copa_liga' || newTournamentFormat === 'grupos') && (
                        <label className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-300">
                          <input type="checkbox" checked={newTwoLegs} onChange={(e) => setNewTwoLegs(e.target.checked)} className="accent-amber-500 h-4 w-4" />
                          <span>Ida y vuelta en eliminatorias</span>
                        </label>
                      )}
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 max-h-60 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700">
                        <span className="text-xs font-bold text-slate-300">Selecciona Participantes ({selectedParticipants.size})</span>
                        <button
                          onClick={() => {
                            if (selectedParticipants.size === characters.length) {
                              setSelectedParticipants(new Set());
                            } else {
                              setSelectedParticipants(new Set(characters.map(c => c.id)));
                            }
                          }}
                          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-widest"
                        >
                          {selectedParticipants.size === characters.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {characters.map(c => (
                            <div key={c.id} className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-700 cursor-pointer hover:border-amber-500/50 transition-colors" onClick={() => {
                              const newSet = new Set(selectedParticipants);
                              if (newSet.has(c.id)) {
                                newSet.delete(c.id);
                              } else {
                                newSet.add(c.id);
                              }
                              setSelectedParticipants(newSet);
                            }}>
                              <input type="checkbox" id={`p-${c.id}`} checked={selectedParticipants.has(c.id)} onChange={() => {}} className="accent-amber-500 h-4 w-4 cursor-pointer" />
                              <label htmlFor={`p-${c.id}`} className="text-xs font-bold text-slate-400 truncate cursor-pointer flex-1">{c.name}</label>
                            </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-center text-[10px] font-bold text-amber-500 uppercase tracking-widest">Coste: {TOURNEY_COST} Monedas</p>
                    <div className="flex gap-4 pt-2">
                        <button onClick={() => {
                          setIsCreatingTournament(false);
                          setSelectedParticipants(new Set());
                        }} className="flex-1 px-4 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-xs border border-slate-700">Cancelar</button>
                        <button onClick={() => {
                            const n = (document.getElementById('new-tourney-name') as HTMLInputElement).value;
                            if (n && selectedParticipants.size >= 2) {
                              handleCreateTournament(n, Array.from(selectedParticipants), newTournamentFormat, {
                                roundsPerPair: newRoundsPerPair,
                                groups: newGroupsCount,
                                advancePerGroup: newAdvancePerGroup,
                                balancedGroups: true,
                                playoffRound: newPlayoffRound,
                                twoLegs: newTwoLegs
                              });
                              setSelectedParticipants(new Set());
                            } else alert("Min. 2 gladiadores.");
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
