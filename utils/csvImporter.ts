
import Papa from 'papaparse';
import { RealPlayerSchema, RealWorldData, SpecificRole, Position } from '../types';
import { LEAGUES_DATA } from '../constants';

// A community-hosted mirror of the FC 24 Player Dataset (CSV)
const COMMUNITY_MIRROR_URL = 'https://raw.githubusercontent.com/pratikagrawal96/FIFA-24-Dataset/main/male_players.csv';

// --- UTILITIES ---

// Levenshtein Distance for Fuzzy Matching
const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    let i, j;
    for (i = 0; i <= b.length; i++) matrix[i] = [i];
    for (j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const normalizeString = (str: string): string => {
    const lower = str.toLowerCase();
    
    // Protection: Don't strip 'united', 'city', 'rovers' for cities with multiple teams
    const protectedCities = ['manchester', 'bristol', 'sheffield', 'milan', 'madrid'];
    const isProtected = protectedCities.some(city => lower.includes(city));

    let processed = lower.replace(/[0-9]/g, ''); // Remove numbers

    if (!isProtected) {
        // Strip generic suffixes only if NOT a protected city
        processed = processed.replace(/ fc| cf| afc| sc| ud| cd| sv| united| utd| city| town| rovers| hotspur| albion| athletic/g, '');
    } else {
        // For protected cities, only strip truly generic fluff, keep the identifiers
        processed = processed.replace(/ fc| cf| afc| sc| ud| cd| sv/g, '');
    }

    return processed.replace(/[^a-z]/g, '').trim();
};

const findMatchingTeam = (csvTeamName: string, gameTeams: any[]) => {
    if (!csvTeamName) return null;
    
    let cleanCSV = csvTeamName.trim();

    // 0. Expansion: Handle "Utd" / "Utd." -> "United" robustly (case insensitive)
    cleanCSV = cleanCSV.replace(/\bUtd\.?\b/gi, 'United');

    // 1. Specific Overrides for Common Mismatches (Kaggle CSV specific)
    const OVERRIDES: Record<string, string> = {
        // England
        "Manchester Utd": "Manchester United",
        "Man Utd": "Manchester United",
        "Man United": "Manchester United",
        "Newcastle Utd": "Newcastle United",
        "Nott'ham Forest": "Nottingham Forest",
        "Nott'm Forest": "Nottingham Forest",
        "Sheffield Utd": "Sheffield Utd", // Matches game data
        "Sheffield United": "Sheffield Utd",
        "Spurs": "Tottenham",
        "Tottenham Hotspur": "Tottenham",
        "West Ham United": "West Ham",
        "Brighton & Hove Albion": "Brighton",
        "Luton": "Luton Town",
        
        // Spain
        "Barcelona": "FC Barcelona",
        "Betis": "Real Betis",
        "Girona": "Girona FC",
        "Las Palmas": "UD Las Palmas",
        "Mallorca": "RCD Mallorca",
        "Osasuna": "CA Osasuna",
        "Sevilla": "Sevilla FC",
        "Valencia": "Valencia CF",
        "Villarreal": "Villarreal CF",
        "Athletic Club": "Athletic Club", // Exact match
        "Atletico Madrid": "Atlético Madrid",
        
        // Italy
        "Inter": "Inter Milan",
        "Internazionale": "Inter Milan",
        "Milan": "AC Milan",
        "Hellas Verona": "Verona",
        
        // Germany
        "Leverkusen": "Bayer Leverkusen",
        "Gladbach": "M'gladbach",
        "Monchengladbach": "M'gladbach",
        "Borussia Monchengladbach": "M'gladbach",
        "Eint Frankfurt": "Eintracht Frankfurt",
        "Mainz 05": "Mainz 05",
        
        // France
        "Paris S-G": "PSG",
        "Paris Saint-Germain": "PSG",
        "Saint-Étienne": "Saint-Étienne", // Special char handling
        "St Etienne": "Saint-Étienne"
    };

    if (OVERRIDES[cleanCSV] || OVERRIDES[csvTeamName]) {
        const target = OVERRIDES[cleanCSV] || OVERRIDES[csvTeamName];
        const match = gameTeams.find(t => t.name === target);
        if (match) return match;
    }

    // 2. Direct Match (Case Insensitive)
    const directMatch = gameTeams.find(t => t.name.toLowerCase() === cleanCSV.toLowerCase());
    if (directMatch) return directMatch;

    // 3. Normalized Match
    const normCSV = normalizeString(cleanCSV);
    
    // Safety: If normalization reduced string too much (e.g. "FC City" -> ""), skip
    if (normCSV.length > 2) {
        // Exact normalized match
        const normMatch = gameTeams.find(t => normalizeString(t.name) === normCSV);
        if (normMatch) return normMatch;
    }

    // 4. Fuzzy Match (Levenshtein)
    let bestMatch = null;
    let bestDist = 100;

    for (const team of gameTeams) {
        const normGame = normalizeString(team.name);
        if (normGame.length < 3) continue; 

        const dist = levenshtein(normCSV, normGame);
        
        // Dynamic threshold based on length
        const threshold = Math.max(2, Math.floor(normGame.length / 4));
        
        if (dist < bestDist && dist <= threshold) {
            bestDist = dist;
            bestMatch = team;
        }
    }

    return bestMatch;
};

// COLUMN MAPPING CONFIG
const FIELD_KEYS = {
    NAME: ['Player', 'player', 'short_name', 'long_name', 'name', 'full_name'],
    CLUB: ['Squad', 'squad', 'Team', 'team', 'club', 'Club'],
    POSITION: ['Pos', 'pos', 'Position', 'position'],
    AGE: ['Age', 'age'],
    NATION: ['Nation', 'nation', 'nationality', 'Country'],
    HEIGHT: ['Height', 'height', 'cm', 'HT', 'ht'],
    
    // Stats for Calculation
    MIN: ['Min', 'minutes', 'MP', 'mp'], // Minutes Played
    GLS: ['Gls', 'goals', 'Goals'],
    AST: ['Ast', 'assists', 'Assists'],
    TKL: ['Tkl', 'Tackles', 'tackles', 'TklW'],
    INT: ['Int', 'Interceptions', 'interceptions'],
    SAVES: ['Saves', 'saves'],
    CS: ['CS', 'Clean Sheets', 'clean_sheets']
};

interface CSVRow {
    [key: string]: string | undefined;
}

const getValue = (row: CSVRow, keys: string[]): string | undefined => {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
        const keyLower = key.toLowerCase();
        const found = Object.keys(row).find(k => k.toLowerCase() === keyLower);
        if (found && row[found]) return row[found];
    }
    return undefined;
};

