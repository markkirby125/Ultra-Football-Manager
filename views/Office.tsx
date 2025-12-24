
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Coins, Briefcase, ThumbsUp, Users, Star, MapPin, Heart, Repeat, TrendingUp, TrendingDown, BadgeCheck, UserCog, Search, Sparkles, DollarSign, Brain, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCompactNumber } from '../utils/engine';
import { AssistantManager, AutoSubMode } from '../types';
import { NATIONALITIES } from '../constants';
import { Crest } from '../components/Crest';

interface Props {
  onOpenStadium: () => void;
  initialTab?: 'overview' | 'staff';
}

export const Office: React.FC<Props> = ({ onOpenStadium, initialTab = 'overview' }) => {
  const { gameState, actions } = useGame();
  const [activeTab, setActiveTab] = useState<'overview' | 'staff'>(initialTab);
  
  React.useEffect(() => {
      if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  
  if (!gameState || !gameState.userTeamId) return null;
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;
  const manager = gameState.managers.find(m => m.id === userTeam.managerId)!;
  const candidates = gameState.assistantCandidates || [];
  const pendingOffers = gameState.pendingOffers || [];

  const weeklyWages = gameState.players
      .filter(p => p.teamId === userTeam.id)
      .reduce((sum, p) => sum + p.wage, 0);

  const getApprovalColor = (val: number) => {
      if (val >= 80) return 'text-emerald-400';
      if (val >= 50) return 'text-yellow-400';
      return 'text-red-400';
  };

  const getBarColor = (val: number) => {
      if (val >= 80) return 'bg-emerald-500';
      if (val >= 50) return 'bg-yellow-500';
      return 'bg-red-500';
  };
  
  const getWellbeingIcon = (val: number) => {
      if (val >= 90) return '🔋';
      if (val >= 50) return '🙂';
      if (val >= 20) return '😵‍💫';
      return '💀';
  };

  const getFanFeedback = () => {
      const { fans } = manager.approval;
      if (fans >= 90) return "The city is buzzing! You are a local hero.";
      if (fans >= 80) return "Supporters are singing your name in the stands.";
      if (fans >= 60) return "Fans are generally content but want more flair.";
      if (fans >= 40) return "Social media is grumbling about recent performances.";
      if (fans >= 20) return "The atmosphere at the stadium is toxic.";
      return "Protests are being organized outside the training ground.";
  };

  const getBoardFeedback = () => {
      const { board } = manager.approval;
      if (board >= 90) return "The Chairman is preparing a contract extension offer.";
      if (board >= 75) return "Your job security is rock solid.";
      if (board >= 50) return "Meeting expectations, but the board is watching.";
      if (board >= 30) return "The board demands an explanation for recent results.";
      return "You are one loss away from being sacked.";
  };

  const getFlag = (code: string) => NATIONALITIES.find(n => n.code === code)?.flag || '🏳️';

  // Financial Helpers
  const lastRev = userTeam.financials?.lastRevenue || 0;
  const lastExp = userTeam.financials?.lastExpenses || 0;
  const lastProfit = lastRev - lastExp;
  const breakdown = userTeam.financials?.breakdown || { wages: 0, transfers: 0, academy: 0, facilities: 0, matchday: 0 };

  const toggleAssistant = (key: keyof typeof userTeam.assistantSettings) => {
      if (!userTeam) return;
      const newSettings = { ...userTeam.assistantSettings, [key]: !userTeam.assistantSettings[key] };
      actions.updateAssistantSettings(newSettings);
  };

  const setAutoSubMode = (mode: AutoSubMode) => {
      if (!userTeam) return;
      const newSettings = { ...userTeam.assistantSettings, autoSubsMode: mode };
      actions.updateAssistantSettings(newSettings);
  };

  const AttributeBar = ({ label, val }: { label: string, val: number }) => (
      <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-bold">{label}</span>
              <span className={`font-mono font-bold ${val >= 15 ? 'text-emerald-400' : 'text-white'}`}>{val}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${val >= 15 ? 'bg-emerald-500' : val >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${(val/20)*100}%` }}></div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center gap-3">
                <h2 className="text-3xl font-sport text-white">Manager's Office</h2>
                {pendingOffers.length > 0 && (
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        {pendingOffers.length} New Offer{pendingOffers.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setActiveTab('overview')} 
                    className={`px-4 py-2 font-bold transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}`}
                >
                    <Briefcase size={16}/> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('staff')} 
                    className={`px-4 py-2 font-bold transition-colors flex items-center gap-2 ${activeTab === 'staff' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}`}
                >
                    <UserCog size={16}/> Staff
                </button>
            </div>
        </div>

        {/* Inbox / Offers Section - Always visible if offers exist */}
        {pendingOffers.length > 0 && (
            <Card title="Inbox (Action Required)" className="border-l-4 border-l-yellow-500 shadow-yellow-900/10">
                <div className="space-y-3">
                    {pendingOffers.map(offer => {
                        const player = gameState.players.find(p => p.id === offer.playerId);
                        const team = gameState.teams.find(t => t.id === offer.offeringTeamId);
                        if (!player || !team) return null;

                        return (
                            <div key={offer.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-left-2">
                                {/* Details */}
                                <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                                    {/* Bidder */}
                                    <div className="flex items-center gap-3">
                                        <Crest team={team} size="md" />
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Bidder</div>
                                            <div className="text-white font-bold">{team.name}</div>
                                        </div>
                                    </div>
                                    <div className="h-10 w-px bg-slate-800 hidden md:block"></div>
                                    {/* Target */}
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Target Player</div>
                                        <div className="text-white font-bold flex items-center gap-2">
                                            <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-bold">{player.position}</span>
                                            {player.name}
                                        </div>
                                    </div>
                                </div>

                                {/* Offer & Action */}
                                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                                    <div className="text-right">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Transfer Fee</div>
                                        <div className="text-2xl font-mono text-emerald-400 font-bold flex items-center gap-1 justify-end">
                                            €{offer.offerAmount.toFixed(1)}M
                                        </div>
                                        <div className="text-[10px] text-slate-400 italic">Market Value: €{player.value}M</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="danger" onClick={() => actions.respondToOffer(offer.id, false)}>Reject</Button>
                                        <Button size="sm" variant="primary" className="flex items-center gap-1" onClick={() => actions.respondToOffer(offer.id, true)}>
                                            <DollarSign size={14}/> Accept
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>
        )}

        {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                {/* Manager Card (Left Col) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="relative bg-gradient-to-br from-yellow-700 via-yellow-600 to-yellow-800 rounded-xl p-1 shadow-2xl border-4 border-yellow-500/50 aspect-[3/4] max-w-[300px] mx-auto transform hover:scale-105 transition-transform duration-300">
                        {/* Card Inner */}
                        <div className="bg-slate-900 h-full w-full rounded-lg overflow-hidden relative flex flex-col items-center pt-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                            <div className="absolute top-4 left-4 text-yellow-500 font-sport font-bold text-5xl drop-shadow-lg">{Math.round(manager.rating)}</div>
                            <div className="absolute top-16 left-5 text-yellow-200/80 font-bold uppercase text-sm tracking-widest">OVR</div>
                            
                            <div className="w-32 h-32 bg-slate-800 rounded-full border-4 border-yellow-500 shadow-lg mb-6 overflow-hidden flex items-center justify-center">
                                <Briefcase size={64} className="text-yellow-500" />
                            </div>
                            
                            <div className="text-center w-full px-4 mb-6">
                                <h3 className="text-2xl font-sport font-bold text-white mb-1 flex items-center justify-center gap-2">
                                    {manager.name} 
                                    {manager.followers > 100000 && <BadgeCheck size={20} className="text-blue-400 fill-current" />}
                                </h3>
                                <div className="text-yellow-400 font-bold uppercase tracking-wider text-sm border-t border-b border-yellow-500/30 py-1">{manager.style}</div>
                                <div className="flex justify-center gap-4 mt-2 text-xs text-slate-400 font-bold">
                                    <span>{formatCompactNumber(manager.followers || 0)} Followers</span>
                                    <span>{formatCompactNumber(manager.following || 0)} Following</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 w-full px-8 mb-4">
                                <div className="flex justify-between text-yellow-200 font-mono font-bold"><span className="text-slate-500">WON</span> {manager.stats.won}</div>
                                <div className="flex justify-between text-yellow-200 font-mono font-bold"><span className="text-slate-500">DRN</span> {manager.stats.drawn}</div>
                                <div className="flex justify-between text-yellow-200 font-mono font-bold"><span className="text-slate-500">LST</span> {manager.stats.lost}</div>
                                <div className="flex justify-between text-yellow-200 font-mono font-bold"><span className="text-slate-500">WIN</span> {manager.stats.won + manager.stats.drawn + manager.stats.lost > 0 ? Math.round((manager.stats.won / (manager.stats.won + manager.stats.drawn + manager.stats.lost))*100) : 0}%</div>
                            </div>
                            
                            {/* NEW: Tactical Aptitude Display */}
                            <div className="w-full px-8 mb-4">
                                <div className="flex justify-between text-yellow-200 font-mono font-bold text-xs border-t border-slate-700 pt-2">
                                    <span className="text-slate-500 flex items-center gap-1"><Brain size={12}/> APTITUDE</span> 
                                    <span className={manager.tacticalAptitude && manager.tacticalAptitude > 15 ? "text-emerald-400" : "text-white"}>{Math.round(manager.tacticalAptitude || 10)}</span>
                                </div>
                            </div>

                            <div className="mt-auto w-full bg-yellow-600 py-2 flex justify-center items-center gap-2">
                                <Star size={16} className="text-yellow-900 fill-current" />
                                <span className="text-yellow-900 font-bold text-xs uppercase tracking-[0.2em]">Director Item</span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Widget */}
                    <Card title="Social Feed" className="max-h-[500px] overflow-hidden flex flex-col">
                        <div className="bg-slate-950 p-3 mb-2 rounded border border-slate-800 flex justify-between items-center">
                             <div className="text-xs text-slate-500 uppercase font-bold">Mental Health</div>
                             <div className="flex items-center gap-2">
                                 <span className="text-xl">{getWellbeingIcon(manager.mentalHealth)}</span>
                                 <span className="font-bold text-white">{manager.mentalHealth}%</span>
                             </div>
                        </div>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                            {manager.socialFeed.length > 0 ? manager.socialFeed.map(post => (
                                <div key={post.id} className={`p-3 rounded-xl shadow-sm border text-sm ${post.type === 'stalker' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white text-slate-900 border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-xs flex items-center gap-1">
                                            {post.authorHandle}
                                            {post.contextTag && <span className="bg-slate-200 text-slate-600 px-1.5 rounded-full text-[9px] font-normal uppercase tracking-wide">{post.contextTag}</span>}
                                        </div>
                                        <div className="text-[10px] text-slate-400">Wk {post.timestamp}</div>
                                    </div>
                                    <p className={`mb-2 leading-tight ${post.type === 'stalker' ? 'font-serif italic' : ''}`}>{post.content}</p>
                                    <div className="flex gap-4 text-xs text-slate-500 font-bold">
                                        <span className="flex items-center gap-1"><Heart size={10} className={post.type === 'praise' ? 'text-red-500 fill-current' : ''}/> {formatCompactNumber(post.likes)}</span>
                                        <span className="flex items-center gap-1"><Repeat size={10}/> {formatCompactNumber(post.shares)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center text-slate-500 italic py-4">Your feed is quiet... for now.</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Content (Right Cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Approval Ratings with Narrative */}
                    <Card title="Job Security">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><Briefcase size={16}/> Board Confidence</span>
                                    <span className={`text-2xl font-mono font-bold ${getApprovalColor(manager.approval.board)}`}>{manager.approval.board}%</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${getBarColor(manager.approval.board)} transition-all duration-500`} style={{ width: `${manager.approval.board}%` }}></div>
                                </div>
                                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs italic text-slate-400">
                                    "{getBoardFeedback()}"
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-300 flex items-center gap-2"><ThumbsUp size={16}/> Fan Support</span>
                                    <span className={`text-2xl font-mono font-bold ${getApprovalColor(manager.approval.fans)}`}>{manager.approval.fans}%</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${getBarColor(manager.approval.fans)} transition-all duration-500`} style={{ width: `${manager.approval.fans}%` }}></div>
                                </div>
                                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs italic text-slate-400">
                                    "{getFanFeedback()}"
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Financials */}
                    <Card title="Financial Ledger">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-900/30 rounded text-emerald-400"><Coins size={20}/></div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Transfer Budget</div>
                                        <div className="text-xl font-mono text-white">€{userTeam.budget.toFixed(2)}M</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-950/30 p-4 rounded border border-slate-800">
                                <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 border-b border-slate-700 pb-2">Last Week's Summary</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-[10px] text-slate-400 mb-1">Revenue</div>
                                        <div className="text-emerald-400 font-mono font-bold text-lg flex items-center gap-1">
                                            <TrendingUp size={14}/> €{lastRev.toFixed(2)}M
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 mb-1">Expenses</div>
                                        <div className="text-red-400 font-mono font-bold text-lg flex items-center gap-1">
                                            <TrendingDown size={14}/> €{lastExp.toFixed(2)}M
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-slate-400 mb-1">Net Profit</div>
                                        <div className={`font-mono font-bold text-lg ${lastProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {lastProfit >= 0 ? '+' : ''}€{lastProfit.toFixed(2)}M
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Detailed Breakdown Table */}
                                <div className="mt-4 pt-2 border-t border-slate-700">
                                    <table className="w-full text-xs">
                                        <tbody className="divide-y divide-slate-800 text-slate-300">
                                            {breakdown.wages > 0 && (
                                                <tr><td className="py-1">Staff & Player Wages</td><td className="text-right text-red-300">-€{breakdown.wages.toFixed(2)}M</td></tr>
                                            )}
                                            {breakdown.transfers > 0 && (
                                                <tr><td className="py-1">Transfer Fees</td><td className="text-right text-red-300">-€{breakdown.transfers.toFixed(2)}M</td></tr>
                                            )}
                                            {breakdown.academy > 0 && (
                                                <tr><td className="py-1">Academy Costs</td><td className="text-right text-red-300">-€{breakdown.academy.toFixed(2)}M</td></tr>
                                            )}
                                            {breakdown.facilities > 0 && (
                                                <tr><td className="py-1">Facility Upgrades</td><td className="text-right text-red-300">-€{breakdown.facilities.toFixed(2)}M</td></tr>
                                            )}
                                            {breakdown.matchday > 0 && (
                                                <tr><td className="py-1">Matchday Income</td><td className="text-right text-emerald-300">+€{breakdown.matchday.toFixed(2)}M</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-900/30 rounded text-blue-400"><Users size={20}/></div>
                                    <div>
                                        <div className="text-xs text-slate-500 uppercase font-bold">Weekly Wages</div>
                                        <div className="text-xl font-mono text-white">€{weeklyWages}k</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Club Info */}
                    <Card title="Club Identity">
                         <div className="grid grid-cols-2 gap-4 text-sm">
                             <div>
                                 <div className="text-slate-500 mb-1">Full Club Name</div>
                                 <div className="text-white font-bold text-lg">{userTeam.name}</div>
                             </div>
                             <div>
                                 <div className="text-slate-500 mb-1">Founded</div>
                                 <div className="text-white font-mono">1902 (Est)</div>
                             </div>
                             <div className="col-span-1 cursor-pointer hover:bg-slate-800 rounded p-1 -ml-1 transition-colors" onClick={onOpenStadium}>
                                 <div className="text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12}/> Stadium (Click to view)</div>
                                 <div className="text-emerald-400 underline decoration-slate-600 underline-offset-4 font-bold">{userTeam.stadium.name}</div>
                             </div>
                             <div>
                                 <div className="text-slate-500 mb-1">Primary Color</div>
                                 <div className="flex items-center gap-2">
                                     <div className="w-4 h-4 rounded border border-white/20" style={{background: userTeam.colors[0]}}></div>
                                     <span className="font-mono">{userTeam.colors[0]}</span>
                                 </div>
                             </div>
                         </div>
                    </Card>
                </div>
            </div>
        ) : (
            <div className="animate-in fade-in">
                {userTeam.assistant ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Assistant Profile */}
                        <div className="lg:col-span-1">
                            <Card className="border-t-4 border-t-purple-500">
                                <div className="flex flex-col items-center text-center p-4">
                                    <div className="w-24 h-24 bg-purple-900 rounded-full flex items-center justify-center text-3xl mb-4 border-4 border-purple-700 shadow-lg">
                                        👨‍💼
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{userTeam.assistant.name}</h3>
                                    <div className="text-purple-400 font-bold uppercase text-xs tracking-widest mb-1">Assistant Manager</div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
                                        <span>{userTeam.assistant.age} Years Old</span>
                                        <span>•</span>
                                        <span>{getFlag(userTeam.assistant.nationality)}</span>
                                    </div>
                                    
                                    <div className="flex gap-1 mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} className={i < Math.round(userTeam.assistant!.quality / 20) ? "text-yellow-400 fill-current" : "text-slate-700"} />
                                        ))}
                                    </div>

                                    <Button variant="danger" size="sm" onClick={() => { if(confirm('Are you sure you want to terminate their contract?')) actions.fireAssistant(); }}>
                                        Fire Assistant
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Stats & Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card title="Staff Attributes">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <AttributeBar label="Man Management" val={userTeam.assistant.manManagement} />
                                        <AttributeBar label="Motivation" val={userTeam.assistant.motivation} />
                                        <p className="text-xs text-slate-500 mt-2 italic">Impacts team talk effectiveness and morale recovery.</p>
                                    </div>
                                    <div>
                                        <AttributeBar label="Tactical Knowledge" val={userTeam.assistant.tacticalKnowledge} />
                                        <AttributeBar label="Judging Ability" val={userTeam.assistant.judgingAbility} />
                                        <p className="text-xs text-slate-500 mt-2 italic">Impacts auto-substitutions and reactive tactics.</p>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Assistant Manager Authority (Live Match)">
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-400 italic">
                                        Delegate match-day responsibilities based on your assistant's attributes.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800">
                                            <div>
                                                <div className="text-sm font-bold text-white">Auto Substitutions</div>
                                                <div className="text-xs text-slate-500">Handle tired/poor players</div>
                                            </div>
                                            <select 
                                                value={userTeam.assistantSettings.autoSubsMode}
                                                onChange={(e) => setAutoSubMode(e.target.value as AutoSubMode)}
                                                className="bg-slate-800 border border-slate-700 rounded text-xs font-bold px-2 py-1 text-white outline-none focus:border-emerald-500"
                                            >
                                                <option value="off">Manual</option>
                                                <option value="basic">Basic</option>
                                                <option value="auto">Auto</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800">
                                            <div>
                                                <div className="text-sm font-bold text-white">Reactive Tactics</div>
                                                <div className="text-xs text-slate-500">Adjust on red cards</div>
                                            </div>
                                            <button onClick={() => toggleAssistant('autoTactics')} className="text-2xl transition-colors text-slate-500 hover:text-white">
                                                {userTeam.assistantSettings.autoTactics ? <ToggleRight className="text-emerald-500" size={32}/> : <ToggleLeft size={32}/>}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800">
                                            <div>
                                                <div className="text-sm font-bold text-white">Opp. Instructions</div>
                                                <div className="text-xs text-slate-500">Set marking instructions</div>
                                            </div>
                                            <button onClick={() => toggleAssistant('autoOppInstructions')} className="text-2xl transition-colors text-slate-500 hover:text-white">
                                                {userTeam.assistantSettings.autoOppInstructions ? <ToggleRight className="text-emerald-500" size={32}/> : <ToggleLeft size={32}/>}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded bg-slate-900 border border-slate-800">
                                            <div>
                                                <div className="text-sm font-bold text-white">Delegate Talks</div>
                                                <div className="text-xs text-slate-500">Handle team talks</div>
                                            </div>
                                            <button onClick={() => toggleAssistant('autoTalks')} className="text-2xl transition-colors text-slate-500 hover:text-white">
                                                {userTeam.assistantSettings.autoTalks ? <ToggleRight className="text-emerald-500" size={32}/> : <ToggleLeft size={32}/>}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs text-slate-500">
                                         <div>Judging: <span className={userTeam.assistant!.judgingAbility >= 14 ? "text-emerald-400" : "text-yellow-500"}>{userTeam.assistant!.judgingAbility >= 14 ? 'Reliable' : 'Questionable'}</span></div>
                                         <div>Tactics: <span className={userTeam.assistant!.tacticalKnowledge >= 13 ? "text-emerald-400" : "text-yellow-500"}>{userTeam.assistant!.tacticalKnowledge >= 13 ? 'Sharp' : 'Basic'}</span></div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center">
                            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                <UserCog size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Staff Vacancy</h3>
                            <p className="text-slate-400 max-w-md mx-auto mb-6">
                                You currently have no Assistant Manager. Hire one to unlock features like auto-substitutions, opposition instructions, and team talk delegation.
                            </p>
                        </div>

                        {candidates.length > 0 ? (
                            <Card title="Available Candidates">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-slate-300">
                                        <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="p-3">Name</th>
                                                <th className="p-3 text-center">Age</th>
                                                <th className="p-3 text-center">Tactical</th>
                                                <th className="p-3 text-center">Man Mgmt</th>
                                                <th className="p-3 text-center">Judging</th>
                                                <th className="p-3 text-center">Quality</th>
                                                <th className="p-3 text-right">Fee</th>
                                                <th className="p-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800">
                                            {candidates.map(c => {
                                                const isTooGood = c.quality > (userTeam.rating + 10);
                                                const canAfford = userTeam.budget >= c.salary;
                                                
                                                return (
                                                    <tr key={c.id} className="hover:bg-slate-800/50">
                                                        <td className="p-3 font-bold text-white flex items-center gap-2">
                                                            <span>{getFlag(c.nationality)}</span>
                                                            {c.name}
                                                        </td>
                                                        <td className="p-3 text-center">{c.age}</td>
                                                        <td className={`p-3 text-center font-mono ${c.tacticalKnowledge >= 15 ? 'text-emerald-400' : ''}`}>{c.tacticalKnowledge}</td>
                                                        <td className={`p-3 text-center font-mono ${c.manManagement >= 15 ? 'text-emerald-400' : ''}`}>{c.manManagement}</td>
                                                        <td className={`p-3 text-center font-mono ${c.judgingAbility >= 15 ? 'text-emerald-400' : ''}`}>{c.judgingAbility}</td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex justify-center gap-0.5">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={10} className={i < Math.round(c.quality / 20) ? "text-yellow-400 fill-current" : "text-slate-700"} />
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right font-mono text-emerald-400">€{c.salary.toFixed(2)}M</td>
                                                        <td className="p-3 text-right">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => actions.hireAssistant(c)} 
                                                                disabled={!canAfford || isTooGood}
                                                                className={isTooGood ? "opacity-50 cursor-not-allowed bg-slate-700 text-slate-400 border-slate-600" : ""}
                                                                title={isTooGood ? "Candidate considers this role below their level." : !canAfford ? "Insufficient Funds" : "Hire Assistant"}
                                                            >
                                                                {isTooGood ? 'Refused' : 'Hire'}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            <div className="text-center text-slate-500 py-4">Checking market for candidates...</div>
                        )}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};
