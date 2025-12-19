
export type CharacterRarity = 'Normal' | 'Excentrico' | 'Supremo' | 'Legendario';

export interface Skill {
  id: string;
  name: string;
}

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
  stats: {
    wins: number;
    losses: number;
    championshipsWon: number;
    worldDuelWins: number;
    favoredCount: number;
    leaguePoints: number;
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
}

export interface TournamentMatch {
  id: string;
  char1Id: string | null;
  char2Id: string | null;
  winnerId: string | null;
  round: number;
  position: number;
  nextMatchId: string | null;
}

export interface Tournament {
  id: string;
  name: string;
  matches: TournamentMatch[];
  participantIds: string[];
  status: 'active' | 'finished';
  winnerId: string | null;
}
