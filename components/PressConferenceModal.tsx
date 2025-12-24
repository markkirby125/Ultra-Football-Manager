
import React from 'react';
import { PressConference } from '../types';
import { Mic, Radio, Camera, MessageCircle, AlertCircle, Shield, Zap, Skull } from 'lucide-react';

interface Props {
  data: PressConference;
  onOptionSelect: (id: string) => void;
}

export const PressConferenceModal: React.FC<Props> = ({ data, onOptionSelect }) => {
  const getToneIcon = (style: string) => {
      switch(style) {
          case 'Aggressive': return <Skull size={16} className="text-red-400" />;
          case 'Protective': return <Shield size={16} className="text-blue-400" />;
          case 'Arrogant': return <Zap size={16} className="text-yellow-400" />;
          default: return <MessageCircle size={16} className="text-slate-400" />;
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
        {/* Flash Effect Overlay */}
        <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
        
        <div className="w-full max-w-3xl relative z-10 animate-in zoom-in duration-300">
            {/* Header / Media Overlay */}
            <div className="absolute -top-12 left-0 flex gap-4 text-white/50 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div> Live Broadcast</div>
                <div className="flex items-center gap-2"><Camera size={14}/> Recording</div>
            </div>

            <div className="bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                {/* Journalist Section */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-8 text-center relative border-b border-slate-700">
                    <div className="inline-block p-4 rounded-full bg-slate-700 mb-4 border border-slate-600 shadow-lg">
                        <Mic size={32} className="text-slate-300" />
                    </div>
                    <div className="text-emerald-400 font-bold uppercase text-xs tracking-widest mb-2">{data.outlet}</div>
                    <h2 className="text-white font-bold text-lg mb-1">{data.journalistName}</h2>
                    <p className="text-slate-300 text-xl font-serif italic leading-relaxed max-w-xl mx-auto">"{data.question}"</p>
                </div>

                {/* Options */}
                <div className="p-6 bg-slate-950 grid grid-cols-1 gap-3">
                    <div className="text-xs text-slate-500 font-bold uppercase mb-2">Choose your response:</div>
                    {data.options.map(opt => (
                        <button 
                            key={opt.id}
                            onClick={() => onOptionSelect(opt.id)}
                            className="group flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 hover:border-slate-600 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full border border-white/10 bg-black/20 group-hover:bg-black/40 transition-colors`}>
                                    {getToneIcon(opt.style)}
                                </div>
                                <div>
                                    <div className="text-slate-200 font-medium group-hover:text-white transition-colors">"{opt.label}"</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mt-1 tracking-wider">{opt.style} Tone</div>
                                </div>
                            </div>
                            {opt.risk && (
                                <div className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800 group-hover:border-slate-600 group-hover:text-slate-300 transition-colors flex items-center gap-1">
                                    <AlertCircle size={12}/> {opt.risk}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
