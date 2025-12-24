
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Division, Fixture, Team } from '../types';
import { Button } from '../components/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Crest } from '../components/Crest';
import { getDateFromWeek } from '../utils/engine';

interface Props {
  onSelectFixture: (f: Fixture) => void;
  onTeamClick: (id: string) => void;
}

export const Results: React.FC<Props> = ({ onSelectFixture, onTeamClick }) => {
  const { gameState } = useGame();
  
  if (!gameState || !gameState.userTeamId) return null;
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;

  const [activeCountry, setActiveCountry] = useState<string>(userTeam.country);
  const [activeDivision, setActiveDivision] = useState<Division>(userTeam.division);
  const [expandedFixtureId, setExpandedFixtureId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(gameState ? Math.max(1, gameState.currentWeek - 1) : 1);
  
  const userFixtures = gameState.fixtures.filter(f => f.homeTeamId === userTeam.id || f.awayTeamId === userTeam.id).sort((a,b) => a.week - b.week);
  
  // Separate played (result exists) vs upcoming
  const playedFixtures = userFixtures.filter(f => !!f.result);
  const upcomingFixtures = userFixtures.filter(f => !f.result);

  // Recent Form: Last 3 played matches
  const prevMatches = playedFixtures.slice(-3).reverse();
  
  // Future Matches: Next 2 upcoming
  const futureMatches = upcomingFixtures.slice(0, 2);
  const nextMatch = upcomingFixtures[0];

  const getTeam = (id: string) => gameState.teams.find(t => t.id === id)!;
  const getOpponent = (f: Fixture) => f.homeTeamId === userTeam.id ? getTeam(f.awayTeamId) : getTeam(f.homeTeamId);

  const filteredFixtures = gameState.fixtures.filter(f => {
      const h = getTeam(f.homeTeamId);
      // Filter by league ID or infer from team properties
      return h.country === activeCountry && h.division === activeDivision && f.week === selectedWeek;
  });

  const getDifficultyColor = (opp: Team) => {
      const rank = gameState.teams.filter(t => t.division === opp.division && t.country === opp.country).sort((a,b) => b.stats.points - a.stats.points).findIndex(t => t.id === opp.id) + 1;
      if (rank <= 4) return 'bg-red-500';
      if (rank <= 12) return 'bg-yellow-500';
      return 'bg-emerald-500';
  };

  return (
    <div className="space-y-8">
      {/* Club Schedule Horizontal Scroll */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 min-w-max">
              {userFixtures.map(f => {
                  const opp = getOpponent(f);
                  const isHome = f.homeTeamId === userTeam.id;
                  const isPlayed = !!f.result;
                  // It is next if it's the current week match and NOT played yet
                  const isNext = !isPlayed && f.week === gameState.currentWeek;
                  
                  return (
                      <div key={f.id} 
                           className={`w-40 rounded-lg p-3 border flex flex-col items-center gap-2 cursor-pointer transition-all hover:scale-105
                            ${isNext ? 'bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-slate-900 border-slate-800'}
                           `}
                           onClick={() => isPlayed && onSelectFixture(f)}
                      >
                          <div className="flex justify-between w-full text-[10px] text-slate-500 font-bold uppercase">
                              <div className="flex flex-col">
                                <span>Wk {f.week}</span>
                                <span className="text-[9px] text-slate-600 normal-case">{getDateFromWeek(f.week)}</span>
                              </div>
                              <span>{isHome ? 'Home' : 'Away'}</span>
                          </div>
                          <div className="relative">
                              <Crest team={opp} size="md" />
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${getDifficultyColor(opp)}`} title="Difficulty"></div>
                          </div>
                          <div className="text-xs font-bold text-center truncate w-full">{opp.name}</div>
                          {isPlayed ? (
                               <div className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
                                   f.result?.homeScore === f.result?.awayScore ? 'bg-slate-700 text-slate-300' :
                                   (isHome && f.result?.homeScore! > f.result?.awayScore!) || (!isHome && f.result?.awayScore! > f.result?.homeScore!) ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                               }`}>
                                   {f.result?.homeScore}-{f.result?.awayScore}
                               </div>
                          ) : (
                               <div className="text-xs text-slate-600 font-mono">-- : --</div>
                          )}
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Club Command Ribbon */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-900/50 shadow-2xl bg-slate-900">
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(90deg, ${userTeam.colors[0]} 0%, ${userTeam.colors[1]} 100%)` }}></div>
         <div className="relative z-10 flex flex-col md:flex-row items-stretch">
             
             {/* Recent Form */}
             <div className="p-4 flex-1 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-center">
                 <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-widest">Recent Form</h4>
                 <div className="flex gap-2">
                     {prevMatches.length === 0 ? <span className="text-slate-500 italic text-sm">Season start</span> : 
                        prevMatches.map(f => {
                            const opp = getOpponent(f);
                            const isWin = (f.result?.homeScore! > f.result?.awayScore! && f.homeTeamId === userTeam.id) || (f.result?.awayScore! > f.result?.homeScore! && f.awayTeamId === userTeam.id);
                            const isDraw = f.result?.homeScore === f.result?.awayScore;
                            const resultChar = isWin ? 'W' : isDraw ? 'D' : 'L';
                            const colorClass = isWin ? 'bg-emerald-500' : isDraw ? 'bg-slate-500' : 'bg-red-500';
                            return (
                                <div key={f.id} className="flex flex-col items-center gap-1 w-16 bg-slate-950/50 p-2 rounded cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => onSelectFixture(f)}>
                                    <div className={`text-[10px] font-bold px-1.5 rounded ${colorClass} text-white`}>{resultChar}</div>
                                    <Crest team={opp} size="sm" />
                                    <div className="text-xs font-mono">{f.result?.homeScore}-{f.result?.awayScore}</div>
                                </div>
                            );
                        })
                     }
                 </div>
             </div>

             {/* Next Match Focus */}
             <div className="flex-[2] p-6 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-between">
                 {nextMatch ? (
                     <>
                        <div className="text-center">
                            <div className="text-xs text-emerald-400 font-bold uppercase mb-1">Next Match</div>
                            <div className="text-3xl font-sport text-white">Week {nextMatch.week}</div>
                            <div className="text-slate-400 text-sm font-bold">{getDateFromWeek(nextMatch.week)}</div>
                            <div className="text-slate-500 text-xs mt-1">{getTeam(nextMatch.homeTeamId).name === userTeam.name ? 'Home' : 'Away'}</div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-4xl font-bold font-sport text-slate-600">VS</div>
                            <div className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform" onClick={() => onTeamClick(getOpponent(nextMatch).id)}>
                                <Crest team={getOpponent(nextMatch)} size="lg" className="mb-2" />
                                <div className="font-bold text-lg">{getOpponent(nextMatch).name}</div>
                            </div>
                        </div>
                     </>
                 ) : <div className="text-center w-full text-slate-500">No upcoming fixtures</div>}
             </div>

             {/* Upcoming */}
             <div className="p-4 flex-1 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-center">
                 <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-widest text-right">Upcoming</h4>
                 <div className="space-y-2">
                     {futureMatches.map(f => (
                         <div key={f.id} className="flex justify-between items-center bg-slate-950/50 p-2 rounded cursor-pointer hover:bg-slate-800" onClick={() => onTeamClick(getOpponent(f).id)}>
                             <div className="flex flex-col">
                                <span className="text-xs text-slate-500 font-mono">W{f.week}</span>
                                <span className="text-[9px] text-slate-600">{getDateFromWeek(f.week)}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-xs text-slate-300">{getOpponent(f).name}</span>
                                 <Crest team={getOpponent(f)} size="sm" />
                             </div>
                         </div>
                     ))}
                     {futureMatches.length === 0 && <div className="text-slate-500 italic text-xs text-right">End of schedule</div>}
                 </div>
             </div>
         </div>
      </div>

      {/* Global Match Centre */}
      <div>
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <div className="flex gap-4 items-center">
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
                      <button onClick={() => setActiveDivision(Division.First)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeDivision === Division.First ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Div 1</button>
                      <button onClick={() => setActiveDivision(Division.Second)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeDivision === Division.Second ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Div 2</button>
                  </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900 rounded p-1 border border-slate-700">
                  <button onClick={() => setSelectedWeek(w => Math.max(1, w-1))} className="p-1 hover:text-emerald-400"><ChevronDown className="rotate-90" size={16} /></button>
                  <div className="flex flex-col items-center w-24">
                      <span className="font-mono font-bold text-sm">Week {selectedWeek}</span>
                      <span className="text-[10px] text-slate-500">{getDateFromWeek(selectedWeek)}</span>
                  </div>
                  <button onClick={() => setSelectedWeek(w => Math.min(gameState.totalWeeks, w+1))} className="p-1 hover:text-emerald-400"><ChevronDown className="-rotate-90" size={16} /></button>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFixtures.map(f => {
                  const home = getTeam(f.homeTeamId);
                  const away = getTeam(f.awayTeamId);
                  const isExpanded = expandedFixtureId === f.id;
                  
                  return (
                      <div key={f.id} className={`bg-slate-900 border ${f.homeTeamId === userTeam.id || f.awayTeamId === userTeam.id ? 'border-emerald-500/50' : 'border-slate-800'} rounded-lg overflow-hidden transition-all duration-200`}>
                          <div 
                              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800"
                              onClick={() => setExpandedFixtureId(isExpanded ? null : f.id)}
                          >
                              <div className="flex-1 flex items-center justify-end gap-3 group" onClick={(e) => { e.stopPropagation(); onTeamClick(home.id); }}>
                                  <span className={`font-bold group-hover:underline ${f.result && f.result.homeScore > f.result.awayScore ? 'text-white' : 'text-slate-400'}`}>{home.name}</span>
                                  <Crest team={home} size="sm" />
                              </div>
                              <div className="px-4 text-center min-w-[80px]">
                                  {f.result ? (
                                      <div className="flex flex-col items-center">
                                          <div className="font-mono text-xl font-bold text-white bg-slate-950 px-3 py-1 rounded border border-slate-800">
                                              {f.result.homeScore} - {f.result.awayScore}
                                          </div>
                                          {f.result.stats.xgHome !== undefined && (
                                              <div className="text-[9px] text-slate-500 mt-1">
                                                  xG {f.result.stats.xgHome.toFixed(1)} - {f.result.stats.xgAway.toFixed(1)}
                                              </div>
                                          )}
                                      </div>
                                  ) : (
                                      <span className="text-xs text-slate-500 font-bold uppercase">vs</span>
                                  )}
                              </div>
                              <div className="flex-1 flex items-center justify-start gap-3 group" onClick={(e) => { e.stopPropagation(); onTeamClick(away.id); }}>
                                  <Crest team={away} size="sm" />
                                  <span className={`font-bold group-hover:underline ${f.result && f.result.awayScore > f.result.homeScore ? 'text-white' : 'text-slate-400'}`}>{away.name}</span>
                              </div>
                          </div>
                          
                          {isExpanded && f.result && (
                              <div className="bg-slate-950/50 border-t border-slate-800 p-4 animate-in slide-in-from-top-2">
                                  <div className="flex justify-between items-start text-sm mb-3">
                                      <div className="space-y-1 text-right w-1/2 pr-4 border-r border-slate-800">
                                          {f.result.events.filter(e => e.teamId === home.id && e.type === 'goal').map((e, i) => (
                                              <div key={i} className="text-emerald-400">⚽ {e.playerName} <span className="text-slate-600 text-xs">({e.minute}')</span></div>
                                          ))}
                                      </div>
                                      <div className="space-y-1 text-left w-1/2 pl-4">
                                          {f.result.events.filter(e => e.teamId === away.id && e.type === 'goal').map((e, i) => (
                                              <div key={i} className="text-emerald-400">⚽ {e.playerName} <span className="text-slate-600 text-xs">({e.minute}')</span></div>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="text-center">
                                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onSelectFixture(f); }}>Full Match Report</Button>
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })}
              {filteredFixtures.length === 0 && <div className="col-span-2 text-center text-slate-500 py-12 italic">No matches scheduled for this week in this league.</div>}
          </div>
      </div>
    </div>
  );
};
