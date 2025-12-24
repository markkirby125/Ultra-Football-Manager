
import React from 'react';
import { ContractNegotiation, Player, Team } from '../types';
import { Crest } from './Crest';
import { Button } from './Button';
import { AlertTriangle, Banknote, Briefcase, Check, X } from 'lucide-react';

interface Props {
  negotiation: ContractNegotiation;
  player: Player;
  buyer: Team;
  userTeam: Team;
  onResolve: (decision: 'renew' | 'sell') => void;
}

export const ContractNegotiationModal: React.FC<Props> = ({ negotiation, player, buyer, userTeam, onResolve }) => {
  const renewalCost = 2.0; // Matches engine logic
  const canAffordRenewal = userTeam.budget >= renewalCost;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-slate-900 border-2 border-red-500 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 relative">
            {/* Header */}
            <div className="bg-red-600 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-white/20 p-3 rounded-full mb-2 animate-bounce">
                        <AlertTriangle size={32} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Release Clause Triggered</h2>
                    <p className="text-red-100 font-bold text-sm mt-1">Hostile Transfer Bid Incoming</p>
                </div>
            </div>

            <div className="p-8">
                <p className="text-slate-300 text-center mb-8 text-lg">
                    <strong className="text-white">{buyer.name}</strong> has met the release clause of <strong className="text-emerald-400">€{negotiation.offerAmount}M</strong> for <strong className="text-white">{player.name}</strong>.
                    <br/><br/>
                    <span className="text-sm text-slate-400">Under league rules, we cannot block this transfer unless the player agrees to a new contract immediately.</span>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Option A: Sell */}
                    <button 
                        onClick={() => onResolve('sell')}
                        className="group relative bg-slate-950 border border-slate-700 hover:border-slate-500 p-6 rounded-xl flex flex-col items-center text-center transition-all hover:scale-105"
                    >
                        <div className="text-slate-500 font-bold uppercase text-xs mb-2">Option A</div>
                        <div className="text-xl font-bold text-white mb-2">Accept Departure</div>
                        <div className="text-emerald-400 font-mono font-bold text-2xl mb-2">+€{negotiation.offerAmount}M</div>
                        <p className="text-xs text-slate-500">The player leaves immediately. The funds are added to your budget.</p>
                        <div className="absolute top-4 right-4 text-slate-600 group-hover:text-white"><Briefcase size={20}/></div>
                    </button>

                    {/* Option B: Renew */}
                    <button 
                        onClick={() => onResolve('renew')}
                        disabled={!canAffordRenewal}
                        className={`group relative bg-emerald-900/10 border p-6 rounded-xl flex flex-col items-center text-center transition-all ${canAffordRenewal ? 'border-emerald-500/50 hover:bg-emerald-900/20 hover:border-emerald-400 hover:scale-105 cursor-pointer' : 'border-slate-800 opacity-50 cursor-not-allowed'}`}
                    >
                        <div className="text-emerald-600 font-bold uppercase text-xs mb-2">Option B</div>
                        <div className="text-xl font-bold text-white mb-2">Emergency Renewal</div>
                        <div className="space-y-1 mb-2">
                            <div className="text-white font-mono text-sm">New Wage: <span className="text-yellow-400">€{negotiation.wageDemands}k</span></div>
                            <div className="text-white font-mono text-sm">Fees: <span className="text-red-400">-€{renewalCost}M</span></div>
                        </div>
                        <p className="text-xs text-emerald-400/70">Increases clause significantly. Boosts morale. Costs budget.</p>
                        <div className="absolute top-4 right-4 text-emerald-600 group-hover:text-emerald-400"><Banknote size={20}/></div>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