const mapPosition = (pos: string): { pos: string, role: SpecificRole } => {
    if (!pos) return { pos: Position.MID, role: 'Box to Box' };
    
    const p = pos.toUpperCase().replace(/\s/g, ''); 
    
    // Priority 1: Dual positions affecting squad balance (e.g., Rashford "MF,FW")
    if (p.includes('MF') && p.includes('FW')) {
        return { pos: Position.FWD, role: 'Winger' };
    }
    if (p.includes('FW') && p.includes('MF')) {
        return { pos: Position.FWD, role: 'Inside Forward' };
    }
    if (p.includes('DF') && p.includes('MF')) {
        return { pos: Position.DEF, role: 'Ball Playing Defender' };
    }
    if (p.includes('MF') && p.includes('DF')) {
        return { pos: Position.MID, role: 'Anchor' };
    }

    // Priority 2: Specific Codes
    if (p === 'GK') return { pos: Position.GK, role: 'Goalkeeper' };
    if (p === 'DF') return { pos: Position.DEF, role: 'Stopper' };
    if (p === 'MF') return { pos: Position.MID, role: 'Box to Box' };
    if (p === 'FW') return { pos: Position.FWD, role: 'Poacher' };

    // Priority 3: Loose Matching
    if (p.includes('GK')) return { pos: Position.GK, role: 'Goalkeeper' };
    
    if (p.includes('CB')) return { pos: Position.DEF, role: 'Stopper' };
    if (p.includes('LB') || p.includes('RB') || p.includes('WB')) return { pos: Position.DEF, role: 'Full Back' };
    
    if (p.includes('DM')) return { pos: Position.MID, role: 'Anchor' };
    if (p.includes('AM')) return { pos: Position.MID, role: 'Playmaker' };
    if (p.includes('RM') || p.includes('LM') || p.includes('WINGER')) return { pos: Position.MID, role: 'Winger' }; // Usually wide mid
    if (p.includes('CM')) return { pos: Position.MID, role: 'Box to Box' };
    
    if (p.includes('ST') || p.includes('CF')) return { pos: Position.FWD, role: 'Poacher' };
    if (p.includes('RW') || p.includes('LW')) return { pos: Position.FWD, role: 'Winger' };

    // Fallbacks
    if (p.includes('DF')) return { pos: Position.DEF, role: 'Stopper' };
    if (p.includes('MF')) return { pos: Position.MID, role: 'Box to Box' };
    if (p.includes('FW')) return { pos: Position.FWD, role: 'Target Man' };
    
    // Default to MID if ambiguous
    return { pos: Position.MID, role: 'Box to Box' };
};

