
import React, { useState } from 'react';
import { Player, Position, Team } from '../types';
import { NATIONALITIES } from '../constants';
import { Activity, Shield, Target, Wind, Zap, Move, MessageSquare, Footprints, Ruler, BadgeCheck, Search, Star, TrendingUp, TrendingDown, Banknote, Brain, Award, Clock } from 'lucide-react';
import { Crest } from './Crest';
import { formatCompactNumber, getScoutReport, trainPlayerTrait } from '../utils/engine';
import { useGame } from '../context/GameContext';
import { Button } from './Button';

interface Props {
  player: Player;
  team: Team;
  userTeam?: Team; 
  initialTab?: 'stats' | 'social' | 'scout';
  onClose: () => void;
  onInteract?: () => void;
}

const RadarChart = ({ player }: { player: Player }) => {
    const stats = player.stats;
    const labels = ['ATT', 'MID', 'DEF', 'PAC', 'TEC', 'PHY'];
    // Approximating hidden attributes for visual fullness
    const tec = (stats.att + stats.mid) / 2;
    const phy = (stats.def + stats.pac) / 2;
    const values = [stats.att, stats.mid, stats.def, stats.pac, tec, phy];
    
    // Normalize to 0-100 scale for radius (max 50px radius)
    const scale = (val: number) => (val / 100) * 50;
    
    const points = values.map((val, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const r = scale(val);
        const x = 60 + r * Math.cos(angle);
        const y = 60 + r * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    const fullScalePoints = values.map((_, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const r = 50;
        const x = 60 + r * Math.cos(angle);
        const y = 60 + r * Math.sin(angle);
        return `${x},${y}`;
    });

    return (
        <div className="w-40 h-40 relative mx-auto">
            <svg viewBox="0 0 120 120" className="w-full h-full">
                {/* Background Web */}
                {[20, 35, 50].map(r => (
                    <polygon 
                        key={r} 
                        points={Array.from({length: 6}).map((_, i) => {
                            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                            const x = 60 + r * Math.cos(angle);
                            const y = 60 + r * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none" 
                        stroke="#334155" 
                        strokeWidth="1" 
                    />
                ))}
                
                {/* Labels */}
                {fullScalePoints.map((pt, i) => {
                    const [x, y] = pt.split(',').map(Number);
                    return (
                        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
                            {labels[i]}
                        </text>
                    );
                })}

                {/* Player Polygon */}
                <polygon points={points} fill="rgba(16, 185, 129, 0.4)" stroke="#10b981" strokeWidth="2" />
            </svg>
        </div>
    );
};

export const PlayerDetailModal: React.FC<Props> = ({ player, team, userTeam, initialTab = 'stats', onClose, onInteract }) => {
  const { actions, gameState } = useGame();
  
  const isAcademyPending = player.isAcademy && player.academyStatus === 'pending';
  const startTab = isAcademyPending ? 'scout' : initialTab;
  
  const [activeTab, setActiveTab] = useState<'stats' | 'social' | 'scout'>(startTab);
  
  const getFlag = (code: string) => NATIONALITIES.find(n => n.code === code)?.flag || '🏳️';
  
  const cmToFtIn = (cm: number) => {
      const val = cm || 180;
      const realFeet = ((val * 0.393700) / 12);
      const feet = Math.floor(realFeet);
      const inches = Math.round((realFeet - feet) * 12);
      return `${val}cm (${feet}'${inches}")`;
  };

  const showScout = (userTeam && userTeam.id !== team.id && userTeam.assistant) || player.isAcademy;
  const scoutReport = showScout ? getScoutReport(player, userTeam || team) : null;
  const isOwnPlayer = userTeam && userTeam.id === team.id;

  const handleTrainTrait = () => {
      if (gameState) {
          const res = trainPlayerTrait(gameState, player.id, "Super Sub");
          if (res.success) {
              alert(res.message);
              onClose(); // Crude refresh
          } else {
              alert(res.message);
          }
      }
  };

  const AttrRow = ({ label, val, potentialVal, icon: Icon }: { label: string, val: number, potentialVal?: number, icon: any }) => (
      <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-slate-800 rounded text-slate-400"><Icon size={14} /></div>
          <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                  <span className="font-bold text-slate-400">{label}</span>
                  <div className="flex gap-2">
                      <span className="font-mono text-white">{val}</span>
                      {potentialVal && <span className="font-mono text-slate-500">/ {potentialVal}</span>}
                  </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-emerald-500 z-10" style={{ width: `${val}%` }}></div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative h-48 bg-gradient-to-r from-slate-900 to-slate-800 overflow-hidden border-b border-slate-700">
                <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(45deg, ${team.colors[0]}, ${team.colors[1]})` }}></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-emerald-400 z-10 bg-black/20 p-2 rounded-full backdrop-blur">✕</button>
                
                <div className="absolute bottom-0 left-0 w-full p-6 flex items-end gap-6">
                    <div className="w-32 h-32 bg-slate-800 rounded-full border-4 border-slate-700 shadow-xl flex items-center justify-center text-6xl shadow-emerald-900/50">
                        {getFlag(player.nationality)}
                    </div>
                    <div className="mb-2 flex-1">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm mb-1">
                            <Crest team={team} size="sm" />
                            {team.name}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-sport text-white leading-none">
                            {player.name}
                        </h1>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-slate-300 items-center">
                            <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-white font-bold shadow-sm">{player.position}</span>
                            <span>{player.age} Years</span>
                            <span className="flex items-center gap-1"><Ruler size={14} className="text-slate-500"/> {cmToFtIn(player.height)}</span>
                        </div>
                    </div>
                    
                    <div className="ml-auto text-center flex flex-col gap-3">
                        <div className="text-5xl font-sport font-bold text-white">{player.stats.ovr}</div>
                    </div>
                </div>
            </div>

            <div className="flex border-b border-slate-800 px-8">
                <button onClick={() => setActiveTab('stats')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'stats' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-white'}`}>Statistics</button>
                {!isAcademyPending && <button onClick={() => setActiveTab('social')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'social' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-white'}`}>Social Feed</button>}
                {(showScout || isAcademyPending) && (
                    <button onClick={() => setActiveTab('scout')} className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'scout' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-white'}`}>Scout Report</button>
                )}
            </div>

            <div className="p-8">
                {activeTab === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6">
                            <h3 className="font-sport text-xl text-white border-b border-slate-800 pb-2">Analysis</h3>
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-center">
                                <RadarChart player={player} />
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                                <AttrRow label="ATTACKING" val={player.stats.att} potentialVal={player.potentialStats?.att} icon={Target} />
                                <AttrRow label="DEFENDING" val={player.stats.def} potentialVal={player.potentialStats?.def} icon={Shield} />
                                <AttrRow label="PLAYMAKING" val={player.stats.mid} potentialVal={player.potentialStats?.mid} icon={Zap} />
                                <AttrRow label="PACE" val={player.stats.pac} potentialVal={player.potentialStats?.pac} icon={Wind} />
                            </div>
                            
                            {/* Traits & Training */}
                            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-xs uppercase font-bold text-slate-500 mb-2 flex items-center gap-2">
                                    <Award size={14}/> Player Traits
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {player.traits.length > 0 ? player.traits.map(t => (
                                        <span key={t} className={`text-xs px-2 py-1 rounded font-bold border ${t === 'Super Sub' ? 'bg-yellow-900/30 border-yellow-500/50 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                                            {t}
                                        </span>
                                    )) : <span className="text-xs text-slate-500 italic">No specific traits.</span>}
                                </div>

                                {isOwnPlayer && (
                                    <div className="border-t border-slate-800 pt-3">
                                        <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Development</h4>
                                        {player.trainingTarget ? (
                                            <div className="bg-slate-800/50 p-2 rounded border border-slate-700 text-xs flex items-center gap-2 text-slate-300">
                                                <Clock size={14} className="text-blue-400 animate-pulse"/>
                                                Training: <span className="text-white font-bold">{player.trainingTarget.type.replace('trait_', '').replace('_', ' ')}</span>
                                            </div>
                                        ) : (
                                            !player.traits.includes('Super Sub') && player.stats.pac >= 75 ? (
                                                <Button size="sm" variant="secondary" className="w-full text-xs" onClick={handleTrainTrait} title="Cost: €50k, Duration: 12 weeks">
                                                    Train 'Super Sub' Trait
                                                </Button>
                                            ) : (
                                                <div className="text-center text-xs text-slate-600 italic">No specialist training available.</div>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-6">
                            <h3 className="font-sport text-xl text-white border-b border-slate-800 pb-2">Advanced Metrics (Season)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                                    <div className="text-3xl font-mono font-bold text-emerald-400">{player.statsSeason.xg.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">xG</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                                    <div className="text-3xl font-mono font-bold text-blue-400">{player.statsSeason.xa.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">xA</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                                    <div className="text-3xl font-mono font-bold text-purple-400">{player.statsSeason.xt.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">xThreat</div>
                                </div>
                                <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                                    <div className="text-3xl font-mono font-bold text-yellow-400">{player.statsSeason.xpress.toFixed(1)}</div>
                                    <div className="text-xs text-slate-500 uppercase font-bold">xPress</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* ... other tabs ... */}
            </div>
        </div>
    </div>
  );
};
