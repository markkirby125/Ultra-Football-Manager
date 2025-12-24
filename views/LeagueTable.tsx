
import React, { useState } from 'react';
import { Team, Division, Referee } from '../types';
import { Card } from '../components/Card';
import { Crest } from '../components/Crest';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  teams: Team[];
  division: Division;
  country: string;
  userTeamId: string | null;
  onTeamClick: (id: string) => void;
}

export const LeagueTable: React.FC<Props> = ({ teams, division, country, userTeamId, onTeamClick }) => {
  const sortedTeams = teams
    .filter(t => t.country === country && t.division === division)
    .sort((a, b) => {
        if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
        const gdA = a.stats.gf - a.stats.ga;
        const gdB = b.stats.gf - b.stats.ga;
        return gdB - gdA;
    });

  const maxGF = Math.max(...sortedTeams.map(t => t.stats.gf));
  const maxGA = Math.max(...sortedTeams.map(t => t.stats.ga));

  const getLeagueName = () => {
      const isD1 = division === Division.First;
      switch (country) {
          case 'ENG': return isD1 ? "Premier League" : "Championship";
          case 'ESP': return isD1 ? "La Liga EA Sports" : "La Liga Hypermotion";
          case 'ITA': return isD1 ? "Serie A Enilive" : "Serie BKT";
          case 'GER': return isD1 ? "Bundesliga" : "2. Bundesliga";
          case 'FRA': return isD1 ? "Ligue 1 McDonald's" : "Ligue 2 BKT";
          default: return isD1 ? "First Division" : "Second Division";
      }
  };

  const getRowClass = (index: number) => {
     // Generic European slots logic for top tier
     if (division === Division.First) {
        if (index < 4) return 'border-l-2 border-blue-500 bg-blue-500/5'; // UCL
        if (index < 6) return 'border-l-2 border-orange-500 bg-orange-500/5'; // UEL
        if (index >= sortedTeams.length - 3) return 'border-l-2 border-red-500 bg-red-500/5'; // Relegation
     }
     if (division === Division.Second) {
        if (index < 2) return 'border-l-2 border-emerald-500 bg-emerald-500/5'; // Auto Promo
        if (index < 6) return 'border-l-2 border-yellow-500 bg-yellow-500/5'; // Playoff
        if (index >= sortedTeams.length - 3) return 'border-l-2 border-red-500 bg-red-500/5'; // Relegation
     }
     return 'border-l-2 border-transparent hover:bg-slate-800/50';
  };

  return (
    <Card className="overflow-x-auto shadow-2xl" title={getLeagueName()}>
      <table className="w-full text-sm text-left text-slate-300 border-collapse">
        <thead className="text-xs text-slate-500 uppercase bg-slate-950/30 border-b border-slate-800 font-sport tracking-wider">
          <tr>
            <th className="px-3 py-2 w-10 text-center">#</th>
            <th className="px-3 py-2">Club</th>
            <th className="px-2 py-2 text-center w-8">P</th>
            <th className="px-2 py-2 text-center w-8">W</th>
            <th className="px-2 py-2 text-center w-8">D</th>
            <th className="px-2 py-2 text-center w-8">L</th>
            <th className="px-2 py-2 text-center w-10">GF</th>
            <th className="px-2 py-2 text-center w-10">GA</th>
            <th className="px-2 py-2 text-center w-10">GD</th>
            <th className="px-3 py-2 text-right w-12 text-white">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {sortedTeams.map((team, idx) => (
            <tr 
                key={team.id} 
                className={`transition-all duration-150 cursor-pointer hover:scale-[1.01] origin-left ${getRowClass(idx)} ${team.id === userTeamId ? '!bg-slate-700/40 text-white' : ''}`} 
                onClick={(e) => {
                    e.preventDefault();
                    onTeamClick(team.id);
                }}
            >
              <td className={`px-3 py-2 text-center font-sport text-lg leading-none ${team.id === userTeamId ? 'text-emerald-400' : 'text-slate-500'}`}>{idx + 1}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                    {team.id === userTeamId && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>}
                    <Crest team={team} size="sm" className="w-6 h-8 text-[8px] shrink-0" />
                    <div className="flex flex-col">
                        <span className={`font-medium truncate max-w-[140px] md:max-w-none group-hover:text-emerald-400 ${team.id === userTeamId ? 'text-emerald-300' : ''}`}>{team.name}</span>
                        {/* Form Guide Dots */}
                        <div className="flex gap-0.5 mt-0.5">
                            {team.form.slice(0,5).map((r, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${r === 'W' ? 'bg-emerald-500' : r === 'D' ? 'bg-slate-500' : 'bg-red-500'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
              </td>
              <td className="px-2 py-2 text-center text-slate-500">{team.stats.played}</td>
              <td className="px-2 py-2 text-center text-slate-500">{team.stats.won}</td>
              <td className="px-2 py-2 text-center text-slate-500">{team.stats.drawn}</td>
              <td className="px-2 py-2 text-center text-slate-500">{team.stats.lost}</td>
              <td className={`px-2 py-2 text-center font-mono ${team.stats.gf === maxGF ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>{team.stats.gf}</td>
              <td className={`px-2 py-2 text-center font-mono ${team.stats.ga === maxGA ? 'text-red-400 font-bold' : 'text-slate-400'}`}>{team.stats.ga}</td>
              <td className="px-2 py-2 text-center font-medium text-slate-400">{(team.stats.gf - team.stats.ga) > 0 ? `+${team.stats.gf - team.stats.ga}` : team.stats.gf - team.stats.ga}</td>
              <td className="px-3 py-2 text-right font-sport text-xl leading-none text-slate-200">{team.stats.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
};

export const RefereeTable: React.FC<{ referees: Referee[], onSelect: (id: string) => void }> = ({ referees, onSelect }) => {
    const [sortKey, setSortKey] = useState<string>('games');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const getAvgRating = (r: Referee) => r.gamesOfficiated > 0 ? r.history.reduce((a, b) => a + b.rating, 0) / r.gamesOfficiated : 0;
    const getTotalCards = (r: Referee) => r.cardsGiven.yellow + r.cardsGiven.red;

    const sortedRefs = [...referees].sort((a, b) => {
        let valA: number | string = 0;
        let valB: number | string = 0;

        switch (sortKey) {
            case 'name': valA = a.name; valB = b.name; break;
            case 'games': valA = a.gamesOfficiated; valB = b.gamesOfficiated; break;
            case 'cards': valA = getTotalCards(a); valB = getTotalCards(b); break;
            case 'mentalHealth': valA = a.mentalHealth; valB = b.mentalHealth; break;
            case 'rating': valA = getAvgRating(a); valB = getAvgRating(b); break;
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <span className="text-slate-700 ml-1">⇅</span>;
        return sortDir === 'asc' ? <ChevronUp size={12} className="inline ml-1"/> : <ChevronDown size={12} className="inline ml-1"/>;
    };

    return (
        <Card title="Referee Association">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                    <thead className="text-xs uppercase bg-slate-950/30 text-slate-500 cursor-pointer select-none">
                        <tr>
                            <th className="p-3" onClick={() => handleSort('name')}>Name <SortIcon col="name"/></th>
                            <th className="p-3 text-center" onClick={() => handleSort('games')}>Games <SortIcon col="games"/></th>
                            <th className="p-3 text-center" onClick={() => handleSort('cards')}>Cards <SortIcon col="cards"/></th>
                            <th className="p-3 text-center" onClick={() => handleSort('rating')}>Avg Rtg <SortIcon col="rating"/></th>
                            <th className="p-3 text-center" onClick={() => handleSort('mentalHealth')}>Mental Health <SortIcon col="mentalHealth"/></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedRefs.map(r => (
                            <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors" onClick={() => onSelect(r.id)}>
                                <td className="p-3 font-medium text-emerald-400 hover:underline">{r.name}</td>
                                <td className="p-3 text-center">{r.gamesOfficiated}</td>
                                <td className="p-3 text-center text-yellow-500">{r.cardsGiven.yellow} <span className="text-red-500 ml-1">{r.cardsGiven.red}</span></td>
                                <td className="p-3 text-center font-bold text-white">{getAvgRating(r).toFixed(2)}</td>
                                <td className="p-3 text-center">{r.mentalHealth >= 80 ? '🧠' : r.mentalHealth < 40 ? '💔' : '🙂'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};
