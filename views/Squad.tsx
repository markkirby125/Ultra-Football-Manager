
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Player, Position } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { NATIONALITIES } from '../constants';
import { Activity, Banknote, Calendar, Heart, Medal, Target, Shield, Zap, TrendingUp, TrendingDown, Minus, Star, Users, Brain, MessageSquare, GraduationCap, BarChart2, Clock } from 'lucide-react';

interface Props {
  onPlayerClick: (id: string) => void;
  onInteract: (id: string) => void;
}

export const Squad: React.FC<Props> = ({ onPlayerClick, onInteract }) => {
  const { gameState, actions } = useGame();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [per90Mode, setPer90Mode] = useState(false);
  
  if (!gameState || !gameState.userTeamId) return null;
  const players = gameState.players;
  const teamId = gameState.userTeamId;
  const team = gameState.teams.find(t => t.id === teamId)!;

  const squad = players.filter(p => p.teamId === teamId && !p.isAcademy);
  
  const sorted = squad.sort((a, b) => {
    const posOrder = { [Position.GK]: 0, [Position.DEF]: 1, [Position.MID]: 2, [Position.FWD]: 3 };
    if (posOrder[a.position] !== posOrder[b.position]) return posOrder[a.position] - posOrder[b.position];
    return b.stats.ovr - a.stats.ovr;
  });

  const getPosColor = (pos: Position) => {
      switch(pos) {
          case Position.GK: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
          case Position.DEF: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
          case Position.MID: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
          case Position.FWD: return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      }
  };
  
  const getFlag = (code: string) => NATIONALITIES.find(n => n.code === code)?.flag || '🏳️';

  const avgAge = (squad.reduce((a,b) => a + b.age, 0) / squad.length).toFixed(1);
  const totalValue = squad.reduce((a,b) => a + b.value, 0).toFixed(1);
  const avgCondition = Math.round(squad.reduce((a,b) => a + b.condition, 0) / squad.length);
  const avgMorale = Math.round(squad.reduce((a,b) => a + b.morale, 0) / squad.length);

  const canHoldMeeting = !team.lastTeamMeetingWeek || (gameState.currentWeek - team.lastTeamMeetingWeek >= 4);
  const cooldownWeeks = team.lastTeamMeetingWeek ? 4 - (gameState.currentWeek - team.lastTeamMeetingWeek) : 0;

  const formatStat = (val: number, mins: number, isFloat = false) => {
      if (!per90Mode) return isFloat ? val.toFixed(2) : val;
      if (mins < 45) return '-'; // Not enough sample
      const p90 = (val / mins) * 90;
      return p90.toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="text-3xl font-sport text-white">Squad Management</h2>
          <Button 
              onClick={actions.holdTeamMeeting} 
              disabled={!canHoldMeeting}
              variant={canHoldMeeting ? 'primary' : 'secondary'}
              className="gap-2"
              title={canHoldMeeting ? "Boost Morale (Cost: 0, CD: 4 weeks)" : `Cooldown: ${cooldownWeeks} weeks`}
          >
              <Users size={16} /> 
              {canHoldMeeting ? 'Hold Team Meeting' : `Meeting in ${cooldownWeeks}w`}
          </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
              <div className="bg-emerald-500/10 p-2 rounded-full mb-2"><Activity size={20} className="text-emerald-400" /></div>
              <div className="text-3xl font-sport text-white mb-1">{avgCondition}%</div>
              <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Avg Fitness</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
              <div className="bg-yellow-500/10 p-2 rounded-full mb-2"><Banknote size={20} className="text-yellow-400" /></div>
              <div className="text-3xl font-sport text-white mb-1">€{totalValue}M</div>
              <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Squad Value</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
              <div className="bg-blue-500/10 p-2 rounded-full mb-2"><Calendar size={20} className="text-blue-400" /></div>
              <div className="text-3xl font-sport text-white mb-1">{avgAge}</div>
              <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Avg Age</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-lg">
              <div className="bg-rose-500/10 p-2 rounded-full mb-2"><Heart size={20} className="text-rose-400" /></div>
              <div className="text-3xl font-sport text-white mb-1">{avgMorale > 80 ? '🔥' : avgMorale > 50 ? '😐' : '❄️'}</div>
              <div className="text-xs uppercase text-slate-500 font-bold tracking-wider">Morale ({avgMorale})</div>
          </div>
      </div>

      <Card 
          title="First Team Squad" 
          action={
              <div className="flex gap-2">
                  <Button size="sm" variant={per90Mode ? 'primary' : 'secondary'} onClick={() => setPer90Mode(!per90Mode)} className="flex items-center gap-2">
                      <Clock size={14} /> Per 90
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2">
                      <BarChart2 size={14} /> {showAdvanced ? "Basic Stats" : "Advanced Metrics"}
                  </Button>
              </div>
          }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 uppercase bg-slate-950/30 border-b border-slate-800 font-sport tracking-wider">
                  <tr>
                      <th className="px-4 py-3 text-center">Pos</th>
                      <th className="px-4 py-3">Player Name</th>
                      <th className="px-4 py-3 text-center">Nat</th>
                      <th className="px-4 py-3 text-center">OVR</th>
                      <th className="px-4 py-3 text-center">Mins</th>
                      {!showAdvanced ? (
                          <>
                              <th className="px-4 py-3 text-center">Age</th>
                              <th className="px-4 py-3 text-center">Cond</th>
                              <th className="px-4 py-3 text-center">Morale</th>
                              <th className="px-4 py-3 text-center">Form</th>
                          </>
                      ) : (
                          <>
                              <th className="px-4 py-3 text-center text-emerald-400">xG</th>
                              <th className="px-4 py-3 text-center text-blue-400">xA</th>
                              <th className="px-4 py-3 text-center text-purple-400">xT</th>
                              <th className="px-4 py-3 text-center text-yellow-400">xPress</th>
                          </>
                      )}
                      <th className="px-4 py-3 text-right">Action</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                  {sorted.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => onPlayerClick(p.id)}>
                          <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPosColor(p.position)}`}>
                                  {p.position}
                              </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-200 group-hover:text-white">
                              <div className="flex items-center gap-2">
                                  {p.name}
                                  {p.traits.includes('Super Sub') && <Zap size={14} className="text-yellow-400 fill-current" title="Super Sub Trait"/>}
                              </div>
                          </td>
                          <td className="px-4 py-3 text-center text-lg leading-none">{getFlag(p.nationality)}</td>
                          <td className="px-4 py-3 text-center font-bold text-white">{p.stats.ovr}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-400">{p.statsSeason.minutesPlayed}</td>
                          
                          {!showAdvanced ? (
                              <>
                                  <td className="px-4 py-3 text-center text-slate-500">{p.age}</td>
                                  <td className="px-4 py-3 text-center text-slate-500">{p.condition}%</td>
                                  <td className="px-4 py-3 text-center text-slate-500">{p.morale}</td>
                                  <td className="px-4 py-3 text-center">{p.form.toFixed(1)}</td>
                              </>
                          ) : (
                              <>
                                  <td className="px-4 py-3 text-center font-mono text-emerald-400">{formatStat(p.statsSeason.xg, p.statsSeason.minutesPlayed, true)}</td>
                                  <td className="px-4 py-3 text-center font-mono text-blue-400">{formatStat(p.statsSeason.xa, p.statsSeason.minutesPlayed, true)}</td>
                                  <td className="px-4 py-3 text-center font-mono text-purple-400">{formatStat(p.statsSeason.xt, p.statsSeason.minutesPlayed, true)}</td>
                                  <td className="px-4 py-3 text-center font-mono text-yellow-400">{formatStat(p.statsSeason.xpress, p.statsSeason.minutesPlayed, true)}</td>
                              </>
                          )}
                          
                          <td className="px-4 py-3 text-right">
                              <button onClick={(e) => { e.stopPropagation(); onInteract(p.id); }} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                  <MessageSquare size={16} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
