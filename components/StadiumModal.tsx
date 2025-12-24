
import React from 'react';
import { Team } from '../types';
import { Card } from './Card';
import { MapPin, Users, Calendar, Hammer, TrendingUp, Activity, Waves, AlertTriangle, Wind } from 'lucide-react';
import { Crest } from './Crest';
import { PITCH_EFFECTS } from '../constants';

interface Props {
  team: Team;
  onClose: () => void;
}

export const StadiumModal: React.FC<Props> = ({ team, onClose }) => {
  const s = team.stadium;
  const effects = PITCH_EFFECTS[s.pitchState];

  const getConditionColor = (val: number) => {
      if (val > 80) return 'text-emerald-400';
      if (val > 50) return 'text-yellow-400';
      return 'text-red-400';
  };

  const getEffectColor = (val: number, inverse: boolean = false) => {
      if (val === 1) return 'text-slate-400';
      if (inverse) {
          return val > 1 ? 'text-red-400' : 'text-emerald-400';
      }
      return val > 1 ? 'text-emerald-400' : 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            
            {/* Hero Image */}
            <div className="relative h-64 md:h-80 overflow-hidden">
                <img 
                    src={`https://source.unsplash.com/1600x900/?${encodeURIComponent(s.imageKeyword)}`} 
                    alt={s.name} 
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-emerald-400 bg-black/40 backdrop-blur p-2 rounded-full z-20">✕</button>
                
                <div className="absolute bottom-0 left-0 w-full p-8 flex items-end gap-6 z-10">
                    <div className="hidden md:block">
                        <Crest team={team} size="xl" className="shadow-2xl shadow-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-sm mb-1">
                            <MapPin size={16} /> Home Ground
                        </div>
                        <h1 className="text-4xl md:text-6xl font-sport text-white leading-none shadow-black drop-shadow-lg">{s.name}</h1>
                        <div className="flex gap-6 mt-3 text-slate-300 font-medium">
                            <span className="flex items-center gap-2"><Users size={16} className="text-slate-500" /> {s.capacity.toLocaleString()} Seats</span>
                            <span className="flex items-center gap-2"><Calendar size={16} className="text-slate-500" /> Built {s.yearBuilt}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                
                {/* Infrastructure Stats */}
                <div className="space-y-6">
                    <h3 className="font-sport text-2xl text-white border-b border-slate-800 pb-2">Infrastructure</h3>
                    
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-400 flex items-center gap-2"><Hammer size={16}/> Training Facilities</span>
                                <span className="text-white font-mono font-bold">{s.facilities}/10</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${s.facilities * 10}%` }}></div>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 italic">Determines player stamina recovery speed.</div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-400 flex items-center gap-2"><Activity size={16}/> Pitch Condition</span>
                                <span className={`font-mono font-bold ${getConditionColor(s.pitchCondition)}`}>{s.pitchCondition}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                                <div className={`h-full ${s.pitchCondition > 80 ? 'bg-emerald-500' : 'bg-yellow-500'}`} style={{ width: `${s.pitchCondition}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                                <span className="text-slate-500 italic">Affects passing accuracy.</span>
                                <span className={`font-bold ${s.pitchCondition < 50 ? 'text-red-400' : 'text-slate-400'}`}>Status: {s.pitchState || 'Good'}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-slate-400 flex items-center gap-2"><Waves size={16}/> Pitch Type</span>
                                <span className="text-white font-bold">{s.pitchType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Surface Analysis Effects */}
                    <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                        <h4 className="text-xs uppercase font-bold text-slate-500 mb-3 flex items-center gap-2"><Activity size={14}/> Surface Gameplay Impact</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                <div className={`text-lg font-mono font-bold ${getEffectColor(effects.passing)}`}>
                                    {effects.passing > 1 ? '+' : ''}{Math.round((effects.passing - 1) * 100)}%
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold">Passing</div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                <div className={`text-lg font-mono font-bold ${getEffectColor(effects.fatigue, true)}`}>
                                    {effects.fatigue > 1 ? '+' : ''}{Math.round((effects.fatigue - 1) * 100)}%
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold">Fatigue</div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                <div className={`text-lg font-mono font-bold ${getEffectColor(effects.injury, true)}`}>
                                    {effects.injury > 1 ? '+' : ''}{Math.round((effects.injury - 1) * 100)}%
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold">Injuries</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Atmosphere & Analytics */}
                <div className="space-y-6">
                    <h3 className="font-sport text-2xl text-white border-b border-slate-800 pb-2">Match Day Experience</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Avg Attendance</div>
                            <div className="text-3xl font-mono font-bold text-white">
                                {Math.round(s.capacity * 0.92).toLocaleString()}
                            </div>
                            <div className="text-xs text-emerald-400 mt-1">92% Capacity</div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold mb-1">Atmosphere Rating</div>
                            <div className="text-3xl font-mono font-bold text-yellow-400">A+</div>
                            <div className="text-xs text-slate-400 mt-1">Intimidating</div>
                        </div>
                    </div>

                    <Card className="bg-slate-950/50">
                        <div className="flex items-center gap-3 mb-2">
                             <TrendingUp className="text-emerald-500" />
                             <h4 className="font-bold text-white">Fortress Factor</h4>
                        </div>
                        <p className="text-sm text-slate-400">
                            Teams find it incredibly difficult to play at {s.name}. The close proximity of the stands to the pitch creates a hostile environment for visiting players, granting a significant home advantage.
                        </p>
                    </Card>

                    <Card className="bg-slate-950/50">
                        <div className="flex items-center gap-3 mb-2">
                             <Wind className="text-blue-500" />
                             <h4 className="font-bold text-white">Climate Profile</h4>
                        </div>
                        <div className="flex justify-between items-center text-sm text-slate-300">
                            <span>Region Type:</span>
                            <span className="font-mono font-bold text-white">{s.climateType}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 italic">
                            {s.climateType === 'Atlantic' ? "High probability of rain and slick surfaces." : 
                             s.climateType === 'Mediterranean' ? "Warm, dry conditions with occasional heavy storms." : 
                             "Continental climate with cold winters and hot summers."}
                        </p>
                    </Card>
                </div>

            </div>
        </div>
    </div>
  );
};
