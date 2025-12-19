import React, { useState } from 'react';
import { Character } from '@/types';
import { TOWER_COST } from '@/utils/game';

export default function TowerView({
  characters,
  tower,
  onStartTower,
}: {
  characters: Character[];
  tower: { charId: string; currentLevel: number; inProgress: boolean } | null;
  onStartTower: (charId: string) => void;
}) {
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  if (tower && tower.inProgress) {
    const char = characters.find(c => c.id === tower.charId);
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-gradient-to-br from-red-900/30 to-black border-2 border-red-600 rounded-3xl p-8">
          <h2 className="text-4xl font-black text-red-400 uppercase tracking-tighter mb-2">Torre del Terror</h2>
          <p className="text-red-300 text-sm italic">¡En batalla!</p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-black text-slate-100">Nivel {tower.currentLevel} / 10</h3>
          <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border-2 border-red-600">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-700 h-full transition-all"
              style={{ width: `${(tower.currentLevel / 10) * 100}%` }}
            ></div>
          </div>
          <p className="text-slate-400 text-sm">
            {char?.name} está enfrentándose al nivel {tower.currentLevel}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-red-900/40 via-slate-900 to-black border-2 border-red-600/60 rounded-3xl p-10 shadow-2xl">
        <div className="flex items-start gap-6">
          <div className="text-5xl">🏰</div>
          <div>
            <h2 className="text-4xl font-black text-red-400 uppercase tracking-tighter mb-2">Torre del Terror</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Elige un personaje y enfréntate a 10 bots consecutivos del nivel 1 al 10. 
              Cada victoria te acerca a la cima. ¿Llegarás al final?
            </p>
            <div className="mt-4 flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-lg w-fit border border-amber-500/40">
              <i className="fa-solid fa-coins text-amber-500"></i>
              <span className="text-amber-400 font-bold">Costo: {TOWER_COST} monedas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-black text-slate-100 mb-4 uppercase">Selecciona tu Gladiador</h3>
        {characters.length === 0 ? (
          <p className="text-slate-500 italic text-center py-8">Necesitas al menos un personaje.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedChar === char.id
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-slate-700 bg-slate-900/50 hover:border-red-600/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={char.avatarUrl} 
                    alt={char.name} 
                    className="w-12 h-12 rounded-full border border-slate-600"
                  />
                  <div>
                    <p className="font-bold text-slate-100">{char.name}</p>
                    <p className="text-xs text-slate-500">Nivel {char.level} • Mejor: Nivel {char.stats.towerLevel}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedChar && (
        <div className="flex gap-4">
          <button
            onClick={() => onStartTower(selectedChar)}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-6 py-4 rounded-2xl font-black uppercase shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-tower"></i> Entrar a la Torre
          </button>
          <button
            onClick={() => setSelectedChar(null)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-4 rounded-2xl font-black uppercase"
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-sm font-black text-slate-400 mb-3 uppercase">Cómo funciona</h3>
        <ul className="space-y-2 text-slate-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-red-400 font-bold">1.</span>
            <span>Selecciona un personaje y paga {TOWER_COST} monedas</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 font-bold">2.</span>
            <span>Enfrenta 10 bots consecutivos (nivel 1 al 10)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 font-bold">3.</span>
            <span>Si pierdes, tu progreso se guarda. Intenta nuevamente.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 font-bold">4.</span>
            <span>Completa los 10 niveles para conquistar la Torre del Terror</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
