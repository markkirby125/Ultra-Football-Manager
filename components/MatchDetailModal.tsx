
import React, { useState, useMemo } from 'react';
import { Fixture, GameState, MatchResult } from '../types';
import { Card } from './Card';
import { Crest, Kit } from './Crest';
import { X, Shield, Activity, Brain, UserCog, Stethoscope, Search, FileText, BarChart2, MessageSquare } from 'lucide-react';
import { generateAssistantMatchReport } from '../utils/engine';

interface Props {
  fixture: Fixture;
  gameState: GameState;
  onClose: () => void;
  onOpenReferee: (id: string) => void;
  onOpenPlayer: (id: string) => void;
}

const StatRow = ({ label, vHome, vAway }: { label: string, vHome: number, vAway: number }) => {
    const total = vHome + vAway;
    const homePct = total === 0 ? 50 : (vHome / total) * 100;
    
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
                <span className="font-mono text-slate-300">{vHome}</span>
                <span className="text-slate-500 uppercase font-bold">{label}</span>
                <span className="font-mono text-slate-300">{vAway}</span>
            </div>
            <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-800">
                <div className="bg-emerald-500 h-full" style={{ width: `${homePct}%` }}></div>
                <div className="bg-blue-500 h-full flex-1"></div>
            </div>
        </div>
    );
};

