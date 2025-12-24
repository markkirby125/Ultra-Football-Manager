
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { TrainingFocus, PitchState, Player } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MapPin, Hammer, Activity, GraduationCap, Zap, TrendingUp, UserCog, Star, ArrowUpCircle, Info, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Crest } from '../components/Crest';
import { getAssistantRecommendation } from '../utils/engine';

interface Props {
    onPlayerClick?: (id: string) => void;
}

const UpgradeSection = ({ 
    level, 
    type, 
    cost, 
    description, 
    onUpgrade, 
    canAfford,
    isMaxed 
}: { 
    level: number, 
    type: string, 
    cost: number, 
    description: string, 
    onUpgrade: () => void, 
    canAfford: boolean,
    isMaxed: boolean
}) => (
    <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h4 className="font-bold text-white text-xl">{type} Upgrade</h4>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Current Level</span>
                    <span className="text-emerald-400 font-mono font-bold">{level}/10</span>
                </div>
                <p className="text-sm text-slate-400 mt-2 max-w-md">{description}</p>
            </div>
            <div className="text-right shrink-0 bg-slate-900 p-3 rounded border border-slate-800 min-w-[120px]">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Upgrade Cost</div>
                {!isMaxed ? (
                    <div className={`font-mono font-bold text-2xl ${canAfford ? 'text-white' : 'text-red-400'}`}>€{cost}M</div>
                ) : (
                    <div className="text-yellow-500 font-bold uppercase text-xs">Max Level</div>
                )}
            </div>
        </div>
        
        <div className="relative mb-6">
            <div className="flex justify-between text-xs text-slate-500 font-bold uppercase mb-1">
                <span>Efficiency</span>
                <span>{level * 10}%</span>
            </div>
            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative shadow-inner">
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/50 z-10 pointer-events-none">
                    {level * 10}%
                </div>
                <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-1000" style={{width: `${level * 10}%`}}></div>
            </div>
        </div>

        <Button 
            onClick={onUpgrade} 
            disabled={!canAfford || isMaxed} 
            className={`w-full py-3 text-lg ${!canAfford && !isMaxed ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700' : ''}`}
            variant={canAfford && !isMaxed ? 'primary' : 'secondary'}
        >
            {isMaxed ? 'Max Level Reached' : canAfford ? `Upgrade Facility` : 'Insufficient Funds'}
        </Button>
    </div>
);

