
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { Fixture, Team, Player, MatchEvent, MatchResult, Referee, MatchStats, PlayerMatchStats, Position, WeatherType } from '../types';
import { FORMATIONS, WEATHER_EFFECTS, PITCH_EFFECTS } from '../constants';
import { randInt, getRandom } from '../constants';
import { Button } from '../components/Button';
import { generateCommentary } from '../utils/matchCommentary';
import { 
    Play, Pause, Shield, Zap, Activity, Repeat, UserCog, 
    Megaphone, Clipboard, X, ChevronUp, ChevronDown, 
    Users, Star, AlertTriangle, TrendingUp, TrendingDown,
    Timer, Heart, CloudRain, CloudSnow, Sun, Wind, Cloud, Flag, Eye, BarChart2, Target, Radar
} from 'lucide-react';
import { Crest, Kit } from '../components/Crest';
import { SoundEngine } from '../utils/audio';
import { generateWeather, calculateXG, calculateXA, calculateXT, calculateXPress } from '../utils/engine';
import { PlayerTooltip } from '../components/PlayerTooltip';

interface Props {
  homeTeam: Team;
  awayTeam: Team;
  homeLineup: Player[];
  awayLineup: Player[];
  homeBench: Player[];
  awayBench: Player[];
  fixture: Fixture;
  referee: Referee;
  onComplete: (result: MatchResult) => void;
}

// --- INTERNAL TYPES FOR LIVE ENGINE ---
interface LivePlayer extends Player {
    matchStats: PlayerMatchStats;
    currentCondition: number;
    currentRating: number;
    isSubbedOut?: boolean;
}

// --- HELPER COMPONENTS ---

const StatBar = ({ label, homeVal, awayVal }: { label: string, homeVal: number, awayVal: number }) => {
    const total = homeVal + awayVal;
    const homePct = total === 0 ? 50 : (homeVal / total) * 100;
    
    return (
        <div className="flex items-center gap-4 text-xs font-bold mb-3">
            <div className="w-8 text-right font-mono text-white">{homeVal}</div>
            <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-wider px-1">
                    <span></span>
                    <span>{label}</span>
                    <span></span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="bg-[var(--fot-accent)] h-full transition-all duration-500" style={{ width: `${homePct}%` }}></div>
                    <div className="bg-slate-600 h-full flex-1 transition-all duration-500"></div>
                </div>
            </div>
            <div className="w-8 text-left font-mono text-white">{awayVal}</div>
        </div>
    );
};

const ActionBubble = ({ event, player, teamColor }: { event: string, player: string, teamColor: string }) => (
    <div className="absolute z-50 animate-bounce-slight transition-all duration-500 ease-out" style={{ transform: 'translate(-50%, -120%)' }}>
        <div className="flex flex-col items-center">
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: teamColor }}></div>
                <div className="flex flex-col items-start min-w-[80px]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-0.5 tracking-wider">{event}</span>
                    <span className="text-sm font-bold text-white leading-none whitespace-nowrap">{player}</span>
                </div>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-900/90 mt-[-1px]"></div>
            <div className="w-3 h-1 bg-black/50 blur-[2px] rounded-full mt-1"></div>
        </div>
    </div>
);

const EventCard = ({ event }: { event: MatchEvent }) => {
    const isGoal = event.type === 'goal';
    const isRed = event.type === 'red';
    const isSub = event.type === 'sub';
    const isVar = event.type === 'var';
    const isInjury = event.type === 'injury';
    
    let icon = <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>;
    let borderClass = 'border-l-2 border-slate-700';
    let textClass = 'text-slate-300';
    let bgClass = 'bg-[#151A21]';
    let fontFamily = 'font-sans';

    if (isGoal) {
        icon = <div className="text-sm">⚽</div>;
        borderClass = 'border-l-4 border-[var(--fot-success)]';
        textClass = 'text-[var(--fot-success)]';
        bgClass = 'bg-emerald-900/10';
    } else if (isRed) {
        icon = <div className="w-3 h-4 bg-[#FF3B5C] rounded-[1px]"></div>;
        borderClass = 'border-l-4 border-[#FF3B5C]';
        bgClass = 'bg-red-900/10';
    } else if (isSub) {
        icon = <Repeat size={14} className="text-purple-400"/>;
        borderClass = 'border-l-4 border-purple-500';
    } else if (isVar) {
        icon = <Eye size={14} className="text-blue-400"/>;
        borderClass = 'border-l-4 border-blue-500';
    } else if (isInjury) {
        icon = <Activity size={14} className="text-orange-400"/>;
        borderClass = 'border-l-4 border-orange-500';
    } else if (event.style === 'poetic') {
        borderClass = 'border-l-2 border-yellow-500';
        textClass = 'text-yellow-100 italic';
        fontFamily = 'font-serif';
    } else if (event.style === 'critical') {
        borderClass = 'border-l-2 border-red-800';
        textClass = 'text-red-200 font-bold';
    } else if (event.style === 'analytical') {
        borderClass = 'border-l-2 border-blue-400';
        textClass = 'text-blue-100 font-mono text-xs';
    }

    return (
        <div className={`flex gap-4 p-3 mb-2 rounded-r-lg relative overflow-hidden ${bgClass} ${borderClass}`}>
            <div className="flex flex-col items-center min-w-[30px] pt-0.5">
                <span className="font-mono font-bold text-xs text-slate-400">{event.minute}'</span>
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                    {icon}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>
                        {event.type === 'goal' ? 'GOAL!' : event.type.replace('_', ' ')}
                    </span>
                </div>
                <div className={`text-sm ${fontFamily} text-white leading-tight`}>{event.playerName}</div>
                {event.extraInfo && <div className={`text-xs mt-1 ${event.style === 'poetic' ? 'text-yellow-200/70 italic' : 'text-slate-500'}`}>{event.extraInfo}</div>}
                {event.xg && <div className="text-[9px] text-slate-600 font-mono mt-1">xG: {event.xg.toFixed(2)}</div>}
            </div>
        </div>
    );
};

const PitchPlayer = ({ player, isHome, onClick, isSelected }: { player: LivePlayer, isHome: boolean, onClick?: () => void, isSelected?: boolean }) => {
    if (!player) return null;
    
    let ringColor = "ring-slate-600";
    if (player.position === Position.GK) ringColor = "ring-yellow-600";
    else if (player.position === Position.DEF) ringColor = "ring-blue-600";
    else if (player.position === Position.MID) ringColor = "ring-emerald-600";
    else if (player.position === Position.FWD) ringColor = "ring-rose-600";

    return (
        <PlayerTooltip player={player} liveStats={player.matchStats} onClick={onClick ? (e) => { onClick(); } : undefined}>
            <div 
                className={`
                    flex flex-col items-center justify-center transition-all duration-300 relative z-10
                    ${onClick ? 'cursor-pointer hover:scale-110' : ''}
                    ${isSelected ? 'scale-125 z-20' : ''}
                    ${player.matchStats.red ? 'opacity-50 grayscale' : ''}
                `}
            >
                <div className={`
                    w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center 
                    font-bold text-xs md:text-sm text-white shadow-lg border-2 
                    ${isSelected ? 'border-white ring-4 ring-emerald-400 bg-emerald-600' : `border-slate-800 bg-slate-900 ${ringColor}`}
                `}>
                    {player.matchStats.rating.toFixed(1)}
                    {player.matchStats.yellow && !player.matchStats.red && (
                        <div className="absolute -top-1 -right-1 w-3 h-4 bg-yellow-400 rounded-[1px] border border-black/50 shadow-sm"></div>
                    )}
                    {player.matchStats.red && (
                        <div className="absolute -top-1 -right-1 w-3 h-4 bg-red-600 rounded-[1px] border border-black/50 shadow-sm"></div>
                    )}
                </div>
                
                <div className="mt-1 px-2 py-0.5 bg-black/60 backdrop-blur rounded text-[8px] md:text-[9px] text-white font-bold truncate max-w-[80px] border border-white/10">
                    {player.name.split(' ').pop()}
                </div>

                <div className="w-8 h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                    <div 
                        className={`h-full ${player.currentCondition > 70 ? 'bg-emerald-500' : player.currentCondition > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${player.currentCondition}%` }}
                    ></div>
                </div>
            </div>
        </PlayerTooltip>
    );
};

