
import { GameState } from '../types';

const DB_NAME = 'FootballManagerDB';
const DB_VERSION = 1;

export const DB_STORES = {
    META: 'meta',
    TEAMS: 'teams',
    PLAYERS: 'players',
    FIXTURES: 'fixtures',
    HISTORY: 'history'
};

class GameDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = request.result;
                
                // Meta store (Single object for global state)
                if (!db.objectStoreNames.contains(DB_STORES.META)) {
                    db.createObjectStore(DB_STORES.META, { keyPath: 'key' });
                }

                // Teams store
                if (!db.objectStoreNames.contains(DB_STORES.TEAMS)) {
                    const store = db.createObjectStore(DB_STORES.TEAMS, { keyPath: 'id' });
                    store.createIndex('country', 'country', { unique: false });
                    store.createIndex('division', 'division', { unique: false });
                }

                // Players store
                if (!db.objectStoreNames.contains(DB_STORES.PLAYERS)) {
                    const store = db.createObjectStore(DB_STORES.PLAYERS, { keyPath: 'id' });
                    store.createIndex('teamId', 'teamId', { unique: false });
                }

                // Fixtures store
                if (!db.objectStoreNames.contains(DB_STORES.FIXTURES)) {
                    const store = db.createObjectStore(DB_STORES.FIXTURES, { keyPath: 'id' });
                    store.createIndex('week', 'week', { unique: false });
                    store.createIndex('leagueId', 'leagueId', { unique: false });
                }

                // History store
                if (!db.objectStoreNames.contains(DB_STORES.HISTORY)) {
                    db.createObjectStore(DB_STORES.HISTORY, { autoIncrement: true });
                }
            };
        });
    }

    async saveState(state: GameState): Promise<void> {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DB_STORES.META, DB_STORES.TEAMS, DB_STORES.PLAYERS, DB_STORES.FIXTURES], 'readwrite');
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            // Save Meta (Lightweight)
            const metaStore = transaction.objectStore(DB_STORES.META);
            const metaData = {
                key: 'gameState',
                currentWeek: state.currentWeek,
                totalWeeks: state.totalWeeks,
                userTeamId: state.userTeamId,
                news: state.news,
                transferList: state.transferList,
                assistantCandidates: state.assistantCandidates,
                pendingOffers: state.pendingOffers,
                userSettings: state.userSettings,
                activePressConference: state.activePressConference,
                activeContractNegotiation: state.activeContractNegotiation,
                managers: state.managers,
                referees: state.referees,
                dbVersion: state.dbVersion
            };
            metaStore.put(metaData);

            // Save Teams (Bulk)
            const teamStore = transaction.objectStore(DB_STORES.TEAMS);
            state.teams.forEach(t => teamStore.put(t));

            // Save Players (Bulk)
            const playerStore = transaction.objectStore(DB_STORES.PLAYERS);
            state.players.forEach(p => playerStore.put(p));

            // Save Fixtures (Bulk)
            const fixtureStore = transaction.objectStore(DB_STORES.FIXTURES);
            state.fixtures.forEach(f => fixtureStore.put(f));
        });
    }

    async loadState(): Promise<GameState | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([DB_STORES.META, DB_STORES.TEAMS, DB_STORES.PLAYERS, DB_STORES.FIXTURES], 'readonly');
            
            const metaReq = transaction.objectStore(DB_STORES.META).get('gameState');
            const teamsReq = transaction.objectStore(DB_STORES.TEAMS).getAll();
            const playersReq = transaction.objectStore(DB_STORES.PLAYERS).getAll();
            const fixturesReq = transaction.objectStore(DB_STORES.FIXTURES).getAll();

            transaction.oncomplete = () => {
                if (!metaReq.result) {
                    resolve(null);
                    return;
                }
                
                const meta = metaReq.result;
                const state: GameState = {
                    currentWeek: meta.currentWeek,
                    totalWeeks: meta.totalWeeks,
                    userTeamId: meta.userTeamId,
                    teams: teamsReq.result,
                    players: playersReq.result,
                    fixtures: fixturesReq.result,
                    managers: meta.managers || [],
                    referees: meta.referees || [],
                    news: meta.news || [],
                    transferList: meta.transferList || [],
                    assistantCandidates: meta.assistantCandidates || [],
                    pendingOffers: meta.pendingOffers || [],
                    userSettings: meta.userSettings || { audioEnabled: true, motionEffectsEnabled: true },
                    activePressConference: meta.activePressConference,
                    activeContractNegotiation: meta.activeContractNegotiation,
                    dbVersion: meta.dbVersion || 1
                };
                resolve(state);
            };
            
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async clearDB(): Promise<void> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction([DB_STORES.META, DB_STORES.TEAMS, DB_STORES.PLAYERS, DB_STORES.FIXTURES], 'readwrite');
        transaction.objectStore(DB_STORES.META).clear();
        transaction.objectStore(DB_STORES.TEAMS).clear();
        transaction.objectStore(DB_STORES.PLAYERS).clear();
        transaction.objectStore(DB_STORES.FIXTURES).clear();
        return new Promise((resolve) => {
            transaction.oncomplete = () => resolve();
        });
    }
}

export const dbService = new GameDB();