const mapNationality = (nat: string): string => {
    if (!nat) return 'EUR';
    const match = nat.match(/[A-Z]{3}/);
    if (match) return match[0];
    
    const parts = nat.split(' ');
    const code = parts.find(p => p === p.toUpperCase() && p.length === 3);
    if (code) return code;

    return nat.substring(0, 3).toUpperCase();
};

// --- RATING ENGINE ---

const calculateRating = (row: CSVRow, pos: string, teamTier: number): { ovr: number, stats: any } => {
    const parseStat = (keys: string[]) => {
        const val = getValue(row, keys);
        if (!val) return 0;
        return parseInt(val.replace(/,/g, ''), 10) || 0;
    };

    const min = parseStat(FIELD_KEYS.MIN);
    const gls = parseStat(FIELD_KEYS.GLS);
    const ast = parseStat(FIELD_KEYS.AST);
    
    let base = teamTier === 1 ? 76 : 68;

    if (min > 0) {
        if (min < 500) base -= 8;
        else if (min < 1500) base -= 4;
        else if (min > 2500) base += 3;
    } else {
        base -= 5; 
    }

    let performanceBonus = 0;

    if (pos === 'FWD') {
        const goalContribution = gls + (ast * 0.5);
        if (goalContribution > 20) performanceBonus += 8;
        else if (goalContribution > 15) performanceBonus += 6;
        else if (goalContribution > 10) performanceBonus += 4;
        else if (goalContribution > 5) performanceBonus += 2;
        if (gls > 25) performanceBonus += 4;
    } 
    else if (pos === 'MID') {
        const contributions = ast + (gls * 0.5);
        if (contributions > 15) performanceBonus += 7;
        else if (contributions > 10) performanceBonus += 5;
        else if (contributions > 5) performanceBonus += 2;
        if (min > 3000) performanceBonus += 2;
    } 
    else if (pos === 'DEF') {
        if (min > 2500) performanceBonus += 4;
        if (gls > 3) performanceBonus += 2;
    }
    else if (pos === 'GK') {
        if (min > 3000) performanceBonus += 4;
    }

    let ovr = Math.round(base + performanceBonus);
    if (teamTier === 2) ovr = Math.min(84, ovr);
    ovr = Math.max(55, Math.min(94, ovr)); 

    let att = 50, def = 50, mid = 50, pac = 65, gk = 10;

    if (pos === 'FWD') {
        att = ovr + 2; mid = ovr - 8; def = ovr - 35; pac = ovr + 2;
    } else if (pos === 'MID') {
        mid = ovr + 2; att = ovr - 8; def = ovr - 8; pac = ovr - 5;
    } else if (pos === 'DEF') {
        def = ovr + 2; mid = ovr - 12; att = ovr - 40; pac = ovr - 8;
    } else if (pos === 'GK') {
        gk = ovr; att = 20; def = 45; mid = 45; pac = 40;
    }

    const noise = () => Math.floor(Math.random() * 6) - 3;
    att += noise(); def += noise(); mid += noise(); pac += noise();

    return {
        ovr,
        stats: { 
            att: Math.min(99, Math.max(1, att)), 
            def: Math.min(99, Math.max(1, def)), 
            mid: Math.min(99, Math.max(1, mid)), 
            pac: Math.min(99, Math.max(1, pac)), 
            gk: Math.min(99, Math.max(1, gk)), 
            ovr 
        }
    };
};

