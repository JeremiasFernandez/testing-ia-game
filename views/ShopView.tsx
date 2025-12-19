import React from 'react';
import { SHOP_OFFERS } from '@/utils/game';

export default function ShopView({
  onBuy,
}: {
  onBuy: (name: string, level: number, skills: number, price: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 mb-10">
        <h2 className="text-4xl font-black text-slate-100 uppercase italic">Mercado de Elite</h2>
        <p className="text-slate-500">Recluta guerreros veteranos para dominar las ligas.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SHOP_OFFERS.map(offer => {
          const skills = Math.min(Math.floor(offer.level / 2), 5);
          return (
            <div key={offer.level} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 flex flex-col items-center text-center group hover:border-indigo-500 transition-all shadow-xl">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-black text-3xl mb-4 border border-indigo-500/20">Lv {offer.level}</div>
              <h3 className="text-white font-black text-xl uppercase italic">Comandante Élite</h3>
              <p className="text-slate-500 text-xs mt-2 italic">Entrenado con {skills} habilidades.</p>
              <div className="mt-8 w-full pt-8 border-t border-slate-700 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-coins text-amber-500"></i>
                  <span className="text-white font-black text-2xl">{offer.price.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => {
                    const n = prompt('Nombra al nuevo recluta:');
                    if (n) onBuy(n, offer.level, skills, offer.price);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95"
                >COMPRAR</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
