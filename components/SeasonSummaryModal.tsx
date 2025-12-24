
import React from 'react';
import { SeasonSummary } from '../types';
import { Crest } from './Crest';
import { Button } from './Button';
import { Trophy, ArrowUpCircle, ArrowDownCircle, Star, Target, Crown } from 'lucide-react';

interface Props {
  summary: SeasonSummary;
  onContinue: () => void;
}

export const SeasonSummaryModal: React.FC<Props> = ({ summary, onContinue }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-500 relative">
            {/* Confetti / Celebration BG */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/confetti.png')] opacity-10 pointer-events-none"></div>
            
            <div className="p-8 text-center relative z-10">
                <div className="inline-block p-4 bg-yellow-500/20 rounded-full mb-4 animate-bounce">
                    <Trophy size={64} className="text-yellow-400 drop-shadow-lg" />
                </div>
                <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">Season Complete</h1>
                <p className="text-slate-400 text-lg uppercase tracking-widest font-bold">2025/26 Summary</p>
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Champion */}
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-xl border border-yellow-500/30 shadow-xl flex flex-col items-center transform hover:scale-105 transition-transform">
                        <div className="text-yellow-500 font-bold uppercase text-xs tracking-widest mb-4 flex items-center gap-2"><Crown size={14}/> League Champions</div>
                        <Crest team={{ crest: summary.champion.crest, colors: ['#fff', '#000'] } as any} size="xl" className="mb-4 drop-shadow-2xl" />
                        <h3 className="text-2xl font-bold text-white">{summary.champion.name}</h3>
                    </div>

                    {/* Awards */}
                    <div className="space-y-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4 text-left">
                            <div className="p-3 bg-emerald-900/30 rounded-full text-emerald-400"><Target size={24}/></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Golden Boot</div>
                                <div className="font-bold text-white text-lg">{summary.topScorer.name}</div>
                                <div className="text-xs text-emerald-400">{summary.topScorer.goals} Goals</div>
                            </div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4 text-left">
                            <div className="p-3 bg-purple-900/30 rounded-full text-purple-400"><Star size={24}/></div>
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase font-bold">Player of the Season</div>
                                <div className="font-bold text-white text-lg">{summary.playerOfTheSeason.name}</div>
                                <div className="text-xs text-purple-400">{summary.playerOfTheSeason.rating.toFixed(2)} Avg Rating</div>
                            </div>
                        </div>
                    </div>

                    {/* Promotion/Relegation */}
                    <div className="space-y-4">
                        <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30">
                            <div className="text-emerald-400 font-bold uppercase text-xs mb-3 flex items-center gap-2"><ArrowUpCircle size={14}/> Promoted</div>
                            <div className="space-y-2">
                                {summary.promoted.map((t, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-white">
                                        <Crest team={{ crest: t.crest, colors: ['#fff', '#000'] } as any} size="sm" />
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30">
                            <div className="text-red-400 font-bold uppercase text-xs mb-3 flex items-center gap-2"><ArrowDownCircle size={14}/> Relegated</div>
                            <div className="space-y-2">
                                {summary.relegated.map((t, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-white">
                                        <Crest team={{ crest: t.crest, colors: ['#fff', '#000'] } as any} size="sm" />
                                        {t.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <Button size="lg" onClick={onContinue} className="px-12 py-4 text-xl shadow-lg shadow-emerald-500/20 animate-pulse">
                        Start Next Season
                    </Button>
                </div>
            </div>
        </div>
    </div>
  );
};
