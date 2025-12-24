
import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import { Button } from './components/Button';
import { Logo } from './components/Logo';
import { Overview } from './views/Overview';
import { Squad } from './views/Squad';
import { Tactics } from './views/Tactics';
import { Transfers } from './views/Transfers';
import { Facilities } from './views/Facilities';
import { Office } from './views/Office';
import { Standings } from './views/Standings';
import { Results } from './views/Results';
import { Settings } from './views/Settings';
import { LiveMatch } from './views/LiveMatch';
import { TeamSelection } from './views/TeamSelection';
import { ApiKeyModal } from './components/ApiKeyModal';
import { NewspaperModal } from './components/NewspaperModal';
import { PlayerDetailModal } from './components/PlayerDetailModal';
import { TeamDetailModal } from './components/TeamDetailModal';
import { MatchDetailModal } from './components/MatchDetailModal';
import { RefereeModal } from './components/RefereeModal';
import { StadiumModal } from './components/StadiumModal';
import { PlayerInteractionModal } from './components/PlayerInteractionModal';
import { ContractNegotiationModal } from './components/ContractNegotiationModal';
import { PressConferenceModal } from './components/PressConferenceModal';
import { SeasonSummaryModal } from './components/SeasonSummaryModal';
import { NewGameWizard } from './views/NewGameWizard';
import { Crest } from './components/Crest';
import { Trophy, Users, TrendingUp, DollarSign, Settings as SettingsIcon, Layout, Clipboard, Calendar, Key, Zap } from 'lucide-react';
import { Team, Player, Fixture, NewsItem } from './types';

