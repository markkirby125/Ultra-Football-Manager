
import React from 'react';
import { Team, Player, Manager } from '../types';
import { Crest } from './Crest';
import { Users, MapPin, Calendar, Briefcase, Flame, TrendingUp, Target, Heart, Brain } from 'lucide-react';

interface Props {
  team: Team;
  manager?: Manager;
  players: Player[];
  rival?: Team;
  onClose: () => void;
  onPlayerClick: (id: string) => void;
}

export const TeamDetailModal: React.FC<Props> = ({ team, manager, players, rival, onClose, onPlayerClick }) => {
  const sortedSquad = players.sort((a,b) => b.stats.ovr - a.stats.ovr);

  // Big Three Analysis
  const topScorer = [...players].sort((a,b) => b.statsSeason.goals - a.statsSeason.goals)[0];
  const topAssister = [...players].sort((a,b) => b.statsSeason.assists - a.statsSeason.assists)[0];
  const highestRated = [...players].sort((a,b) => (b.statsSeason.ratingSum/Math.max(1, b.statsSeason.apps)) - (a.statsSeason.ratingSum/Math.max(1, a.statsSeason.apps)))[0];

  // Locker Room Atmosphere
  const avgCondition = Math.round(players.reduce((a,b) => a + b.condition, 0) / players.length);
  const avgMorale = Math.round(players.reduce((a,b) => a + b.morale, 0) / players.length);
  const fanApproval = manager?.approval.fans || 50;
  
  const getMentalHealthIcon = (val: number) => {
      if (val >= 90) return '🧠'; // Strong
      if (val >= 50) return '🙂'; // Okay
      if (val >= 30) return '😟'; // Worried
      return '💔'; // Broken
  };

  const BigThreeCard = ({ label, player, stat }: any) => (
      <div className="bg-slate-950 p-3 rounded border border-slate-800 flex items-center gap-3 cursor-pointer hover:border-emerald-500/50" onClick={() => onPlayerClick(player.id)}>
          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-lg text-slate-600">
              {player.name.charAt(0)}
          </div>
          <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">{label}</div>
              <div className="font-bold text-white leading-tight">{player.name}</div>
              <div className="text-xs text-emerald-400 font-mono">{stat}</div>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[65] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl flex flex-col lg:flex-row" onClick={e => e.stopPropagation()}>
            {/* Sidebar Identity */}
            <div className="w-full lg:w-80 bg-slate-950 p-8 flex flex-col items-center border-r border-slate-800 relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})` }}></div>
                <Crest team={team} size="xl" className="mb-6 z-10" />
                <h1 className="text-3xl font-sport text-center text-white mb-2 z-10">{team.name}</h1>
                <div className="text-emerald-400 font-bold text-sm mb-6 z-10">{team.rating} OVR</div>

                <div className="w-full space-y-4 z-10">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                            <Briefcase size={16} className="text-slate-500" />
                            <span>{manager?.name || 'Vacant'}</span>
                        </div>
                        {manager && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 ml-7">
                                <span title="Mental Health">{getMentalHealthIcon(manager.mentalHealth)}</span>
                                <span>{manager.mentalHealth}% Mental Health</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <MapPin size={16} className="text-slate-500" />
                        <div>
                            <div>{team.stadium.name}</div>
                            <div className="text-xs text-slate-500">{team.stadium.capacity.toLocaleString()} Capacity</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Calendar size={16} className="text-slate-500" />
                        <span>Est. {team.foundedYear}</span>
                    </div>
                </div>

                {rival && (
                    <div className="mt-8 w-full bg-red-900/20 border border-red-500/30 p-4 rounded text-center z-10">
                        <div className="flex items-center justify-center gap-2 text-red-400 font-bold uppercase text-xs mb-2">
                            <Flame size={14} /> Local Rival
                        </div>
                        <div className="font-bold text-white">{rival.name}</div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 bg-slate-900 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-sport text-white">Club Dashboard</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
                </div>

                {/* Dashboard Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* The Big Three */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Target size={14}/> Key Performers</h3>
                        <div className="grid grid-cols-1 gap-2">
                            <BigThreeCard label="Top Scorer" player={topScorer} stat={`${topScorer.statsSeason.goals} Goals`} />
                            <BigThreeCard label="Playmaker" player={topAssister} stat={`${topAssister.statsSeason.assists} Assists`} />
                            <BigThreeCard label="MVP" player={highestRated} stat={`${(highestRated.statsSeason.ratingSum / Math.max(1, highestRated.statsSeason.apps)).toFixed(2)} Rating`} />
                        </div>
                    </div>

                    {/* Atmosphere */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Heart size={14}/> Club Atmosphere</h3>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800 h-full flex flex-col justify-around">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Squad Condition</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${avgCondition > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{width: `${avgCondition}%`}}></div>
                                    </div>
                                    <span className="font-mono text-white text-sm">{avgCondition}%</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Team Morale</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${avgMorale > 80 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{width: `${avgMorale}%`}}></div>
                                    </div>
                                    <span className="font-mono text-white text-sm">{avgMorale}%</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Fan Support</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${fanApproval > 60 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{width: `${fanApproval}%`}}></div>
                                    </div>
                                    <span className="font-mono text-white text-sm">{fanApproval}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Squad List */}
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Users size={14}/> Full Roster</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {sortedSquad.map(p => (
                        <div key={p.id} 
                             className="flex items-center justify-between p-2 bg-slate-800/30 rounded hover:bg-slate-800 cursor-pointer border border-transparent hover:border-emerald-500/30 group transition-all"
                             onClick={() => onPlayerClick(p.id)}
                        >
                             <div className="flex items-center gap-3">
                                 <div className={`text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded bg-slate-700 text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors`}>
                                     {p.position}
                                 </div>
                                 <div>
                                     <div className="font-bold text-white text-sm">{p.name}</div>
                                     <div className="text-[10px] text-slate-500">{p.age}y • {p.nationality}</div>
                                 </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="text-xs text-slate-500 flex flex-col items-end">
                                    <span>{p.statsSeason.goals}G</span>
                                    <span>{p.statsSeason.assists}A</span>
                                </div>
                                <div className="text-lg font-sport font-bold text-slate-400 group-hover:text-white w-8 text-center">{p.stats.ovr}</div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
