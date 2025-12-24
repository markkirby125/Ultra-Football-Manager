
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    GameState, GameContextType, LoadingState, RealWorldData, Team, 
    MatchResult, Fixture, AssistantManager, AssistantSettings, UserSettings 
} from '../types';
import { 
    initializeNewGame, processWeeklyFinances, simulateMatch, updateStatsAfterMatch, 
    generateWeeklyWorldEvents, generateNewsFromMatch, processEndOfSeason,
    scoutYouthAction, upgradeFacilityAction, relayPitchAction, promoteYouthAction,
    rejectYouthAction, signPlayerAction, processTransferOfferAction, playerInteractionAction,
    resolveContractNegotiationAction, resolvePressConferenceAction
} from '../utils/engine';
import { saveGame, loadGame, clearSave } from '../services/storage';
import { configureAI } from '../utils/textGenerator';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle', stepsCompleted: [] });
  const [apiKey, setApiKey] = useState<string>('');
  const [grokApiKey, setGrokApiKey] = useState<string>('');
  const [activeMatch, setActiveMatch] = useState<Fixture | null>(null);
  const [hasSaveFile, setHasSaveFile] = useState(false);

  // Check for save on mount
  useEffect(() => {
      const checkSave = async () => {
          const save = await loadGame();
          if (save) {
              setHasSaveFile(true);
          }
      };
      checkSave();
  }, []);

  // Configure AI when key changes
  useEffect(() => {
      if (apiKey) {
          configureAI(apiKey);
      }
  }, [apiKey]);

  const updateState = async (newState: GameState) => {
      setGameState(newState);
      await saveGame(newState);
  };

  const actions = {
    startNewGame: async (explicitKey?: string) => {
        setLoadingState({ status: 'connecting', stepsCompleted: [] });
        if (explicitKey) setApiKey(explicitKey);
        
        try {
            setLoadingState(prev => ({ ...prev, status: 'scouting', stepsCompleted: [...prev.stepsCompleted, 'connecting'] }));
            
            // Artificial delay for UI feedback
            await new Promise(r => setTimeout(r, 1000));
            
            const newState = await initializeNewGame(undefined, (msg) => {
               // Optional progress callback
            });
            
            setLoadingState(prev => ({ ...prev, status: 'finalizing', stepsCompleted: [...prev.stepsCompleted, 'scouting'] }));
            await updateState(newState);
            setLoadingState({ status: 'complete', stepsCompleted: [] });
        } catch (e: any) {
            setLoadingState({ status: 'error', stepsCompleted: [], error: { title: "Initialization Failed", message: e.message } });
        }
    },

    startFictionalGame: async () => {
        setLoadingState({ status: 'scouting', stepsCompleted: [] });
        const newState = await initializeNewGame();
        await updateState(newState);
        setLoadingState({ status: 'complete', stepsCompleted: [] });
    },

    startImportedGame: async (data: RealWorldData) => {
        setLoadingState({ status: 'parsing', stepsCompleted: [] });
        try {
            const newState = await initializeNewGame(data);
            await updateState(newState);
            setLoadingState({ status: 'complete', stepsCompleted: [] });
        } catch (e: any) {
            setLoadingState({ status: 'error', stepsCompleted: [], error: { title: "Import Failed", message: e.message } });
        }
    },

    retryWorldGeneration: () => {
        setLoadingState({ status: 'idle', stepsCompleted: [] });
    },

    loadSavedGame: async () => {
        const saved = await loadGame();
        if (saved) {
            setGameState(saved);
        }
    },

    selectTeam: (id: string) => {
        if (!gameState) return;
        updateState({ ...gameState, userTeamId: id });
    },

    updateTeam: (team: Team) => {
        if (!gameState) return;
        const newTeams = gameState.teams.map(t => t.id === team.id ? team : t);
        updateState({ ...gameState, teams: newTeams });
    },

    holdTeamMeeting: () => {
        if (!gameState || !gameState.userTeamId) return;
        const team = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (team) {
            const updatedTeam = { ...team, lastTeamMeetingWeek: gameState.currentWeek };
            const updatedPlayers = gameState.players.map(p => 
                p.teamId === team.id ? { ...p, morale: Math.min(100, p.morale + 10) } : p
            );
            updateState({ ...gameState, teams: gameState.teams.map(t => t.id === team.id ? updatedTeam : t), players: updatedPlayers });
        }
    },

    simulateWeek: async () => {
        if (!gameState) return;
        setIsSimulating(true);

        // Process Finances
        let state = processWeeklyFinances(gameState);

        // Simulate Matches
        const weekFixtures = state.fixtures.filter(f => f.week === state.currentWeek && !f.result);
        
        for (const fixture of weekFixtures) {
            const home = state.teams.find(t => t.id === fixture.homeTeamId)!;
            const away = state.teams.find(t => t.id === fixture.awayTeamId)!;
            const ref = state.referees.find(r => r.id === fixture.refereeId)!;
            
            const result = simulateMatch(fixture, home, away, ref, state.players);
            state = updateStatsAfterMatch(state, result);
        }

        // Living World Events (News, Transfers, Social)
        state = generateWeeklyWorldEvents(state);

        // Check for End of Season
        if (state.currentWeek >= state.totalWeeks) {
            state = processEndOfSeason(state); 
        } else {
            // Advance Week
            state.currentWeek += 1;
        }

        await updateState(state);
        setIsSimulating(false);
    },

    startNextSeason: () => {
        if (!gameState) return;
        const newState = { ...gameState, seasonSummary: undefined };
        updateState(newState);
    },

    startLiveMatch: (fixture: Fixture) => {
        setActiveMatch(fixture);
    },

    completeLiveMatch: (result: MatchResult) => {
        if (!gameState) return;
        let state = updateStatsAfterMatch(gameState, result);
        state = generateNewsFromMatch(state, result); 
        setActiveMatch(null);
        updateState(state);
    },

    scoutYouth: () => {
        if (!gameState || !gameState.userTeamId) return;
        const res = scoutYouthAction(gameState, gameState.userTeamId);
        if (res.success && res.newState) updateState(res.newState);
        else if (res.message) alert(res.message);
    },

    upgradeFacility: (type: 'stadium'|'training'|'youth'|'medical') => {
        if (!gameState || !gameState.userTeamId) return;
        const res = upgradeFacilityAction(gameState, gameState.userTeamId, type);
        if (res.success && res.newState) updateState(res.newState);
        else if (res.message) alert(res.message);
    },

    relayPitch: () => {
        if (!gameState || !gameState.userTeamId) return;
        const res = relayPitchAction(gameState, gameState.userTeamId);
        if (res.success && res.newState) updateState(res.newState);
        else if (res.message) alert(res.message);
    },

    promoteYouthPlayer: (id: string) => {
        if (!gameState) return;
        const res = promoteYouthAction(gameState, id);
        if (res.success && res.newState) updateState(res.newState);
    },

    rejectYouthPlayer: (id: string) => {
        if (!gameState) return;
        const res = rejectYouthAction(gameState, id);
        if (res.success && res.newState) updateState(res.newState);
    },

    respondToOffer: (id: string, accept: boolean) => {
        if (!gameState) return;
        const res = processTransferOfferAction(gameState, id, accept);
        if (res.success && res.newState) updateState(res.newState);
    },

    signPlayer: (id: string) => {
        if (!gameState || !gameState.userTeamId) return;
        const res = signPlayerAction(gameState, id, gameState.userTeamId);
        if (res.success && res.newState) updateState(res.newState);
        else if (res.message) alert(res.message);
    },

    fireAssistant: () => {
        if (!gameState || !gameState.userTeamId) return;
        const newTeams = gameState.teams.map(t => 
            t.id === gameState.userTeamId ? { ...t, assistant: undefined } : t
        );
        updateState({ ...gameState, teams: newTeams });
    },

    hireAssistant: (candidate: AssistantManager) => {
        if (!gameState || !gameState.userTeamId) return;
        const team = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (team && team.budget >= candidate.salary) {
            const newTeam = { ...team, assistant: candidate, budget: team.budget - candidate.salary };
            const newTeams = gameState.teams.map(t => t.id === team.id ? newTeam : t);
            const newCandidates = gameState.assistantCandidates.filter(c => c.id !== candidate.id);
            updateState({ ...gameState, teams: newTeams, assistantCandidates: newCandidates });
        }
    },

    updateAssistantSettings: (settings: AssistantSettings) => {
        if (!gameState || !gameState.userTeamId) return;
        const team = gameState.teams.find(t => t.id === gameState.userTeamId);
        if (team) {
            const newTeam = { ...team, assistantSettings: settings };
            const newTeams = gameState.teams.map(t => t.id === team.id ? newTeam : t);
            updateState({ ...gameState, teams: newTeams });
        }
    },

    interactWithPlayer: (id: string, action: 'praise'|'criticize'|'encourage'|'warn') => {
        if (!gameState) return;
        const res = playerInteractionAction(gameState, id, action);
        if (res.success && res.newState) updateState(res.newState);
    },

    resolvePressConference: (optionId: string) => {
        if (!gameState) return;
        const res = resolvePressConferenceAction(gameState, optionId);
        if (res.success && res.newState) updateState(res.newState);
    },

    resolveContractNegotiation: (decision: 'renew' | 'sell') => {
        if (!gameState) return;
        const res = resolveContractNegotiationAction(gameState, decision);
        if (res.success && res.newState) updateState(res.newState);
    },

    updateSettings: (settings: UserSettings) => {
        if (!gameState) return;
        updateState({ ...gameState, userSettings: settings });
    },

    resign: () => {
        if (!gameState) return;
        updateState({ ...gameState, userTeamId: null });
    },

    factoryReset: () => {
        clearSave();
        window.location.reload();
    },

    setApiKey: (key: string) => setApiKey(key),
    setGrokApiKey: (key: string) => setGrokApiKey(key),
    clearCache: () => {
        clearSave();
        window.location.reload();
    },
    forceUpdateState: (newState: GameState) => updateState(newState)
  };

  return (
    <GameContext.Provider value={{ gameState, isSimulating, loadingState, apiKey, grokApiKey, activeMatch, hasSaveFile, actions }}>
      {children}
    </GameContext.Provider>
  );
};
