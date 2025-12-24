
import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Player, Position, Team, WeatherType, PitchState } from '../types';
import { FORMATIONS, WEATHER_EFFECTS, PITCH_EFFECTS } from '../constants';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Shield, Zap, Target, Activity, Wand2, Info, Repeat, User, LogOut, MessageCircle, BrainCircuit, MapPin, CloudRain, Sun, CloudSnow, Wind, Droplets, Thermometer, AlertTriangle, Lock } from 'lucide-react';
import { Crest } from '../components/Crest';
import { generateWeather } from '../utils/engine';

interface PlayerTokenProps {
  player: Player | undefined;
  index: number;
  isSelected: boolean;
  isTargetable: boolean;
  isSuspended: boolean;
  onClick: () => void;
  onPlayerClick: (id: string, tab?: 'stats' | 'social') => void;
  onSwapRequest: () => void;
  onBenchRequest: () => void;
}

const PlayerToken: React.FC<PlayerTokenProps> = ({ player, index, isSelected, isTargetable, isSuspended, onClick, onPlayerClick, onSwapRequest, onBenchRequest }) => {
    if (!player) return <div className="w-12 h-12 bg-slate-800/30 rounded-full border-2 border-slate-500/30 border-dashed" />;
    
    let ringColor = "ring-slate-400";
    let bgColor = "bg-slate-700";
    
    if (player.position === Position.GK) { bgColor = "bg-yellow-600"; ringColor = "ring-yellow-400"; }
    else if (player.position === Position.DEF) { bgColor = "bg-blue-700"; ringColor = "ring-blue-400"; }
    else if (player.position === Position.MID) { bgColor = "bg-emerald-700"; ringColor = "ring-emerald-400"; }
    else if (player.position === Position.FWD) { bgColor = "bg-rose-700"; ringColor = "ring-rose-400"; }

    const height = player.height || 180;
    const scale = 1.0 + ((height - 175) / 150); 

    // Visual State for Suspension
    if (isSuspended) {
        bgColor = "bg-slate-800 grayscale";
        ringColor = "ring-red-900";
    }

    return (
        <div className="relative group">
            <div 
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); 
                    if (!isSuspended) onClick();
                }}
                className={`flex flex-col items-center justify-center transition-all duration-200 
                  ${isSelected ? 'scale-110 z-50' : 'hover:scale-105 z-10'}
                  ${isTargetable && !isSelected ? 'animate-bounce-slight opacity-90 scale-105' : ''}
                  ${isSuspended ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div 
                    className={`w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-bold font-sport text-lg shadow-xl relative transition-all duration-300
                      ${isSelected ? 'border-2 border-white ring-4 ' + ringColor + ' shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-2 border-slate-200/20 ' + bgColor}
                      ${isTargetable ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : ''}
                    `}
                    style={{ transform: `scale(${scale})` }}
                >
                    {player.stats.ovr}
                    {isSelected && <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>}
                    
                    {/* Condition Status */}
                    {player.condition < 60 && !isSuspended && (
                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white" title="Injured/Fatigued">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                    )}

                    {/* Suspension Status */}
                    {isSuspended && (
                        <div className="absolute inset-0 bg-red-900/80 rounded-full flex items-center justify-center border-2 border-red-500">
                            <Lock size={20} className="text-white" />
                        </div>
                    )}
                </div>
                
                <div className={`mt-1 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-lg backdrop-blur-md truncate max-w-[90px] border border-white/10 ${isSelected ? 'bg-emerald-600' : isSuspended ? 'bg-red-900 border-red-500' : 'bg-slate-900/80'}`}>
                    {player.name.split(' ').pop()}
                </div>
                
                {!isSuspended && (
                    <div className="mt-0.5 flex gap-0.5 w-10">
                        <div className="h-1 bg-slate-800 rounded-full flex-1 overflow-hidden">
                            <div className={`h-full ${player.condition > 80 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${player.condition}%` }}></div>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full flex-1 overflow-hidden">
                            <div className={`h-full bg-blue-500`} style={{ width: `${player.morale}%` }}></div>
                        </div>
                    </div>
                )}
                {isSuspended && <div className="text-[8px] font-bold text-red-400 bg-black/50 px-1 rounded mt-0.5">BANNED</div>}
            </div>

            {isSelected && !isTargetable && (
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 shadow-2xl rounded p-2 z-[60] w-32 flex flex-col gap-1 animate-in zoom-in-95 duration-150">
                     <div className="text-[10px] font-bold text-slate-400 text-center mb-1">{player.name}</div>
                     <button onClick={(e) => { e.stopPropagation(); onSwapRequest(); }} className="flex items-center gap-2 text-xs text-white hover:bg-slate-800 p-1 rounded w-full">
                         <Repeat size={12} className="text-emerald-400" /> Swap
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onPlayerClick(player.id); }} className="flex items-center gap-2 text-xs text-white hover:bg-slate-800 p-1 rounded w-full">
                         <User size={12} className="text-blue-400" /> Profile
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onBenchRequest(); }} className="flex items-center gap-2 text-xs text-white hover:bg-slate-800 p-1 rounded w-full">
                         <LogOut size={12} className="text-red-400" /> Bench
                     </button>
                     <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                 </div>
            )}
        </div>
    );
};

interface Props {
  onPlayerClick: (id: string, tab?: 'stats' | 'social') => void;
}

export const Tactics: React.FC<Props> = ({ onPlayerClick }) => {
  const { gameState, actions } = useGame();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [swapMode, setSwapMode] = useState(false);

  if (!gameState || !gameState.userTeamId) return null;
  const team = gameState.teams.find(t => t.id === gameState.userTeamId)!;
  const players = gameState.players;
  const assistant = team.assistant;

  const formation = team.tactics.formation;

  const squad = useMemo(() => players.filter(p => p.teamId === team.id).sort((a,b) => b.stats.ovr - a.stats.ovr), [players, team.id]);
  const startingXI = useMemo(() => team.tactics.lineup.map(id => squad.find(p => p.id === id)!), [team.tactics.lineup, squad]);
  const bench = useMemo(() => squad.filter(p => !team.tactics.lineup.includes(p.id)), [squad, team.tactics.lineup]);

  const currentWeek = gameState.currentWeek;

  // Context: Next Match
  const nextFixture = gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id) && !f.result);
  const nextOpponent = nextFixture ? gameState.teams.find(t => t.id === (nextFixture.homeTeamId === team.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)) : null;
  const nextReferee = nextFixture ? gameState.referees.find(r => r.id === nextFixture.refereeId) : null;
  const isHome = nextFixture && nextFixture.homeTeamId === team.id;
  
  const homeTeamForFixture = nextFixture ? gameState.teams.find(t => t.id === nextFixture.homeTeamId) : null;
  const weatherForecast: WeatherType = homeTeamForFixture ? generateWeather(homeTeamForFixture.stadium.climateType, gameState.currentWeek, homeTeamForFixture.stadium.name) : 'Clear';
  const pitchForecast: PitchState = isHome ? team.stadium.pitchState : (nextOpponent?.stadium.pitchState || 'Good');

  const wMod = WEATHER_EFFECTS[weatherForecast];
  const pMod = PITCH_EFFECTS[pitchForecast];
  
  const netPassing = Math.round((wMod.passing * pMod.passing - 1) * 100);
  const netFatigue = Math.round((wMod.fatigue * pMod.fatigue - 1) * 100);
  const netInjury = Math.round((wMod.injury * pMod.injury - 1) * 100);

  const familiarityScore = team.formationFamiliarity[formation] || 20;
  const familiarityMod = (familiarityScore - 80) / 400; 
  
  const attVal = Math.round(startingXI.reduce((a,b) => a + (b ? b.stats.att : 0), 0)/11 * (1 + familiarityMod));
  const midVal = Math.round(startingXI.reduce((a,b) => a + (b ? b.stats.mid : 0), 0)/11 * (1 + familiarityMod));
  const defVal = Math.round(startingXI.reduce((a,b) => a + (b ? b.stats.def : 0), 0)/11 * (1 + familiarityMod));

  const updateLineup = (newLineup: string[], fmt: string) => {
      actions.updateTeam({ 
          ...team, 
          tactics: { ...team.tactics, lineup: newLineup, formation: fmt }
      });
  };

  const handleFormationChange = (fmt: string) => {
    updateLineup(team.tactics.lineup, fmt);
  };

  const autoPickBestXI = () => {
    const targetFormations = assistant ? Object.keys(FORMATIONS) : [formation];
    let bestScore = -1;
    let bestFormation = formation;
    let bestLineup: Player[] = [];

    const calculateScore = (p: Player, idealSide?: 'Left' | 'Right') => {
        let score = p.stats.ovr;
        score += (p.condition / 100) * 5; 
        if (idealSide) {
            if (p.preferredFoot === 'Both') score += 2;
            else if (p.preferredFoot === idealSide) score += 4;
            else score -= 2;
        }
        return score;
    };

    // Filter out suspended players for auto pick
    const availableSquad = squad.filter(p => !p.suspendedUntilWeek || p.suspendedUntilWeek <= currentWeek);

    targetFormations.forEach(fmtKey => {
        const formationStats = FORMATIONS[fmtKey as keyof typeof FORMATIONS];
        const famBonus = (team.formationFamiliarity[fmtKey] || 20) / 10; 

        const getBestForPos = (pos: Position, count: number, excludeIds: string[]) => {
            const available = availableSquad.filter(p => p.position === pos && !excludeIds.includes(p.id));
            if ((pos === Position.DEF || pos === Position.MID) && count >= 2) {
                 const leftBest = available.sort((a, b) => calculateScore(b, 'Left') - calculateScore(a, 'Left'))[0];
                 const rightBest = available.filter(p => p.id !== leftBest?.id).sort((a, b) => calculateScore(b, 'Right') - calculateScore(a, 'Right'))[0];
                 
                 const others = available
                    .filter(p => p.id !== leftBest?.id && p.id !== rightBest?.id)
                    .sort((a,b) => calculateScore(b) - calculateScore(a))
                    .slice(0, Math.max(0, count - 2));

                 const res = [leftBest, ...others, rightBest].filter(Boolean);
                 if (res.length < count) {
                     const remaining = available.filter(p => !res.includes(p)).sort((a,b) => calculateScore(b) - calculateScore(a)).slice(0, count - res.length);
                     return [...res, ...remaining];
                 }
                 return res;
            }
            return available.sort((a, b) => calculateScore(b) - calculateScore(a)).slice(0, count);
        };

        let tempLineup: Player[] = [];
        const gk = getBestForPos(Position.GK, 1, []);
        tempLineup = [...tempLineup, ...gk];
        
        const def = getBestForPos(Position.DEF, formationStats.def, tempLineup.map(p => p.id));
        tempLineup = [...tempLineup, ...def];

        const mid = getBestForPos(Position.MID, formationStats.mid, tempLineup.map(p => p.id));
        tempLineup = [...tempLineup, ...mid];

        const fwd = getBestForPos(Position.FWD, formationStats.fwd, tempLineup.map(p => p.id));
        tempLineup = [...tempLineup, ...fwd];

        if (tempLineup.length < 11) {
            const remaining = availableSquad.filter(p => !tempLineup.map(x => x.id).includes(p.id)).sort((a,b) => calculateScore(b) - calculateScore(a)).slice(0, 11 - tempLineup.length);
            tempLineup = [...tempLineup, ...remaining];
        }

        let totalScore = tempLineup.reduce((acc, p) => acc + calculateScore(p), 0);
        totalScore += famBonus; 
        
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestFormation = fmtKey;
            bestLineup = tempLineup;
        }
    });

    updateLineup(bestLineup.map(p => p.id), bestFormation);
    alert(assistant ? `${assistant.name} has selected a ${bestFormation} to maximize team strengths.` : "Auto-picked best available players.");
  };

  const handleSwap = (index1: number, index2: number) => {
      // Check suspension for swap target on pitch if index2 is valid
      const targetP = startingXI[index2];
      if (targetP && targetP.suspendedUntilWeek && targetP.suspendedUntilWeek > currentWeek) return;

      const newLineup = [...team.tactics.lineup];
      const temp = newLineup[index1];
      newLineup[index1] = newLineup[index2];
      newLineup[index2] = temp;
      actions.updateTeam({ ...team, tactics: { ...team.tactics, lineup: newLineup }});
      setSwapMode(false);
      setSelectedSlot(null);
  };

  const handleBenchSwap = (benchPlayer: Player) => {
      if (selectedSlot === null) return;
      // Cannot bring suspended player in
      if (benchPlayer.suspendedUntilWeek && benchPlayer.suspendedUntilWeek > currentWeek) return;

      const newLineup = [...team.tactics.lineup];
      newLineup[selectedSlot] = benchPlayer.id;
      actions.updateTeam({ ...team, tactics: { ...team.tactics, lineup: newLineup }});
      setSwapMode(false);
      setSelectedSlot(null);
  };
  
  const handleMoveToBench = (index: number) => {
       const playerToBench = startingXI[index];
       if (!playerToBench) return;
       // Find valid non-suspended replacement
       const firstBenchOption = bench.find(p => p.position === playerToBench.position && (!p.suspendedUntilWeek || p.suspendedUntilWeek <= currentWeek)) 
                             || bench.find(p => !p.suspendedUntilWeek || p.suspendedUntilWeek <= currentWeek);
       if (firstBenchOption) {
           const newLineup = [...team.tactics.lineup];
           newLineup[index] = firstBenchOption.id;
           actions.updateTeam({ ...team, tactics: { ...team.tactics, lineup: newLineup }});
       }
       setSwapMode(false);
       setSelectedSlot(null);
  };

  // Render logic for tokens on pitch
  const formationStats = FORMATIONS[formation as keyof typeof FORMATIONS] || FORMATIONS['4-4-2'];
  const playersByRow = [
      startingXI.slice(0, 1), // GK
      startingXI.slice(1, 1 + formationStats.def), // DEF
      startingXI.slice(1 + formationStats.def, 1 + formationStats.def + formationStats.mid), // MID
      startingXI.slice(1 + formationStats.def + formationStats.mid, 11) // FWD
  ];

  const StatBar = ({ label, val, color }: { label: string, val: number, color: string }) => (
      <div className="flex-1">
          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
              <span>{label}</span>
              <span>{Math.round(val)}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${Math.min(100, val)}%` }}></div>
          </div>
      </div>
  );

  const getFamiliarityColor = (val: number) => {
      if (val >= 80) return 'bg-emerald-500';
      if (val >= 50) return 'bg-yellow-500';
      return 'bg-red-500';
  };

  const getEnvColor = (val: number, invert: boolean = false) => {
      if (val === 0) return 'text-slate-400';
      if (invert) return val > 0 ? 'text-red-400' : 'text-emerald-400';
      return val > 0 ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* ... (Header logic remains similar) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-3xl font-sport text-white">Tactical Board</h2>
          <div className="flex items-center gap-2">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex items-center">
                  <select 
                      value={formation}
                      onChange={(e) => handleFormationChange(e.target.value)}
                      className="bg-transparent text-white font-bold text-sm outline-none px-2 py-1 cursor-pointer"
                  >
                      {Object.keys(FORMATIONS).map(f => {
                          const fam = team.formationFamiliarity[f] || 20;
                          return <option key={f} value={f}>{f} ({Math.round(fam)}%)</option>
                      })}
                  </select>
              </div>
              <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={autoPickBestXI}
                  className="flex items-center gap-2"
                  title={assistant ? `Ask ${assistant.name} to pick best XI` : "Auto Select Best Team"}
              >
                  <BrainCircuit size={16} className={assistant ? "text-purple-400" : "text-slate-400"} />
                  {assistant ? `Ask ${assistant.name.split(' ')[0]}` : 'Auto Pick'}
              </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
              {/* Pitch */}
              <div className="relative aspect-[1.4] bg-[#0a5c36] rounded-xl border-4 border-slate-800 shadow-2xl overflow-hidden select-none">
                  <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 5%, rgba(0,0,0,0.1) 5%, rgba(0,0,0,0.1) 10%)' }}></div>
                  <div className="absolute inset-0 border-2 border-white/30 m-4 rounded-lg"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30"></div>
                  <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                  <div className="absolute inset-0 flex flex-col justify-between py-8 px-12">
                      {/* Reversed Rendering: FWD Top */}
                      {[...playersByRow].reverse().map((row, visualRowIdx) => {
                          const rowIdx = playersByRow.length - 1 - visualRowIdx; 
                          return (
                              <div key={rowIdx} className="flex justify-around items-center relative">
                                  {row.map((p, pIdx) => {
                                      let absIndex = 0;
                                      if (rowIdx === 0) absIndex = 0;
                                      else if (rowIdx === 1) absIndex = 1 + pIdx;
                                      else if (rowIdx === 2) absIndex = 1 + formationStats.def + pIdx;
                                      else absIndex = 1 + formationStats.def + formationStats.mid + pIdx;

                                      const isSuspended = !!(p && p.suspendedUntilWeek && p.suspendedUntilWeek > currentWeek);

                                      return (
                                          <PlayerToken 
                                              key={p ? p.id : `empty-${rowIdx}-${pIdx}`}
                                              player={p}
                                              index={absIndex}
                                              isSelected={selectedSlot === absIndex}
                                              isTargetable={swapMode && selectedSlot !== absIndex && !isSuspended}
                                              isSuspended={isSuspended}
                                              onClick={() => {
                                                  if (swapMode && selectedSlot !== null) {
                                                      handleSwap(selectedSlot, absIndex);
                                                  } else {
                                                      setSelectedSlot(selectedSlot === absIndex ? null : absIndex);
                                                      setSwapMode(selectedSlot !== absIndex);
                                                  }
                                              }}
                                              onPlayerClick={onPlayerClick}
                                              onSwapRequest={() => { setSwapMode(true); }}
                                              onBenchRequest={() => handleMoveToBench(absIndex)}
                                          />
                                      );
                                  })}
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-6 shadow-lg">
                  <StatBar label="Attack" val={attVal} color="bg-rose-500" />
                  <StatBar label="Midfield" val={midVal} color="bg-emerald-500" />
                  <StatBar label="Defense" val={defVal} color="bg-blue-500" />
                  <div className="w-px bg-slate-800"></div>
                  <StatBar label="Chemistry" val={team.chemistry} color="bg-purple-500" />
                  <StatBar label="Familiarity" val={familiarityScore} color={getFamiliarityColor(familiarityScore)} />
              </div>
          </div>

          <div className="space-y-4">
              {/* Next Match Context Card (Same as before) */}
              {nextOpponent ? (
                  <Card title="Pre-Match Briefing" className="border-emerald-900/30 bg-slate-900/50">
                      <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                              <Crest team={nextOpponent} size="md" />
                              <div>
                                  <div className="font-bold text-white leading-tight">{nextOpponent.name}</div>
                                  <div className="text-[10px] text-slate-400">{isHome ? 'Home' : 'Away'} • {nextOpponent.rating} OVR</div>
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="text-xs font-bold text-slate-500 uppercase">League Rank</div>
                              <div className="text-xl font-mono text-white">{gameState.teams.filter(t => t.division === nextOpponent.division).sort((a,b) => b.stats.points - a.stats.points).findIndex(t => t.id === nextOpponent.id) + 1}</div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center gap-2">
                              {weatherForecast === 'Rain' ? <CloudRain size={16} className="text-blue-400"/> : weatherForecast === 'Snow' ? <CloudSnow size={16} className="text-white"/> : <Sun size={16} className="text-yellow-400"/>}
                              <div className="flex flex-col">
                                  <span className="text-xs text-slate-300 font-bold">{weatherForecast}</span>
                                  {pitchForecast === 'Poor' || pitchForecast === 'Very Poor' ? (
                                      <span className="text-[9px] text-orange-400 font-bold uppercase">{pitchForecast} Pitch!</span>
                                  ) : (
                                      <span className="text-[9px] text-slate-500">Pitch OK</span>
                                  )}
                              </div>
                          </div>
                          {nextReferee && (
                              <div className="bg-slate-950 p-2 rounded border border-slate-800 flex items-center gap-2" title={`Strictness: ${nextReferee.stats.strictness}%`}>
                                  <Shield size={16} className={nextReferee.stats.strictness > 70 ? "text-red-400" : "text-slate-400"}/>
                                  <div className="flex flex-col overflow-hidden">
                                      <span className="text-xs text-slate-300 font-bold truncate">{nextReferee.name.split(' ').pop()}</span>
                                      <span className="text-[9px] text-slate-500">{nextReferee.stats.strictness > 70 ? 'Strict Ref' : 'Standard'}</span>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* Environmental Impact Grid */}
                      <div className="bg-slate-950/50 p-2 rounded border border-slate-800 mb-3">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1">
                              <Activity size={10} /> Conditions Impact
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center">
                              <div>
                                  <div className={`text-xs font-mono font-bold ${getEnvColor(netPassing)}`}>{netPassing > 0 ? '+' : ''}{netPassing}%</div>
                                  <div className="text-[8px] text-slate-500">Pass Acc</div>
                              </div>
                              <div>
                                  <div className={`text-xs font-mono font-bold ${getEnvColor(netFatigue, true)}`}>{netFatigue > 0 ? '+' : ''}{netFatigue}%</div>
                                  <div className="text-[8px] text-slate-500">Fatigue</div>
                              </div>
                              <div>
                                  <div className={`text-xs font-mono font-bold ${getEnvColor(netInjury, true)}`}>{netInjury > 0 ? '+' : ''}{netInjury}%</div>
                                  <div className="text-[8px] text-slate-500">Injuries</div>
                              </div>
                          </div>
                      </div>

                      {assistant && (
                          <div className="bg-purple-900/20 p-2 rounded border-l-2 border-purple-500 text-xs italic text-slate-300 animate-in fade-in">
                              <span className="font-bold text-purple-400 not-italic block mb-1">Scout Tip:</span>
                              {(pitchForecast === 'Poor' || pitchForecast === 'Very Poor') ? "Pitch is terrible. Avoid slick passing; play direct." :
                               netInjury > 15 ? "High injury risk due to conditions. Avoid aggressive tackling." :
                               nextOpponent.rating > team.rating ? "They are superior on paper. Consider a defensive setup." : 
                               nextOpponent.stats.ga > 10 ? "Their defense is leaky. Attack them directly." : 
                               "We should dominate possession. Play expansive."}
                          </div>
                      )}
                  </Card>
              ) : (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center text-slate-500 italic text-sm">
                      No upcoming fixture scheduled.
                  </div>
              )}

              <Card title="Bench & Reserves" className="h-full flex flex-col max-h-[400px]">
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {bench.map(p => {
                          const isSuspended = !!(p.suspendedUntilWeek && p.suspendedUntilWeek > currentWeek);
                          return (
                              <div 
                                  key={p.id} 
                                  className={`flex items-center gap-3 p-2 rounded border transition-colors ${
                                      selectedSlot !== null && swapMode && !isSuspended ? 'border-emerald-500 bg-emerald-900/10 cursor-pointer' : 
                                      isSuspended ? 'border-red-900/50 bg-red-900/10 cursor-not-allowed opacity-70' :
                                      'border-slate-800 bg-slate-950/50 cursor-pointer hover:bg-slate-800'
                                  }`}
                                  onClick={() => {
                                      if (isSuspended) return;
                                      if (swapMode && selectedSlot !== null) {
                                          handleBenchSwap(p);
                                      } else {
                                          onPlayerClick(p.id);
                                      }
                                  }}
                              >
                                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs relative ${p.position === Position.GK ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                      {p.position}
                                      {isSuspended && <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center"><Lock size={12} className="text-red-500"/></div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="font-bold text-sm text-slate-200 truncate">{p.name}</div>
                                      <div className="text-[10px] text-slate-500">
                                          {p.stats.ovr} OVR • {isSuspended ? <span className="text-red-400 font-bold">BANNED</span> : `${p.condition}% Cond`}
                                      </div>
                                  </div>
                                  {swapMode && !isSuspended && (
                                      <div className="text-emerald-400 text-xs font-bold uppercase"><Repeat size={14}/></div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </Card>
          </div>
      </div>
    </div>
  );
};
