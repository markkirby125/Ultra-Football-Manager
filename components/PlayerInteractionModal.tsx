
import React from 'react';
import { Player } from '../types';
import { MessageCircle, ThumbsUp, ThumbsDown, AlertTriangle, Heart } from 'lucide-react';

interface Props {
  player: Player;
  onInteract: (type: 'praise' | 'criticize' | 'encourage' | 'warn') => void;
  onClose: () => void;
}

export const PlayerInteractionModal: React.FC<Props> = ({ player, onInteract, onClose }) => {
  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-slate-900 w-full max-w-md rounded-xl border border-slate-700 shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl shadow-lg border border-slate-600">
                    {player.name.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Talk to {player.name}</h2>
                    <div className="flex gap-4 text-xs text-slate-400 mt-1">
                        <span>Morale: <span className={player.morale < 50 ? 'text-red-400' : 'text-emerald-400'}>{player.morale}</span></span>
                        <span>Mental Health: <span className={player.mentalHealth < 50 ? 'text-red-400' : 'text-emerald-400'}>{player.mentalHealth}</span></span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={() => onInteract('praise')} 
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/30 hover:bg-emerald-900/40 hover:border-emerald-500 transition-all text-left group"
                >
                    <div className="bg-emerald-900/50 p-2 rounded-full text-emerald-400 group-hover:scale-110 transition-transform"><ThumbsUp size={20}/></div>
                    <div>
                        <div className="font-bold text-emerald-100">Praise Recent Form</div>
                        <div className="text-xs text-emerald-400/70">"You've been playing brilliantly lately."</div>
                    </div>
                </button>

                <button 
                    onClick={() => onInteract('encourage')} 
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 hover:border-blue-500 transition-all text-left group"
                >
                    <div className="bg-blue-900/50 p-2 rounded-full text-blue-400 group-hover:scale-110 transition-transform"><Heart size={20}/></div>
                    <div>
                        <div className="font-bold text-blue-100">Encourage</div>
                        <div className="text-xs text-blue-400/70">"Keep your head up, we believe in you."</div>
                    </div>
                </button>

                <button 
                    onClick={() => onInteract('criticize')} 
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-orange-900/20 border border-orange-500/30 hover:bg-orange-900/40 hover:border-orange-500 transition-all text-left group"
                >
                    <div className="bg-orange-900/50 p-2 rounded-full text-orange-400 group-hover:scale-110 transition-transform"><ThumbsDown size={20}/></div>
                    <div>
                        <div className="font-bold text-orange-100">Criticize Performance</div>
                        <div className="text-xs text-orange-400/70">"Your recent displays haven't been good enough."</div>
                    </div>
                </button>

                <button 
                    onClick={() => onInteract('warn')} 
                    className="w-full flex items-center gap-4 p-4 rounded-lg bg-red-900/20 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500 transition-all text-left group"
                >
                    <div className="bg-red-900/50 p-2 rounded-full text-red-400 group-hover:scale-110 transition-transform"><AlertTriangle size={20}/></div>
                    <div>
                        <div className="font-bold text-red-100">Warn About Conduct</div>
                        <div className="text-xs text-red-400/70">"Your discipline needs to improve."</div>
                    </div>
                </button>
            </div>
            
            <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-slate-500 hover:text-white transition-colors">Cancel</button>
        </div>
    </div>
  );
};
