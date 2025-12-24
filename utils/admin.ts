
import { GameState, Player, Team, Position } from '../types';
import { parseAdminCommand } from './textGenerator';

interface AdminResult {
    success: boolean;
    message: string;
    newState?: GameState;
}

const findPlayer = (state: GameState, name: string): Player | undefined => {
    const lower = name.toLowerCase();
    return state.players.find(p => p.name.toLowerCase().includes(lower));
};

const findTeam = (state: GameState, name: string): Team | undefined => {
    const lower = name.toLowerCase();
    // Prioritize exact match, then contains
    return state.teams.find(t => t.name.toLowerCase() === lower) || 
           state.teams.find(t => t.name.toLowerCase().includes(lower));
};

export const executeAdminCommand = async (state: GameState, command: string): Promise<AdminResult> => {
    const userTeam = state.teams.find(t => t.id === state.userTeamId);
    const context = {
        userTeam: userTeam ? userTeam.name : "Unknown",
        currentWeek: state.currentWeek
    };

    const action = await parseAdminCommand(command, context);
    
    if (!action) {
        return { success: false, message: "AI failed to interpret command." };
    }

    // Clone state for mutation
    // Note: In a real Redux setup we wouldn't JSON.parse/stringify, but for this context it ensures deep copy
    const newState: GameState = JSON.parse(JSON.stringify(state)); 

    // --- 1. UPDATE PLAYER ---
    if (action.operation === 'UPDATE_PLAYER') {
        const target = findPlayer(newState, action.targetName);
        if (!target) return { success: false, message: `Player "${action.targetName}" not found.` };

        Object.keys(action.changes).forEach(key => {
            const val = action.changes[key];
            
            // Handle stats nested object
            if (key.startsWith('stats.')) {
                const statName = key.split('.')[1];
                // Check relative math
                let finalVal = val;
                if (typeof val === 'string' && (val.startsWith('+') || val.startsWith('-'))) {
                    const current = (target.stats as any)[statName] || 0;
                    finalVal = current + parseInt(val);
                }
                
                if (target.stats.hasOwnProperty(statName)) {
                    (target.stats as any)[statName] = Number(finalVal);
                }
            } 
            // Handle top-level props
            else if (target.hasOwnProperty(key)) {
                let finalVal = val;
                if (typeof val === 'string' && (val.startsWith('+') || val.startsWith('-'))) {
                    const current = (target as any)[key] || 0;
                    finalVal = current + parseInt(val);
                }
                (target as any)[key] = finalVal;
            }
        });

        // Recalculate OVR if stats changed (simplified)
        if (Object.keys(action.changes).some(k => k.startsWith('stats.'))) {
             target.stats.ovr = Math.round((target.stats.att + target.stats.def + target.stats.mid + target.stats.pac) / 4);
        }

        return { success: true, message: `Updated ${target.name}.`, newState };
    }

    // --- 2. UPDATE TEAM ---
    if (action.operation === 'UPDATE_TEAM') {
        const target = findTeam(newState, action.targetName);
        if (!target) return { success: false, message: `Team "${action.targetName}" not found.` };

        Object.keys(action.changes).forEach(key => {
            const val = action.changes[key];
            if (target.hasOwnProperty(key)) {
                let finalVal = val;
                // Relative Math for Budget (e.g. "+50")
                if (typeof val === 'string' && (val.startsWith('+') || val.startsWith('-'))) {
                    const current = (target as any)[key] || 0;
                    finalVal = current + parseFloat(val);
                }
                (target as any)[key] = finalVal;
            }
        });

        return { success: true, message: `Updated ${target.name}. New ${Object.keys(action.changes)[0]}: ${Object.values(action.changes)[0]}`, newState };
    }

    // --- 3. TRANSFER ---
    if (action.operation === 'TRANSFER') {
        const player = findPlayer(newState, action.playerName);
        const toTeam = findTeam(newState, action.toTeam);

        if (!player) return { success: false, message: `Player "${action.playerName}" not found.` };
        if (!toTeam) return { success: false, message: `Team "${action.toTeam}" not found.` };

        const fromTeamId = player.teamId;
        const fromTeam = newState.teams.find(t => t.id === fromTeamId);

        // Update IDs
        player.teamId = toTeam.id;

        // Handle Fee (Optional)
        if (action.fee && action.fee > 0) {
            toTeam.budget -= action.fee;
            if (fromTeam) fromTeam.budget += action.fee;
        }

        return { 
            success: true, 
            message: `Transferred ${player.name} to ${toTeam.name}${action.fee ? ` for €${action.fee}M` : ''}.`, 
            newState 
        };
    }

    // --- 4. RELEASE ---
    if (action.operation === 'RELEASE') {
        const player = findPlayer(newState, action.playerName);
        if (!player) return { success: false, message: `Player "${action.playerName}" not found.` };
        
        player.teamId = 'free_agent';
        return { success: true, message: `Released ${player.name} to Free Agency.`, newState };
    }

    // --- 5. HEAL ---
    if (action.operation === 'HEAL') {
        if (action.targetName === 'ALL') {
            if (!userTeam) return { success: false, message: "No user team found." };
            newState.players.forEach(p => {
                if (p.teamId === userTeam.id) {
                    p.condition = 100;
                    p.injuryRisk = 0;
                }
            });
            return { success: true, message: `Healed entire squad for ${userTeam.name}.`, newState };
        } else {
            const player = findPlayer(newState, action.targetName);
            if (!player) return { success: false, message: `Player "${action.targetName}" not found.` };
            player.condition = 100;
            player.injuryRisk = 0;
            return { success: true, message: `${player.name} has been fully healed.`, newState };
        }
    }

    // --- 6. LIST / QUERY ---
    if (action.operation === 'LIST_PLAYERS') {
        let results = newState.players;
        const filters = action.filters || {}; // Safety check

        // Filter by Team
        if (filters.team) {
            const team = findTeam(newState, filters.team);
            if (team) {
                results = results.filter(p => p.teamId === team.id);
            } else {
                return { success: false, message: `Team "${filters.team}" not found.` };
            }
        }

        // Filter by Position
        if (filters.position) {
            results = results.filter(p => p.position === filters.position);
        }

        // Filter by Rating
        if (filters.minRating) {
            results = results.filter(p => p.stats.ovr >= filters.minRating);
        }

        // Sort by OVR desc
        results.sort((a,b) => b.stats.ovr - a.stats.ovr);

        // Limit
        const limit = action.limit || 20;
        const sliced = results.slice(0, limit);

        const listString = sliced.map(p => 
            `• ${p.name} (${p.position}) - ${p.stats.ovr} OVR - Age: ${p.age}`
        ).join('\n');

        return { 
            success: true, 
            message: `Found ${results.length} players:\n\n${listString}${results.length > limit ? `\n...and ${results.length - limit} more.` : ''}`,
            // No newState returned means no update to DB, just UI echo
        };
    }

    // --- 7. HELP ---
    if (action.operation === 'HELP') {
        const helpMsg = `
AVAILABLE COMMANDS:

💰 FINANCE
• "Give [Team] 50m" (Adds to budget)
• "Set my budget to 500m"

⚽ PLAYERS
• "Set [Player Name] pace to 99"
• "Make [Player Name] 18 years old"
• "Transfer [Player Name] to [Team Name] for 50m"
• "Release [Player Name]"

🏥 MEDICAL
• "Heal [Player Name]"
• "Heal my team" (Heals everyone)

📋 ROSTER
• "List all players at [Team]"
• "List all GK at [Team]"
• "Who is the best player at [Team]?"

Use natural language. The AI will interpret your intent.
        `;
        return { success: true, message: helpMsg };
    }

    return { success: false, message: `Operation ${action.operation} not supported yet.` };
};