const XGTimeline = ({ result, homeColor, awayColor }: { result: MatchResult, homeColor: string, awayColor: string }) => {
    // Generate data points
    // [ { min: 0, h: 0, a: 0 }, { min: 5, h: 0.1, a: 0 } ... ]
    const points = useMemo(() => {
        let hCum = 0;
        let aCum = 0;
        const data = [{ min: 0, h: 0, a: 0 }];
        
        // Filter events with xG
        const xgEvents = result.events.filter(e => e.xg !== undefined).sort((a,b) => a.minute - b.minute);
        
        xgEvents.forEach(e => {
            if (e.teamId === result.homeTeamId) hCum += (e.xg || 0);
            else aCum += (e.xg || 0);
            data.push({ min: e.minute, h: hCum, a: aCum });
        });
        
        // Final point at 90
        data.push({ min: 90, h: hCum, a: aCum });
        
        return data;
    }, [result]);

    const maxVal = Math.max(1, ...points.map(p => Math.max(p.h, p.a))) * 1.1;

    // SVG scaling
    const w = 100;
    const h = 50;
    
    const getPoints = (key: 'h' | 'a') => {
        return points.map(p => {
            const x = (p.min / 90) * w;
            const y = h - (p[key] / maxVal) * h;
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="w-full h-40 bg-slate-950/50 rounded border border-slate-800 relative overflow-hidden p-2">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Grid Lines */}
                <line x1="0" y1={h/2} x2={w} y2={h/2} stroke="#334155" strokeWidth="0.2" strokeDasharray="2"/>
                <line x1={w/2} y1="0" x2={w/2} y2={h} stroke="#334155" strokeWidth="0.2" strokeDasharray="2"/>
                
                {/* Home Line */}
                <polyline 
                    points={getPoints('h')} 
                    fill="none" 
                    stroke={homeColor} 
                    strokeWidth="1.5" 
                    strokeLinejoin="round"
                />
                {/* Away Line */}
                <polyline 
                    points={getPoints('a')} 
                    fill="none" 
                    stroke={awayColor} 
                    strokeWidth="1.5" 
                    strokeLinejoin="round"
                />
            </svg>
            <div className="absolute top-2 left-2 text-[10px] font-bold text-slate-500">xG Timeline</div>
            <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">90'</div>
        </div>
    );
};

const KeaneBot = ({ result, homeName, awayName }: { result: MatchResult, homeName: string, awayName: string }) => {
    const getReaction = () => {
        const winner = result.homeScore > result.awayScore ? 'home' : result.homeScore < result.awayScore ? 'away' : 'draw';
        const xgWinner = result.stats.xgHome > result.stats.xgAway ? 'home' : 'away';
        const hName = homeName;
        const aName = awayName;

        if (result.homeScore === 0 && result.stats.xgHome > 1.5) return `"${hName} should be ashamed. All that pretty football and they couldn't finish their dinner. Absolute disgrace."`;
        if (result.awayScore === 0 && result.stats.xgAway > 1.5) return `"${aName} were rubbish in the final third. I've seen milk turn faster than their strikers."`;
        if (winner === 'draw' && result.stats.xgHome + result.stats.xgAway < 1.0) return `"I've seen more excitement in a library. Both managers should refund the fans."`;
        if (winner !== xgWinner) return `"Football is about putting the ball in the net, not spreadsheets. ${winner === 'home' ? hName : aName} wanted it more. Simple as that."`;
        if (result.stats.foulsHome + result.stats.foulsAway < 15) return `"Too nice out there. Nobody putting a tackle in. It's a man's game, show some aggression!"`;
        
        return `"Job done. Move on to the next one."`;
    };

    return (
        <div className="bg-slate-950 border-l-4 border-red-700 p-4 rounded shadow-lg flex gap-4 items-start animate-in slide-in-from-bottom-2">
            <div className="w-12 h-12 bg-slate-800 rounded-full overflow-hidden shrink-0 border-2 border-red-700">
                {/* Placeholder for Roy icon */}
                <div className="w-full h-full flex items-center justify-center text-xl">😠</div>
            </div>
            <div>
                <div className="text-red-500 font-bold text-xs uppercase tracking-widest mb-1">The Pundit</div>
                <p className="text-slate-300 italic font-serif text-sm leading-relaxed">
                    {getReaction()}
                </p>
            </div>
        </div>
    );
};

export const MatchDetailModal: React.FC<Props> = ({ fixture, gameState, onClose, onOpenReferee, onOpenPlayer }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'events' | 'debrief'>('stats');
  const home = gameState.teams.find(t => t.id === fixture.homeTeamId);
  const away = gameState.teams.find(t => t.id === fixture.awayTeamId);
  const res = fixture.result;
  const referee = gameState.referees.find(r => r.id === fixture.refereeId);
  
  const userTeamId = gameState.userTeamId;
  const userTeam = gameState.teams.find(t => t.id === userTeamId);
  const hasAssistant = userTeam && userTeam.assistant;
  const isUserMatch = userTeamId && (fixture.homeTeamId === userTeamId || fixture.awayTeamId === userTeamId);

  // Generate Report Memoized
  const report = useMemo(() => {
      if (activeTab === 'debrief' && isUserMatch && hasAssistant) {
          return generateAssistantMatchReport(gameState, fixture.result?.matchId || '');
      }
      return null;
  }, [activeTab, isUserMatch, hasAssistant, gameState, fixture.result?.matchId]);

  if (!home || !away || !res) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-4xl h-[90vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center shrink-0 z-20 relative overflow-hidden">
                {/* Background glow for atmosphere */}
                <div className="absolute top-0 left-0 w-1/2 h-full opacity-5 pointer-events-none" style={{ background: `linear-gradient(90deg, ${home.colors[0]}, transparent)` }}></div>
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none" style={{ background: `linear-gradient(-90deg, ${away.colors[0]}, transparent)` }}></div>

                <div className="flex items-center justify-center w-full gap-8 relative z-10">
                     <div className="flex flex-col items-center">
                         <div className="relative group">
                             <Crest team={home} size="lg" className="relative z-10" />
                             <Kit team={home} className="w-12 h-12 absolute -bottom-4 -right-4 drop-shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform" />
                         </div>
                         <div className="font-bold text-white mt-4 text-lg">{home.name}</div>
                     </div>
                     
                     <div className="flex flex-col items-center">
                         <div className="text-5xl font-mono font-bold text-white tracking-widest bg-slate-900 px-8 py-3 rounded-lg border border-slate-800 shadow-2xl">
                             {res.homeScore} - {res.awayScore}
                         </div>
                         <div className="mt-2 text-xs text-slate-500 font-bold uppercase tracking-widest">Full Time</div>
                     </div>

                     <div className="flex flex-col items-center">
                         <div className="relative group">
                             <Crest team={away} size="lg" className="relative z-10" />
                             <Kit team={away} className="w-12 h-12 absolute -bottom-4 -left-4 drop-shadow-lg transform rotate-6 group-hover:rotate-0 transition-transform" />
                         </div>
                         <div className="font-bold text-white mt-4 text-lg">{away.name}</div>
                     </div>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white z-50"><X /></button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-900 border-b border-slate-800 px-6 shrink-0">
                <button 
                    onClick={() => setActiveTab('stats')} 
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'stats' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-white'}`}
                >
                    <BarChart2 size={16} /> Statistics
                </button>
                <button 
                    onClick={() => setActiveTab('events')} 
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'events' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-white'}`}
                >
                    <FileText size={16} /> Events
                </button>
                {hasAssistant && isUserMatch && (
                    <button 
                        onClick={() => setActiveTab('debrief')} 
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'debrief' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-white'}`}
                    >
                        <UserCog size={16} /> AM Debrief
                    </button>
                )}
            </div>

            <div className="p-8 flex-1 overflow-y-auto min-h-0">
                 {/* STATS TAB */}
                 {activeTab === 'stats' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                         <div className="space-y-6">
                             {/* Keane Bot */}
                             <KeaneBot result={res} homeName={home.name} awayName={away.name} />

                             <div className="bg-slate-950/50 p-5 rounded-lg border border-slate-800">
                                 <h4 className="text-xs font-bold text-emerald-500 uppercase mb-4 border-b border-emerald-500/20 pb-2">Attack & Control</h4>
                                 <StatRow label="Possession %" vHome={Math.round(res.stats.possessionHome)} vAway={Math.round(res.stats.possessionAway)} />
                                 <StatRow label="Expected Goals (xG)" vHome={parseFloat(res.stats.xgHome.toFixed(2))} vAway={parseFloat(res.stats.xgAway.toFixed(2))} />
                                 <StatRow label="Total Shots" vHome={res.stats.shotsHome} vAway={res.stats.shotsAway} />
                                 <StatRow label="Shots on Target" vHome={res.stats.shotsOnTargetHome} vAway={res.stats.shotsOnTargetAway} />
                                 <StatRow label="Corners" vHome={res.stats.cornersHome} vAway={res.stats.cornersAway} />
                             </div>

                             {/* xG Timeline */}
                             <XGTimeline result={res} homeColor={home.colors[0]} awayColor={away.colors[0]} />

                             <div className="bg-slate-950/50 p-5 rounded-lg border border-slate-800">
                                 <h4 className="text-xs font-bold text-blue-500 uppercase mb-4 border-b border-blue-500/20 pb-2">Defense & Discipline</h4>
                                 <StatRow label="Passes Completed" vHome={res.stats.passesHome} vAway={res.stats.passesAway} />
                                 <StatRow label="xPress Score" vHome={parseFloat(res.stats.xPressHome.toFixed(2))} vAway={parseFloat(res.stats.xPressAway.toFixed(2))} />
                                 <StatRow label="Interceptions" vHome={res.stats.interceptionsHome} vAway={res.stats.interceptionsAway} />
                                 <StatRow label="GK Saves" vHome={res.stats.savesHome} vAway={res.stats.savesAway} />
                                 <StatRow label="Fouls" vHome={res.stats.foulsHome} vAway={res.stats.foulsAway} />
                             </div>
                         </div>
                         
                         {/* Player Ratings List */}
                         <div className="bg-slate-950/50 p-5 rounded-lg border border-slate-800 h-full overflow-y-auto max-h-[600px] custom-scrollbar">
                             <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Top Performers</h4>
                             {res.lineups.home.concat(res.lineups.away).sort((a,b) => b.rating - a.rating).slice(0, 10).map((p, i) => (
                                 <div key={i} className="flex justify-between items-center mb-2 p-2 hover:bg-slate-900 rounded cursor-pointer" onClick={() => onOpenPlayer(p.playerId)}>
                                     <div className="flex items-center gap-3">
                                         <div className={`font-bold text-sm ${p.rating >= 8.0 ? 'text-yellow-400' : 'text-white'}`}>{p.rating.toFixed(1)}</div>
                                         <div className="text-sm">
                                             <span className="font-bold">{p.name}</span>
                                             <span className="text-slate-500 text-xs ml-2">
                                                 {home.id === fixture.homeTeamId && res.lineups.home.some(h=>h.playerId===p.playerId) ? home.name : away.name}
                                             </span>
                                         </div>
                                     </div>
                                     <div className="text-xs text-slate-400">
                                         <span className="mr-2 font-mono text-emerald-500" title="Expected Goals">{p.xg > 0 ? `${p.xg.toFixed(2)} xG` : ''}</span>
                                         {p.goals > 0 && <span className="mr-2">⚽ {p.goals}</span>}
                                         {p.assists > 0 && <span>🅰️ {p.assists}</span>}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* EVENTS TAB */}
                 {activeTab === 'events' && (
                     <div className="bg-slate-950/30 p-5 rounded-lg border border-slate-800 h-full overflow-y-auto max-h-[600px] custom-scrollbar animate-in fade-in">
                         <div className="relative border-l border-slate-700 ml-4 space-y-6">
                             {res.events.map((e, i) => (
                                 <div key={i} className="relative pl-6">
                                     <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${e.type === 'goal' ? 'bg-emerald-500' : e.type === 'red' ? 'bg-red-500' : 'bg-slate-600'}`}></div>
                                     <div className="flex items-center gap-2 mb-1">
                                         <span className="font-mono text-emerald-400 font-bold">{e.minute}'</span>
                                         <span className="text-xs uppercase font-bold text-slate-500">{e.type}</span>
                                         {e.xg && <span className="text-[10px] text-slate-600 border border-slate-700 px-1 rounded">{e.xg.toFixed(2)} xG</span>}
                                     </div>
                                     <div className="text-white text-sm">
                                         <span className="font-bold cursor-pointer hover:underline" onClick={() => onOpenPlayer(e.playerId)}>{e.playerName}</span>
                                         {e.extraInfo && <span className="text-slate-400 text-xs block">{e.extraInfo}</span>}
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 {/* AM DEBRIEF TAB */}
                 {activeTab === 'debrief' && report && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                         {/* Card 1: Engine Room */}
                         <div className="bg-slate-950 border-l-4 border-emerald-500 p-5 rounded shadow-lg">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="bg-emerald-900/30 p-2 rounded-full text-emerald-400"><Activity size={20} /></div>
                                 <h4 className="font-bold text-white text-lg">The Engine Room</h4>
                             </div>
                             <p className="text-slate-300 italic mb-2">"{report.tacticalAnalysis.verdict}"</p>
                             <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                                 Key Takeaway: <span className="text-emerald-400">{report.tacticalAnalysis.statHighlight}</span>
                             </div>
                         </div>

                         {/* Card 2: Physio Watch */}
                         <div className="bg-slate-950 border-l-4 border-blue-500 p-5 rounded shadow-lg">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="bg-blue-900/30 p-2 rounded-full text-blue-400"><Stethoscope size={20} /></div>
                                 <h4 className="font-bold text-white text-lg">Physio Watch</h4>
                             </div>
                             <p className="text-slate-300 text-sm mb-2">{report.physioReport.generalStatus}</p>
                             {report.physioReport.fatiguedPlayers.length > 0 && (
                                 <div className="text-xs text-orange-400 mt-2">
                                     <span className="font-bold">Needs Rest:</span> {report.physioReport.fatiguedPlayers.join(", ")}
                                 </div>
                             )}
                             {report.physioReport.injuries.length > 0 && (
                                 <div className="text-xs text-red-400 mt-1">
                                     <span className="font-bold">Medical Room:</span> {report.physioReport.injuries.join(", ")}
                                 </div>
                             )}
                         </div>

                         {/* Card 3: Head Space */}
                         <div className="bg-slate-950 border-l-4 border-yellow-500 p-5 rounded shadow-lg">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="bg-yellow-900/30 p-2 rounded-full text-yellow-400"><Brain size={20} /></div>
                                 <h4 className="font-bold text-white text-lg">Head Space</h4>
                             </div>
                             {report.mentalHealthWatch.concernedPlayers.length > 0 ? (
                                 <ul className="space-y-2">
                                     {report.mentalHealthWatch.concernedPlayers.map((p, idx) => (
                                         <li key={idx} className="text-sm text-slate-300">
                                             <span className="font-bold text-white">{p.name}:</span> {p.issue}
                                         </li>
                                     ))}
                                 </ul>
                             ) : (
                                 <p className="text-slate-300 text-sm">"The squad is mentally resilient. No concerns today."</p>
                             )}
                         </div>

                         {/* Card 4: Scout's Eye */}
                         <div className="bg-slate-950 border-l-4 border-purple-500 p-5 rounded shadow-lg">
                             <div className="flex items-center gap-3 mb-3">
                                 <div className="bg-purple-900/30 p-2 rounded-full text-purple-400"><Search size={20} /></div>
                                 <h4 className="font-bold text-white text-lg">Scout's Eye</h4>
                             </div>
                             <p className="text-slate-300 text-sm mb-2">
                                 "We struggled to contain <span className="font-bold text-white">{report.oppositionScout.keyPlayer}</span>."
                             </p>
                             <div className="text-xs text-purple-300 italic">
                                 {report.oppositionScout.threatAnalysis}
                             </div>
                         </div>
                     </div>
                 )}
            </div>
            
            <div className="p-4 bg-slate-950 border-t border-slate-800 text-center flex justify-center items-center gap-4 shrink-0">
                 {referee && (
                     <div className="flex items-center gap-4 text-slate-400">
                         <span className="uppercase text-xs font-bold flex items-center gap-2"><Shield size={14}/> {referee.name}</span>
                         {res.refereePerformance && (
                             <span className={`text-sm font-bold ${res.refereePerformance.rating > 7 ? 'text-emerald-400' : 'text-red-400'}`}>
                                 {res.refereePerformance.rating.toFixed(1)} Rating
                             </span>
                         )}
                         <button onClick={() => onOpenReferee(fixture.refereeId)} className="text-xs text-blue-400 hover:text-white underline">
                             View Report
                         </button>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};
