
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cell, Difficulty, GameStatus, AIHint } from './types';
import { DIFFICULTY_CONFIG } from './constants';
import CellComponent from './components/CellComponent';
import { getAIHint } from './services/geminiService';

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [time, setTime] = useState(0);
  const [flagsCount, setFlagsCount] = useState(0);
  const [hint, setHint] = useState<AIHint | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const timerRef = useRef<number | null>(null);

  const settings = DIFFICULTY_CONFIG[difficulty];

  const initializeBoard = useCallback(() => {
    const newBoard: Cell[][] = [];
    for (let x = 0; x < settings.rows; x++) {
      const row: Cell[] = [];
      for (let y = 0; y < settings.cols; y++) {
        row.push({
          x,
          y,
          isMine: false,
          status: 'hidden',
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameStatus('ready');
    setTime(0);
    setFlagsCount(0);
    setHint(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [settings]);

  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = window.setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  const placeMines = (startRow: number, startCol: number, currentBoard: Cell[][]) => {
    let minesPlaced = 0;
    while (minesPlaced < settings.mines) {
      const r = Math.floor(Math.random() * settings.rows);
      const c = Math.floor(Math.random() * settings.cols);
      if ((Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1) || currentBoard[r][c].isMine) continue;
      currentBoard[r][c].isMine = true;
      minesPlaced++;
    }
    for (let r = 0; r < settings.rows; r++) {
      for (let c = 0; c < settings.cols; c++) {
        if (currentBoard[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < settings.rows && nc >= 0 && nc < settings.cols && currentBoard[nr][nc].isMine) count++;
          }
        }
        currentBoard[r][c].neighborMines = count;
      }
    }
  };

  const revealCell = (r: number, c: number, currentBoard: Cell[][]) => {
    if (currentBoard[r][c].status !== 'hidden') return;
    currentBoard[r][c].status = 'revealed';
    if (currentBoard[r][c].isMine) {
      setGameStatus('lost');
      return;
    }
    if (currentBoard[r][c].neighborMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < settings.rows && nc >= 0 && nc < settings.cols) revealCell(nr, nc, currentBoard);
        }
      }
    }
  };

  const checkWin = (currentBoard: Cell[][]) => {
    let unrevealedSafeCells = 0;
    for (let r = 0; r < settings.rows; r++) {
      for (let c = 0; c < settings.cols; c++) {
        if (!currentBoard[r][c].isMine && currentBoard[r][c].status !== 'revealed') unrevealedSafeCells++;
      }
    }
    if (unrevealedSafeCells === 0) setGameStatus('won');
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    if (gameStatus === 'ready') {
      placeMines(r, c, newBoard);
      setGameStatus('playing');
    }
    if (newBoard[r][c].status === 'flagged') return;
    revealCell(r, c, newBoard);
    setBoard(newBoard);
    setHint(null);
    checkWin(newBoard);
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameStatus !== 'playing' && gameStatus !== 'ready') return;
    const newBoard = board.map(row => row.map(cell => ({ ...cell })));
    if (newBoard[r][c].status === 'revealed') return;
    if (newBoard[r][c].status === 'hidden') {
      newBoard[r][c].status = 'flagged';
      setFlagsCount(prev => prev + 1);
    } else {
      newBoard[r][c].status = 'hidden';
      setFlagsCount(prev => prev - 1);
    }
    setBoard(newBoard);
    setHint(null);
  };

  const handleAskAI = async () => {
    if (gameStatus !== 'playing') return;
    setIsAiLoading(true);
    setHint(null);
    const aiHint = await getAIHint(board);
    setHint(aiHint);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Intro Modal Overlay */}
      {showIntro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/50 rounded-[2.5rem] shadow-[0_0_100px_rgba(37,99,235,0.2)] overflow-hidden relative animate-in fade-in zoom-in duration-500">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter text-white digital-font mb-2">
                MISSION BRIEFING
              </h2>
              <p className="text-blue-100 text-sm font-bold uppercase tracking-[0.3em] opacity-80">
                Strategic Intelligence Protocol v3.0
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-8 sm:p-12 bg-slate-900/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-2xl">
                      🖱️
                    </div>
                    <div>
                      <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Left Click</h4>
                      <p className="text-slate-400 text-sm leading-snug">안전하다고 생각되는 구역의 데이터를 스캔하여 공개합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-2xl">
                      🚩
                    </div>
                    <div>
                      <h4 className="text-rose-400 text-xs font-black uppercase tracking-widest mb-1">Right Click</h4>
                      <p className="text-slate-400 text-sm leading-snug">지뢰가 의심되는 위험 구역에 경고 마커를 설치합니다.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center text-2xl">
                      ✨
                    </div>
                    <div>
                      <h4 className="text-purple-400 text-xs font-black uppercase tracking-widest mb-1">AI Analyst</h4>
                      <p className="text-slate-400 text-sm leading-snug">Gemini AI가 보드 전체를 분석하여 다음 전략적 이동을 제안합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-2xl">
                      🎯
                    </div>
                    <div>
                      <h4 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Objective</h4>
                      <p className="text-slate-400 text-sm leading-snug">모든 지뢰를 찾아내고 모든 안전 구역을 확보하여 시스템을 안정화하십시오.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIntro(false)}
                className="w-full py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-lg tracking-[0.4em] rounded-2xl shadow-[0_10px_40px_rgba(37,99,235,0.4)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-4 group"
              >
                <span>INITIATE MISSION</span>
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-12 gap-8 z-10 transition-all duration-700 ${showIntro ? 'blur-sm opacity-20' : ''}`}>
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 drop-shadow-[0_0_15px_rgba(129,140,248,0.4)]">
            NEON MINES
          </h1>
          <p className="text-slate-400 text-sm sm:text-lg font-medium tracking-wide mt-2">
            The Future of Strategic Logic <span className="text-blue-500 mx-1">/</span> <span className="text-indigo-400">Gemini AI Enhanced</span>
          </p>
        </div>

        <div className="flex gap-1 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-xl shadow-2xl">
          {(Object.keys(Difficulty) as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficulty(diff)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 tracking-widest ${
                difficulty === diff
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {diff === Difficulty.BEGINNER ? 'LEVEL 01' : diff === Difficulty.INTERMEDIATE ? 'LEVEL 02' : 'LEVEL 03'}
            </button>
          ))}
        </div>
      </header>

      <main className={`w-full max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-10 z-10 transition-all duration-700 ${showIntro ? 'blur-sm opacity-20 scale-95 pointer-events-none' : ''}`}>
        {/* Game Area */}
        <div className="xl:col-span-8 flex flex-col items-center">
          <div className="w-full bg-slate-900/60 backdrop-blur-xl p-6 rounded-t-3xl border-x border-t border-slate-700/50 flex justify-between items-center shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Mines Left</span>
                <div className="bg-black/40 px-6 py-2 rounded-xl border border-rose-500/30 min-w-[100px] text-center shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]">
                  <span className="text-2xl digital-font text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]">
                    {Math.max(0, settings.mines - flagsCount).toString().padStart(3, '0')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Runtime</span>
                <div className="bg-black/40 px-6 py-2 rounded-xl border border-blue-500/30 min-w-[100px] text-center shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]">
                  <span className="text-2xl digital-font text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                    {time.toString().padStart(3, '0')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={initializeBoard}
              className="group w-16 h-16 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full text-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-2 border-slate-600 active:scale-95 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {gameStatus === 'won' ? '🥇' : gameStatus === 'lost' ? '💀' : '🕹️'}
            </button>

            <button
              onClick={handleAskAI}
              disabled={isAiLoading || gameStatus !== 'playing'}
              className={`
                px-8 py-3 rounded-2xl font-black text-sm tracking-widest flex items-center gap-3 transition-all duration-500
                ${isAiLoading || gameStatus !== 'playing' 
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                  : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] shadow-xl active:scale-95'}
              `}
            >
              {isAiLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="animate-pulse">✨</span>
                  AI ANALYSIS
                </>
              )}
            </button>
          </div>

          <div className="w-full bg-slate-900/80 backdrop-blur-2xl p-8 rounded-b-3xl border border-slate-700/50 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] overflow-auto flex justify-center custom-scrollbar">
            <div 
              className="grid gap-1.5 p-2 bg-slate-950/50 rounded-2xl border border-slate-800/50"
              style={{
                gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))`,
                width: 'max-content'
              }}
            >
              {board.map((row, x) =>
                row.map((cell, y) => (
                  <CellComponent
                    key={`${x}-${y}`}
                    cell={cell}
                    onClick={handleCellClick}
                    onContextMenu={handleContextMenu}
                    gameOver={gameStatus === 'lost'}
                    hinted={hint?.x === x && hint?.y === y}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar / AI Panel */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          {/* Status Alert */}
          {gameStatus === 'won' && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 p-6 rounded-3xl text-emerald-400 animate-in fade-in zoom-in slide-in-from-top-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <h3 className="font-black text-2xl mb-2 flex items-center gap-2 tracking-tighter">
                <span className="text-3xl">🎉</span> MISSION COMPLETE
              </h3>
              <p className="text-sm font-medium opacity-80 uppercase tracking-widest">System stabilized. No mines detected.</p>
            </div>
          )}
          {gameStatus === 'lost' && (
            <div className="bg-rose-500/10 border border-rose-500/50 p-6 rounded-3xl text-rose-400 animate-in fade-in zoom-in slide-in-from-top-4 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
              <h3 className="font-black text-2xl mb-2 flex items-center gap-2 tracking-tighter">
                <span className="text-3xl">🚨</span> CRITICAL FAILURE
              </h3>
              <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Explosion initiated. Connection lost.</p>
            </div>
          )}

          {/* AI Helper Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-[2rem] flex-1 flex flex-col shadow-2xl relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>

            <h2 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tighter italic">
              <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
              INTEL CORE <span className="text-blue-500">v3.0</span>
            </h2>
            
            <div className="flex-1 flex flex-col justify-center text-center space-y-6">
              {!hint && !isAiLoading && (
                <div className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] leading-relaxed py-12 border-2 border-dashed border-slate-800 rounded-3xl">
                  {gameStatus === 'ready' 
                    ? "Initialize session to enable AI data stream" 
                    : gameStatus === 'playing'
                    ? "Awaiting command for battlefield analysis"
                    : "Session terminated"}
                </div>
              )}

              {isAiLoading && (
                <div className="flex flex-col items-center gap-6 py-12">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-[spin_1s_linear_infinite_reverse]" />
                  </div>
                  <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Running Logic Patterns...</p>
                </div>
              )}

              {hint && (
                <div className="bg-black/40 p-6 rounded-3xl border border-blue-500/40 text-left animate-in fade-in slide-in-from-right-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-400 to-indigo-600"></div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      hint.type === 'safe' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {hint.type === 'safe' ? 'SECURE ZONE' : 'MINE DETECTED'}
                    </span>
                    <span className="text-[10px] text-slate-500 digital-font font-bold">POS: {hint.x}, {hint.y}</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                    {hint.explanation}
                  </p>
                  <div className="text-[10px] text-blue-400/70 border-t border-slate-800/80 pt-4 flex items-center gap-2 font-bold italic">
                    <span className="animate-bounce">👉</span> SCAN LOCATED TILE ON GRID
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-800/80">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Interface Protocol</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                   <span className="text-[10px] font-black text-blue-500 uppercase">Primary</span>
                   <span className="text-xs text-slate-400">Tactical Reveal</span>
                </div>
                <div className="flex flex-col gap-2 p-3 bg-slate-950/40 rounded-2xl border border-slate-800/50">
                   <span className="text-[10px] font-black text-rose-500 uppercase">Secondary</span>
                   <span className="text-xs text-slate-400">Mark Hazard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] text-center pb-12 opacity-50">
        Engineered by Gemini-3-Pro <span className="text-blue-900 mx-2">|</span> Tactical Logic Visualization v1.0.4
      </footer>
    </div>
  );
};

export default App;
