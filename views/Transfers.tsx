
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Player, Position } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Crest } from '../components/Crest';
import { NATIONALITIES } from '../constants';
import { Search, Lock, Unlock, Sparkles, Tag, Banknote, Zap, Heart } from 'lucide-react';
import { isTransferWindowOpen } from '../utils/engine';

interface Props {
  onPlayerClick: (id: string) => void;
}

export const Transfers: React.FC<Props> = ({ onPlayerClick }) => {
  const { gameState, actions } = useGame();
  const [filterPos, setFilterPos] = useState<Position | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<'free' | 'listed'>('free');
  
  // Smart Filters
  const [showBargains, setShowBargains] = useState(false);
  const [showWonderkids, setShowWonderkids] = useState(false);
  const [showReleaseClauses, setShowReleaseClauses] = useState(false);

  if (!gameState || !gameState.userTeamId) return null;
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId)!;

  const getFlag = (code: string) => NATIONALITIES.find(n => n.code === code)?.flag || '🏳️';
  
  const freeAgents = gameState.players.filter(p => p.teamId === 'free_agent');
  const transferListed = gameState.transferList 
      ? gameState.players.filter(p => gameState.transferList.includes(p.id) && p.teamId !== userTeam.id) 
      : [];

  let displayedPlayers = activeTab === 'free' ? freeAgents : transferListed;

  // Apply Smart Filters (Overrides tab if active)
  if (showBargains || showWonderkids || showReleaseClauses) {
      // Search global if filters active? Or just current list? 
      // Design usually implies searching the market. Let's search all players not in user team.
      displayedPlayers = gameState.players.filter(p => p.teamId !== userTeam.id && p.teamId !== 'free_agent');
      
      if (showBargains) {
          displayedPlayers = displayedPlayers.filter(p => p.value > 0 && p.teamId !== 'free_agent' && (p.value * 0.8) > (p.releaseClause || p.value)); // Simple bargain logic
      }
      if (showWonderkids) {
          displayedPlayers = displayedPlayers.filter(p => p.age <= 21 && p.potential >= 80);
      }
      if (showReleaseClauses) {
          displayedPlayers = displayedPlayers.filter(p => p.releaseClause && p.releaseClause < p.value * 1.2); // Affordable clauses
      }
      // Limit to avoid lag if too many
      displayedPlayers = displayedPlayers.slice(0, 50);
  }

  const filteredPlayers = displayedPlayers.filter(p => filterPos === 'ALL' || p.position === filterPos);

  const windowOpen = isTransferWindowOpen(gameState.currentWeek);

  const getCost = (p: Player) => {
      if (p.teamId === 'free_agent') return p.value;
      if (showReleaseClauses && p.releaseClause) return p.releaseClause;
      return Math.round(p.value * 1.2 * 10) / 10;
  };

  const toggleSmartFilter = (filter: 'bargain'|'wonderkid'|'clause') => {
      if (filter === 'bargain') { setShowBargains(!showBargains); setShowWonderkids(false); setShowReleaseClauses(false); }
      if (filter === 'wonderkid') { setShowWonderkids(!showWonderkids); setShowBargains(false); setShowReleaseClauses(false); }
      if (filter === 'clause') { setShowReleaseClauses(!showReleaseClauses); setShowBargains(false); setShowWonderkids(false); }
      
      // If turning off, revert to default view (free agents)
      if ((filter === 'bargain' && showBargains) || (filter === 'wonderkid' && showWonderkids) || (filter === 'clause' && showReleaseClauses)) {
          setActiveTab('free');
      }
  };

  const PlayerRow: React.FC<{ player: Player }> = ({ player }) => {
      const cost = getCost(player);
      const canAfford = userTeam.budget >= cost;
      const team = player.teamId === 'free_agent' ? null : gameState.teams.find(t => t.id === player.teamId);
      const isFree = player.teamId === 'free_agent';
      // const isSignable = isFree || windowOpen || (player.releaseClause && canAfford);

      return (
          <div className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded mb-2 hover:bg-slate-800 transition-colors group">
              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => onPlayerClick(player.id)}>
                   <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${player.position === Position.GK ? 'bg-yellow-900 text-yellow-400' : 'bg-slate-700 text-slate-300'}`}>
                       {player.position}
                   </div>
                   <div>
                       <div className="font-bold text-white group-hover:text-emerald-400 flex items-center gap-2">
                           {player.name}
                           {player.traits.includes('Super Sub') && <Zap size={12} className="text-yellow-400 fill-current" title="Super Sub"/>}
                           {player.isFanFavorite && <Heart size={12} className="text-red-400 fill-current" title="Fan Favorite (High Charisma)"/>}
                           {player.age <= 21 && player.potential >= 80 && <Sparkles size={12} className="text-purple-400" title="Wonderkid"/>}
                       </div>
                       <div className="text-xs text-slate-500 flex items-center gap-2">
                           <span>{player.age} yo</span>
                           <span>{getFlag(player.nationality)}</span>
                           {team && <span className="flex items-center gap-1 text-slate-400"><Crest team={team} size="sm" className="w-3 h-3"/> {team.name}</span>}
                       </div>
                   </div>
              </div>
              
              <div className="flex items-center gap-6 mr-4">
                   <div className="text-center w-12">
                       <div className="text-xl font-sport font-bold text-white">{player.stats.ovr}</div>
                       <div className="text-[9px] text-slate-500 uppercase font-bold">OVR</div>
                   </div>
                   <div className="text-right w-24">
                       <div className="text-emerald-400 font-mono font-bold">€{cost}M</div>
                       <div className="text-[9px] text-slate-500 uppercase font-bold">{player.releaseClause && showReleaseClauses ? 'Clause' : 'Cost'}</div>
                   </div>
              </div>

              <Button 
                size="sm" 
                disabled={!canAfford || !windowOpen} 
                onClick={() => actions.signPlayer(player.id)}
                className={canAfford && windowOpen ? 'bg-emerald-600 hover:bg-emerald-500' : 'opacity-50 cursor-not-allowed bg-slate-700'}
                title={!windowOpen ? "Transfer Window Closed" : !canAfford ? "Insufficient Funds" : "Sign Player"}
              >
                  {!windowOpen ? <Lock size={12}/> : canAfford ? 'Sign' : 'No Funds'}
              </Button>
          </div>
      );
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <h2 className="text-3xl font-sport text-white">Transfer Market</h2>
             <div className="flex gap-4 items-center">
                 <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded border ${windowOpen ? 'text-emerald-400 border-emerald-500/50 bg-emerald-900/20' : 'text-red-400 border-red-500/50 bg-red-900/20'}`}>
                     {windowOpen ? <Unlock size={14}/> : <Lock size={14}/>}
                     {windowOpen ? 'Window OPEN' : 'Window CLOSED'}
                 </div>
                 <div className="bg-slate-900 px-4 py-2 rounded border border-slate-800 text-emerald-400 font-mono font-bold">
                     Budget: €{userTeam.budget.toFixed(2)}M
                 </div>
             </div>
        </div>

        {/* Tab / Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between border-b border-slate-800 pb-2 gap-4">
            <div className="flex gap-2">
                <button onClick={() => { setActiveTab('free'); setShowBargains(false); setShowWonderkids(false); setShowReleaseClauses(false); }} className={`px-4 py-2 font-bold transition-colors ${activeTab === 'free' && !showBargains && !showWonderkids && !showReleaseClauses ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}`}>
                    Free Agents
                </button>
                <button onClick={() => { setActiveTab('listed'); setShowBargains(false); setShowWonderkids(false); setShowReleaseClauses(false); }} className={`px-4 py-2 font-bold transition-colors ${activeTab === 'listed' && !showBargains && !showWonderkids && !showReleaseClauses ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}>
                    Transfer List
                </button>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => toggleSmartFilter('wonderkid')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors ${showWonderkids ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                    <Sparkles size={14}/> Wonderkids
                </button>
                <button 
                    onClick={() => toggleSmartFilter('bargain')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors ${showBargains ? 'bg-yellow-600 border-yellow-500 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                    <Tag size={14}/> Bargains
                </button>
                <button 
                    onClick={() => toggleSmartFilter('clause')}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold border transition-colors ${showReleaseClauses ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                >
                    <Banknote size={14}/> Release Clauses
                </button>
            </div>
        </div>

        <Card className="min-h-[500px]">
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    {['ALL', Position.GK, Position.DEF, Position.MID, Position.FWD].map(p => (
                        <button 
                            key={p} 
                            onClick={() => setFilterPos(p as any)}
                            className={`px-3 py-1 rounded text-xs font-bold ${filterPos === p ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-500 hover:text-slate-300'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <div className="text-xs text-slate-500 italic">
                    {filteredPlayers.length} players found
                </div>
            </div>

            <div className="space-y-1 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredPlayers.length > 0 ? (
                    filteredPlayers.map(p => <PlayerRow key={p.id} player={p} />)
                ) : (
                    <div className="text-center py-20 text-slate-500">
                        <Search size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>No players found matching criteria.</p>
                    </div>
                )}
            </div>
        </Card>
    </div>
  );
};