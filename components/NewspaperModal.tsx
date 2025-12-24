
import React, { useState, useEffect } from 'react';
import { Share2, MessageCircle, Heart, Calendar, Loader2, Sparkles, Quote } from 'lucide-react';
import { NewsItem, MatchResult } from '../types';
import { useGame } from '../context/GameContext';
import { generateLongFormArticle } from '../utils/textGenerator';
import { Button } from './Button';

interface Props {
  headline?: string; 
  newsItem?: NewsItem; 
  allNews?: NewsItem[]; 
  onClose: () => void;
}

export const NewspaperModal: React.FC<Props> = ({ headline, newsItem, allNews, onClose }) => {
  const { gameState, apiKey } = useGame();
  const [view, setView] = useState<'article' | 'archive'>(newsItem || headline ? 'article' : 'archive');
  const [currentArticle, setCurrentArticle] = useState<NewsItem | null>(newsItem || null);
  
  const [longFormContent, setLongFormContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Manual Generation Handler
  const handleGenerate = async () => {
      if (currentArticle && currentArticle.matchId && apiKey && gameState) {
          setIsGenerating(true);
          const generatedText = await generateLongFormArticle(gameState, currentArticle);
          if (generatedText) {
              setLongFormContent(generatedText);
          }
          setIsGenerating(false);
      }
  };

  // Reset content when switching articles
  useEffect(() => {
      setLongFormContent(null);
      setIsGenerating(false);
  }, [currentArticle?.id]);

  // Pull Quote Logic
  const getPullQuote = () => {
      if (!currentArticle?.matchId || !gameState) return null;
      const fixture = gameState.fixtures.find(f => f.result && f.result.matchId === currentArticle.matchId);
      if (!fixture?.result) return null;
      
      const poeticEvents = fixture.result.events.filter(e => e.style === 'poetic');
      if (poeticEvents.length > 0) {
          // Prefer goal poetic events if available
          const goalPoetic = poeticEvents.find(e => e.type === 'goal');
          return goalPoetic ? goalPoetic.playerName : poeticEvents[0].playerName;
      }
      return null;
  };

  const pullQuote = getPullQuote();

  const generateBody = (item: NewsItem | null, simpleHeadline?: string) => {
      if (item?.body && !isGenerating && !longFormContent) return item.body;
      const txt = item?.headline || simpleHeadline || "";
      let body = "In a developing story that has captured the attention of the football world, sources close to the club have confirmed the recent events. ";
      return body + " Stay tuned for more updates as we get them.";
  };

  const activeHeadline = currentArticle?.headline || headline || "";
  const displayBody = longFormContent || generateBody(currentArticle, headline);
  const canGenerate = apiKey && currentArticle?.matchId && !longFormContent && !isGenerating;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-[#f2f0e9] text-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded shadow-2xl transform rotate-0 flex flex-col font-serif" onClick={e => e.stopPropagation()}>
            <div className="border-b-[3px] border-slate-900 p-4 text-center shrink-0">
                <div className="flex justify-between items-center border-b border-slate-900 pb-1 mb-2 font-sans">
                    <span className="text-[10px] font-bold tracking-widest uppercase">Vol. 2025</span>
                    <button onClick={() => setView(view === 'article' ? 'archive' : 'article')} className="text-xs font-bold uppercase underline hover:text-red-700">
                        {view === 'article' ? 'View Archive' : 'Back to Story'}
                    </button>
                    <span className="text-[10px] font-bold tracking-widest uppercase">€1.50</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none font-sans">El Diario</h1>
                <div className="text-xs font-bold uppercase tracking-[0.6em] mt-1 text-slate-600 font-sans">Deportivo</div>
            </div>

            {view === 'article' ? (
                <div className="p-8">
                    <div className="mb-6">
                        <div className="flex items-center justify-center mb-4 text-[10px] font-bold uppercase text-red-700 tracking-widest gap-2 font-sans">
                            <Calendar size={12} /> Week {currentArticle?.week || '?'} • Official Report
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6 text-center border-b-2 border-slate-900 pb-6 font-sans">
                            {activeHeadline}
                        </h2>
                        
                        {canGenerate && (
                            <div className="flex justify-center mb-6 font-sans">
                                <Button 
                                    onClick={handleGenerate} 
                                    className="flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg"
                                >
                                    <Sparkles size={16} /> Generate Full Report (AI)
                                </Button>
                            </div>
                        )}

                        <div className="columns-1 md:columns-2 gap-8 text-justify text-lg leading-relaxed text-slate-800 relative">
                           {isGenerating && (
                               <div className="absolute inset-0 bg-[#f2f0e9]/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-start pt-10">
                                   <div className="flex items-center gap-2 text-slate-500 font-sans font-bold text-sm bg-white px-4 py-2 rounded-full shadow-lg">
                                       <Loader2 className="animate-spin text-emerald-600" size={16} />
                                       Generating long-form analysis...
                                   </div>
                               </div>
                           )}
                           
                           {pullQuote && !longFormContent && (
                               <div className="float-right w-1/2 ml-4 mb-4 bg-white border-y-4 border-slate-900 p-4 text-center shadow-sm">
                                   <Quote size={24} className="text-slate-400 mx-auto mb-2"/>
                                   <p className="font-bold font-sans text-xl italic text-slate-900 leading-tight">"{pullQuote}"</p>
                                   <div className="text-xs text-slate-500 font-sans uppercase font-bold mt-2 tracking-widest">Live Commentary</div>
                               </div>
                           )}
                           
                           {displayBody.split('\n').map((paragraph, idx) => (
                               <p key={idx} className={idx === 0 ? "first-letter:text-6xl first-letter:font-black first-letter:float-left first-letter:mr-2 first-letter:mt-[-10px] first-letter:font-sans mb-4" : "mb-4"}>
                                   {paragraph}
                               </p>
                           ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-400">
                        <h3 className="font-sans font-bold text-sm uppercase text-slate-500 mb-4 tracking-wider">Social Reaction</h3>
                        <div className="space-y-3 font-sans">
                            {currentArticle?.socialReactions ? (
                                currentArticle.socialReactions.map((reaction, i) => (
                                    <div key={i} className="flex gap-3 items-start">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${reaction.sentiment === 'positive' ? 'bg-emerald-600' : reaction.sentiment === 'negative' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                            {reaction.user[0]}
                                        </div>
                                        <div className="bg-white p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl shadow-sm flex-1 border border-slate-200">
                                            <div className="text-xs font-bold text-slate-900 flex justify-between">
                                                <span>{reaction.user} <span className="text-slate-400 font-normal">{reaction.handle}</span></span>
                                                <span className="text-[10px] text-slate-400">now</span>
                                            </div>
                                            <div className="text-sm text-slate-700 mt-1">{reaction.text}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-xs text-slate-500 italic">No social reactions loaded.</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 bg-[#e6ded3] flex-1">
                    <h3 className="font-sans font-bold text-lg uppercase text-slate-800 mb-4 border-b border-slate-400 pb-2">Headlines Archive</h3>
                    <div className="space-y-2 font-sans">
                        {allNews && allNews.length > 0 ? (
                            allNews.map((item) => (
                                <div key={item.id} 
                                     className="bg-white p-4 border border-slate-300 shadow-sm cursor-pointer hover:border-slate-900 hover:shadow-md transition-all flex justify-between items-center"
                                     onClick={() => { setCurrentArticle(item); setView('article'); }}
                                >
                                    <div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Week {item.week}</div>
                                        <div className="font-bold text-lg leading-tight">{item.headline}</div>
                                    </div>
                                    <div className="text-slate-400">→</div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-500 italic">Archive is empty.</div>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-slate-200 p-4 flex justify-between items-center text-slate-600 text-xs font-bold uppercase tracking-wide shrink-0 font-sans border-t border-slate-300">
                <button onClick={onClose} className="hover:text-slate-900">Close Newspaper</button>
                <div className="flex gap-4">
                    <Share2 size={16} className="cursor-pointer hover:text-blue-600"/>
                    <Heart size={16} className="cursor-pointer hover:text-red-600"/>
                    <MessageCircle size={16} className="cursor-pointer hover:text-emerald-600"/>
                </div>
            </div>
        </div>
    </div>
  );
};
