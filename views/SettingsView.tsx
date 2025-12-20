import React, { useState } from 'react';

export default function SettingsView({
  soundEnabled,
  bgmEnabled,
  onToggleSound,
  onToggleBgm,
  onExport,
  onImport,
  onReset,
}: {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  onToggleSound: () => void;
  onToggleBgm: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetConfirm2, setShowResetConfirm2] = useState(false);

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm1 = () => {
    setShowResetConfirm(false);
    setShowResetConfirm2(true);
  };

  const handleResetConfirm2 = () => {
    setShowResetConfirm2(false);
    onReset();
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
    setShowResetConfirm2(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-black text-slate-100 uppercase italic border-b border-slate-800 pb-4 flex items-center gap-3">
        <i className="fa-solid fa-gear text-indigo-400"></i>
        Configuración
      </h2>

      {/* Audio Settings */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
        <h3 className="text-xl font-black text-slate-200 uppercase italic flex items-center gap-2">
          <i className="fa-solid fa-volume-high text-indigo-400"></i>
          Audio
        </h3>

        {/* Sonidos */}
        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-music text-amber-400"></i>
            <div>
              <p className="font-bold text-slate-200">Efectos de Sonido</p>
              <p className="text-xs text-slate-500">Sonidos de duelos, victorias y eventos</p>
            </div>
          </div>
          <button
            onClick={onToggleSound}
            className={`px-6 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
              soundEnabled
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {soundEnabled ? <i className="fa-solid fa-check mr-2"></i> : <i className="fa-solid fa-times mr-2"></i>}
            {soundEnabled ? 'Activados' : 'Desactivados'}
          </button>
        </div>

        {/* Música de Fondo */}
        <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-headphones text-purple-400"></i>
            <div>
              <p className="font-bold text-slate-200">Música de Fondo</p>
              <p className="text-xs text-slate-500">Música ambiental del juego</p>
            </div>
          </div>
          <button
            onClick={onToggleBgm}
            className={`px-6 py-2 rounded-xl font-bold uppercase text-sm transition-all ${
              bgmEnabled
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {bgmEnabled ? <i className="fa-solid fa-check mr-2"></i> : <i className="fa-solid fa-times mr-2"></i>}
            {bgmEnabled ? 'Activada' : 'Desactivada'}
          </button>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 space-y-4">
        <h3 className="text-xl font-black text-slate-200 uppercase italic flex items-center gap-2">
          <i className="fa-solid fa-floppy-disk text-cyan-400"></i>
          Gestión de Datos
        </h3>

        {/* Guardar */}
        <button
          onClick={onExport}
          className="w-full flex items-center gap-3 bg-slate-900/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors text-left"
        >
          <i className="fa-solid fa-download text-cyan-400 text-lg"></i>
          <div className="flex-1">
            <p className="font-bold text-slate-200">Guardar Partida</p>
            <p className="text-xs text-slate-500">Descarga un archivo JSON con tu progreso</p>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-600"></i>
        </button>

        {/* Cargar */}
        <button
          onClick={onImport}
          className="w-full flex items-center gap-3 bg-slate-900/50 hover:bg-slate-800 p-4 rounded-xl border border-slate-700 transition-colors text-left"
        >
          <i className="fa-solid fa-upload text-cyan-400 text-lg"></i>
          <div className="flex-1">
            <p className="font-bold text-slate-200">Cargar Partida</p>
            <p className="text-xs text-slate-500">Carga una partida guardada desde archivo JSON</p>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-600"></i>
        </button>
      </div>

      {/* Reset Game */}
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-rose-700/50 space-y-4">
        <h3 className="text-xl font-black text-slate-200 uppercase italic flex items-center gap-2">
          <i className="fa-solid fa-exclamation-triangle text-rose-400"></i>
          Zona Peligrosa
        </h3>

        <button
          onClick={handleResetClick}
          className="w-full flex items-center gap-3 bg-rose-900/20 hover:bg-rose-900/30 p-4 rounded-xl border border-rose-700 transition-colors text-left"
        >
          <i className="fa-solid fa-trash text-rose-400 text-lg"></i>
          <div className="flex-1">
            <p className="font-bold text-rose-300">Reiniciar Partida</p>
            <p className="text-xs text-rose-500/80">Elimina TODO tu progreso. No se puede deshacer.</p>
          </div>
          <i className="fa-solid fa-chevron-right text-slate-600"></i>
        </button>

        {/* First Confirmation */}
        {showResetConfirm && !showResetConfirm2 && (
          <div className="bg-rose-900/30 border border-rose-700 rounded-xl p-4 space-y-3">
            <p className="font-bold text-rose-300">
              <i className="fa-solid fa-exclamation-circle mr-2"></i>
              ¿Estás seguro? Se perderán TODOS los héroes, monedas y progreso.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResetConfirm1}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all"
              >
                Sí, continuar
              </button>
              <button
                onClick={handleResetCancel}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Second Confirmation */}
        {showResetConfirm2 && (
          <div className="bg-rose-900/40 border-2 border-rose-600 rounded-xl p-4 space-y-3 animate-pulse">
            <p className="font-black text-rose-200 text-lg">
              <i className="fa-solid fa-warning mr-2"></i>
              ¡ÚLTIMA CONFIRMACIÓN! Esto no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResetConfirm2}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-black uppercase text-sm transition-all shadow-lg shadow-rose-600/30"
              >
                <i className="fa-solid fa-trash mr-2"></i>
                Reiniciar TODO
              </button>
              <button
                onClick={handleResetCancel}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg font-bold uppercase text-sm transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center text-sm text-slate-400 italic">
        <i className="fa-solid fa-info-circle mr-2"></i>
        Los cambios de audio se aplican inmediatamente.
      </div>
    </div>
  );
}
