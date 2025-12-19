import React from 'react';
import { Character } from '@/types';
import CharacterCard from '@/components/CharacterCard';
import { CHAR_COST } from '@/utils/game';

export default function CharsView({
  characters,
  onCreateClick,
  onSelectChar,
}: {
  characters: Character[];
  onCreateClick: () => void;
  onSelectChar: (c: Character) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-100 uppercase italic">Escuadrón</h2>
        <button onClick={onCreateClick} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 uppercase text-[10px] tracking-widest group">
          <div className="flex items-center gap-2"><i className="fa-solid fa-plus"></i> Crear Personaje</div>
          <span className="text-[9px] text-indigo-300 opacity-80">{characters.length < 2 ? 'GRATIS' : `COSTE: ${CHAR_COST}`}</span>
        </button>
      </div>
      {characters.length === 0 ? (
        <div className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-[2.5rem] p-20 text-center text-slate-500 font-bold italic">Inicia tu leyenda invocando un héroe.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{characters.map(char => (<CharacterCard key={char.id} character={char} onClick={onSelectChar}/>))}</div>
      )}
    </div>
  );
}
