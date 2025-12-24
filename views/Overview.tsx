
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { NewsItem, Fixture } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Clock, Flame, Newspaper, Activity, Trophy, BarChart2, UserCog, Lightbulb, Shield, CloudSnow, CloudRain, AlertTriangle } from 'lucide-react';
import { Crest } from '../components/Crest';
import { getDateFromWeek, generateWeather } from '../utils/engine';

interface Props {
  onPlayerClick: (id: string) => void;
  onTeamClick: (id: string) => void;
  onHeadlineClick: (item: NewsItem | null) => void;
  onFixtureClick: (fixture: Fixture) => void;
  onRefereeClick: (id: string) => void;
  onHireAssistant: () => void;
}

export const Overview: React.FC<Props> = ({ onPlayerClick, onTeamClick, onHeadlineClick, onFixtureClick, onRefereeClick, onHireAssistant }) => {
  const { gameState, actions, isSimulating } = useGame();
  const [isPostponed, setIsPostponed] = useState(false);
  const [weather, setWeather] = useState<string>('Clear');
  
  if (!gameState || !gameState.userTeamId) return null;
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;

  // Hero Section Logic (Current Week)
  const currentFixture = gameState.fixtures.find(f => f.week === gameState.currentWeek && (f.homeTeamId === userTeam.id || f.awayTeamId === userTeam.id));
  const opponentId = currentFixture ? (currentFixture.homeTeamId === userTeam.id ? currentFixture.awayTeamId : currentFixture.homeTeamId) : null;
  const opponent = opponentId ? gameState.teams.find(t => t.id === opponentId) : null;
  const referee = currentFixture ? gameState.referees.find(r => r.id === currentFixture.refereeId) : null;
  const homeTeam = currentFixture ? gameState.teams.find(t => t.id === currentFixture.homeTeamId) : null;
  
  const isDerby = opponent && userTeam.rivalId === opponent.id;
  const isCurrentPlayed = !!currentFixture?.result;

  // Check Postponement
  useEffect(() => {
      if (currentFixture && !isCurrentPlayed && homeTeam) {
          // Determine weather for this match context
          const w = generateWeather(homeTeam.stadium.climateType, currentFixture.week, homeTeam.stadium.name);
          setWeather(w);
          
          // 5% chance of postponement if heavy weather
          // To ensure this doesn't flip flop on re-renders, we should use a deterministic seed or store it.
          // Since we don't store it yet, let's use the fixture ID hash + week as seed.
          if (w === 'Snow' || w === 'Heavy Rain') {
              const seed = currentFixture.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
              // Use a pseudo random check
              const x = Math.sin(seed) * 10000;
              const rnd = x - Math.floor(x);
              
              if (rnd < 0.05 && !currentFixture.postponed) {
                  setIsPostponed(true);
              } else {
                  setIsPostponed(false);
              }
          } else {
              setIsPostponed(false);
          }
      }
  }, [currentFixture?.id, currentFixture?.week]);

  // Restrict Simulation if match exists but no assistant
  const canSimulate = !currentFixture || isCurrentPlayed || !!userTeam.assistant;
  const needsAssistant = currentFixture && !isCurrentPlayed && !userTeam.assistant;

  // Report Section Logic (Last Played Match)
  const lastPlayedMatch = gameState.fixtures
      .filter(f => (f.homeTeamId === userTeam.id || f.awayTeamId === userTeam.id) && f.result)
      .sort((a,b) => b.week - a.week)[0];

  const topScorer = gameState.players
      .filter(p => p.teamId === userTeam.id)
      .sort((a,b) => b.statsSeason.goals - a.statsSeason.goals)[0];

  const getNeighbors = () => {
      const sorted = gameState.teams
          .filter(t => t.division === userTeam.division)
          .sort((a, b) => b.stats.points - a.stats.points);
      const idx = sorted.findIndex(t => t.id === userTeam.id);
      return sorted.slice(Math.max(0, idx - 1), Math.min(sorted.length, idx + 2));
  };
  const neighbors = getNeighbors();

  // Curated News
  const curatedNews = gameState.news.filter(n => (n.dramaScore || 0) > 40 || n.type !== 'match').slice(0, 4);
  const latestNews = curatedNews[0];

  const currentDate = getDateFromWeek(gameState.currentWeek);

  return (
    <div className="space-y-6">
        {/* Hero Section */}
        <div className={`bg-gradient-to-br from-slate-900 to-slate-800 border ${isDerby ? 'border-red-500/50' : 'border-emerald-500/20'} rounded-xl p-8 relative overflow-hidden shadow-2xl`}>
            {isDerby && <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse"></div>}
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                {opponent ? (
                    <>
                        <div className="text-center md:text-left flex-1">
                            <div className="mb-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isDerby ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                    {isDerby ? <><Flame size={12}/> DERBY DAY</> : <><Clock size={12}/> {isCurrentPlayed ? 'Latest Result' : 'Upcoming Fixture'}</>}
                                </div>
                                {referee && (
                                    <div 
                                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity ${
                                            referee.stats.strictness > 80 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                            referee.stats.strictness < 30 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                                            'bg-slate-700/50 text-slate-400 border border-slate-600'
                                        }`}
                                        onClick={() => onRefereeClick(referee.id)}
                                        title={`Strictness: ${referee.stats.strictness}%`}
                                    >
                                        <Shield size={12} />
                                        {referee.stats.strictness > 80 ? 'Strict Ref' : referee.stats.strictness < 30 ? 'Lenient Ref' : referee.name.split(' ').pop()}
                                    </div>
                                )}
                            </div>
                            <h2 className="text-4xl font-sport text-white mb-1">{userTeam.name} <span className="text-slate-500 mx-2">vs</span> {opponent.name}</h2>
                            <p className="text-slate-400 text-sm">
                                Week {gameState.currentWeek} ({currentDate}) • {currentFixture?.homeTeamId === userTeam.id ? 'Home' : 'Away'}
                            </p>
                            
                            {/* Weather Alert */}
                            {(weather === 'Snow' || weather === 'Heavy Rain') && !isCurrentPlayed && (
                                <div className="mt-2 text-xs font-bold text-blue-300 flex items-center gap-2">
                                    {weather === 'Snow' ? <CloudSnow size={14}/> : <CloudRain size={14}/>} 
                                    Forecast: {weather} 
                                    {isPostponed && <span className="text-red-400 uppercase ml-2 bg-red-900/30 px-1 rounded">MATCH POSTPONED</span>}
                                </div>
                            )}
                            
                            {/* Assistant Insight */}
                            {userTeam.assistant && !isCurrentPlayed && !isPostponed && (
                                <div className="mt-4 bg-purple-900/20 border-l-2 border-purple-500 p-3 rounded-r max-w-md animate-in fade-in slide-in-from-left-2">
                                    <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase mb-1">
                                        <UserCog size={12} /> Assistant Report
                                    </div>
                                    <p className="text-xs text-slate-300 italic leading-relaxed">
                                        "{opponent.rating > userTeam.rating ? `They are strong favorites. We need to stay compact.` : `We are the better side. Let's attack from the first minute.`} Key danger: {opponent.stats.gf > 10 ? 'High scoring attack.' : 'Solid defense.'}"
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col md:flex-row gap-4 items-center justify-center md:justify-start">
                                {!isCurrentPlayed && (
                                    isPostponed ? (
                                        <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-3">
                                            <AlertTriangle className="text-red-500" />
                                            <div className="text-sm">
                                                <div className="font-bold text-red-200">Match Postponed</div>
                                                <div className="text-xs text-red-300/70">Unplayable conditions. Simulating reschedule.</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button size="lg" onClick={() => currentFixture && actions.startLiveMatch(currentFixture)} className="shadow-emerald-900/50" disabled={isSimulating}>Play Match</Button>
                                    )
                                )}
                                
                                <div className="flex flex-col items-center md:items-start">
                                    {needsAssistant && !isPostponed ? (
                                        <Button 
                                            variant="secondary" 
                                            className="bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-900/20 flex items-center gap-2" 
                                            onClick={onHireAssistant}
                                        >
                                            <UserCog size={18} /> Hire AM to Simulate
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant={isCurrentPlayed || isPostponed ? 'primary' : 'secondary'} 
                                            onClick={actions.simulateWeek} 
                                            disabled={isSimulating || (!canSimulate && !isPostponed)}
                                        >
                                            {isSimulating ? 'Simulating...' : isPostponed ? 'Reschedule (Sim Week)' : isCurrentPlayed ? 'Advance Week' : 'Simulate Week'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                            <div className="cursor-pointer hover:scale-110 transition-transform" onClick={() => onTeamClick(userTeam.id)}>
                                <Crest team={userTeam} size="lg" />
                            </div>
                            <div className="text-4xl font-sport font-bold text-slate-700">
                                {isCurrentPlayed ? <span className="text-white">{currentFixture?.result?.homeScore} - {currentFixture?.result?.awayScore}</span> : "VS"}
                            </div>
                            <div className="cursor-pointer hover:scale-110 transition-transform" onClick={() => onTeamClick(opponent.id)}>
                                <Crest team={opponent} size="lg" />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center w-full py-8">
                        <h2 className="text-3xl font-sport text-white mb-2">Rest Week</h2>
                        <div className="text-slate-400 mb-4">{currentDate}</div>
                        <Button onClick={actions.simulateWeek} disabled={isSimulating}>
                            {isSimulating ? 'Simulating...' : 'Simulate Week'}
                        </Button>
                    </div>
                )}
            </div>
        </div>

        {/* Post-Match Report Overview (Shows Last Played Match) */}
        {lastPlayedMatch && lastPlayedMatch.result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 cursor-pointer group" onClick={() => onFixtureClick(lastPlayedMatch)}>
                <div className="bg-slate-900 border border-slate-700 hover:border-emerald-500 transition-all rounded-xl p-0 overflow-hidden shadow-xl relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <BarChart2 size={100} />
                    </div>
                    
                    <div className="bg-slate-950/50 p-3 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                             <Activity size={16} /> Match Report <span className="text-slate-500 text-[10px] ml-2">Week {lastPlayedMatch.week}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-bold uppercase">Click for details →</div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                         {/* Score & Scorers */}
                         <div className="md:col-span-2 flex flex-col gap-6">
                             <div className="flex items-center justify-between">
                                 {/* Home */}
                                 <div className="flex items-center gap-4 flex-1">
                                     <Crest team={gameState.teams.find(t => t.id === lastPlayedMatch.homeTeamId)!} size="md" />
                                     <div className="font-bold text-xl text-white">{gameState.teams.find(t => t.id === lastPlayedMatch.homeTeamId)!.name}</div>
                                 </div>
                                 
                                 {/* Score */}
                                 <div className="px-6 py-2 bg-slate-950 rounded-lg border border-slate-800 text-3xl font-mono font-bold text-white shadow-inner">
                                     {lastPlayedMatch.result.homeScore} - {lastPlayedMatch.result.awayScore}
                                 </div>

                                 {/* Away */}
                                 <div className="flex items-center gap-4 flex-1 justify-end">
                                     <div className="font-bold text-xl text-white text-right">{gameState.teams.find(t => t.id === lastPlayedMatch.awayTeamId)!.name}</div>
                                     <Crest team={gameState.teams.find(t => t.id === lastPlayedMatch.awayTeamId)!} size="md" />
                                 </div>
                             </div>

                             {/* Scorers List */}
                             <div className="flex justify-between text-sm text-slate-400">
                                 <div className="space-y-1">
                                     {lastPlayedMatch.result.events.filter(e => e.type === 'goal' && e.teamId === lastPlayedMatch.homeTeamId).map((e, i) => (
                                         <div key={i} className="flex items-center gap-2">
                                             <span>⚽</span> {e.playerName} <span className="text-slate-600 font-mono">({e.minute}')</span>
                                         </div>
                                     ))}
                                 </div>
                                 <div className="space-y-1 text-right">
                                     {lastPlayedMatch.result.events.filter(e => e.type === 'goal' && e.teamId === lastPlayedMatch.awayTeamId).map((e, i) => (
                                         <div key={i} className="flex items-center gap-2 justify-end">
                                             <span className="text-slate-600 font-mono">({e.minute}')</span> {e.playerName} <span>⚽</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                             
                             {/* Possession Bar */}
                             <div className="mt-2">
                                 <div className="flex justify-between text-xs text-slate-500 font-bold uppercase mb-1">
                                     <span>Possession</span>
                                     <span>{lastPlayedMatch.result.stats.possessionHome}% / {lastPlayedMatch.result.stats.possessionAway}%</span>
                                 </div>
                                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                                     <div className="h-full bg-emerald-500" style={{ width: `${lastPlayedMatch.result.stats.possessionHome}%` }}></div>
                                     <div className="h-full bg-blue-500" style={{ width: `${lastPlayedMatch.result.stats.possessionAway}%` }}></div>
                                 </div>
                             </div>
                         </div>

                         {/* MOM Card */}
                         <div className="border-l border-slate-800 pl-8 flex flex-col justify-center">
                             {(() => {
                                 const mom = lastPlayedMatch.result.lineups.home.concat(lastPlayedMatch.result.lineups.away).sort((a,b) => b.rating - a.rating)[0];
                                 if (!mom) return null;
                                 return (
                                     <div className="bg-gradient-to-br from-yellow-900/20 to-slate-900 p-4 rounded-lg border border-yellow-500/30 text-center relative overflow-hidden">
                                         <div className="absolute inset-0 bg-yellow-500/5 animate-pulse"></div>
                                         <div className="relative z-10">
                                             <div className="inline-block p-2 bg-yellow-500/20 rounded-full mb-2 text-yellow-500">
                                                 <Trophy size={20} />
                                             </div>
                                             <div className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">Man of the Match</div>
                                             <div className="font-bold text-white text-lg">{mom.name}</div>
                                             <div className="text-xs text-slate-400 mb-2">{mom.position} • {mom.rating.toFixed(1)} Rating</div>
                                             <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 mt-2 border-t border-slate-800 pt-2">
                                                  {mom.goals > 0 && <div>{mom.goals} Goals</div>}
                                                  {mom.assists > 0 && <div>{mom.assists} Assists</div>}
                                                  {mom.saves > 0 && <div>{mom.saves} Saves</div>}
                                                  {mom.tackles > 0 && <div>{mom.tackles} Tackles</div>}
                                                  {mom.passes > 0 && <div>{mom.passes} Passes</div>}
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })()}
                         </div>
                    </div>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card title="League Context" className="h-full">
                <div className="space-y-2">
                    {neighbors.map((t, i) => (
                        <div key={t.id} onClick={() => onTeamClick(t.id)} className={`flex items-center justify-between p-3 rounded cursor-pointer hover:bg-slate-800 transition-colors ${t.id === userTeam.id ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-slate-950/50'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`font-mono font-bold w-6 text-center ${t.id === userTeam.id ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {gameState.teams.filter(x => x.division === t.division).sort((a,b)=>b.stats.points-a.stats.points).findIndex(x=>x.id===t.id)+1}
                                </span>
                                <span className={t.id === userTeam.id ? 'text-white font-bold' : 'text-slate-400'}>{t.name}</span>
                            </div>
                            <div className="font-sport text-xl">{t.stats.points} <span className="text-xs text-slate-600 font-sans">pts</span></div>
                        </div>
                    ))}
                </div>
            </Card>

            <div className="space-y-6">
                <Card title="Key Player" className="h-full">
                    <div className="space-y-4">
                        {topScorer && (
                            <div className="flex items-center gap-4 bg-slate-950/30 p-2 rounded hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => onPlayerClick(topScorer.id)}>
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-500">⚽</div>
                                <div>
                                    <div className="text-xs uppercase text-slate-500 font-bold">Top Scorer</div>
                                    <div className="font-bold text-white hover:text-emerald-400">{topScorer.name}</div>
                                    <div className="text-xs text-emerald-400">{topScorer.statsSeason.goals} Goals</div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <Card 
                title="Editor's Picks" 
                action={<Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={() => onHeadlineClick(null)}>Archive</Button>}
                className="h-full"
            >
                {latestNews && (
                    <div className="mb-4 pb-4 border-b border-slate-800">
                        <div className="relative h-32 rounded bg-slate-800 mb-2 overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10"></div>
                             {/* Abstract News Image */}
                             <div className="w-full h-full bg-slate-700 flex items-center justify-center text-slate-600 font-sport text-4xl">EL DIARIO</div>
                             <div className="absolute bottom-2 left-2 z-20 text-white font-bold text-sm leading-tight max-w-[90%]">{latestNews.headline}</div>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{latestNews.body}</p>
                        <Button size="sm" variant="ghost" className="mt-2 text-emerald-400 p-0 h-auto hover:bg-transparent hover:text-white" onClick={() => onHeadlineClick(latestNews)}>Read Full Story →</Button>
                    </div>
                )}
                <div className="space-y-3">
                    {curatedNews.slice(1).map((item, i) => (
                        <div key={item.id} className="flex gap-3 items-start cursor-pointer hover:bg-slate-800 p-2 rounded transition-colors group" onClick={() => onHeadlineClick(item)}>
                            <Newspaper size={16} className={`mt-0.5 shrink-0 group-hover:text-emerald-400 ${item.dramaScore && item.dramaScore > 80 ? 'text-red-400 animate-pulse' : 'text-slate-500'}`} />
                            <div>
                                <p className="text-sm text-slate-300 leading-snug group-hover:text-white line-clamp-2">{item.headline}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    </div>
  );
};
