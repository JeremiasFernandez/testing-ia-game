import React, { useState } from 'react';
import { Character } from '@/types';
import CharacterCard from '@/components/CharacterCard';
import { CHAR_COST } from '@/utils/game';

export default function CharsView({
  characters,
  onCreateClick,
  onSelectChar,
  folders,
  selectedFolder,
  onFolderSelect,
  onCreateFolder,
  onAddToFolder,
  onRemoveFromFolder,
}: {
  characters: Character[];
  onCreateClick: () => void;
  onSelectChar: (c: Character) => void;
  folders: string[];
  selectedFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
  onCreateFolder: (name: string) => void;
  onAddToFolder: (charId: string, folder: string) => void;
  onRemoveFromFolder: (charId: string, folder: string) => void;
}) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [managingChar, setManagingChar] = useState<string | null>(null);

  const filteredChars = selectedFolder 
    ? characters.filter(c => c.folders?.includes(selectedFolder))
    : characters;

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black text-slate-100 uppercase italic">Escuadrón</h2>
        <button onClick={onCreateClick} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-black shadow-lg shadow-indigo-600/20 uppercase text-[10px] tracking-widest group w-full sm:w-auto">
          <div className="flex items-center gap-2 justify-center"><i className="fa-solid fa-plus"></i> <span className="hidden sm:inline">Crear Personaje</span><span className="sm:hidden">Crear</span></div>
          <span className="text-[9px] text-indigo-300 opacity-80">{characters.length < 2 ? 'GRATIS' : `${CHAR_COST}`}</span>
        </button>
      </div>

      {/* Folders Section */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-wide">Carpetas</h3>
          <button 
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="text-[10px] font-black uppercase bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-slate-300"
          >
            <i className="fa-solid fa-folder-plus mr-1"></i> Nueva
          </button>
        </div>
        
        {isCreatingFolder && (
          <div className="flex gap-2 mb-3">
            <input 
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Nombre de carpeta..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
              autoFocus
            />
            <button onClick={handleCreateFolder} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-white text-xs font-bold">
              Crear
            </button>
            <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-slate-300 text-xs font-bold">
              Cancelar
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => onFolderSelect(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedFolder === null 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fa-solid fa-users mr-1"></i> Todos ({characters.length})
          </button>
          {folders.map(folder => {
            const count = characters.filter(c => c.folders?.includes(folder)).length;
            return (
              <button 
                key={folder}
                onClick={() => onFolderSelect(folder)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFolder === folder 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <i className="fa-solid fa-folder mr-1"></i> {folder} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredChars.length === 0 ? (
        <div className="bg-slate-800/40 border-2 border-dashed border-slate-700 rounded-[2.5rem] p-20 text-center text-slate-500 font-bold italic">
          {selectedFolder ? `No hay personajes en "${selectedFolder}"` : 'Inicia tu leyenda invocando un héroe.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChars.map(char => (
            <div key={char.id} className="relative">
              <CharacterCard character={char} onClick={onSelectChar}/>
              {folders.length > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setManagingChar(managingChar === char.id ? null : char.id); }}
                  className="absolute top-4 right-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white w-8 h-8 rounded-lg text-xs font-bold transition-all z-10"
                  title="Gestionar carpetas"
                >
                  <i className="fa-solid fa-folder-tree"></i>
                </button>
              )}
              {managingChar === char.id && folders.length > 0 && (
                <div className="absolute top-14 right-4 bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl z-20 min-w-[160px]">
                  <p className="text-[10px] text-slate-500 font-black uppercase mb-2">Carpetas</p>
                  {folders.map(folder => {
                    const isIn = char.folders?.includes(folder);
                    return (
                      <button
                        key={folder}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isIn) {
                            onRemoveFromFolder(char.id, folder);
                          } else {
                            onAddToFolder(char.id, folder);
                          }
                        }}
                        className={`w-full text-left px-2 py-1 rounded text-xs font-bold mb-1 transition-all ${
                          isIn 
                            ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <i className={`fa-solid ${isIn ? 'fa-check-square' : 'fa-square'} mr-2`}></i>
                        {folder}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
