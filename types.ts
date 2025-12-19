
export type CharacterRarity = 'Normal' | 'Excentrico' | 'Supremo' | 'Legendario';

export interface Skill {
  id: string;
  name: string;
}

export type CharacterTheme = {
  border: string; // Tailwind gradient classes
  bar: string; // Tailwind gradient classes
  badge: string; // Tailwind color classes
};

export interface Character {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  level: number;
  xp: number;
  rarity: CharacterRarity;
  division: number; // 1, 2, or 3
  skills: Skill[];
  theme?: CharacterTheme; // Visual color theme
  folders?: string[]; // Array of folder names this character belongs to
  stats: {
    wins: number;
    losses: number;
    championshipsWon: number;
    worldDuelWins: number;
    favoredCount: number;
    leaguePoints: number;
    towerLevel: number; // 0-10, highest level reached in Tower of Terror
    currentWinStreak: number; // Current consecutive wins
    maxWinStreak: number; // Longest streak ever
    fans: number; // Popularity/fans count (1-15 per battle)
    lastBattleResults: ('win' | 'loss')[]; // Last 5 battle results
  };
}

export interface BattleRecord {
  id: string;
  char1Id: string;
  char2Id: string; // If 'Mundial', this is 'NPC_ID'
  char2Name?: string; // For NPC names
  score1: number;
  score2: number;
  winnerId: string;
  timestamp: number;
  battleType: 'Normal' | 'Torneo' | 'Mundial';
  tournamentId?: string;
  tournamentName?: string;
  audience?: number; // spectators for this duel
}

export type TournamentFormat = 'copa' | 'liga' | 'copa_liga' | 'grupos';

export interface TournamentSettings {
  roundsPerPair?: number; // for liga / copa_liga
  groups?: number; // for grupos
  advancePerGroup?: number; // for grupos
  balancedGroups?: boolean; // for grupos
  playoffRound?: number; // for copa_liga: 2, 4, 8, 16, 32
  twoLegs?: boolean; // ida y vuelta in knockout matches
}

export interface TournamentMatch {
  id: string;
  char1Id: string | null;
  char2Id: string | null;
  winnerId: string | null;
  score1?: number | null;
  score2?: number | null;
  round: number;
  position: number;
  nextMatchId: string | null;
  stage?: 'group' | 'knockout' | 'league';
  groupId?: number; // for group stage identification
  legNumber?: number; // 1 or 2 for two-legs format
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  settings?: TournamentSettings;
  matches: TournamentMatch[];
  participantIds: string[];
  status: 'active' | 'finished';
  winnerId: string | null;
}
