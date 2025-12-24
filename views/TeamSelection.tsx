
import React, { useState, useMemo } from 'react';
import { Team, Division } from '../types';
import { Crest } from '../components/Crest';
import { Trophy, MapPin, Coins, ArrowUpDown, Search, Filter } from 'lucide-react';
import { useGame } from '../context/GameContext';

interface Props {
  onSelectTeam: (id: string) => void;
}

export const TeamSelection: React.FC<Props> = ({ onSelectTeam }) => {
  const { gameState } = useGame();
  const [activeDivision, setActiveDivision] = useState<Division>(Division.First);
  const [activeCountry, setActiveCountry] = useState<string>('ENG');
  const [sortBy, setSortBy] = useState<'rating' | 'budget' | 'name'>('rating');
  const [searchQuery, setSearchQuery] = useState('');

  if (!gameState) return null;

  const filteredTeams = useMemo(() => {
    return gameState.teams
      .filter(t => t.country === activeCountry && t.division === activeDivision)
      .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'budget') return b.budget - a.budget;
        return a.name.localeCompare(b.name);
      });
  }, [gameState.teams, activeDivision, activeCountry, sortBy, searchQuery]);

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]';
    if (rating >= 75) return 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    return 'bg-slate-600 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-12 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-6xl font-sport text-white mb-2 tracking-wide drop-shadow-2xl">Select Your Club</h1>
          <p className="text-slate-400 text-lg uppercase tracking-widest font-bold">Season 2025/26 • Choose Your Destiny</p>
        </div>

        {/* Country Selector */}
        <div className="flex justify-center mb-6 overflow-x-auto pb-2">
            <div className="flex bg-slate-900 p-2 rounded-xl border border-slate-700 gap-2">
                {['ENG', 'ESP', 'ITA', 'GER', 'FRA'].map(code => (
                    <button 
                        key={code}
                        onClick={() => setActiveCountry(code)}
                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${activeCountry === code ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                    >
                        {code}
                    </button>
                ))}
            </div>
        </div>

        {/* Control Bar */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-50 shadow-2xl">
          {/* Division Toggles */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveDivision(Division.First)}
              className={`px-6 py-2 rounded-md font-bold transition-all flex items-center gap-2 ${
                activeDivision === Division.First
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Trophy size={16} className={activeDivision === Division.First ? 'text-yellow-400' : ''} />
              Division 1
            </button>
            <button
              onClick={() => setActiveDivision(Division.Second)}
              className={`px-6 py-2 rounded-md font-bold transition-all flex items-center gap-2 ${
                activeDivision === Division.Second
                  ? 'bg-slate-800 text-white shadow-lg border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Trophy size={16} className={activeDivision === Division.Second ? 'text-slate-400' : ''} />
              Division 2
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search club..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Filter size={12}/> Sort By:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="rating">Rating (High-Low)</option>
              <option value="budget">Budget (High-Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTeams.map((team, idx) => (
            <div 
              key={team.id}
              onClick={() => onSelectTeam(team.id)}
              className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-300 cursor-pointer hover:-translate-y-1"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Card Header Gradient */}
              <div 
                className="h-24 w-full relative"
                style={{ background: `linear-gradient(135deg, ${team.colors[0]}, ${team.colors[1]})` }}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
              </div>

              {/* Floating Crest */}
              <div className="absolute top-12 left-6 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <Crest team={team} size="lg" />
              </div>

              {/* Rating Badge */}
              <div className={`absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-lg font-sport font-bold text-2xl ${getRatingColor(team.rating)}`}>
                {team.rating}
              </div>

              {/* Card Body */}
              <div className="p-6 pt-10">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-2xl font-sport text-white leading-none group-hover:text-emerald-400 transition-colors">{team.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                  <MapPin size={12} /> {team.stadium.name}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Budget</div>
                    <div className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Coins size={12} /> €{team.budget}M
                    </div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 flex flex-col justify-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Tier</div>
                    <div className="font-bold text-white text-xs">{team.budgetTier}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredTeams.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-500 text-xl font-light">
                  No clubs found for the selected criteria.
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
