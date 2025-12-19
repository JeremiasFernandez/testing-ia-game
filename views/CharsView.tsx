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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-100 uppercase italic">Escuadrón</h2>
        <button onClick={onCreateClick} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 uppercase text-[10px] tracking-widest group w-full sm:w-auto">
          <div className="flex items-center gap-2 justify-center"><i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">Crear Personaje</span><span className="sm:hidden">Crear</span></div>
          <span className="text-[9px] text-indigo-300 opacity-80">{characters.length < 2 ? 'GRATIS' : `${CHAR_COST}`}</span>
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