const App: React.FC = () => {
  const { gameState, activeMatch, actions, loadingState, hasSaveFile, apiKey, grokApiKey } = useGame();
  const [view, setView] = useState<'overview' | 'squad' | 'tactics' | 'transfers' | 'facilities' | 'office' | 'standings' | 'results' | 'settings'>('overview');
  const [officeTab, setOfficeTab] = useState<'overview' | 'staff'>('overview');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showNewGameWizard, setShowNewGameWizard] = useState(false);
  
  // Modal States
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Fixture | null>(null);
  const [selectedRefereeId, setSelectedRefereeId] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showStadium, setShowStadium] = useState(false);
  const [interactionPlayerId, setInteractionPlayerId] = useState<string | null>(null);
  
  // Key Confirmation Handler (Only for Loading Game now)
  const handleKeyConfirm = (newGemini: string, newGrok: string) => {
      actions.setApiKey(newGemini);
      if (newGrok) actions.setGrokApiKey(newGrok);
      setShowKeyModal(false);
      actions.loadSavedGame();
  };

  const startNew = () => {
      setShowNewGameWizard(true);
  };

  const startFictional = () => {
      actions.startFictionalGame();
  };

  // If match is active, show Live Match View
  if (activeMatch && gameState) {
      const home = gameState.teams.find(t => t.id === activeMatch.homeTeamId)!;
      const away = gameState.teams.find(t => t.id === activeMatch.awayTeamId)!;
      const ref = gameState.referees.find(r => r.id === activeMatch.refereeId)!;
      
      // Prepare lineups (assuming tactics populated)
      const getLineup = (team: Team) => team.tactics.lineup.map(id => gameState.players.find(p => p.id === id)).filter(Boolean) as Player[];
      const getBench = (team: Team) => gameState.players.filter(p => p.teamId === team.id && !team.tactics.lineup.includes(p.id));

      return (
          <LiveMatch 
              homeTeam={home} 
              awayTeam={away} 
              homeLineup={getLineup(home)} 
              awayLineup={getLineup(away)}
              homeBench={getBench(home)}
              awayBench={getBench(away)}
              fixture={activeMatch}
              referee={ref}
              onComplete={actions.completeLiveMatch}
          />
      );
  }

  // Loading Screen
  if (loadingState.status !== 'idle' && loadingState.status !== 'complete') {
      const isKnownStep = ['validating', 'connecting', 'scouting', 'parsing', 'finalizing'].includes(loadingState.status);
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-[#0F1419] text-white">
              <Logo className="w-32 h-32 mb-8 animate-pulse text-[var(--fot-accent)]" />
              <h2 className="text-2xl font-bold mb-2">Initialize Database</h2>
              <div className="flex flex-col gap-2 w-64">
                  {['validating', 'connecting', 'scouting', 'parsing', 'finalizing'].map(step => (
                      <div key={step} className="flex items-center gap-3 text-sm">
                          <div className={`w-3 h-3 rounded-full ${loadingState.stepsCompleted.includes(step as any) ? 'bg-[var(--fot-accent)]' : loadingState.status === step ? 'bg-yellow-500 animate-bounce' : 'bg-slate-700'}`}></div>
                          <span className={loadingState.status === step ? 'text-white font-bold' : 'text-slate-500 uppercase'}>{step}</span>
                      </div>
                  ))}
              </div>
              
              {!isKnownStep && (
                  <div className="mt-6 text-sm font-mono text-[var(--fot-accent)] bg-white/5 px-4 py-2 rounded border border-white/10 animate-pulse">
                      {loadingState.status}
                  </div>
              )}

              {loadingState.error && (
                  <div className="mt-8 p-4 bg-red-900/50 border border-red-500 rounded max-w-md text-center">
                      <h3 className="font-bold text-red-200">{loadingState.error.title}</h3>
                      <p className="text-sm text-red-300 mb-4">{loadingState.error.message}</p>
                      <Button onClick={actions.retryWorldGeneration} variant="secondary">Retry</Button>
                  </div>
              )}
          </div>
      );
  }

  // Initial Menu
  if (!gameState) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-[#0F1419] text-white p-4">
              <Logo className="w-48 h-48 mb-8 text-[var(--fot-accent)] drop-shadow-[0_0_30px_rgba(0,212,255,0.4)]" />
              <h1 className="text-5xl font-extrabold mb-2 tracking-tight">ULTRA FOOTBALL</h1>
              <p className="text-slate-400 mb-12 uppercase text-sm font-bold tracking-widest">Director Mode • Season 2025</p>
              
              {showNewGameWizard ? (
                  <NewGameWizard onBack={() => setShowNewGameWizard(false)} />
              ) : (
                  <div className="flex flex-col gap-4 w-full max-w-md">
                      <Button onClick={startNew} className="py-4 text-lg">Start New Career</Button>
                      <Button onClick={startFictional} variant="secondary" className="py-4 text-lg">Start Fictional World</Button>
                      <Button 
                          onClick={() => {
                              if (apiKey) {
                                  actions.loadSavedGame();
                              } else {
                                  setShowKeyModal(true);
                              }
                          }} 
                          variant="ghost" 
                          className={`text-slate-400 hover:text-white ${!hasSaveFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!hasSaveFile}
                      >
                          {hasSaveFile ? 'Continue Career' : 'No Save Found'}
                      </Button>
                  </div>
              )}

              {showKeyModal && <ApiKeyModal onConfirm={handleKeyConfirm} onCancel={() => setShowKeyModal(false)} canCancel={true} />}
          </div>
      );
  }

  // Team Selection
  if (!gameState.userTeamId) {
      return <TeamSelection onSelectTeam={actions.selectTeam} />;
  }

  // User Team for Sidebar
  const userTeam = gameState.teams.find(t => t.id === gameState.userTeamId);

  // Main Dashboard Layout
  return (
    <div className="flex h-screen bg-[#0F1419] text-white font-sans overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-[var(--fot-border)] flex flex-col shrink-0 bg-[#151A21]">
            <div className="p-6 flex items-center gap-3">
                <Logo className="w-8 h-8 text-[var(--fot-accent)]" />
                <span className="font-bold text-xl text-white tracking-tight">UFD</span>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
                {[
                    { id: 'overview', icon: Layout, label: 'Overview' },
                    { id: 'squad', icon: Users, label: 'Squad' },
                    { id: 'tactics', icon: Clipboard, label: 'Tactics' },
                    { id: 'standings', icon: Trophy, label: 'Standings' },
                    { id: 'results', icon: Calendar, label: 'Fixtures' },
                    { id: 'transfers', icon: DollarSign, label: 'Transfers' },
                    { id: 'facilities', icon: TrendingUp, label: 'Facilities' },
                    { id: 'office', icon: Users, label: 'Office' },
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setView(item.id as any)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === item.id ? 'bg-white/10 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <item.icon size={18} className={view === item.id ? 'text-[var(--fot-accent)]' : 'text-slate-500'} />
                        <span className="text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-[var(--fot-border)]">
                {/* User Team Indicator */}
                {userTeam && (
                    <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Crest team={userTeam} size="sm" />
                        <div className="flex flex-col min-w-0">
                             <span className="text-xs font-bold text-white truncate">{userTeam.name}</span>
                             <span className="text-[10px] text-slate-400">{userTeam.rating} OVR</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-3 px-1">
                    <div className="flex gap-3">
                        <Key size={16} className={apiKey ? "text-[var(--fot-accent)]" : "text-slate-600"} title={apiKey ? "Gemini Active" : "Gemini Missing"} />
                        <Zap size={16} className={grokApiKey ? "text-yellow-400" : "text-slate-600"} title={grokApiKey ? "Grok Active" : "Grok Missing"} />
                    </div>
                    <button onClick={() => setView('settings')} className="text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300" title="Settings">
                        <SettingsIcon size={16} />
                    </button>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current Season</div>
                <div className="text-sm font-mono text-white">Week {gameState.currentWeek} / {gameState.totalWeeks}</div>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
                {view === 'overview' && (
                    <Overview 
                        onPlayerClick={setSelectedPlayerId} 
                        onTeamClick={setSelectedTeamId} 
                        onHeadlineClick={setSelectedNews}
                        onFixtureClick={setSelectedMatch}
                        onRefereeClick={setSelectedRefereeId}
                        onHireAssistant={() => {
                            setView('office');
                            setOfficeTab('staff');
                        }}
                    />
                )}
                {view === 'squad' && <Squad onPlayerClick={setSelectedPlayerId} onInteract={setInteractionPlayerId} />}
                {view === 'tactics' && <Tactics onPlayerClick={setSelectedPlayerId} />}
                {view === 'transfers' && <Transfers onPlayerClick={setSelectedPlayerId} />}
                {view === 'facilities' && <Facilities onPlayerClick={setSelectedPlayerId} />}
                {view === 'office' && <Office onOpenStadium={() => setShowStadium(true)} initialTab={officeTab} />}
                {view === 'standings' && <Standings onTeamClick={setSelectedTeamId} onRefereeClick={setSelectedRefereeId} onPlayerClick={setSelectedPlayerId} />}
                {view === 'results' && <Results onSelectFixture={setSelectedMatch} onTeamClick={setSelectedTeamId} />}
                {view === 'settings' && <Settings />}
            </div>
        </div>

        {/* Modals */}
        {selectedPlayerId && (
            <PlayerDetailModal 
                player={gameState.players.find(p => p.id === selectedPlayerId)!}
                team={gameState.teams.find(t => t.id === gameState.players.find(p => p.id === selectedPlayerId)?.teamId)!}
                userTeam={gameState.teams.find(t => t.id === gameState.userTeamId)}
                onClose={() => setSelectedPlayerId(null)}
            />
        )}

        {selectedTeamId && (
            <TeamDetailModal 
                team={gameState.teams.find(t => t.id === selectedTeamId)!}
                manager={gameState.managers.find(m => m.teamId === selectedTeamId)}
                players={gameState.players.filter(p => p.teamId === selectedTeamId)}
                rival={gameState.teams.find(t => t.id === gameState.teams.find(x => x.id === selectedTeamId)?.rivalId)}
                onClose={() => setSelectedTeamId(null)}
                onPlayerClick={setSelectedPlayerId}
            />
        )}

        {selectedMatch && (
            <MatchDetailModal 
                fixture={selectedMatch}
                gameState={gameState}
                onClose={() => setSelectedMatch(null)}
                onOpenReferee={setSelectedRefereeId}
                onOpenPlayer={setSelectedPlayerId}
            />
        )}

        {selectedRefereeId && (
            <RefereeModal 
                referee={gameState.referees.find(r => r.id === selectedRefereeId)!}
                teams={gameState.teams}
                onClose={() => setSelectedRefereeId(null)}
            />
        )}

        {selectedNews && (
            <NewspaperModal 
                newsItem={selectedNews}
                allNews={gameState.news}
                onClose={() => setSelectedNews(null)}
            />
        )}

        {showStadium && (
            <StadiumModal 
                team={gameState.teams.find(t => t.id === gameState.userTeamId)!}
                onClose={() => setShowStadium(false)}
            />
        )}

        {interactionPlayerId && (
            <PlayerInteractionModal 
                player={gameState.players.find(p => p.id === interactionPlayerId)!}
                onInteract={(type) => {
                    actions.interactWithPlayer(interactionPlayerId, type);
                    setInteractionPlayerId(null);
                }}
                onClose={() => setInteractionPlayerId(null)}
            />
        )}

        {gameState.activePressConference && (
            <PressConferenceModal 
                data={gameState.activePressConference}
                onOptionSelect={actions.resolvePressConference}
            />
        )}

        {gameState.activeContractNegotiation && (
            <ContractNegotiationModal 
                negotiation={gameState.activeContractNegotiation}
                player={gameState.players.find(p => p.id === gameState.activeContractNegotiation!.playerId)!}
                buyer={gameState.teams.find(t => t.id === gameState.activeContractNegotiation!.buyingTeamId)!}
                userTeam={gameState.teams.find(t => t.id === gameState.userTeamId)!}
                onResolve={actions.resolveContractNegotiation}
            />
        )}

        {gameState.seasonSummary && (
            <SeasonSummaryModal 
                summary={gameState.seasonSummary}
                onContinue={actions.startNextSeason}
            />
        )}
    </div>
  );
};

export default App;
