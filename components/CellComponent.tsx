
import React from 'react';
import { Cell } from '../types';
import { NUMBER_COLORS as Colors } from '../constants';

interface CellProps {
  cell: Cell;
  onClick: (x: number, y: number) => void;
  onContextMenu: (e: React.MouseEvent, x: number, y: number) => void;
  gameOver: boolean;
  hinted?: boolean;
}

const CellComponent: React.FC<CellProps> = ({ cell, onClick, onContextMenu, gameOver, hinted }) => {
  const isRevealed = cell.status === 'revealed' || (gameOver && cell.isMine);
  const isFlagged = cell.status === 'flagged';
  const isHidden = cell.status === 'hidden';

  const getDisplayContent = () => {
    if (isFlagged) return '🚩';
    if (!isRevealed) return '';
    if (cell.isMine) return '💥';
    return cell.neighborMines > 0 ? cell.neighborMines : '';
  };

  // Base classes for the cell
  let baseClass = `
    w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center 
    cursor-pointer select-none transition-all duration-200
    rounded-lg text-sm sm:text-xl font-bold border
  `;

  // Status-specific styles
  let statusClass = '';
  if (isRevealed) {
    if (cell.isMine) {
      statusClass = 'bg-rose-600 border-rose-400 shadow-[0_0_20px_rgba(225,29,72,0.6)] z-10 scale-110';
    } else {
      statusClass = 'bg-slate-900/80 border-slate-700/50 backdrop-blur-sm inset-shadow-sm';
    }
  } else {
    statusClass = `
      bg-gradient-to-br from-slate-700 to-slate-800 
      border-slate-600 hover:border-blue-400 hover:from-slate-600 hover:to-slate-700
      shadow-[0_4px_0_0_#1e293b] active:shadow-none active:translate-y-[2px]
    `;
    if (isFlagged) {
      statusClass += ' animate-pulse';
    }
  }

  // Hint styles
  const hintClass = hinted ? 'hint-pulse z-20 scale-105 border-amber-400 border-2' : '';

  return (
    <div
      onClick={() => onClick(cell.x, cell.y)}
      onContextMenu={(e) => onContextMenu(e, cell.x, cell.y)}
      className={`${baseClass} ${statusClass} ${hintClass}`}
    >
      <span className={`
        ${isRevealed && !cell.isMine ? Colors[cell.neighborMines] : 'text-white'}
        ${isRevealed ? 'animate-in zoom-in duration-300' : ''}
      `}>
        {getDisplayContent()}
      </span>
    </div>
  );
};

export default React.memo(CellComponent);
