import { useEffect, useState } from 'react';

export function LevelUpNotification({ character }: { character: { name: string; level: number } }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-8 py-4 rounded-xl font-black shadow-2xl border-2 border-yellow-300 text-lg">
        <div className="flex items-center gap-2">
          <i className="fas fa-star text-2xl"></i>
          {character.name} ¡Subió a Nivel {character.level}!
          <i className="fas fa-star text-2xl"></i>
        </div>
      </div>
    </div>
  );
}