export const Facilities: React.FC<Props> = ({ onPlayerClick }) => {
  const { gameState, actions } = useGame();
  const [activeTab, setActiveTab] = useState<'stadium' | 'training' | 'medical' | 'youth'>('stadium');
  const [scoutFeedback, setScoutFeedback] = useState<{show: boolean, x: number, y: number} | null>(null);
  
  if (!gameState || !gameState.userTeamId) return null;
  const team = gameState.teams.find(t => t.id === gameState.userTeamId)!;
  const squad = gameState.players.filter(p => p.teamId === team.id && !p.isAcademy);
  const academyPlayers = gameState.players.filter(p => p.teamId === team.id && p.isAcademy);

  // Assistant Recommendation
  const nextFixture = gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === team.id || f.awayTeamId === team.id));
  const oppId = nextFixture ? (nextFixture.homeTeamId === team.id ? nextFixture.awayTeamId : nextFixture.homeTeamId) : undefined;
  const nextOpponent = oppId ? gameState.teams.find(t => t.id === oppId) : undefined;
  
  const recommendation = team.assistant ? getAssistantRecommendation(team, squad, nextOpponent) : null;

  const updateTraining = (focus: TrainingFocus) => {
      // Reset streak if changing focus
      const streak = team.training.focus === focus ? team.training.streak : 0;
      actions.updateTeam({ ...team, training: { focus, streak } });
  };

  const updateTicketPrice = (price: 'Low' | 'Medium' | 'High') => {
      actions.updateTeam({ ...team, ticketPrice: price });
  };

  const handleScoutClick = (e: React.MouseEvent) => {
      if (team.budget >= 0.5) {
          actions.scoutYouth();
          setScoutFeedback({ show: true, x: e.clientX, y: e.clientY });
          setTimeout(() => setScoutFeedback(null), 1000);
      }
  };

  const getPitchColor = (state: PitchState) => {
      if (state === 'Perfect') return 'bg-emerald-500';
      if (state === 'Good') return 'bg-green-500';
      if (state === 'Average') return 'bg-yellow-500';
      if (state === 'Poor') return 'bg-orange-500';
      return 'bg-red-500';
  };

  const calculateCost = (base: number, lvl: number) => Math.max(2, base * lvl);

  const renderStadium = () => {
      const lvl = team.facilities.stadiumLevel;
      const cost = calculateCost(10, lvl);
      return (
          <div className="space-y-6">
              <div className="relative h-48 md:h-64 rounded-xl overflow-hidden border border-slate-700">
                  <img src={`https://source.unsplash.com/1600x900/?${encodeURIComponent(team.stadium.imageKeyword)}`} className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${team.colors[0]}cc, transparent)` }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  
                  <div className="absolute bottom-6 left-6">
                      <h2 className="text-4xl font-sport text-white drop-shadow-lg">{team.stadium.name}</h2>
                      <div className="flex gap-4 text-slate-300 mt-2">
                          <span className="flex items-center gap-2"><MapPin size={16}/> Capacity: {team.stadium.capacity.toLocaleString()}</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                      <Card title="Management">
                          <div className="mb-4">
                              <h4 className="text-xs uppercase font-bold text-slate-500 mb-2">Ticket Pricing</h4>
                              <div className="grid grid-cols-3 gap-2">
                                  {(['Low', 'Medium', 'High'] as const).map(p => (
                                      <div 
                                        key={p} 
                                        onClick={() => updateTicketPrice(p)}
                                        className={`p-2 rounded border cursor-pointer text-center text-xs font-bold transition-all ${team.ticketPrice === p ? 'bg-emerald-900/40 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                                      >
                                          {p}
                                      </div>
                                  ))}
                              </div>
                          </div>
                          
                          <div>
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-xs uppercase font-bold text-slate-500">Pitch State</h4>
                                  <Button size="sm" variant="ghost" className="text-xs text-blue-400 hover:text-white" onClick={actions.relayPitch} disabled={team.stadium.pitchState === 'Perfect'} title="Cost: €2.5M">Relay Pitch (€2.5M)</Button>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1"><div className={`h-full ${getPitchColor(team.stadium.pitchState)}`} style={{width: `${team.stadium.pitchCondition}%`}}></div></div>
                              <div className="text-right text-xs text-slate-400">{team.stadium.pitchState} ({team.stadium.pitchCondition}%)</div>
                          </div>
                      </Card>
                  </div>

                  <UpgradeSection 
                      type="Stadium" 
                      level={lvl} 
                      cost={cost} 
                      description="Expand stadium capacity by 5,000 seats and improve matchday revenue potential."
                      onUpgrade={() => actions.upgradeFacility('stadium')}
                      canAfford={team.budget >= cost}
                      isMaxed={lvl >= 10}
                  />
              </div>
          </div>
      );
  };

  const renderTraining = () => {
      const lvl = team.facilities.trainingLevel;
      const cost = calculateCost(8, lvl);
      return (
          <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex justify-between items-center">
                  <div>
                      <h3 className="text-xl font-bold text-white mb-1">Training Ground</h3>
                      <p className="text-slate-400 text-sm">Determine weekly focus and improve player development.</p>
                  </div>
                  <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase font-bold">Focus Streak</div>
                      <div className="text-3xl font-sport text-emerald-400">{team.training.streak} Wks</div>
                  </div>
              </div>

              {recommendation && (
                  <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg flex items-start gap-4">
                      <div className="bg-purple-900/50 p-2 rounded-full text-purple-300"><UserCog size={24} /></div>
                      <div>
                          <h4 className="text-sm font-bold text-purple-300 uppercase mb-1">Assistant Recommendation</h4>
                          <p className="text-sm text-slate-200"><strong className="text-white">{team.assistant?.name}</strong> suggests <span className="text-purple-300 font-bold mx-1">{recommendation.focus}</span> training.</p>
                          <p className="text-xs text-slate-400 italic mt-1">"{recommendation.reason}"</p>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(['General', 'Attack', 'Defense', 'Possession', 'Physical'] as const).map(f => (
                      <div 
                        key={f}
                        onClick={() => updateTraining(f)}
                        className={`p-3 rounded border cursor-pointer relative group transition-all text-center ${team.training.focus === f ? 'bg-emerald-900/30 border-emerald-500 shadow-lg' : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}
                      >
                          {team.training.focus === f && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>}
                          <div className={`mb-1 flex justify-center ${team.training.focus === f ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-500'}`}>
                              {f === 'Attack' ? <Zap size={20}/> : f === 'Defense' ? <Hammer size={20}/> : f === 'Possession' ? <Activity size={20}/> : f === 'Physical' ? <TrendingUp size={20}/> : <Crest team={team} size="sm"/>}
                          </div>
                          <div className="font-bold text-xs text-white">{f}</div>
                      </div>
                  ))}
              </div>

              <UpgradeSection 
                  type="Training Complex" 
                  level={lvl} 
                  cost={cost} 
                  description="Accelerates XP gain for all players, with a significant bonus for U23 talent."
                  onUpgrade={() => actions.upgradeFacility('training')}
                  canAfford={team.budget >= cost}
                  isMaxed={lvl >= 10}
              />
          </div>
      );
  };

  const renderMedical = () => {
      const lvl = team.facilities.medicalLevel;
      const cost = calculateCost(5, lvl);
      return (
          <div className="space-y-6">
              <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 text-center">
                  <Activity size={48} className="mx-auto text-rose-500 mb-4" />
                  <h2 className="text-2xl font-sport text-white">Medical Centre</h2>
                  <p className="text-slate-400 max-w-md mx-auto mt-2">
                      State-of-the-art facilities reduce injury frequency and duration.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Performance Impact">
                      <div className="text-center py-4">
                          <div className="text-5xl font-sport text-white">{10 + lvl}%</div>
                          <div className="text-sm text-slate-500 uppercase font-bold tracking-widest mt-2">Base Recovery Rate</div>
                          <div className="mt-4 text-xs text-slate-400">Players recover condition significantly faster between matches at higher levels.</div>
                      </div>
                  </Card>
                  
                  <UpgradeSection 
                      type="Medical" 
                      level={lvl} 
                      cost={cost} 
                      description="Drastically improves condition recovery and reduces long-term injury risks."
                      onUpgrade={() => actions.upgradeFacility('medical')}
                      canAfford={team.budget >= cost}
                      isMaxed={lvl >= 10}
                  />
              </div>
          </div>
      );
  };

  const renderYouth = () => {
      const lvl = team.facilities.youthLevel;
      const cost = calculateCost(10, lvl);
      return (
          <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center gap-6">
                  <div className="p-4 bg-slate-800 rounded-full text-blue-400"><GraduationCap size={32}/></div>
                  <div>
                      <h3 className="text-xl font-bold text-white">Academy & Scouting</h3>
                      <p className="text-slate-400 text-sm">Develop the next generation of superstars.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="space-y-6">
                        <Card title="Scouting Network">
                            <div className="text-center p-4">
                                <p className="text-slate-400 text-sm mb-6">
                                    Send scouts to local schools. Higher Academy levels unlock players with higher potential ceilings.
                                </p>
                                <div className="relative">
                                    <Button 
                                        onClick={handleScoutClick}
                                        disabled={team.budget < 0.5}
                                        className={`w-full ${team.budget < 0.5 ? 'opacity-50' : ''}`}
                                    >
                                        Scout Player (€500k)
                                    </Button>
                                    {/* Floating Cost Animation */}
                                    {scoutFeedback && (
                                        <div 
                                            className="fixed text-red-500 font-bold text-xl pointer-events-none z-50 animate-bounce"
                                            style={{ left: scoutFeedback.x, top: scoutFeedback.y - 20 }}
                                        >
                                            -€0.5M
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <h4 className="text-xs uppercase font-bold text-slate-500 mb-3">Recent Intake</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {academyPlayers.length === 0 && <div className="text-slate-500 text-xs italic text-center py-4">No players in academy.</div>}
                                {academyPlayers.map(p => {
                                    const status = p.academyStatus || 'pending';
                                    const isRejected = status === 'rejected';
                                    const isSigned = status === 'signed';
                                    const opacityClass = isRejected ? 'opacity-50 grayscale cursor-not-allowed' : 'opacity-100 hover:bg-slate-800 cursor-pointer';
                                    
                                    return (
                                        <div 
                                            key={p.id} 
                                            className={`flex justify-between items-center text-sm p-3 bg-slate-800/50 rounded border border-slate-700/50 transition-colors ${opacityClass}`} 
                                            onClick={() => {
                                                if (!isRejected && onPlayerClick) onPlayerClick(p.id);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full" style={{
                                                    backgroundColor: p.position === 'GK' ? '#ca8a04' : p.position === 'DEF' ? '#2563eb' : p.position === 'MID' ? '#10b981' : '#e11d48'
                                                }}></div>
                                                <div className="bg-slate-700 w-8 h-8 flex items-center justify-center rounded text-xs font-bold text-slate-300">
                                                    {p.position}
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold">{p.name}</div>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                                        <span>Pot: <span className="text-blue-400">{p.potential}</span></span>
                                                        {status === 'pending' && <span className="text-yellow-500 flex items-center gap-1"><Clock size={10}/> Pending</span>}
                                                        {status === 'signed' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10}/> Promoted</span>}
                                                        {status === 'rejected' && <span className="text-red-500 flex items-center gap-1"><XCircle size={10}/> Rejected</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="text-xs h-7 px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!isRejected && onPlayerClick) onPlayerClick(p.id);
                                                }}
                                                disabled={isRejected}
                                            >
                                                {status === 'signed' ? 'Profile' : 'Report'}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                   </div>

                   <UpgradeSection 
                      type="Academy" 
                      level={lvl} 
                      cost={cost} 
                      description="Increases the base quality and potential of scouted youth players."
                      onUpgrade={() => actions.upgradeFacility('youth')}
                      canAfford={team.budget >= cost}
                      isMaxed={lvl >= 10}
                  />
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
        <h2 className="text-3xl font-sport text-white">Club Infrastructure</h2>
        
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {[
                { id: 'stadium', label: 'Stadium', icon: MapPin },
                { id: 'training', label: 'Training', icon: Hammer },
                { id: 'medical', label: 'Medical', icon: Activity },
                { id: 'youth', label: 'Academy', icon: GraduationCap },
            ].map(t => (
                <button 
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold transition-colors ${activeTab === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                >
                    <t.icon size={16} /> {t.label}
                </button>
            ))}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {activeTab === 'stadium' && renderStadium()}
            {activeTab === 'training' && renderTraining()}
            {activeTab === 'medical' && renderMedical()}
            {activeTab === 'youth' && renderYouth()}
        </div>
    </div>
  );
};
