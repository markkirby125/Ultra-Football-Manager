
import { GameState } from '../types';
import { dbService } from './db';

// Legacy keys for migration
const LEGACY_KEY = 'ufd_v1_save';

export const saveGame = async (state: GameState) => {
  try {
    await dbService.saveState(state);
  } catch (e) {
    console.error("IDB Save failed", e);
    // Fallback?
  }
};

export const loadGame = async (): Promise<GameState | null> => {
  try {
    // Check for legacy localStorage save
    const legacyJson = localStorage.getItem(LEGACY_KEY);
    if (legacyJson) {
        console.log("Migrating legacy save...");
        const legacyState = JSON.parse(legacyJson);
        await dbService.saveState(legacyState);
        localStorage.removeItem(LEGACY_KEY); // Clear after migrate
        return legacyState;
    }

    return await dbService.loadState();
  } catch (e) {
    console.error("Load failed", e);
    return null;
  }
};

export const clearSave = async () => {
    localStorage.removeItem(LEGACY_KEY);
    await dbService.clearDB();
};
