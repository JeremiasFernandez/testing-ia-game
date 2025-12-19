import React from 'react';
import { BattleRecord, Character } from '@/types';

export default function HistoryView({ history, characters }: { history: BattleRecord[]; characters: Character[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-slate-100 uppercase italic border-b border-slate-800 pb-4">Historial de Crónicas</h2>
      {history.map(record => (
        <div key={record.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <img src={characters.find(c => c.id === record.char1Id)?.avatarUrl} className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover" />
            <span className="font-black uppercase italic text-slate-200">{characters.find(c => c.id === record.char1Id)?.name || '---'}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="bg-slate-900 px-6 py-2 rounded-2xl font-black text-2xl border border-slate-700">
              <span className={record.winnerId === record.char1Id ? 'text-indigo-400' : 'text-slate-600'}>{record.score1}</span>
              <span className="mx-4 text-slate-800">-</span>
              <span className={record.winnerId !== record.char1Id ? 'text-rose-400' : 'text-slate-600'}>{record.score2}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 flex-1 justify-end">
            <span className="font-black uppercase italic text-slate-200">{record.char2Name || characters.find(c => c.id === record.char2Id)?.name || 'NPC'}</span>
            <img src={characters.find(c => c.id === record.char2Id)?.avatarUrl || `https://picsum.photos/seed/${record.char2Name}/100`} className="w-12 h-12 rounded-full border-2 border-rose-500 object-cover" />
          </div>
        </div>
      ))}
    </div>
  );
}
