
import React, { useState } from 'react';
import { Referee, Team } from '../types';
import { NATIONALITIES } from '../constants';
import { Card } from './Card';
import { Heart, Repeat, Calendar, Shield, Activity, Scale, Eye, BadgeCheck, Brain, MessageCircle, User } from 'lucide-react';
import { Crest } from './Crest';
import { formatCompactNumber } from '../utils/engine';

interface Props {
  referee: Referee;
  teams: Team[];
  onClose: () => void;
}

export const RefereeModal: React.FC<Props> = ({ referee, teams, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'social'>('profile');
  
  const getFlag = (code: string) => NATIONALITIES.find(n => n.code === code)?.flag || '🏳️';
  const getTeam = (id: string) => teams.find(t => t.id === id);

  const avgRating = referee.gamesOfficiated > 0 
      ? (referee.history.reduce((a, b) => a + b.rating, 0) / referee.gamesOfficiated).toFixed(1)
      : '-';

  const foulsPerGame = referee.gamesOfficiated > 0
      ? (referee.foulsCalled / referee.gamesOfficiated).toFixed(1)
      : '-';
      
  const getMentalHealthIcon = (val: number) => {
      if (val >= 90) return '🧠'; // Strong
      if (val >= 50) return '🙂'; // Okay
      if (val >= 30) return '😟'; // Worried
      return '💔'; // Broken
  };

  const recentMatches = [...referee.history].reverse().slice(0, 3);

  const StatBar = ({ label, val, max = 100, color = 'bg-blue-500', icon: Icon }: any) => (
      <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 flex items-center gap-1">{Icon && <Icon size={12}/>} {label}</span>
              <span className="text-white font-mono">{val}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${Math.min(100, (val/max)*100)}%` }}></div>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl flex flex-col lg:flex-row" onClick={e => e.stopPropagation()}>
            {/* Left Col */}
            <div className="lg:w-1/3 bg-slate-950 p-6 border-r border-slate-800">
                 <div className="flex items-center gap-3 mb-6">
                     <span className="text-4xl">{getFlag(referee.nationality)}</span>
                     <div>
                         <h2 className="text-2xl font-sport text-white leading-none">{referee.name}</h2>
                         <div className="text-slate-400 text-sm mt-1">{referee.age} Years Old • {referee.division}</div>
                         <div className="flex flex-wrap gap-1 mt-2">
                             {referee.traits.map(t => (
                                 <span key={t} className="text-[10px] uppercase bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">{t}</span>
                             ))}
                         </div>
                     </div>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                     <div className="bg-slate-900 p-3 rounded border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Avg Rating</div>
                        <div className="text-3xl font-mono text-emerald-400">{avgRating}</div>
                        <div className="text-xs text-slate-400 mt-1">/ 10.0</div>
                     </div>
                     
                     <div className="bg-slate-900 p-3 rounded border border-slate-800 flex justify-between items-center">
                        <div className="text-sm text-slate-400 flex items-center gap-2"><Brain size={14}/> Mental Health</div>
                        <div className="flex items-center gap-2">
                             <span className="text-xl">{getMentalHealthIcon(referee.mentalHealth)}</span>
                             <span className={`font-bold ${referee.mentalHealth < 40 ? 'text-red-400' : 'text-white'}`}>{referee.mentalHealth}%</span>
                        </div>
                     </div>
                 </div>

                 <div className="space-y-4 mb-6 bg-slate-900/50 p-4 rounded border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Officiating Style</h4>
                    <StatBar label="Strictness" val={referee.stats.strictness} color="bg-red-500" icon={Shield} />
                    <StatBar label="Card Avg (Y)" val={referee.stats.yellowCardAvg} max={7} color="bg-yellow-500" />
                    <StatBar label="Card Avg (R)" val={referee.stats.redCardAvg} max={0.5} color="bg-red-600" />
                    <StatBar label="Home Bias" val={Math.round((referee.stats.homeBias - 1) * 100)} max={15} color="bg-purple-500" icon={Scale} />
                    <StatBar label="VAR Accuracy" val={referee.stats.varAccuracy} color="bg-emerald-500" icon={Eye} />
                 </div>
                 
                 {/* Social Mini Profile */}
                 <div className="bg-slate-900 p-4 rounded border border-slate-800 text-center">
                     <div className="flex items-center justify-center gap-2 font-bold text-white mb-1">
                        {referee.socialHandle} 
                        {referee.followers > 10000 && <BadgeCheck size={14} className="text-blue-400 fill-current" />}
                     </div>
                     <div className="text-xs text-slate-400 mb-2">{formatCompactNumber(referee.followers || 0)} Followers</div>
                     <div className="text-[10px] text-slate-500 italic">"The man in the middle."</div>
                 </div>
            </div>

            {/* Right Col */}
            <div className="flex-1 p-6 space-y-6 bg-slate-900 overflow-y-auto flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4">
                        <button onClick={() => setActiveTab('profile')} className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'profile' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500'}`}>
                            <User size={16} /> Profile
                        </button>
                        <button onClick={() => setActiveTab('social')} className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'social' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500'}`}>
                            <MessageCircle size={16} /> Social Feed
                        </button>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
                </div>

                {activeTab === 'profile' ? (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                            {recentMatches.length === 0 ? <div className="text-slate-500 text-sm italic col-span-3">No matches yet.</div> :
                             recentMatches.map((h, i) => {
                                 const home = getTeam(h.homeTeamId);
                                 const away = getTeam(h.awayTeamId);
                                 return (
                                     <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col items-center text-center">
                                         <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Week {h.week}</div>
                                         <div className="flex justify-between w-full mb-2">
                                             <Crest team={home!} size="sm" />
                                             <span className="font-bold text-sm text-white pt-2">vs</span>
                                             <Crest team={away!} size="sm" />
                                         </div>
                                         <div className="w-full border-t border-slate-800 pt-2 flex justify-between text-xs">
                                             <span className="text-yellow-500 font-bold">{h.cards} Cards</span>
                                             <span className="text-emerald-400 font-bold">{h.rating.toFixed(1)} Rtg</span>
                                         </div>
                                     </div>
                                 )
                             })}
                        </div>
                        <Card title="Referee Guidelines">
                            <p className="text-sm text-slate-400 italic">
                                This official is known for {referee.stats.strictness > 70 ? "a zero-tolerance policy on fouls." : "letting the game flow."} 
                                {referee.stats.redCardAvg > 0.3 && " They are quick to reach for the red card."}
                                {referee.stats.varAccuracy < 80 && " VAR decisions can be inconsistent."}
                            </p>
                        </Card>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in flex-1">
                        {referee.socialFeed.length > 0 ? referee.socialFeed.map(post => (
                            <div key={post.id} className="p-4 rounded-xl shadow-sm border bg-white text-slate-900 border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-200 text-slate-500">
                                            {post.authorName[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm leading-none flex items-center gap-1">
                                                {post.authorName}
                                                {post.contextTag && <span className="bg-slate-200 text-slate-600 px-1.5 rounded-full text-[9px] font-normal uppercase tracking-wide">{post.contextTag}</span>}
                                            </div>
                                            <div className="text-slate-500 text-xs">{post.authorHandle}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400">Wk {post.timestamp}</div>
                                </div>
                                <p className="mb-3 text-sm">{post.content}</p>
                                <div className="flex gap-4 text-xs text-slate-500 font-bold">
                                    <span className="flex items-center gap-1"><Heart size={12} className={post.type === 'praise' ? 'text-red-500 fill-current' : ''}/> {formatCompactNumber(post.likes)}</span>
                                    <span className="flex items-center gap-1"><Repeat size={12}/> {formatCompactNumber(post.shares)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-500 py-12">No social activity yet.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
