import React, { useState } from 'react';
import { SHOP_OFFERS, COSMETICS } from '@/utils/game';
import { Character } from '@/types';

const SELL_PRICES: Record<number, number> = {
  1: 50, 2: 55, 3: 100, 4: 250, 5: 500, 6: 800, 7: 1000, 8: 1500, 9: 2000, 10: 5000,
  11: 5500, 12: 9000, 13: 10000, 14: 11000, 15: 15000, 16: 19000, 17: 20000,
};

const calculateSellPrice = (char: Character): number => {
  const basePrice = SELL_PRICES[char.level] || 20000;
  const skillBonus = 1 + (char.skills.length * 0.1);
  return Math.floor(basePrice * skillBonus);
};

type ShopSection = 'buy' | 'sell' | 'cosmetics';

export default function ShopView({
  onBuy,
  characters,
  onSell,
  coins,
  onBuyCosmetic,
  onEquipCosmetic,
  onUnequipCosmetic,
}: {
  onBuy: (name: string, level: number, skills: number, price: number) => void;
  characters: Character[];
  onSell: (charId: string, price: number) => void;
  coins: number;
  onBuyCosmetic: (charId: string, cosmeticId: string, price: number) => void;
  onEquipCosmetic: (charId: string, cosmeticId: string) => void;
  onUnequipCosmetic: (charId: string, cosmeticId: string) => void;
}) {
  const [activeSection, setActiveSection] = useState('buy' as ShopSection);
  const [selectedCharForCosmetics, setSelectedCharForCosmetics] = useState(null as Character | null);

  const getCharacterCosmetics = (charId: string) => {
    const char = characters.find(c => c.id === charId);
    return char?.cosmetics || [];
  };

  const getEquippedCosmetics = (charId: string) => {
    const char = characters.find(c => c.id === charId);
    return char?.equippedCosmetics || [];
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-4xl font-black text-slate-100 uppercase italic">Mercado de Elite</h2>
        <p className="text-slate-500">Recluta guerreros, vende héroes o personaliza con cosméticos.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => setActiveSection('buy')}
            className={`px-6 py-3 rounded-xl font-black uppercase text-xs transition-all ${
              activeSection === 'buy'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fa-solid fa-cart-shopping mr-2"></i>Héroes
          </button>
          <button
            onClick={() => setActiveSection('sell')}
            className={`px-6 py-3 rounded-xl font-black uppercase text-xs transition-all ${
              activeSection === 'sell'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fa-solid fa-hand-holding-dollar mr-2"></i>Vender
          </button>
          <button
            onClick={() => setActiveSection('cosmetics')}
            className={`px-6 py-3 rounded-xl font-black uppercase text-xs transition-all ${
              activeSection === 'cosmetics'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Cosméticos
          </button>
        </div>
      </div>
      {activeSection === 'buy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SHOP_OFFERS.map(offer => {
          const skills = Math.min(Math.floor(offer.level / 2), 5);
          return (
            <div key={offer.level} className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 flex flex-col items-center text-center group hover:border-indigo-500 transition-all shadow-xl">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 font-black text-3xl mb-4 border border-indigo-500/20">Lv {offer.level}</div>
              <h3 className="text-white font-black text-xl uppercase italic">Heroe</h3>
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
      )}

      {activeSection === 'sell' && (
        <div>
          {characters.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa-solid fa-users-slash text-slate-700 text-6xl mb-4"></i>
              <p className="text-slate-500 text-lg font-bold">No tienes héroes para vender</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map(char => {
                const sellPrice = calculateSellPrice(char);
                return (
                  <div
                    key={char.id}
                    className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 hover:border-amber-500 transition-all shadow-xl"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={char.avatarUrl}
                        alt={char.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-lg truncate uppercase italic">{char.name}</h3>
                        <p className="text-slate-500 text-xs">Nivel {char.level} • {char.skills.length} habilidades</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Precio base:</span>
                        <span className="text-slate-300 font-bold">{(SELL_PRICES[char.level] || 20000).toLocaleString()}</span>
                      </div>
                      {char.skills.length > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Bonus habilidades:</span>
                          <span className="text-indigo-400 font-bold">+{char.skills.length * 10}%</span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                        <span className="text-amber-400 font-black text-xs uppercase">Precio total:</span>
                        <div className="flex items-center gap-2">
                          <i className="fa-solid fa-coins text-amber-500"></i>
                          <span className="text-white font-black text-xl">{sellPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`¿Vender a ${char.name} por ${sellPrice.toLocaleString()} monedas?`)) {
                          onSell(char.id, sellPrice);
                        }
                      }}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-3 rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform"
                    >
                      <i className="fa-solid fa-hand-holding-dollar mr-2"></i>Vender
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSection === 'cosmetics' && (
        <div className="space-y-6">
          {characters.length === 0 ? (
            <div className="text-center py-20">
              <i className="fa-solid fa-users-slash text-slate-700 text-6xl mb-4"></i>
              <p className="text-slate-500 text-lg font-bold">Necesitas héroes para comprar cosméticos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cosmetics Catalog */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-2xl font-black text-slate-200 uppercase italic">Catálogo de Cosméticos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COSMETICS.map(cosmetic => {
                    const owned = selectedCharForCosmetics?.cosmetics?.includes(cosmetic.id) ?? false;
                    const equipped = selectedCharForCosmetics?.equippedCosmetics?.includes(cosmetic.id) ?? false;
                    return (
                      <div key={cosmetic.id} className={`p-4 rounded-xl border-2 transition-all ${
                        equipped ? 'border-amber-500 bg-amber-900/20' : owned ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-900/30'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-3xl mb-2">{cosmetic.emoji}</div>
                            <h4 className="font-black text-slate-200">{cosmetic.name}</h4>
                            <p className="text-xs text-slate-500">{cosmetic.type}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 font-black text-amber-400">
                              <i className="fa-solid fa-coins text-sm"></i>
                              {cosmetic.price}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{cosmetic.description}</p>
                        {!selectedCharForCosmetics ? (
                          <button disabled className="w-full bg-slate-700 text-slate-500 py-2 rounded-lg text-xs font-bold uppercase opacity-50">
                            Selecciona un héroe
                          </button>
                        ) : owned ? (
                          equipped ? (
                            <button
                              onClick={() => onUnequipCosmetic(selectedCharForCosmetics.id, cosmetic.id)}
                              className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 rounded-lg text-xs font-bold uppercase transition-all"
                            >
                              <i className="fa-solid fa-check mr-1"></i>Equipado - Desactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => onEquipCosmetic(selectedCharForCosmetics.id, cosmetic.id)}
                              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold uppercase transition-all"
                            >
                              <i className="fa-solid fa-star mr-1"></i>Equipar
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              if (!selectedCharForCosmetics) return;
                              if (coins >= cosmetic.price) {
                                if (confirm(`¿Comprar "${cosmetic.name}" por ${cosmetic.price} monedas para ${selectedCharForCosmetics.name}?`)) {
                                  onBuyCosmetic(selectedCharForCosmetics.id, cosmetic.id, cosmetic.price);
                                }
                              } else {
                                alert(`Necesitas ${cosmetic.price - coins} monedas más.`);
                              }
                            }}
                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                              coins >= cosmetic.price
                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                : 'bg-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <i className="fa-solid fa-cart-plus mr-1"></i>Comprar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Character Selector */}
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-200 uppercase italic">Tu Héroe</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {characters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => setSelectedCharForCosmetics(char)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                        selectedCharForCosmetics?.id === char.id
                          ? 'border-indigo-500 bg-indigo-900/30'
                          : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <img src={char.avatarUrl} alt={char.name} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-bold text-slate-200 truncate">{char.name}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        <p>Cosméticos: {char.cosmetics?.length || 0}</p>
                        <p>Equipados: {char.equippedCosmetics?.length || 0}/3</p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedCharForCosmetics && (
                  <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 space-y-2">
                    <h4 className="font-black text-slate-300 text-sm">Equipados:</h4>
                    {selectedCharForCosmetics.equippedCosmetics && selectedCharForCosmetics.equippedCosmetics.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCharForCosmetics.equippedCosmetics.map(cosmeticId => {
                          const cosmetic = COSMETICS.find(c => c.id === cosmeticId);
                          return cosmetic ? (
                            <div key={cosmetic.id} className="flex items-center justify-between bg-amber-900/30 border border-amber-700 p-2 rounded text-xs">
                              <span className="text-amber-300 font-bold">{cosmetic.emoji} {cosmetic.name}</span>
                              <button
                                onClick={() => onUnequipCosmetic(selectedCharForCosmetics.id, cosmetic.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Sin cosméticos equipados</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}    </div>
  );
}