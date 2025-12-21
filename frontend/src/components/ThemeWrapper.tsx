import React, { useMemo } from 'react';
import '../styles/Chalkboard.css';
import { useGame } from '../context/GameContext';

const mulberry32 = (seed: number) => {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

const QUOTES = [
  "A-A-RON", "BALAKAY", "DE-NICE", "JAY-QUELLIN", "TIM-O-THEE",
  "O-SHAG-HENNESSY", "INSOBORDINATE!", "CHICANEROUS!", "DEPLORABLE!", 
  "I GOT MY EYE ON YOU", "YA DONE MESSED UP NOW!", "PRESENT.",
  "MR. GARVEY", "CLASS IS IN SESSION", "DON'T TEST ME", "SON OF A BITCH!"
];

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scatteredQuotes = useMemo(() => {
    const seed = 46; // Change seed for a different layout
    const random = mulberry32(seed);

    const cols = 5;
    const rows = 4; // Fewer rows to prevent vertical clutter
    const cells: { r: number; c: number }[] = [];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ r, c });
      }
    }

    const shuffledCells = cells.sort(() => random() - 0.5);

    return QUOTES.map((text, i) => {
        const cell = shuffledCells[i % shuffledCells.length];
        const jitterX = (random() - 0.5) * 10; 
        const jitterY = (random() - 0.5) * 15;
        
        const left = (cell.c * (100 / cols)) + 8 + jitterX;
        const top = (cell.r * (100 / rows)) + 12 + jitterY;

        return {
            text,
            top: `${top}%`,
            left: `${left}%`,
            rotate: `${(random() - 0.5) * 18}deg`,
            fontSize: `${0.9 + random() * 0.4}rem`, 
            isYellow: i % 4 === 0
        };
    });
  }, []);
  const { gameState, roomCode } = useGame() || {};

  return (
    <div className="chalkboard-theme">
      {/* Only show the scattered chalk text on the Join screen (no gameState & no roomCode) */}
      {!gameState && !roomCode && scatteredQuotes.map((q, i) => (
        <div 
          key={`${q.text}-${i}`}
          className="bg-chalk-text chalk-textured-text"
          style={{
            top: q.top,
            left: q.left,
            transform: `rotate(${q.rotate})`,
            fontSize: q.fontSize,
            filter: q.isYellow ? 'hue-rotate(340deg) saturate(200%)' : 'none'
          }}
        >
          {q.text}
        </div>
      ))}

      <div className="chalkboard-surface">
        {children}
      </div>

      <div className="chalk-tray" />
    </div>
  );
};