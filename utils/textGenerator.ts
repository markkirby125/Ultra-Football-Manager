
import { GoogleGenAI } from "@google/genai";
import { GameState, NewsItem } from '../types';
import { getRandom } from '../constants';

export const STALKER_TEMPLATES = [
    "Saw {target} at a cafe looking stressed. Transfer incoming?",
    "Just bumped into {target} at the airport! Where is he going?",
    "{target} spotted leaving the training ground early today.",
    "Heard rumors that {target} had a bust-up with the manager."
];

let ai: GoogleGenAI | null = null;

export const configureAI = (apiKey: string) => {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
};

export const testGeminiConnection = async (key?: string): Promise<boolean> => {
    try {
        const activeKey = key || process.env.API_KEY; // Fallback only if available
        if (!activeKey) return false;
        
        const tempAI = new GoogleGenAI({ apiKey: activeKey });
        // Simple test call
        await tempAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello',
        });
        
        // If passed, set global instance
        ai = tempAI;
        return true;
    } catch (e) {
        console.error("Gemini Connection Failed", e);
        return false;
    }
};

export const testGrokConnection = async (key?: string): Promise<boolean> => {
    // Mock implementation as Grok is optional/external
    if (key && key.startsWith('xai-')) return true;
    return false;
};

export const parseKeysFromFile = (text: string) => {
    const geminiMatch = text.match(/gemini_api="([^"]+)"/);
    const grokMatch = text.match(/grok_api="([^"]+)"/);
    return {
        gemini: geminiMatch ? geminiMatch[1] : null,
        grok: grokMatch ? grokMatch[1] : null
    };
};

export const generateAssistantAdvice = async (gameState: GameState): Promise<string> => {
    if (!ai) return "Focus on keeping possession and waiting for opportunities.";
    
    // Placeholder for actual AI call
    return "The opponent is vulnerable on the counter. Exploit their high line.";
};

export const generateLongFormArticle = async (gameState: GameState, newsItem: NewsItem): Promise<string | null> => {
    if (!ai || !newsItem.matchId) return null;

    try {
        const match = gameState.fixtures.find(f => f.result && f.result.matchId === newsItem.matchId)?.result;
        if (!match) return null;

        const prompt = `
            Write a passionate sports journalism article about this match:
            Home: ${match.homeScore} - Away: ${match.awayScore}
            Key Events: ${match.events.map(e => `${e.minute}' ${e.type} by ${e.playerName}`).join(', ')}
            Headline: ${newsItem.headline}
            
            Style: Sensationalist, dramatic, immersive.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text || newsItem.body;
    } catch (e) {
        console.error("Article Generation Failed", e);
        return null;
    }
};

export const generateStalkerPost = (): string => {
    return getRandom(STALKER_TEMPLATES);
};

export const parseAdminCommand = async (command: string, context: { userTeam: string, currentWeek: number }): Promise<any | null> => {
    if (!ai) return null;

    const prompt = `
        You are a Game Master for a football management simulator.
        Interpret the user's natural language request and return a JSON object to modify the game state.

        **Context:**
        - User's Team: "${context.userTeam}"
        - Current Week: ${context.currentWeek}
        - If user says "my team", "us", "we", apply to "${context.userTeam}".
        - If the user asks for help, list commands, or how to use the console, return operation "HELP".

        **Supported Operations:**

        1. UPDATE_PLAYER
        Target specific player stats (att, def, mid, pac, gk, ovr), condition (0-100), injuryRisk (0-100), morale (0-100), age, value, potential.
        {
            "operation": "UPDATE_PLAYER",
            "targetName": "String (Player Name)",
            "changes": { "field": value } 
        }

        2. UPDATE_TEAM
        Modify budget, name, stadium capacity.
        *IMPORTANT*: For budget, use strings starting with "+" or "-" for relative changes (e.g. "+50", "-10"). Use numbers for absolute sets (e.g. 500).
        {
            "operation": "UPDATE_TEAM",
            "targetName": "String (Team Name)",
            "changes": { "field": value }
        }

        3. TRANSFER
        Move a player to a different team.
        {
            "operation": "TRANSFER",
            "playerName": "String",
            "toTeam": "String (Team Name)",
            "fee": number (optional, default 0)
        }

        4. RELEASE
        Release a player to free agency.
        {
            "operation": "RELEASE",
            "playerName": "String"
        }

        5. HEAL
        Restore condition to 100 and remove injury risk.
        {
            "operation": "HEAL",
            "targetName": "String (Player Name) OR 'ALL'"
        }

        6. LIST_PLAYERS
        Query the database.
        {
            "operation": "LIST_PLAYERS",
            "filters": {
                "team": "String (optional)",
                "position": "GK/DEF/MID/FWD (optional)",
                "minRating": number (optional)
            },
            "limit": number (default 20)
        }

        7. HELP
        List available commands.
        {
            "operation": "HELP"
        }

        **User Request:** "${command}"
        
        Return ONLY the JSON object. No markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Admin Command Error", e);
        return null;
    }
};
