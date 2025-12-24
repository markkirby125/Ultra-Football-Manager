
import React, { useState, useMemo } from 'react';
import { LeagueTable, RefereeTable } from './LeagueTable';
import { useGame } from '../context/GameContext';
import { Division, Player, Position, Referee } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Crest } from '../components/Crest';
import { Trophy, Target, Shield, Activity, Zap, Ban, Users, Globe, User, Gavel } from 'lucide-react';
import { NATIONALITIES } from '../constants';

interface Props {
  onTeamClick: (id: string) => void;
  onRefereeClick: (id: string) => void;
  onPlayerClick: (id: string) => void;
}

export const Standings: React.FC<Props> = ({ onTeamClick, onRefereeClick, onPlayerClick }) => {
  const { gameState } = useGame();

  if (!gameState || !gameState.userTeamId) return null;
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;

  const [activeTab, setActiveTab] = useState<'League' | 'Referees'>('League');
  const [activeCountry, setActiveCountry] = useState<string>(userTeam.country);
  const [activeDivision, setActiveDivision] = useState<Division>(userTeam.division);
  const [statsScope, setStatsScope] = useState<'Global' | 'Club'>('Global');
  const [statsMetric, setStatsMetric] = useState<string>('Goals');

  const players = gameState.players;
  const referees = gameState.referees;
  const userTeamId = gameState.userTeamId;

  // Filter Players based on active division
  const statsSource = useMemo(() => {
      if (activeTab === 'Referees') return referees; // Special Case

      // 1. Division Filter & Country Filter
      let pool = players.filter(p => {
          const t = gameState.teams.find(t => t.id === p.teamId);
          return t && t.country === activeCountry && t.division === activeDivision;
      });

      // 2. Club Filter
      if (statsScope === 'Club') {
          pool = pool.filter(p => p.teamId === userTeamId);
      }
      return pool;
  }, [players, referees, userTeamId, statsScope, activeTab, activeCountry, activeDivision, gameState.teams]);

  const topStats = useMemo(() => {
      if (activeTab === 'Referees') {
          // Referee Stats Logic
          const refs = [...referees];
          switch(statsMetric) {
              case 'Strictest': return refs.sort((a,b) => b.stats.strictness - a.stats.strictness).slice(0, 10);
              case 'CardHappy': return refs.sort((a,b) => (b.cardsGiven.yellow + b.cardsGiven.red) - (a.cardsGiven.yellow + a.cardsGiven.red)).slice(0, 10);
              case 'TopRated': 
                  return refs.sort((a,b) => {
                      const ratingA = a.gamesOfficiated > 0 ? a.history.reduce((x,y)=>x+y.rating,0)/a.gamesOfficiated : 0;
                      const ratingB = b.gamesOfficiated > 0 ? b.history.reduce((x,y)=>x+y.rating,0)/b.gamesOfficiated : 0;
                      return ratingB - ratingA;
                  }).slice(0, 10);
              case 'Games': return refs.sort((a,b) => b.gamesOfficiated - a.gamesOfficiated).slice(0, 10);
              default: return refs.slice(0,10);
          }
      }

      // Player Stats Logic
      let filtered = [...(statsSource as Player[])];
      
      switch (statsMetric) {
          case 'Goals':
              return filtered.sort((a,b) => b.statsSeason.goals - a.statsSeason.goals || b.statsSeason.apps - a.statsSeason.apps).slice(0, 10);
          case 'Assists':
              return filtered.sort((a,b) => b.statsSeason.assists - a.statsSeason.assists || b.statsSeason.apps - a.statsSeason.apps).slice(0, 10);
          case 'Rating':
              // Logic: 0 games = bottom. 1 game = raw. >1 = avg.
              // We sort by average.
              return filtered.sort((a,b) => {
                  const avgA = a.statsSeason.apps > 0 ? a.statsSeason.ratingSum / a.statsSeason.apps : 0;
                  const avgB = b.statsSeason.apps > 0 ? b.statsSeason.ratingSum / b.statsSeason.apps : 0;
                  return avgB - avgA;
              }).slice(0, 10);
          case 'Cards':
              return filtered.sort((a,b) => (b.statsSeason.yellows + b.statsSeason.reds*3) - (a.statsSeason.yellows + a.statsSeason.reds*3)).slice(0, 10);
          case 'CleanSheets':
              return filtered.filter(p => p.position === Position.GK)
                             .sort((a,b) => b.statsSeason.cleanSheets - a.statsSeason.cleanSheets).slice(0, 10);
          default:
              return [];
      }
  }, [statsSource, statsMetric, activeTab, referees]);

  const getMetricValue = (item: Player | Referee) => {
      if (activeTab === 'Referees') {
          const r = item as Referee;
          switch (statsMetric) {
              case 'Strictest': return `${r.stats.strictness}%`;
              case 'CardHappy': return `${r.cardsGiven.yellow + r.cardsGiven.red} Cards`;
              case 'TopRated': return (r.gamesOfficiated > 0 ? (r.history.reduce((a,b)=>a+b.rating,0)/r.gamesOfficiated).toFixed(2) : '-');
              case 'Games': return r.gamesOfficiated;
              default: return '';
          }
      }

      const p = item as Player;
      switch (statsMetric) {
          case 'Goals': return p.statsSeason.goals;
          case 'Assists': return p.statsSeason.assists;
          case 'Rating': 
              if (p.statsSeason.apps === 0) return 'N/A';
              return (p.statsSeason.ratingSum / p.statsSeason.apps).toFixed(2);
          case 'Cards': return `${p.statsSeason.yellows}Y / ${p.statsSeason.reds}R`;
          case 'CleanSheets': return p.statsSeason.cleanSheets;
      }
  };

  const getMetricLabel = () => {
       if (activeTab === 'Referees') {
           switch(statsMetric) {
               case 'Strictest': return 'Strictness';
               case 'CardHappy': return 'Total Cards';
               case 'TopRated': return 'Avg Rating';
               case 'Games': return 'Games';
               default: return '';
           }
       }
       switch (statsMetric) {
          case 'Rating': return "Avg Rtg";
          case 'CleanSheets': return "Clean Sheets";
          default: return statsMetric;
      }
  };

  // Switch default metric when tab changes
  React.useEffect(() => {
      if (activeTab === 'Referees') setStatsMetric('TopRated');
      else setStatsMetric('Goals');
  }, [activeTab]);

  return (
      <div className="flex flex-col h-[78vh] space-y-4">
          {/* Top Navigation for Tables */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex gap-2">
                  <Button variant={activeTab === 'League' ? 'primary' : 'secondary'} onClick={() => setActiveTab('League')}>Leagues</Button>
                  <Button variant={activeTab === 'Referees' ? 'primary' : 'secondary'} onClick={() => setActiveTab('Referees')}>Referees</Button>
              </div>
              
              {activeTab === 'League' && (
                  <div className="flex gap-4 items-center overflow-x-auto pb-2 md:pb-0">
                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                          {['ENG', 'ESP', 'ITA', 'GER', 'FRA'].map(code => (
                              <button 
                                key={code} 
                                onClick={() => setActiveCountry(code)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeCountry === code ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                  {code}
                              </button>
                          ))}
                      </div>
                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                          <button onClick={() => setActiveDivision(Division.First)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeDivision === Division.First ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                              Div 1
                          </button>
                          <button onClick={() => setActiveDivision(Division.Second)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeDivision === Division.Second ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                              Div 2
                          </button>
                      </div>
                  </div>
              )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
              {/* LEFT: TABLE */}
              <div className="lg:w-3/5 overflow-y-auto custom-scrollbar pr-2">
                  {activeTab === 'League' && <LeagueTable teams={gameState.teams} division={activeDivision} country={activeCountry} userTeamId={userTeamId} onTeamClick={onTeamClick} />}
                  {activeTab === 'Referees' && <RefereeTable referees={gameState.referees} onSelect={onRefereeClick} />}
              </div>

              {/* RIGHT: STATS CENTRE */}
              <div className="lg:w-2/5 flex flex-col gap-4 min-h-0">
                  <Card title={activeTab === 'Referees' ? "Officiating Analytics" : `Stats Centre (${activeCountry})`} className="flex-1 flex flex-col min-h-0 shadow-xl border-slate-700">
                      {/* Controls */}
                      <div className="flex flex-col gap-3 mb-4 shrink-0">
                          {activeTab !== 'Referees' && (
                              <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
                                  <button onClick={() => setStatsScope('Global')} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${statsScope === 'Global' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                                      <Globe size={12}/> Global
                                  </button>
                                  <button onClick={() => setStatsScope('Club')} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-all ${statsScope === 'Club' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                                      <Users size={12}/> My Club
                                  </button>
                              </div>
                          )}
                          
                          <div className="flex flex-wrap gap-2 justify-center">
                              {activeTab !== 'Referees' ? (
                                  <>
                                    <button onClick={() => setStatsMetric('Goals')} className={`p-2 rounded border transition-colors ${statsMetric === 'Goals' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Top Scorers"><Target size={16}/></button>
                                    <button onClick={() => setStatsMetric('Assists')} className={`p-2 rounded border transition-colors ${statsMetric === 'Assists' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Assists"><Zap size={16}/></button>
                                    <button onClick={() => setStatsMetric('Rating')} className={`p-2 rounded border transition-colors ${statsMetric === 'Rating' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Average Rating"><Activity size={16}/></button>
                                    <button onClick={() => setStatsMetric('CleanSheets')} className={`p-2 rounded border transition-colors ${statsMetric === 'CleanSheets' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Clean Sheets"><Shield size={16}/></button>
                                    <button onClick={() => setStatsMetric('Cards')} className={`p-2 rounded border transition-colors ${statsMetric === 'Cards' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Discipline"><Ban size={16}/></button>
                                  </>
                              ) : (
                                  <>
                                    <button onClick={() => setStatsMetric('TopRated')} className={`p-2 rounded border transition-colors ${statsMetric === 'TopRated' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Top Rated"><Activity size={16}/></button>
                                    <button onClick={() => setStatsMetric('Strictest')} className={`p-2 rounded border transition-colors ${statsMetric === 'Strictest' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Strictest"><Shield size={16}/></button>
                                    <button onClick={() => setStatsMetric('CardHappy')} className={`p-2 rounded border transition-colors ${statsMetric === 'CardHappy' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Most Cards"><Ban size={16}/></button>
                                    <button onClick={() => setStatsMetric('Games')} className={`p-2 rounded border transition-colors ${statsMetric === 'Games' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`} title="Games Officiated"><Gavel size={16}/></button>
                                  </>
                              )}
                          </div>
                      </div>

                      {/* List */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                          {topStats.length > 0 ? topStats.map((item, idx) => {
                              const isRef = activeTab === 'Referees';
                              const p = item as Player;
                              const r = item as Referee;
                              const team = !isRef ? gameState.teams.find(t => t.id === p.teamId) : null;
                              
                              return (
                                  <div 
                                    key={item.id} 
                                    onClick={() => isRef ? onRefereeClick(r.id) : onPlayerClick(p.id)} 
                                    className="flex items-center gap-3 p-2 rounded bg-slate-900/50 border border-slate-800 hover:bg-slate-800 cursor-pointer group transition-colors"
                                  >
                                      <div className="w-6 text-center font-sport text-lg text-slate-600 font-bold">{idx + 1}</div>
                                      
                                      <div className="relative shrink-0">
                                          {team && <Crest team={team} size="sm" className="w-8 h-10 opacity-80" />}
                                          {isRef && <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">ref</div>}
                                      </div>

                                      <div className="flex-1 min-w-0">
                                          <div className="font-bold text-white text-sm truncate group-hover:text-emerald-400">{item.name}</div>
                                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                              {!isRef && (
                                                  <>
                                                    <span>{p.position}</span>
                                                    {team && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="truncate">{team.name}</span>
                                                        </>
                                                    )}
                                                  </>
                                              )}
                                              {isRef && <span>{r.division}</span>}
                                          </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                          <div className="text-emerald-400 font-mono font-bold text-lg leading-none">{getMetricValue(item)}</div>
                                          <div className="text-[8px] text-slate-500 uppercase font-bold">{getMetricLabel()}</div>
                                      </div>
                                  </div>
                              );
                          }) : (
                              <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                                  <Activity size={32} className="opacity-20 mb-2" />
                                  <span className="italic text-sm">No stats recorded yet.</span>
                              </div>
                          )}
                      </div>
                  </Card>
              </div>
          </div>
      </div>
  );
};