const processCSVData = (data: CSVRow[]): RealWorldData => {
    const result: RealWorldData = {};
    const gameTeams = Object.values(LEAGUES_DATA).flatMap(l => l.teams);
    
    // PRE-PROCESSING: Deduplication & Cleaning
    // Map key: "Name_Nationality" -> CSVRow
    // We prioritize rows with higher 'Min' (Minutes Played) to handle loans/transfers
    const uniquePlayers = new Map<string, CSVRow>();

    data.forEach(row => {
        const name = getValue(row, FIELD_KEYS.NAME);
        
        // Filter garbage/header rows
        if (!name || name === 'Player' || name === 'player' || name === 'Rk') return;

        const nationRaw = getValue(row, FIELD_KEYS.NATION) || '';
        const nationCode = mapNationality(nationRaw);
        const key = `${name}_${nationCode}`;

        const minsStr = getValue(row, FIELD_KEYS.MIN);
        const currentMins = minsStr ? parseInt(minsStr.replace(/,/g, ''), 10) : 0;

        if (uniquePlayers.has(key)) {
            const existingRow = uniquePlayers.get(key)!;
            const existingMinsStr = getValue(existingRow, FIELD_KEYS.MIN);
            const existingMins = existingMinsStr ? parseInt(existingMinsStr.replace(/,/g, ''), 10) : 0;

            // Update if current row has significantly more minutes (main club)
            if (currentMins > existingMins) {
                uniquePlayers.set(key, row);
            }
        } else {
            uniquePlayers.set(key, row);
        }
    });

    let matchedCount = 0;
    let newTeamCount = 0;

    uniquePlayers.forEach(row => {
        const clubName = getValue(row, FIELD_KEYS.CLUB);
        if (!clubName) return;

        const matchedTeam = findMatchingTeam(clubName, gameTeams);
        const teamKey = matchedTeam ? matchedTeam.name : clubName;
        const tier = matchedTeam ? matchedTeam.tier : 2;

        if (!matchedTeam && !result[teamKey]) {
            newTeamCount++;
        }

        const name = getValue(row, FIELD_KEYS.NAME) || 'Unknown Player';
        const posRaw = getValue(row, FIELD_KEYS.POSITION) || 'MID';
        const { pos, role } = mapPosition(posRaw);
        const age = parseInt(getValue(row, FIELD_KEYS.AGE) || '22');
        const nat = mapNationality(getValue(row, FIELD_KEYS.NATION) || '');
        
        let height = 180;
        const heightRaw = getValue(row, FIELD_KEYS.HEIGHT);
        if (heightRaw) {
            const h = parseInt(heightRaw.replace(/[^0-9]/g, ''));
            if (h > 100 && h < 220) height = h;
        }

        const ratingData = calculateRating(row, pos, tier);

        const player: RealPlayerSchema = {
            n: name,
            p: pos,
            a: isNaN(age) ? 22 : age,
            r: ratingData.ovr,
            nat: nat,
            h: height,
            role: role,
            detailedStats: ratingData.stats
        };

        if (!result[teamKey]) {
            result[teamKey] = [];
        }
        result[teamKey].push(player);
        matchedCount++;
    });

    console.log(`CSV Import Report:
    - Rows Processed: ${data.length}
    - Unique Players: ${matchedCount}
    - Matched Teams: ${Object.keys(result).filter(k => gameTeams.some(t=>t.name === k)).length}
    - New Generic Teams: ${Object.keys(result).filter(k => !gameTeams.some(t=>t.name === k)).length}
    `);

    return result;
};

export const parseImportData = (file: File): Promise<RealWorldData> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const data = processCSVData(results.data as CSVRow[]);
                    if (Object.keys(data).length === 0) {
                        reject(new Error("No valid data found. Ensure CSV has 'Squad' and 'Player' columns."));
                    } else {
                        resolve(data);
                    }
                } catch (e) {
                    reject(e);
                }
            },
            error: (error) => reject(error)
        });
    });
};

export const fetchCommunityData = async (): Promise<RealWorldData> => {
    try {
        const response = await fetch(COMMUNITY_MIRROR_URL);
        if (!response.ok) throw new Error("Failed to download database.");
        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = processCSVData(results.data as CSVRow[]);
                    resolve(data);
                },
                error: (error) => reject(error)
            });
        });
    } catch (e: any) {
        throw e;
    }
};