export const LiveMatch: React.FC<Props> = ({ homeTeam, awayTeam, homeLineup, awayLineup, homeBench, awayBench, fixture, referee, onComplete }) => {
  const { gameState } = useGame();
  
  // --- ENGINE STATE ---
  const [clock, setClock] = useState(0);
  const [gameStatus, setGameStatus] = useState<'PreMatch' | 'FirstHalf' | 'HalfTime' | 'SecondHalf' | 'FullTime'>('PreMatch');
  const [simSpeed, setSimSpeed] = useState(30); 
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'Commentary' | 'Stats' | 'Analysis' | 'Lineup'>('Commentary');
  const [onlyKeyEvents, setOnlyKeyEvents] = useState(false);
  
  // --- LIVE SQUAD STATE ---
  const initLivePlayer = (p: Player): LivePlayer => ({
      ...p,
      currentCondition: p.condition,
      currentRating: 6.0,
      matchStats: {
          playerId: p.id, name: p.name, position: p.position, rating: 6.0, goals: 0, assists: 0,
          shots: 0, xg: 0, xa: 0, xt: 0, xpress: 0, xsave: 0, passes: 0, keyPasses: 0,
          tackles: 0, saves: 0, interceptions: 0, clearances: 0, crosses: 0, headersWon: 0,
          dribblesAttempted: 0, dribblesCompleted: 0, yellow: false, red: false, aerialsWon: 0, fouls: 0, minutesPlayed: 0
      }
  });

  const [homeSquad, setHomeSquad] = useState<LivePlayer[]>(homeLineup.map(initLivePlayer));
  const [awaySquad, setAwaySquad] = useState<LivePlayer[]>(awayLineup.map(initLivePlayer));
  const [homeFormation, setHomeFormation] = useState(homeTeam.tactics.formation || '4-4-2');
  const [awayFormation, setAwayFormation] = useState(awayTeam.tactics.formation || '4-4-2');

  const [subsCount, setSubsCount] = useState({ home: 0, away: 0 });
  const [maxSubs] = useState(5);

  // --- INTERACTIVE STATE ---
  const [activeSheet, setActiveSheet] = useState<'none' | 'tactics' | 'subs' | 'shouts'>('none');
  const [selectedSubOut, setSelectedSubOut] = useState<string | null>(null);
  const [selectedSubIn, setSelectedSubIn] = useState<string | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<string | null>(null); 
  const [shoutCooldown, setShoutCooldown] = useState(0);
  const [assistantCooldown, setAssistantCooldown] = useState(0);
  const [assistantTip, setAssistantTip] = useState<{msg: string, action?: () => void} | null>(null);
  
  // --- VISUAL & LOGIC STATE ---
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 50 });
  const [activeAction, setActiveAction] = useState<{ type: string, player: Player, teamId: string } | null>(null);
  const [momentum, setMomentum] = useState(0); // -50 (Away) to 50 (Home)
  const [momentumHistory, setMomentumHistory] = useState<number[]>([]);
  const [lastBallZone, setLastBallZone] = useState(2); // Midfield start
  
  // New Logic States
  const [assistContext, setAssistContext] = useState<{ id: string, timer: number, type: 'through'|'cross'|'cutback'|'simple' } | null>(null);
  const [varState, setVarState] = useState<'idle' | 'checking' | 'decision'>('idle');
  const [varDecision, setVarDecision] = useState<'goal' | 'no_goal' | null>(null);
  
  // --- ENVIRONMENT STATE ---
  const [weather] = useState<WeatherType>(generateWeather(homeTeam.stadium.climateType, fixture.week, homeTeam.stadium.name));
  
  // --- STATS ---
  const [scores, setScores] = useState({ home: 0, away: 0 });
  const [matchStats, setMatchStats] = useState<MatchStats>({
      possessionHome: 50, possessionAway: 50, ticksHome: 0, ticksAway: 0,
      shotsHome: 0, shotsAway: 0, shotsOnTargetHome: 0, shotsOnTargetAway: 0, xgHome: 0, xgAway: 0,
      xPressHome: 0, xPressAway: 0, passesHome: 0, passesAway: 0, tacklesHome: 0, tacklesAway: 0,
      headersWonHome: 0, headersWonAway: 0, dribblesHome: 0, dribblesAway: 0, savesHome: 0, savesAway: 0,
      cornersHome: 0, cornersAway: 0, foulsHome: 0, foulsAway: 0, yellowHome: 0, yellowAway: 0,
      interceptionsHome: 0, interceptionsAway: 0, clearancesHome: 0, clearancesAway: 0,
      freeKicksHome: 0, freeKicksAway: 0, offsidesHome: 0, offsidesAway: 0, crossesHome: 0, crossesAway: 0
  });

  const timerRef = useRef<any>(null);
  const userTeamId = gameState?.userTeamId;
  const isUserHome = userTeamId === homeTeam.id;

  const playSound = (type: 'whistle'|'goal'|'ping') => {
      if (gameState?.userSettings.audioEnabled) {
          if (type === 'whistle') SoundEngine.playWhistle();
          if (type === 'goal') SoundEngine.playGoal();
          if (type === 'ping') SoundEngine.playPing();
      }
  };

  const addLog = (type: MatchEvent['type'], p: Player|null, teamId: string|null, extra?: string, style: MatchEvent['style'] = 'neutral', xg?: number, loc?: {x: number, y: number}) => {
      const newEvent: MatchEvent = {
          minute: Math.floor(clock),
          type,
          teamId: teamId || '',
          playerId: p?.id || '',
          playerName: p ? p.name : (extra || 'Event'),
          extraInfo: extra,
          visualClass: type === 'goal' ? 'goal' : undefined,
          style: style,
          xg,
          location: loc
      };
      setEvents(prev => [newEvent, ...prev]);
  };

  useEffect(() => {
      // VAR Timer logic
      if (varState === 'checking') {
          const timeout = setTimeout(() => {
              setVarState('decision');
              const confirmed = Math.random() > 0.3; // 70% chance goal stands
              setVarDecision(confirmed ? 'goal' : 'no_goal');
              
              if (confirmed) {
                  addLog('var', null, null, "VAR Check Complete: Goal Stands.", 'neutral');
                  setVarState('idle');
                  setSimSpeed(30);
              } else {
                  addLog('var', null, null, "VAR Check Complete: Goal Disallowed (Offside).", 'critical');
                  setScores(prev => ({ ...prev, [assistContext?.id ? 'home' : 'away']: Math.max(0, prev[assistContext?.id ? 'home' : 'away'] - 1) })); // Simplified rollback
                  setVarState('idle');
                  setSimSpeed(30);
              }
          }, 3000);
          return () => clearTimeout(timeout);
      }
  }, [varState]);

  useEffect(() => {
      if (simSpeed === 0 || varState !== 'idle') return;
      if (gameStatus === 'PreMatch' || gameStatus === 'HalfTime' || gameStatus === 'FullTime') return;

      timerRef.current = setInterval(() => {
          setClock(c => {
              const next = c + (0.1 * (simSpeed/30));
              if (gameStatus === 'FirstHalf' && next >= 45) { setSimSpeed(0); setGameStatus('HalfTime'); playSound('whistle'); addLog('whistle', null, null, "Half-time whistle.", 'neutral'); return 45; }
              if (gameStatus === 'SecondHalf' && next >= 90) { setSimSpeed(0); setGameStatus('FullTime'); playSound('whistle'); addLog('whistle', null, null, "Full-time whistle.", 'neutral'); return 90; }
              return next;
          });
          tick();
      }, 1000 / (simSpeed/2)); 

      return () => clearInterval(timerRef.current);
  }, [simSpeed, gameStatus, homeSquad, awaySquad, varState]);

  const getZone = (x: number, teamSide: 'home' | 'away') => {
      let z = 0;
      if (x > 84) z = 5;
      else if (x > 67) z = 4;
      else if (x > 50) z = 3;
      else if (x > 33) z = 2;
      else if (x > 16) z = 1;
      return teamSide === 'home' ? z : 5 - z;
  };

  const tick = () => {
      // 1. Decay & Cooldowns
      setMomentum(m => {
          const next = m * 0.99;
          setMomentumHistory(prev => [...prev.slice(-59), next]); // Keep last 60 ticks
          return next;
      });
      if (shoutCooldown > 0) setShoutCooldown(prev => Math.max(0, prev - 0.05));
      if (assistantCooldown > 0) setAssistantCooldown(prev => Math.max(0, prev - 0.05));
      if (assistContext) {
          if (assistContext.timer <= 0) setAssistContext(null);
          else setAssistContext(prev => ({ ...prev!, timer: prev!.timer - 1 }));
      }

      // 2. Determine Possession
      const homeProb = 0.5 + (momentum / 200); 
      const currentPossession = Math.random() < homeProb ? 'home' : 'away';
      setMatchStats(s => currentPossession === 'home' ? {...s, ticksHome: s.ticksHome+1} : {...s, ticksAway: s.ticksAway+1});

      // Passive Passing (Recycling possession)
      if (Math.random() < 0.4) { // 40% chance per tick to register a pass in build-up
          setMatchStats(prev => currentPossession === 'home' ? { ...prev, passesHome: prev.passesHome + 1 } : { ...prev, passesAway: prev.passesAway + 1 });
      }

      // 3. Select Actors
      const attSquad = currentPossession === 'home' ? homeSquad : awaySquad;
      const defSquad = currentPossession === 'home' ? awaySquad : homeSquad;
      const attTeam = currentPossession === 'home' ? homeTeam : awayTeam;
      
      const activeAtt = attSquad.filter(p => !p.isSubbedOut && !p.matchStats.red);
      const activeDef = defSquad.filter(p => !p.isSubbedOut && !p.matchStats.red);

      if (activeAtt.length === 0 || activeDef.length === 0) return;

      const getWeightedActor = (pool: LivePlayer[]) => {
          const weightedPool = [];
          for (const p of pool) {
              let weight = 1;
              if (p.position === Position.MID) weight = 3;
              if (p.position === Position.FWD) weight = 4;
              for(let i=0; i<weight; i++) weightedPool.push(p);
          }
          return getRandom(weightedPool);
      };

      const attacker = getWeightedActor(activeAtt);
      const defender = getRandom(activeDef);

      // 4. Update Condition
      if (Math.random() < 0.01) {
          const weatherMod = WEATHER_EFFECTS[weather].fatigue;
          attacker.currentCondition = Math.max(0, attacker.currentCondition - ((100 - attacker.stats.pac)/100 * weatherMod));
          defender.currentCondition = Math.max(0, defender.currentCondition - ((100 - defender.stats.pac)/100 * weatherMod));
      }

      // 5. Event Logic
      const roll = Math.random();
      const eventThreshold = 0.05 + (Math.abs(momentum)/1000); 

      // Injury Check
      if (Math.random() < 0.002 && attacker.currentCondition < 30) {
          handleInjury(attacker, attTeam);
          return;
      }

      if (roll < eventThreshold) {
          // DUEL
          const attSkill = (attacker.stats.att + attacker.stats.pac + attacker.stats.mid)/3 * (attacker.currentCondition/100);
          const defSkill = (defender.stats.def + defender.stats.pac + defender.stats.mid)/3 * (defender.currentCondition/100);
          
          const duelResult = (attSkill * Math.random()) > (defSkill * Math.random());

          if (duelResult) {
              if (Math.random() < 0.35) {
                  // SHOT
                  handleShot(attacker, attTeam, currentPossession);
              } else {
                  // KEY PASS / DRIBBLE / PROGRESSION
                  setActiveAction({ type: 'Attacking', player: attacker, teamId: attTeam.id });
                  
                  const newX = currentPossession === 'home' ? randInt(60, 85) : randInt(15, 40);
                  const newY = randInt(20, 80);
                  
                  const currentZone = getZone(newX, currentPossession);
                  const prevZone = getZone(ballPosition.x, currentPossession);
                  
                  if (currentZone > prevZone) {
                      const xt = calculateXT(attacker, prevZone, currentZone);
                      updatePlayerStat(attacker, 'xt', xt);
                  }

                  setBallPosition({ x: newX, y: newY });
                  setLastBallZone(currentZone);
                  
                  setMomentum(m => m + (currentPossession === 'home' ? 5 : -5));
                  updatePlayerStat(attacker, 'rating', 0.1);
                  
                  // Set Assist Context
                  const passType = Math.random() < 0.3 ? 'through' : Math.random() < 0.3 ? 'cross' : 'simple';
                  setAssistContext({ id: attacker.id, timer: 8, type: passType });
              }
          } else {
              // Defender wins -> Tackle/Interception
              handleDefensiveAction(defender, defSquad[0].teamId === homeTeam.id ? homeTeam : awayTeam, currentPossession);
          }
      } else {
          if (Math.random() < 0.1) {
              setBallPosition({ x: randInt(30, 70), y: randInt(20, 80) });
          }
      }
  };

  const handleDefensiveAction = (defender: LivePlayer, team: Team, possessionSide: 'home' | 'away') => {
      const isTackle = Math.random() > 0.5;
      const defenderZone = getZone(ballPosition.x, possessionSide === 'home' ? 'away' : 'home');
      const isHomeTeam = team.id === homeTeam.id;

      // High press bonus (Zone 3,4,5)
      if (defenderZone >= 3) {
          const xPress = calculateXPress(defender, defenderZone);
          updatePlayerStat(defender, 'xpress', xPress);
          setMatchStats(s => possessionSide === 'home' ? {...s, xPressAway: s.xPressAway + xPress} : {...s, xPressHome: s.xPressHome + xPress});
      }

      // Foul Check
      if (isTackle && Math.random() < (0.1 + (referee.stats.strictness/200))) {
          addLog('whistle', defender, team.id, "Foul committed.", 'neutral');
          setMatchStats(s => isHomeTeam ? {...s, foulsHome: s.foulsHome+1} : {...s, foulsAway: s.foulsAway+1});
          
          if (Math.random() < (0.2 + (referee.stats.yellowCardAvg/10))) {
              if (defender.matchStats.yellow) {
                  handleCard(defender, team, 'red', 'Second Yellow');
              } else {
                  handleCard(defender, team, 'yellow', 'Bad Tackle');
              }
          } else if (Math.random() < 0.05) {
              handleCard(defender, team, 'red', 'Violent Conduct');
          }
          return;
      }

      // Successful Defense
      const { text, style } = generateCommentary(isTackle ? 'tackle' : 'neutral', { player: defender, team: team, minute: Math.floor(clock) });
      addLog(isTackle ? 'tackle' : 'pass', defender, team.id, text, style);
      setActiveAction({ type: isTackle ? 'Tackle' : 'Intercept', player: defender, teamId: team.id });
      setMomentum(m => m + (possessionSide === 'home' ? -3 : 3)); 
      updatePlayerStat(defender, isTackle ? 'tackles' : 'interceptions', 1);
      updatePlayerStat(defender, 'rating', 0.2);

      // --- FIX: Update Match Aggregate Stats ---
      setMatchStats(s => {
          if (isHomeTeam) {
              return { ...s, tacklesHome: isTackle ? s.tacklesHome + 1 : s.tacklesHome, interceptionsHome: !isTackle ? s.interceptionsHome + 1 : s.interceptionsHome };
          } else {
              return { ...s, tacklesAway: isTackle ? s.tacklesAway + 1 : s.tacklesAway, interceptionsAway: !isTackle ? s.interceptionsAway + 1 : s.interceptionsAway };
          }
      });
  };

  const handleCard = (player: LivePlayer, team: Team, type: 'yellow'|'red', reason: string) => {
      if (type === 'red') {
          updatePlayerStat(player, 'red', true);
          addLog('red', player, team.id, reason, 'critical');
          setActiveAction({ type: 'RED CARD', player, teamId: team.id });
      } else {
          updatePlayerStat(player, 'yellow', true);
          addLog('neutral', player, team.id, `${reason} - Yellow Card`, 'neutral');
      }
  };

  const handleInjury = (player: LivePlayer, team: Team) => {
      const { text, style } = generateCommentary('injury', { player, team, minute: Math.floor(clock) });
      addLog('injury', player, team.id, text, style);
      setActiveAction({ type: 'INJURY', player, teamId: team.id });
      player.currentCondition = 5; 
  };

  const handleShot = (attacker: LivePlayer, team: Team, side: 'home' | 'away') => {
      const isHome = side === 'home';
      const defSquad = isHome ? awaySquad : homeSquad;
      const gk = defSquad.find(p => p.position === Position.GK && !p.isSubbedOut) || defSquad[0];

      // Shot Location Logic
      const shotX = isHome ? 95 : 5;
      const shotY = randInt(35, 65);
      setBallPosition({ x: shotX, y: shotY });
      setActiveAction({ type: 'Shooting', player: attacker, teamId: team.id });

      // Calculate xG
      const distance = Math.abs(50 - shotY) / 2 + (isHome ? 100 - shotX : shotX); // Rough distance
      const xg = calculateXG(attacker, distance, 'shot', false);
      
      setMatchStats(s => isHome ? { ...s, shotsHome: s.shotsHome+1, xgHome: s.xgHome + xg } : { ...s, shotsAway: s.shotsAway+1, xgAway: s.xgAway + xg });
      updatePlayerStat(attacker, 'shots', 1);
      updatePlayerStat(attacker, 'xg', xg);

      const saveChance = (gk.stats.gk / 100) * (gk.currentCondition / 100);
      const shotQuality = (attacker.stats.att / 100) * (attacker.currentCondition / 100) * Math.random();

      // Assist Calculation
      let assistPlayerId = undefined;
      if (assistContext && assistContext.id !== attacker.id) {
          const assister = (isHome ? homeSquad : awaySquad).find(p => p.id === assistContext.id);
          if (assister) {
              const xa = calculateXA(assister, assistContext.type, attacker);
              updatePlayerStat(assister, 'xa', xa);
              assistPlayerId = assister.id;
          }
      }

      if (shotQuality > saveChance && Math.random() < 0.4) {
          // GOAL
          setScores(s => isHome ? {...s, home: s.home+1} : {...s, away: s.away+1});
          
          const { text, style } = generateCommentary('goal', { player: attacker, team, minute: Math.floor(clock), score: scores, isDerby: homeTeam.rivalId === awayTeam.id });
          addLog('goal', attacker, team.id, text, style, xg, {x: shotX, y: shotY});
          
          playSound('goal');
          setActiveAction({ type: 'GOAL!', player: attacker, teamId: team.id });
          setMomentum(isHome ? 40 : -40); 
          updatePlayerStat(attacker, 'goals', 1);
          updatePlayerStat(attacker, 'rating', 1.0); 
          updatePlayerStat(gk, 'rating', -0.3);
          setBallPosition({ x: 50, y: 50 });

          // --- FIX: Count Goals as Shots On Target ---
          setMatchStats(s => isHome ? {...s, shotsOnTargetHome: s.shotsOnTargetHome+1 } : {...s, shotsOnTargetAway: s.shotsOnTargetAway+1 });

          if (assistPlayerId) {
              const assister = (isHome ? homeSquad : awaySquad).find(p => p.id === assistPlayerId);
              if (assister) {
                  updatePlayerStat(assister, 'assists', 1);
                  updatePlayerStat(assister, 'rating', 0.5);
              }
          }

          if (Math.random() < 0.15 && referee.stats.varAccuracy > 0) {
              setSimSpeed(0);
              setVarState('checking');
              addLog('var', null, null, "Goal under review...", 'neutral');
          }

      } else {
          // SAVE / MISS
          if (Math.random() > 0.5) {
              const { text, style } = generateCommentary('save', { player: gk, team: defSquad[0].teamId === homeTeam.id ? homeTeam : awayTeam, minute: Math.floor(clock) });
              addLog('save', gk, gk.teamId, text, style, xg, {x: shotX, y: shotY});
              setActiveAction({ type: 'Save', player: gk, teamId: gk.teamId });
              updatePlayerStat(gk, 'saves', 1);
              updatePlayerStat(gk, 'rating', 0.4);
              setMatchStats(s => isHome ? {...s, shotsOnTargetHome: s.shotsOnTargetHome+1, savesAway: s.savesAway+1} : {...s, shotsOnTargetAway: s.shotsOnTargetAway+1, savesHome: s.savesHome+1});
              setBallPosition({ x: isHome ? 85 : 15, y: randInt(30, 70) }); // Rebound
          } else {
              const { text, style } = generateCommentary('miss', { player: attacker, team, minute: Math.floor(clock) });
              addLog('miss', attacker, team.id, text, style, xg, {x: shotX, y: shotY});
              updatePlayerStat(attacker, 'rating', -0.1);
              setBallPosition({ x: isHome ? 100 : 0, y: randInt(40, 60) }); // Goal kick
          }
          setMomentum(0); 
      }
  };

  const updatePlayerStat = (p: LivePlayer, stat: keyof PlayerMatchStats, val: any) => {
      const updater = (squad: LivePlayer[], setSquad: React.Dispatch<React.SetStateAction<LivePlayer[]>>) => {
          setSquad(prev => prev.map(player => {
              if (player.id !== p.id) return player;
              
              if (stat === 'red' || stat === 'yellow') {
                  const newStats = { ...player.matchStats, [stat]: val as boolean };
                  return { ...player, matchStats: newStats };
              }

              const newStats = { ...player.matchStats, [stat]: (player.matchStats[stat] as number) + (val as number) };
              if (stat === 'rating') {
                  newStats.rating = Math.min(10, Math.max(1, newStats.rating));
              }
              return { ...player, matchStats: newStats, currentRating: newStats.rating };
          }));
      };

      if (homeSquad.some(pl => pl.id === p.id)) updater(homeSquad, setHomeSquad);
      else updater(awaySquad, setAwaySquad);
  };

  const generateAssistantTip = () => {
      const tips = [
          { msg: "We are losing the midfield battle. Consider 'Encourage'.", action: () => handleShout('Encourage') },
          { msg: "Opponent is tired. 'Demand More' to push for a goal!", action: () => handleShout('Demand More') },
          { msg: "Our defense looks shaky. Switch to 'Defensive'?", action: () => {} },
      ];
      const tip = getRandom(tips);
      setAssistantTip(tip);
      setAssistantCooldown(60); // 60s cooldown
      setTimeout(() => setAssistantTip(null), 8000); 
  };

  const handleAssistantClick = () => {
      if (!homeTeam.assistant) return;
      
      setAssistantCooldown(60);
      // Chance to give useful info or generic
      if (Math.random() < 0.7) {
          generateAssistantTip();
      } else {
          setAssistantTip({ msg: "I'm monitoring the situation. Keep it up for now." });
          setTimeout(() => setAssistantTip(null), 4000);
      }
  };

  // --- ACTIONS ---

  const handleSub = () => {
      if (!selectedSubOut || !selectedSubIn) return;
      if (subsCount.home >= maxSubs) {
          alert("No substitutions remaining!");
          return;
      }

      const playerOut = homeSquad.find(p => p.id === selectedSubOut);
      const playerIn = homeBench.find(p => p.id === selectedSubIn);

      if (playerOut && playerIn) {
          const newLiveIn = initLivePlayer(playerIn);
          
          setHomeSquad(prev => prev.map(p => {
              if (p.id === selectedSubOut) return { ...p, isSubbedOut: true };
              return p;
          }).concat(newLiveIn));

          setSubsCount(prev => ({ ...prev, home: prev.home + 1 }));
          addLog('sub', newLiveIn, homeTeam.id, `ON: ${playerIn.name}, OFF: ${playerOut.name}`, 'analytical');
          setActiveSheet('none');
          setSelectedSubOut(null);
          setSelectedSubIn(null);
      }
  };

  const handlePitchSwap = (playerId: string) => {
      if (!swapSourceId) {
          setSwapSourceId(playerId);
      } else {
          // Find indices
          const idx1 = homeSquad.findIndex(p => p.id === swapSourceId);
          const idx2 = homeSquad.findIndex(p => p.id === playerId);
          if (idx1 !== -1 && idx2 !== -1) {
              const newSquad = [...homeSquad];
              const temp = newSquad[idx1];
              newSquad[idx1] = newSquad[idx2];
              newSquad[idx2] = temp;
              setHomeSquad(newSquad);
              addLog('tactical', null, homeTeam.id, "Positional swap on the field.", 'analytical');
          }
          setSwapSourceId(null);
      }
  };

  const handleShout = (shout: string) => {
      setShoutCooldown(15);
      setActiveSheet('none');
      const { text, style } = generateCommentary('shout', { player: homeSquad[0], team: homeTeam, minute: Math.floor(clock) });
      addLog('shout', null, userTeamId, `Manager shouts: "${shout}"`, style);
      setMomentum(m => isUserHome ? m + 15 : m - 15);
      setHomeSquad(prev => prev.map(p => ({ ...p, currentRating: Math.min(10, p.currentRating + 0.1) })));
  };

  const handleTeamTalk = (type: 'Aggressive' | 'Calm' | 'Passionate') => {
      let momentumBoost = 0;
      let conditionBoost = 0;

      if (type === 'Aggressive') {
          momentumBoost = 20;
          conditionBoost = -5;
      } else if (type === 'Calm') {
          momentumBoost = 5;
          conditionBoost = 5;
      } else {
          momentumBoost = 15;
      }

      setMomentum(m => isUserHome ? m + momentumBoost : m - momentumBoost);
      setHomeSquad(prev => prev.map(p => ({ 
          ...p, 
          currentCondition: Math.min(100, p.currentCondition + conditionBoost),
          currentRating: p.currentRating + 0.2 
      })));
      
      setGameStatus('SecondHalf');
      setSimSpeed(30);
  };

  const filteredEvents = onlyKeyEvents 
      ? events.filter(e => e.type === 'goal' || e.type === 'red' || (e.visualClass && e.visualClass.includes('yellow'))) 
      : events;

  const totalTicks = matchStats.ticksHome + matchStats.ticksAway;
  const possHome = totalTicks > 0 ? Math.round((matchStats.ticksHome / totalTicks) * 100) : 50;

  const activeHomePlayers = homeSquad.filter(p => !p.isSubbedOut);
  
  const WeatherIcon = () => {
      if (weather === 'Rain' || weather === 'Heavy Rain') return <CloudRain size={16} className="text-blue-400"/>;
      if (weather === 'Snow') return <CloudSnow size={16} className="text-white"/>;
      if (weather === 'Windy') return <Wind size={16} className="text-slate-400"/>;
      if (weather === 'Cloudy') return <Cloud size={16} className="text-slate-400"/>;
      return <Sun size={16} className="text-yellow-400"/>;
  };

  const renderFormationOnPitch = (squad: LivePlayer[], fmt: string, isHomeTeam: boolean) => {
      const stats = FORMATIONS[fmt as keyof typeof FORMATIONS] || FORMATIONS['4-4-2'];
      const xi = squad.filter(p => !p.isSubbedOut).slice(0, 11);
      
      const rows = [
          xi.slice(0, 1), 
          xi.slice(1, 1 + stats.def), 
          xi.slice(1 + stats.def, 1 + stats.def + stats.mid), 
          xi.slice(1 + stats.def + stats.mid, 11) 
      ];

      if (isHomeTeam) rows.reverse();

      return (
          <div className="flex-1 flex flex-col justify-evenly py-2">
              {rows.map((row, idx) => (
                  <div key={idx} className="flex justify-around items-center px-4 w-full">
                      {row.map(p => (
                          <PitchPlayer 
                              key={p.id} 
                              player={p} 
                              isHome={isHomeTeam} 
                              onClick={isHomeTeam ? () => handlePitchSwap(p.id) : undefined}
                              isSelected={swapSourceId === p.id}
                          />
                      ))}
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F1419] flex flex-col font-sans text-white">
        
        {/* VAR OVERLAY */}
        {varState !== 'idle' && (
            <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                <div className="bg-slate-900 border-2 border-blue-500 rounded-lg p-6 flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(59,130,246,0.5)] animate-in zoom-in">
                    <div className="text-2xl font-black italic text-white uppercase tracking-widest flex items-center gap-3">
                        <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                        VAR CHECK
                    </div>
                    <div className="text-blue-400 font-mono text-lg animate-pulse">
                        {varState === 'checking' ? 'REVIEWING FOOTAGE...' : varDecision === 'goal' ? 'GOAL CONFIRMED' : 'GOAL DISALLOWED'}
                    </div>
                </div>
            </div>
        )}

        {/* ... PRE MATCH and HALF TIME (omitted for brevity, unchanged) ... */}
        {/* --- PRE-MATCH TACTICAL BOARD --- */}
        {gameStatus === 'PreMatch' && (
            <div className="absolute inset-0 z-[200] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
                <div className="w-full max-w-6xl h-[90vh] flex flex-col md:flex-row bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Left: Context */}
                    <div className="md:w-1/3 bg-slate-950 p-8 flex flex-col border-r border-slate-800 relative">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-4 mb-6">
                                <Crest team={homeTeam} size="lg" />
                                <div className="text-4xl font-sport font-bold italic text-slate-600">VS</div>
                                <Crest team={awayTeam} size="lg" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">{fixture.leagueId || 'League Match'}</h2>
                            <div className="flex gap-4 text-sm text-slate-400 mb-8">
                                <span className="flex items-center gap-1"><WeatherIcon /> {weather}</span>
                                <span className="flex items-center gap-1"><Flag size={14}/> {referee.name.split(' ').pop()}</span>
                            </div>
                            
                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 w-full mb-6">
                                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Tactical Setup</h4>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-slate-300">Formation</span>
                                    <select 
                                        value={homeFormation}
                                        onChange={(e) => setHomeFormation(e.target.value)}
                                        className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-2 py-1 rounded outline-none"
                                    >
                                        {Object.keys(FORMATIONS).map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>

                            <Button 
                                size="lg" 
                                onClick={() => { setGameStatus('FirstHalf'); setSimSpeed(30); }}
                                className="w-full py-4 text-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse"
                            >
                                KICK OFF
                            </Button>
                        </div>
                    </div>

                    {/* Right: Lineup Board */}
                    <div className="flex-1 bg-slate-900 p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Clipboard size={20}/> Starting XI</h3>
                            <div className="text-xs text-slate-500 italic">Drag to swap not implemented, click to select.</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {homeSquad.slice(0, 11).map((p, idx) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                                    <div className="font-mono text-slate-500 w-6 text-center">{idx+1}</div>
                                    <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${p.position === 'GK' ? 'bg-yellow-600' : 'bg-slate-600'}`}>
                                        {p.position}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">{p.name}</div>
                                        <div className="text-xs text-slate-400">{p.stats.ovr} OVR • {p.condition}% Cond</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- HALF TIME MODAL --- */}
        {gameStatus === 'HalfTime' && (
            <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">Half Time</div>
                        <div className="text-6xl font-mono font-black text-white mb-2">{scores.home} - {scores.away}</div>
                        <p className="text-slate-400 italic">"Possession is {possHome}%. We need to {possHome > 50 ? 'maintain control' : 'fight harder'}."</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <button onClick={() => handleTeamTalk('Aggressive')} className="p-4 bg-red-900/30 border border-red-500/50 hover:bg-red-900/50 rounded-lg text-center transition-all group">
                            <div className="text-2xl mb-2">🤬</div>
                            <div className="font-bold text-red-200 group-hover:text-white">Aggressive</div>
                            <div className="text-[10px] text-red-300/50 uppercase mt-1">High Risk</div>
                        </button>
                        <button onClick={() => handleTeamTalk('Calm')} className="p-4 bg-blue-900/30 border border-blue-500/50 hover:bg-blue-900/50 rounded-lg text-center transition-all group">
                            <div className="text-2xl mb-2">😌</div>
                            <div className="font-bold text-blue-200 group-hover:text-white">Calm</div>
                            <div className="text-[10px] text-blue-300/50 uppercase mt-1">Stabilize</div>
                        </button>
                        <button onClick={() => handleTeamTalk('Passionate')} className="p-4 bg-emerald-900/30 border border-emerald-500/50 hover:bg-emerald-900/50 rounded-lg text-center transition-all group">
                            <div className="text-2xl mb-2">🔥</div>
                            <div className="font-bold text-emerald-200 group-hover:text-white">Passionate</div>
                            <div className="text-[10px] text-emerald-300/50 uppercase mt-1">Boost Morale</div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- 1. MATCH HEADER --- */}
        <div className="bg-[#151A21] border-b border-white/5 pt-2 pb-0 px-4 shrink-0 z-20 shadow-lg">
             <div className="flex justify-between items-center mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                 <div className="flex items-center gap-3">
                     <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-white">LGE</span>
                     <span>Week {fixture.week}</span>
                     <span className="flex items-center gap-1 text-slate-500 border-l border-slate-700 pl-3">
                         <WeatherIcon /> {weather}
                     </span>
                     <span className="flex items-center gap-1 text-slate-500" title={`Referee: ${referee.name}`}>
                         <Flag size={12}/> {referee.name.split(' ').pop()}
                     </span>
                 </div>
                 <div className={`flex items-center gap-2 ${gameStatus.includes('Half') || gameStatus.includes('Full') ? 'text-white' : 'text-[var(--fot-danger)] animate-pulse'}`}>
                     <Timer size={12} />
                     {gameStatus === 'PreMatch' ? '00:00' : gameStatus === 'FullTime' ? 'FT' : gameStatus === 'HalfTime' ? 'HT' : Math.floor(clock) + "'"}
                 </div>
             </div>

             <div className="flex justify-between items-center px-4 mb-3 relative">
                 <div className="flex flex-col items-center w-24">
                     <Crest team={homeTeam} size="sm" />
                     <span className="text-[10px] font-bold mt-1 text-slate-300 truncate w-full text-center">{homeTeam.name}</span>
                 </div>
                 
                 <div className="text-4xl font-mono font-black text-white tracking-tighter px-6 py-1 bg-black/20 rounded-lg border border-white/5 shadow-inner">
                     {scores.home} - {scores.away}
                 </div>

                 <div className="flex flex-col items-center w-24">
                     <Crest team={awayTeam} size="sm" />
                     <span className="text-[10px] font-bold mt-1 text-slate-300 truncate w-full text-center">{awayTeam.name}</span>
                 </div>
             </div>

             <div className="h-1 flex w-full mb-0 relative bg-slate-800">
                 <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${50 + momentum}%`, opacity: 0.8 }}></div>
                 <div className="h-full bg-slate-600 transition-all duration-700 ease-out flex-1" style={{ opacity: 0.8 }}></div>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-white z-10"></div>
             </div>

             <div className="flex justify-center gap-8 overflow-x-auto pt-2">
                 {['Commentary', 'Stats', 'Analysis', 'Lineup'].map(tab => (
                     <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                     >
                         {tab}
                     </button>
                 ))}
             </div>
        </div>

        {/* --- 2. MAIN CONTENT --- */}
        <div className="flex-1 overflow-y-auto relative bg-[#0F1419] custom-scrollbar pb-32">
            
            {activeTab === 'Commentary' && (
                <>
                    <div className="h-[35vh] min-h-[220px] relative bg-[#0F1419] flex items-center justify-center border-b border-white/5 shadow-2xl overflow-hidden group">
                        <div 
                            className="relative h-[90%] aspect-[1.6] max-w-[95%] bg-gradient-to-r from-[#1e3a29] to-[#0f291e] border-2 border-white/10 shadow-2xl rounded-lg overflow-hidden transition-transform duration-700"
                            style={{ transform: 'perspective(1000px) rotateX(20deg) scale(0.95)', transformStyle: 'preserve-3d' }}
                        >
                            {/* Markings */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>
                            
                            {/* Center Line */}
                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2"></div>
                            <div className="absolute top-1/2 left-1/2 w-[12%] aspect-square border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                            
                            {/* Left Penalty Area */}
                            <div className="absolute top-[22%] bottom-[22%] left-0 w-[15%] border-r border-t border-b border-white/30 bg-white/5"></div>
                            <div className="absolute top-[38%] bottom-[38%] left-0 w-[6%] border-r border-t border-b border-white/30"></div>
                            
                            {/* Right Penalty Area */}
                            <div className="absolute top-[22%] bottom-[22%] right-0 w-[15%] border-l border-t border-b border-white/30 bg-white/5"></div>
                            <div className="absolute top-[38%] bottom-[38%] right-0 w-[6%] border-l border-t border-b border-white/30"></div>

                            {/* Zones */}
                            {momentum > 20 && <div className="absolute top-0 bottom-0 right-0 w-[30%] bg-emerald-500/10 animate-pulse transition-opacity"></div>}
                            {momentum < -20 && <div className="absolute top-0 bottom-0 left-0 w-[30%] bg-red-500/10 animate-pulse transition-opacity"></div>}

                            <div 
                                className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_15px_white] z-20 transition-all duration-700 ease-out"
                                style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
                            ></div>

                            {activeAction && (
                                <div className="absolute transition-all duration-700 ease-out z-30" style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}>
                                    <ActionBubble 
                                        event={activeAction.type} 
                                        player={activeAction.player.name.split(' ').pop() || ''} 
                                        teamColor={activeAction.teamId === homeTeam.id ? homeTeam.colors[0] : awayTeam.colors[0]} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 max-w-2xl mx-auto space-y-0 relative animate-in fade-in">
                        <div className="absolute left-[29px] top-2 bottom-2 w-px bg-slate-800 z-0"></div>
                        {filteredEvents.map((e, i) => (
                            <div key={i} className="relative z-10 animate-in slide-in-from-left-2 duration-300">
                                <EventCard event={e} />
                            </div>
                        ))}
                        {filteredEvents.length === 0 && <div className="text-center text-slate-500 py-10 text-sm">Match events will appear here...</div>}
                    </div>
                </>
            )}

            {activeTab === 'Stats' && (
                <div className="p-4 max-w-2xl mx-auto space-y-6 animate-in fade-in pt-4">
                    <div className="bg-[#1A2330] rounded-xl border border-white/5 p-4 shadow-lg">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Activity size={12}/> Match Conditions</div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-slate-900 p-2 rounded flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded text-blue-400"><WeatherIcon /></div>
                                <div>
                                    <div className="text-xs text-slate-400">Weather</div>
                                    <div className="text-sm font-bold text-white">{weather}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded text-red-400"><Flag size={16} /></div>
                                <div>
                                    <div className="text-xs text-slate-400">Referee</div>
                                    <div className="text-sm font-bold text-white">{referee.name.split(' ').pop()}</div>
                                    <div className="text-[10px] text-slate-500">Strictness: {referee.stats.strictness}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A2330] rounded-xl border border-white/5 p-6 shadow-lg">
                        <StatBar label="Possession" homeVal={possHome} awayVal={100 - possHome} />
                        <StatBar label="xG" homeVal={parseFloat(matchStats.xgHome.toFixed(2))} awayVal={parseFloat(matchStats.xgAway.toFixed(2))} />
                        <StatBar label="xPress" homeVal={parseFloat(matchStats.xPressHome.toFixed(2))} awayVal={parseFloat(matchStats.xPressAway.toFixed(2))} />
                        <StatBar label="Shots" homeVal={matchStats.shotsHome} awayVal={matchStats.shotsAway} />
                        <StatBar label="On Target" homeVal={matchStats.shotsOnTargetHome} awayVal={matchStats.shotsOnTargetAway} />
                        <StatBar label="Passes" homeVal={matchStats.passesHome} awayVal={matchStats.passesAway} />
                        <StatBar label="Tackles" homeVal={matchStats.tacklesHome} awayVal={matchStats.tacklesAway} />
                        <StatBar label="Interceptions" homeVal={matchStats.interceptionsHome} awayVal={matchStats.interceptionsAway} />
                        <StatBar label="Fouls" homeVal={matchStats.foulsHome} awayVal={matchStats.foulsAway} />
                    </div>
                </div>
            )}

            {activeTab === 'Analysis' && (
                <div className="p-4 max-w-3xl mx-auto space-y-6 animate-in fade-in pt-4">
                    {/* Shot Map */}
                    <div className="bg-[#1A2330] rounded-xl border border-white/5 p-4 shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Target size={14}/> Shot Map</h4>
                            <div className="flex gap-2 text-[10px] font-bold">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Goal</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Save</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Miss</span>
                            </div>
                        </div>
                        <div className="relative aspect-[1.6] bg-[#0a5c36] rounded border border-white/10 overflow-hidden">
                            {/* Pitch Markings */}
                            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>
                            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/20 -translate-x-1/2"></div>
                            <div className="absolute top-[22%] bottom-[22%] left-0 w-[15%] border-r border-t border-b border-white/30 bg-white/5"></div>
                            <div className="absolute top-[22%] bottom-[22%] right-0 w-[15%] border-l border-t border-b border-white/30 bg-white/5"></div>
                            
                            {/* Shot Points */}
                            {events.filter(e => (e.type === 'goal' || e.type === 'miss' || e.type === 'save') && e.location).map((e, i) => (
                                <div 
                                    key={i}
                                    className={`absolute w-3 h-3 rounded-full border border-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform z-10 ${e.type === 'goal' ? 'bg-emerald-500' : e.type === 'save' ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ left: `${e.location!.x}%`, top: `${e.location!.y}%` }}
                                    title={`${e.playerName} (${e.xg?.toFixed(2)} xG)`}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Momentum Graph */}
                    <div className="bg-[#1A2330] rounded-xl border border-white/5 p-4 shadow-lg">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Activity size={14}/> Match Momentum (Last 60 Ticks)</h4>
                        <div className="h-32 w-full flex items-end gap-0.5 relative border-b border-white/10">
                            {momentumHistory.map((val, i) => {
                                const height = Math.min(100, Math.abs(val));
                                const isHome = val > 0;
                                return (
                                    <div 
                                        key={i} 
                                        className={`flex-1 ${isHome ? 'bg-emerald-500' : 'bg-blue-500'} opacity-80`}
                                        style={{ height: `${height}%`, marginBottom: isHome ? '0' : '0', alignSelf: isHome ? 'flex-end' : 'flex-start' }} // This is a simple bar, could be improved with SVG path
                                    ></div>
                                );
                            })}
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20 border-t border-dashed border-white/20"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                            <span className="text-blue-400">Away Pressure</span>
                            <span className="text-emerald-400">Home Pressure</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Lineup' && (
                <div className="flex flex-col h-full overflow-hidden p-2">
                    {/* Pitch Container - Flex 1 to take available space, min-h-0 to allow shrinking */}
                    <div className="flex-1 relative bg-[#0a5c36] border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-0 mx-auto w-full max-w-lg">
                        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>
                        <div className="absolute top-0 left-[20%] right-[20%] h-[10%] border-b-2 border-l-2 border-r-2 border-white/30"></div>
                        <div className="absolute bottom-0 left-[20%] right-[20%] h-[10%] border-t-2 border-l-2 border-r-2 border-white/30"></div>
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30"></div>
                        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                        {/* Opponent Half (Top) */}
                        <div className="flex-1 flex flex-col border-b border-white/10 relative z-10">
                            {renderFormationOnPitch(awaySquad, awayFormation, false)}
                        </div>

                        {/* User Half (Bottom) */}
                        <div className="flex-1 flex flex-col relative z-10">
                            {renderFormationOnPitch(homeSquad, homeFormation, true)}
                        </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-2">Tactical Instructions</div>
                        <div className="flex justify-center gap-4">
                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-white">{homeFormation}</span>
                            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-white">Balanced</span>
                        </div>
                        {swapSourceId && <div className="mt-2 text-xs text-emerald-400 animate-pulse">Select player to swap position...</div>}
                    </div>
                </div>
            )}
        </div>

        {/* --- DIRECTOR DOCK --- */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[200]">
            <div className="bg-[#1A2330]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-2 flex items-center gap-2 transition-all">
                
                <button 
                    onClick={() => setActiveSheet(activeSheet === 'tactics' ? 'none' : 'tactics')}
                    className={`flex flex-col items-center gap-1 w-14 p-2 rounded-xl transition-all ${activeSheet === 'tactics' ? 'bg-[var(--fot-accent)] text-black' : 'hover:bg-white/10 text-slate-400'}`}
                >
                    <Clipboard size={18} />
                    <span className="text-[8px] font-bold uppercase">Tactics</span>
                </button>

                <button 
                    onClick={() => setActiveSheet(activeSheet === 'shouts' ? 'none' : 'shouts')}
                    disabled={shoutCooldown > 0}
                    className={`flex flex-col items-center gap-1 w-14 p-2 rounded-xl transition-all relative ${activeSheet === 'shouts' ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-slate-400 disabled:opacity-50'}`}
                >
                    <Megaphone size={18} />
                    <span className="text-[8px] font-bold uppercase">Shout</span>
                    {shoutCooldown > 0 && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-xs font-bold text-white">{Math.ceil(shoutCooldown)}</div>}
                </button>

                <button 
                    onClick={() => setSimSpeed(simSpeed === 0 ? 30 : 0)}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg mx-2"
                >
                    {simSpeed === 0 ? <Play size={24} fill="currentColor"/> : <Pause size={24} fill="currentColor"/>}
                </button>

                <button 
                    onClick={() => setActiveSheet(activeSheet === 'subs' ? 'none' : 'subs')}
                    className={`flex flex-col items-center gap-1 w-14 p-2 rounded-xl transition-all ${activeSheet === 'subs' ? 'bg-purple-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                >
                    <Repeat size={18} />
                    <span className="text-[8px] font-bold uppercase">Subs</span>
                </button>

                <button 
                    className={`flex flex-col items-center gap-1 w-14 p-2 rounded-xl transition-all relative ${!homeTeam.assistant || assistantCooldown > 0 ? 'cursor-not-allowed' : 'hover:bg-white/10 text-slate-400'}`}
                    onClick={handleAssistantClick}
                    disabled={!homeTeam.assistant || assistantCooldown > 0}
                    style={{ opacity: !homeTeam.assistant ? 0.3 : 1 }}
                >
                    <UserCog size={18} />
                    <span className="text-[8px] font-bold uppercase">Asst</span>
                    {assistantCooldown > 0 && <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-xs font-bold text-white">{Math.ceil(assistantCooldown)}</div>}
                </button>
            </div>
        </div>

        {/* --- ASSISTANT TOAST --- */}
        {assistantTip && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-purple-900/90 backdrop-blur border border-purple-500/50 p-3 rounded-lg shadow-xl animate-in slide-in-from-bottom-2 cursor-pointer flex justify-between items-center z-[250]" onClick={() => { assistantTip.action?.(); setAssistantTip(null); }}>
                <div className="flex items-center gap-3">
                    <UserCog className="text-purple-300" size={20} />
                    <span className="text-xs font-bold text-white">{assistantTip.msg}</span>
                </div>
                {assistantTip.action && <div className="text-[10px] bg-purple-700 px-2 py-1 rounded text-white font-bold uppercase">Apply</div>}
            </div>
        )}

        {/* --- BOTTOM SHEETS --- */}
        {activeSheet !== 'none' && (
            <>
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-[150]" onClick={() => setActiveSheet('none')}></div>
                <div className="absolute bottom-24 left-4 right-4 bg-[#1A2330] border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-10 z-[160] max-w-lg mx-auto overflow-hidden">
                    
                    {/* SUBS SHEET */}
                    {activeSheet === 'subs' && (
                        <div className="flex flex-col h-[50vh]">
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    <Repeat size={16}/> Substitutions <span className="text-slate-500">({subsCount.home}/{maxSubs})</span>
                                </h3>
                                <button onClick={() => setActiveSheet('none')}><X size={16} className="text-slate-400"/></button>
                            </div>
                            
                            {/* Pitch List */}
                            <div className="flex-1 overflow-y-auto mb-2 pr-1 custom-scrollbar">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 sticky top-0 bg-[#1A2330]">On Pitch</div>
                                {activeHomePlayers.map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => setSelectedSubOut(p.id)}
                                        className={`flex justify-between items-center p-2 mb-1 rounded cursor-pointer border ${selectedSubOut === p.id ? 'bg-red-900/30 border-red-500' : 'bg-slate-900 border-transparent hover:bg-slate-800'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-500 w-6">{p.position}</span>
                                            <div>
                                                <div className="text-sm font-bold text-white">{p.name}</div>
                                                <div className="w-16 h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                                    <div className={`h-full ${p.currentCondition > 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${p.currentCondition}%`}}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs font-mono font-bold text-slate-400">{p.currentRating.toFixed(1)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Bench List */}
                            <div className="flex-1 overflow-y-auto border-t border-slate-700 pt-2 pr-1 custom-scrollbar">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2 sticky top-0 bg-[#1A2330]">Bench</div>
                                {homeBench.filter(p => !homeSquad.some(s => s.id === p.id)).map(p => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => setSelectedSubIn(p.id)}
                                        className={`flex justify-between items-center p-2 mb-1 rounded cursor-pointer border ${selectedSubIn === p.id ? 'bg-emerald-900/30 border-emerald-500' : 'bg-slate-900 border-transparent hover:bg-slate-800'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-500 w-6">{p.position}</span>
                                            <div>
                                                <div className="text-sm font-bold text-white">{p.name}</div>
                                                <div className="text-[10px] text-slate-500">{p.stats.ovr} OVR</div>
                                            </div>
                                        </div>
                                        {selectedSubOut && selectedSubIn === p.id && (
                                            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSub(); }}>Confirm</Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TACTICS SHEET */}
                    {activeSheet === 'tactics' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tactical Adjustments</h3>
                                <button onClick={() => setActiveSheet('none')}><X size={16} className="text-slate-400"/></button>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-2">
                                        <span>Defensive</span>
                                        <span className="text-[var(--fot-accent)]">Balanced</span>
                                        <span>Attacking</span>
                                    </div>
                                    <input type="range" className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.keys(FORMATIONS).map(f => (
                                        <button 
                                            key={f} 
                                            onClick={() => setHomeFormation(f)}
                                            className={`py-2 rounded border text-xs font-bold transition-colors ${homeFormation === f ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHOUTS SHEET */}
                    {activeSheet === 'shouts' && (
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Touchline Shouts</h3>
                                <button onClick={() => setActiveSheet('none')}><X size={16} className="text-slate-400"/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['Demand More', 'Encourage', 'Calm Down', 'Fire Up', 'Praise', 'Focus'].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => handleShout(s)}
                                        className="flex items-center justify-center p-3 bg-slate-800/50 hover:bg-blue-600 hover:text-white rounded-xl border border-slate-700 transition-all text-xs font-bold uppercase"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}

        {/* FULL TIME MODAL */}
        {gameStatus === 'FullTime' && (
            <div className="absolute inset-0 z-[300] bg-black/90 backdrop-blur flex items-center justify-center p-6 animate-in zoom-in">
                <div className="text-center w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
                    <h1 className="text-6xl font-black text-white mb-2 tracking-tighter">FULL TIME</h1>
                    <div className="text-5xl font-mono text-[var(--fot-accent)] mb-8 font-bold">{scores.home} - {scores.away}</div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8 text-sm text-slate-300">
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="font-bold text-emerald-400">{matchStats.shotsHome} ({matchStats.shotsOnTargetHome})</div>
                            <div className="text-[10px] uppercase">Shots</div>
                            <div className="font-bold text-blue-400">{matchStats.shotsAway} ({matchStats.shotsOnTargetAway})</div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded">
                            <div className="font-bold text-emerald-400">{matchStats.xgHome.toFixed(2)}</div>
                            <div className="text-[10px] uppercase">xG</div>
                            <div className="font-bold text-blue-400">{matchStats.xgAway.toFixed(2)}</div>
                        </div>
                    </div>

                    <Button size="lg" className="w-full" onClick={() => onComplete({
                        matchId: fixture.id,
                        homeTeamId: homeTeam.id,
                        awayTeamId: awayTeam.id,
                        homeScore: scores.home,
                        awayScore: scores.away,
                        stats: matchStats,
                        events,
                        momentumHistory: [],
                        managerHomeId: homeTeam.managerId,
                        managerAwayId: awayTeam.managerId,
                        conditions: { weather: weather, pitch: homeTeam.stadium.pitchState },
                        lineups: { 
                            home: homeSquad.map(p => p.matchStats), 
                            away: awaySquad.map(p => p.matchStats) 
                        }
                    })}>
                        Return to Office
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
};
