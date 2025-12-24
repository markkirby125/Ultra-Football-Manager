
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player, Position, PlayerMatchStats } from '../types';
import { NATIONALITIES } from '../constants';
import { Lock, X, Stethoscope, Trophy } from 'lucide-react';

interface Props {
  player: Player;
  liveStats?: PlayerMatchStats; // NEW: Accept live match stats
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  onPlayerClick?: (id: string, tab?: 'stats' | 'social') => void;
  onClick?: (e: React.MouseEvent) => void; // Allow override click behavior
}

export const PlayerTooltip: React.FC<Props> = ({ player, liveStats, children, className, as: Component = 'div', onPlayerClick, onClick }) => {
  const [visible, setVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, alignBottom: false });
  const triggerRef = useRef<any>(null);

  const handleMouseEnter = () => {
    if (locked) return;
    if (triggerRef.current) {
      updateCoords();
      setVisible(true);
    }
  };

  const updateCoords = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = rect.left + rect.width / 2;
      let y = rect.top - 8;
      let alignBottom = false;
      
      if (rect.top < 260) {
          y = rect.bottom + 8;
          alignBottom = true;
      }
      setCoords({ x, y, alignBottom });
  };

  const handleMouseLeave = () => {
      if (!locked) setVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent map click
      
      if (onClick) {
          onClick(e);
          return;
      }

      if (!locked) {
          setLocked(true);
          setVisible(true);
          updateCoords();
      } else {
          setLocked(false);
          setVisible(false);
      }
  };

  useEffect(() => {
      const handleGlobalClick = () => {
          if (locked) {
              setLocked(false);
              setVisible(false);
          }
      };
      const handleKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && locked) {
              setLocked(false);
              setVisible(false);
          }
      };
      
      if (locked) {
          window.addEventListener('click', handleGlobalClick);
          window.addEventListener('keydown', handleKey);
      }
      return () => {
          window.removeEventListener('click', handleGlobalClick);
          window.removeEventListener('keydown', handleKey);
      };
  }, [locked]);

  const handleTooltipClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  };

  const getFlag = (code: string) => {
      const nat = NATIONALITIES.find(n => n.code === code);
      return nat ? nat.flag : '🏳️';
  };

  const cmToFtIn = (cm: number) => {
      const realFeet = ((cm * 0.393700) / 12);
      const feet = Math.floor(realFeet);
      const inches = Math.round((realFeet - feet) * 12);
      return `${cm}cm (${feet}' ${inches}")`;
  };

  const getPosColor = (pos: Position) => {
      switch(pos) {
          case Position.GK: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
          case Position.DEF: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
          case Position.MID: return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
          case Position.FWD: return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      }
  };

  const ratingAvg = player.statsSeason.apps > 0 
      ? (player.statsSeason.ratingSum / player.statsSeason.apps).toFixed(1) 
      : '-';

  const height = player.height || 180;
  let physiqueTag = '';
  if (height > 190) physiqueTag = 'Aerial Threat 🏰';
  else if (height < 172) physiqueTag = 'Low Gravity ⚡';

  const StatBox = ({ label, value, highlight }: { label: string, value: React.ReactNode, highlight?: boolean }) => (
      <div className={`p-1.5 rounded bg-slate-950/40 border border-slate-800 ${highlight ? 'border-emerald-500/30' : ''} flex flex-col items-center justify-center h-[42px]`}>
          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">{label}</div>
          <div className={`text-sm font-mono font-bold leading-none ${highlight ? 'text-emerald-400' : 'text-slate-300'}`}>{value}</div>
      </div>
  );

  const renderLiveStats = () => {
      if (!liveStats) return null;
      
      const p = player.position;

      if (p === Position.GK) {
          return (
              <div className="grid grid-cols-3 gap-1 text-center">
                  <StatBox label="Rating" value={liveStats.rating.toFixed(1)} highlight={liveStats.rating >= 7.0} />
                  <StatBox label="Saves" value={liveStats.saves} highlight={liveStats.saves > 3} />
                  <StatBox label="Passes" value={liveStats.passes} />
              </div>
          );
      } else if (p === Position.DEF) {
          return (
              <div className="grid grid-cols-4 gap-1 text-center">
                  <StatBox label="Rating" value={liveStats.rating.toFixed(1)} highlight={liveStats.rating >= 7.0} />
                  <StatBox label="Tackles" value={liveStats.tackles} highlight={liveStats.tackles > 2} />
                  <StatBox label="Int" value={liveStats.interceptions} />
                  <StatBox label="Blocks" value={liveStats.clearances} />
              </div>
          );
      } else if (p === Position.MID) {
          return (
              <div className="grid grid-cols-4 gap-1 text-center">
                  <StatBox label="Rating" value={liveStats.rating.toFixed(1)} highlight={liveStats.rating >= 7.0} />
                  <StatBox label="Passes" value={liveStats.passes} highlight={liveStats.passes > 30} />
                  <StatBox label="Key P." value={liveStats.keyPasses} highlight={liveStats.keyPasses > 0} />
                  <StatBox label="xA" value={liveStats.xa.toFixed(2)} highlight={liveStats.xa > 0.2} />
              </div>
          );
      } else { // FWD
           return (
              <div className="grid grid-cols-4 gap-1 text-center">
                  <StatBox label="Rating" value={liveStats.rating.toFixed(1)} highlight={liveStats.rating >= 7.0} />
                  <StatBox label="xG" value={liveStats.xg.toFixed(2)} highlight={liveStats.xg > 0.3} />
                  <StatBox label="Shots" value={liveStats.shots} />
                  <StatBox label="Passes" value={liveStats.passes} />
              </div>
          );
      }
  };

  const renderSeasonStats = () => {
      const s = player.statsSeason;
      
      const cardsValue = (
          <div className="flex items-center gap-1">
              <span className={s.yellows > 0 ? "text-yellow-500" : "text-slate-600"}>{s.yellows}</span>
              <span className="text-slate-700 text-[10px]">/</span>
              <span className={s.reds > 0 ? "text-red-500" : "text-slate-600"}>{s.reds}</span>
          </div>
      );
      
      let p1Label = "Stat 1", p1Val: any = 0;
      let p2Label = "Stat 2", p2Val: any = 0;
      let p1Highlight = false;

      if (player.position === Position.GK) {
          p1Label = "Saves"; p1Val = s.saves; p1Highlight = s.saves > 20;
          p2Label = "Passes"; p2Val = s.passes;
      } else if (player.position === Position.DEF) {
          p1Label = "Tackles"; p1Val = s.tackles; p1Highlight = s.tackles > 15;
          p2Label = "Headers"; p2Val = s.aerialsWon || 0;
      } else if (player.position === Position.MID) {
          p1Label = "Passes"; p1Val = s.passes; p1Highlight = s.passes > 100;
          p2Label = "Assists"; p2Val = s.assists;
      } else { 
          p1Label = "Goals"; p1Val = s.goals; p1Highlight = s.goals > 5;
          p2Label = "Shots"; p2Val = s.shots;
      }

      return (
          <div className="grid grid-cols-3 gap-1 text-center">
              <StatBox label="Apps" value={s.apps} />
              <StatBox label={p1Label} value={p1Val} highlight={p1Highlight} />
              <StatBox label={p2Label} value={p2Val} />
              <StatBox label="Cards Y/R" value={cardsValue} />
              <StatBox label="Avg Rtg" value={ratingAvg} highlight={Number(ratingAvg) > 7.0} />
              <StatBox label="MOM" value={s.mom} highlight={s.mom > 0} />
          </div>
      );
  };

  const risk = player.injuryRisk || 0;
  const riskColor = risk > 80 ? 'bg-red-500' : risk > 50 ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <>
      <Component
        ref={triggerRef}
        className={`${className} cursor-pointer`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </Component>
      {visible && createPortal(
        <div 
            className="fixed z-[100] animate-in fade-in zoom-in-95 duration-150"
            style={{ 
                left: coords.x, 
                top: coords.y,
                transform: coords.alignBottom ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' 
            }}
            onClick={handleTooltipClick}
        >
            <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-lg p-3 w-64 text-slate-200 font-sans relative">
                {locked && (
                    <button 
                        onClick={() => { setLocked(false); setVisible(false); }}
                        className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 text-slate-400 hover:text-white border border-slate-600 shadow-lg"
                    >
                        <X size={12} />
                    </button>
                )}
                
                {/* Goal Indicator Badge */}
                {liveStats && liveStats.goals > 0 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-black font-sport text-xs px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1 animate-bounce-slight z-20">
                        <Trophy size={12} fill="currentColor" /> 
                        GOAL {liveStats.goals > 1 ? `x${liveStats.goals}` : ''}
                    </div>
                )}

                <div className="flex justify-between items-start border-b border-slate-800 pb-2 mb-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{getFlag(player.nationality)}</span>
                            <span className="font-sport text-lg leading-none text-white">{player.name}</span>
                            {locked && <Lock size={10} className="text-emerald-500" />}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{player.age} Years Old • {player.preferredFoot} Foot • {cmToFtIn(height)}</div>
                        {physiqueTag && <div className="text-[10px] text-yellow-400 font-bold mt-0.5">{physiqueTag}</div>}
                    </div>
                    <div className="text-right">
                         <div className={`text-xs font-bold px-1.5 py-0.5 rounded border mb-1 inline-block ${getPosColor(player.position)}`}>
                             {player.position}
                         </div>
                         <div className="text-2xl font-sport font-bold text-white leading-none">{player.stats.ovr}</div>
                    </div>
                </div>

                {liveStats?.red && (
                     <div className="bg-red-900/40 border border-red-500/50 p-2 rounded mb-2 flex items-center gap-2 animate-pulse">
                         <div className="w-3 h-4 bg-red-600 rounded-[2px] border border-white/50 shrink-0"></div>
                         <div className="text-xs text-red-200 font-bold">
                             Sent Off: <span className="text-white font-normal italic">{liveStats.cardReason || 'Red Card'}</span>
                         </div>
                     </div>
                )}

                {liveStats?.yellow && !liveStats.red && (
                     <div className="bg-yellow-900/20 border border-yellow-500/50 p-2 rounded mb-2 flex items-center gap-2">
                         <div className="w-3 h-4 bg-yellow-400 rounded-[2px] border border-white/50 shrink-0"></div>
                         <div className="text-xs text-yellow-200 font-bold">
                             Booked: <span className="text-white font-normal italic">{liveStats.cardReason || 'Yellow Card'}</span>
                         </div>
                     </div>
                )}
                
                <div className="grid grid-cols-4 gap-1 text-xs mb-3">
                    <div className="bg-slate-800/50 p-1 rounded text-center">
                        <span className="block text-[9px] text-rose-400 font-bold uppercase">ATT</span>
                        <span className="font-mono text-white">{player.stats.att}</span>
                    </div>
                    <div className="bg-slate-800/50 p-1 rounded text-center">
                        <span className="block text-[9px] text-emerald-400 font-bold uppercase">MID</span>
                        <span className="font-mono text-white">{player.stats.mid}</span>
                    </div>
                    <div className="bg-slate-800/50 p-1 rounded text-center">
                        <span className="block text-[9px] text-blue-400 font-bold uppercase">DEF</span>
                        <span className="font-mono text-white">{player.stats.def}</span>
                    </div>
                    <div className="bg-slate-800/50 p-1 rounded text-center">
                        <span className="block text-[9px] text-purple-400 font-bold uppercase">{player.position === Position.GK ? 'GK' : 'PAC'}</span>
                        <span className="font-mono text-white">{player.position === Position.GK ? player.stats.gk : player.stats.pac}</span>
                    </div>
                </div>

                <div className="mb-2">
                     <div className="text-[10px] text-slate-500 font-bold uppercase mb-1 flex items-center gap-2">
                         <span className={`w-1.5 h-1.5 rounded-full ${liveStats ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                         {liveStats ? 'Current Match' : 'Season Stats'}
                     </div>
                     {liveStats ? renderLiveStats() : renderSeasonStats()}
                </div>

                {/* Injury Risk Indicator */}
                <div className="mt-2 pt-2 border-t border-slate-800">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500 mb-1">
                        <span className="flex items-center gap-1"><Stethoscope size={10}/> Injury Risk</span>
                        <span className={risk > 80 ? "text-red-400 animate-pulse" : "text-slate-400"}>{risk > 80 ? "CRITICAL" : risk > 50 ? "High" : "Low"}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${riskColor}`} style={{ width: `${Math.min(100, risk)}%` }}></div>
                    </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Value</span>
                    <span className="text-emerald-400 font-mono">€{player.value}M</span>
                </div>
                {onPlayerClick && !liveStats && (
                    <div className="flex gap-2 mt-2">
                        <button 
                            onClick={() => { onPlayerClick(player.id); setLocked(false); setVisible(false); }}
                            className="flex-1 text-center text-[9px] bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 py-1 rounded uppercase font-bold tracking-widest border border-emerald-500/20"
                        >
                            Profile
                        </button>
                        <button 
                            onClick={() => { onPlayerClick(player.id, 'social'); setLocked(false); setVisible(false); }}
                            className="flex-1 text-center text-[9px] bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 py-1 rounded uppercase font-bold tracking-widest border border-purple-500/20"
                        >
                            Socials
                        </button>
                    </div>
                )}
            </div>
            <div className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent ${coords.alignBottom ? '-top-2 border-b-8 border-b-slate-900' : '-bottom-2 border-t-8 border-t-slate-900'}`}></div>
        </div>,
        document.body
      )}
    </>
  );
};
