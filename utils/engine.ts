
import { 
    Team, Player, Fixture, MatchResult, GameState, 
    MatchStats, PlayerMatchStats, Referee, NewsItem,
    TransferOffer, ContractNegotiation, Division,
    Position, TeamFinancials, AssistantManager,
    RealWorldData, SpecificRole,
    TrainingFocus, AssistantMatchReport, MatchEvent, PitchState, TeamCrest,
    SocialPost, SeasonSummary, PressConference
} from '../types';
import { 
    TEAMS_DATA, LEAGUES_DATA, REFEREE_NAMES, 
    randInt, getRandom, SEASON_START_DATE,
    NAMES_BY_NATION, NATIONALITIES, WEATHER_EFFECTS, PITCH_EFFECTS, ZONE_VALUES, FORMATIONS
} from '../constants';

// --- ENGINE CONSTANTS ---
export const TOTAL_WEEKS = 38;
const STARTING_BUDGET_MODIFIER = 1.0;

// --- UTILITY HELPERS ---

export const generateName = (natCode: string): string => {
    let poolKey = natCode;
    if (['IRE', 'SCO', 'WAL', 'USA', 'AUS', 'JAM', 'GHA', 'NGA'].includes(natCode)) poolKey = 'ENG';
    else if (['AUT', 'SUI', 'NED', 'DEN', 'NOR', 'SWE'].includes(natCode)) poolKey = 'GER';
    else if (['ARG', 'COL', 'URU', 'MEX'].includes(natCode)) poolKey = 'ESP';
    else if (['BRA', 'POR'].includes(natCode)) poolKey = 'ESP';
    else if (['SEN', 'CIV', 'ALG', 'MAR', 'CMR', 'MLI'].includes(natCode)) poolKey = 'AFR';
    else if (['TUR'].includes(natCode)) poolKey = 'TUR';
    else if (['CRO', 'SRB', 'ALB', 'ROU'].includes(natCode)) poolKey = 'SLA';
    else if (!NAMES_BY_NATION[natCode]) poolKey = 'WLD';

    const pool = NAMES_BY_NATION[poolKey] || NAMES_BY_NATION['WLD'];
    return `${getRandom(pool.first)} ${getRandom(pool.last)}`;
};

export const getWeightedNationality = (leagueCode: string): string => {
    const rand = Math.random();

    if (leagueCode === 'ENG') {
        if (rand < 0.58) return 'ENG';
        if (rand < 0.90) return getRandom(['IRE', 'SCO', 'WAL', 'NED', 'FRA', 'POR', 'DEN', 'NOR', 'SWE']);
        return getRandom(['NGA', 'JAM', 'GHA', 'BRA', 'USA', 'ARG']);
    }
    if (leagueCode === 'ESP') {
        if (rand < 0.62) return 'ESP';
        if (rand < 0.87) return getRandom(['FRA', 'POR', 'ITA']);
        return getRandom(['MAR', 'ARG', 'BRA', 'COL', 'URU', 'SEN']);
    }
    if (leagueCode === 'FRA') {
        if (rand < 0.52) return 'FRA';
        if (rand < 0.77) return getRandom(['BEL', 'POR', 'SUI', 'ESP']);
        return getRandom(['SEN', 'CIV', 'ALG', 'MAR', 'CMR', 'MLI']);
    }
    if (leagueCode === 'ITA') {
        if (rand < 0.68) return 'ITA';
        if (rand < 0.88) return getRandom(['ALB', 'CRO', 'ROU', 'FRA', 'SUI', 'SRB', 'POL']);
        return getRandom(['BRA', 'ARG', 'NGA', 'USA']);
    }
    if (leagueCode === 'GER') {
        if (rand < 0.62) return 'GER';
        if (rand < 0.87) return getRandom(['AUT', 'NED', 'POL', 'DEN', 'SUI', 'FRA']);
        return getRandom(['TUR', 'BRA', 'SRB', 'JPN', 'USA']);
    }

    return getRandom(NATIONALITIES).code;
};

export const generateWeather = (climate: string, week: number, seed: string): 'Clear' | 'Cloudy' | 'Rain' | 'Heavy Rain' | 'Snow' | 'Windy' => {
    let baseProb = { clear: 0.4, cloudy: 0.3, rain: 0.2, snow: 0.0, windy: 0.1 };
    
    if (week >= 13 && week <= 24) { // Winter
        if (climate === 'Continental') baseProb = { clear: 0.2, cloudy: 0.4, rain: 0.1, snow: 0.2, windy: 0.1 };
        if (climate === 'Atlantic') baseProb = { clear: 0.1, cloudy: 0.3, rain: 0.4, snow: 0.05, windy: 0.15 };
    }
    
    if (climate === 'Mediterranean') {
        baseProb.clear += 0.2;
        baseProb.rain -= 0.1;
        baseProb.snow = 0;
    }

    const rand = Math.random();
    if (rand < baseProb.clear) return 'Clear';
    if (rand < baseProb.clear + baseProb.cloudy) return 'Cloudy';
    if (rand < baseProb.clear + baseProb.cloudy + baseProb.rain) return Math.random() < 0.3 ? 'Heavy Rain' : 'Rain';
    if (rand < baseProb.clear + baseProb.cloudy + baseProb.rain + baseProb.snow) return 'Snow';
    return 'Windy';
};

export const formatCompactNumber = (number: number) => {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(number);
};

export const getDateFromWeek = (week: number) => {
    const d = new Date(SEASON_START_DATE);
    d.setDate(d.getDate() + (week - 1) * 7);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const isTransferWindowOpen = (week: number) => {
    return (week <= 4) || (week >= 20 && week <= 24);
};

export const generateProceduralCrest = (name: string, color: string, accent: string): TeamCrest => {
    const hash = name.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
    const shapes = ['shield', 'round', 'crest', 'diamond', 'hexagon', 'star'] as const;
    const patterns = ['solid', 'stripes', 'hoops', 'half', 'quarters', 'cross', 'sash', 'checkered'] as const;
    const icons = ['crown', 'ball', 'star', 'tower', 'shield', 'sword', 'anchor', 'eagle', 'lion', 'wings', 'tree', 'horse', 'bat', 'bird', 'cross', 'wolf', 'lily', 'bull', 'bear', 'skull', 'dog', 'ship', 'dragon', 'tiger', 'moose', 'rose', 'owl', 'lamb', 'animal', 'fish', 'lady', 'castle', 'ladder', 'church', 'arm', 'sailor', 'fort', 'cock', 'seahorse', 'wasp', 'wheel', 'leaf', 'hammer', 'none'] as const;

    return {
        shape: shapes[hash % shapes.length],
        pattern: patterns[(hash * 2) % patterns.length],
        icon: icons[(hash * 3) % icons.length],
        color1: color,
        color2: accent
    };
};

export const autoFillLineup = (team: Team, players: Player[]) => {
    const available = [...players].sort((a,b) => b.stats.ovr - a.stats.ovr);
    const formation = FORMATIONS[team.tactics.formation as keyof typeof FORMATIONS] || FORMATIONS['4-4-2'];
    
    const gk = available.find(p => p.position === Position.GK);
    const defs = available.filter(p => p.position === Position.DEF && p.id !== gk?.id).slice(0, formation.def);
    const mids = available.filter(p => p.position === Position.MID && p.id !== gk?.id).slice(0, formation.mid);
    const fwds = available.filter(p => p.position === Position.FWD && p.id !== gk?.id).slice(0, formation.fwd);
    
    const selected = [gk, ...defs, ...mids, ...fwds].filter(Boolean) as Player[];
    if (selected.length < 11) {
        const remaining = available.filter(p => !selected.includes(p)).slice(0, 11 - selected.length);
        selected.push(...remaining);
    }
    
    team.tactics.lineup = selected.map(p => p.id);
};

// --- INITIALIZATION ---

const generateLeagueFixturesInternal = (teams: Team[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const leagues = Array.from(new Set(teams.map(t => t.country)));

    leagues.forEach(leagueCode => {
        const div1Teams = teams.filter(t => t.country === leagueCode && t.division === Division.First);
        const div2Teams = teams.filter(t => t.country === leagueCode && t.division === Division.Second);
        
        const processGroup = (group: Team[]) => {
            if (group.length < 2) return;
            const rounds = group.length - 1; 
            const halfSize = group.length / 2;
            const teamIds = group.map(t => t.id);
            
            for (let round = 0; round < rounds * 2; round++) {
                const week = round + 1;
                for (let i = 0; i < halfSize; i++) {
                    const homeIdx = (round + i) % (group.length - 1);
                    const awayIdx = (group.length - 1 - i + round) % (group.length - 1);
                    
                    let homeId = teamIds[homeIdx];
                    let awayId = teamIds[awayIdx];
                    
                    if (i === 0) awayId = teamIds[group.length - 1];

                    if (round >= rounds) {
                        const temp = homeId; homeId = awayId; awayId = temp;
                    }

                    fixtures.push({
                        id: `fix_${leagueCode}_${week}_${homeId}_${awayId}_${Date.now()}`,
                        week,
                        leagueId: leagueCode,
                        homeTeamId: homeId,
                        awayTeamId: awayId,
                        refereeId: 'ref_0'
                    });
                }
            }
        };

        processGroup(div1Teams);
        processGroup(div2Teams);
    });
    
    return fixtures;
};

export const initializeNewGame = async (
    realData?: RealWorldData, 
    onProgress?: (msg: string) => void
): Promise<GameState> => {
    
    const createdPlayersSig = new Set<string>();
    const teams: Team[] = [];
    const players: Player[] = [];
    const managers: any[] = [];
    const referees: Referee[] = [];

    const leagues = Object.values(LEAGUES_DATA);
    let currentStep = 0;

    for (const league of leagues) {
        for (const teamData of league.teams) {
            currentStep++;
            if (onProgress) onProgress(`Generating ${teamData.name}...`);

            const teamId = teamData.name.replace(/\s/g, '').toLowerCase() + '_' + randInt(1000,9999);
            const division = teamData.tier === 1 ? Division.First : Division.Second;
            
            const teamPlayers: Player[] = [];
            const realRoster = realData?.[teamData.name] || [];
            
            if (realRoster.length > 0) {
                realRoster.forEach((rp, idx) => {
                    const sig = `${rp.n}_${rp.nat}`;
                    if (!createdPlayersSig.has(sig)) {
                        teamPlayers.push(createPlayerFromReal(rp, teamId, teamData.name));
                        createdPlayersSig.add(sig);
                    }
                });
                
                if (teamPlayers.length < 22) {
                    const needed = 22 - teamPlayers.length;
                    for(let i=0; i<needed; i++) {
                        const p = createFictionalPlayer(teamId, division, league.code);
                        teamPlayers.push(p);
                        createdPlayersSig.add(`${p.name}_${p.nationality}`);
                    }
                }
            } else {
                const positions = [
                    ...Array(3).fill(Position.GK),
                    ...Array(7).fill(Position.DEF),
                    ...Array(7).fill(Position.MID),
                    ...Array(5).fill(Position.FWD)
                ];
                positions.forEach(pos => {
                    const p = createFictionalPlayer(teamId, division, league.code, pos);
                    teamPlayers.push(p);
                });
            }

            const avgOvr = Math.round(teamPlayers.reduce((a,b) => a + b.stats.ovr, 0) / teamPlayers.length);
            const mgrId = `mgr_${teamId}`;
            managers.push({
                id: mgrId,
                name: teamData.manager,
                teamId: teamId,
                rating: avgOvr + randInt(-5, 5),
                style: getRandom(['Attacking', 'Defensive', 'Possession', 'Counter', 'High Press']),
                stats: { won: 0, drawn: 0, lost: 0 },
                followers: randInt(5000, 5000000),
                following: randInt(10, 500),
                mentalHealth: randInt(70, 100),
                socialFeed: [],
                approval: { board: 70, fans: 70 },
                tacticalAptitude: randInt(10, 20)
            });

            const teamCrest = teamData.crest || generateProceduralCrest(teamData.name, teamData.color, teamData.accent);
            const team: Team = {
                id: teamId,
                name: teamData.name,
                country: league.code,
                division: division,
                rating: avgOvr,
                budget: getBudget(teamData.budgetTier),
                budgetTier: teamData.budgetTier,
                colors: [teamData.color, teamData.accent],
                crest: teamCrest,
                managerId: mgrId,
                assistantSettings: { autoSubsMode: 'basic', autoTactics: false, autoTalks: false, autoOppInstructions: false },
                stadium: {
                    name: teamData.stadium,
                    capacity: teamData.capacity,
                    yearBuilt: teamData.founded + randInt(0, 100),
                    imageKeyword: teamData.stadiumImageKeyword,
                    facilities: teamData.facilities,
                    pitchCondition: 100,
                    pitchState: 'Perfect',
                    pitchType: 'Grass',
                    climateType: teamData.climate
                },
                facilities: { stadiumLevel: Math.floor(teamData.facilities), trainingLevel: Math.floor(teamData.facilities), youthLevel: Math.floor(teamData.facilities), medicalLevel: Math.floor(teamData.facilities) },
                training: { focus: 'General', streak: 0 },
                tactics: { formation: '4-4-2', lineup: [], style: 'Balanced' },
                formationFamiliarity: { '4-4-2': 100 },
                financials: { lastRevenue: 0, lastExpenses: 0, breakdown: { wages: 0, transfers: 0, academy: 0, facilities: 0, matchday: 0 } },
                ticketPrice: 'Medium',
                foundedYear: teamData.founded,
                stats: { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 },
                form: [],
                chemistry: 75,
                rivalId: '',
                history: []
            };

            teams.push(team);
            players.push(...teamPlayers);
        }
    }

    teams.forEach(t => {
        const teamData = TEAMS_DATA.find(td => td.name === t.name);
        if (teamData && teamData.rivalName) {
            const rival = teams.find(r => r.name === teamData.rivalName);
            if (rival) t.rivalId = rival.id;
        }
    });

    for (let i = 0; i < 30; i++) {
        const refName = REFEREE_NAMES[i] || `Ref ${i}`;
        referees.push({
            id: `ref_${i}`,
            name: refName,
            age: randInt(30, 55),
            nationality: getRandom(NATIONALITIES).code,
            division: Division.First,
            rating: randInt(6, 9),
            gamesOfficiated: 0,
            cardsGiven: { yellow: 0, red: 0 },
            foulsCalled: 0,
            history: [],
            stats: {
                strictness: randInt(10, 90),
                yellowCardAvg: randInt(2, 6),
                redCardAvg: Math.random() * 0.5,
                homeBias: 1.0 + (Math.random() * 0.1),
                varAccuracy: randInt(80, 99),
                penaltyAvg: 0.3,
                fatigueDrop: 1.0
            },
            traits: [],
            mentalHealth: randInt(80, 100),
            followers: randInt(100, 10000),
            following: 10,
            socialHandle: `@${refName.replace(/\s/g, '')}`,
            socialFeed: []
        });
    }

    if (onProgress) onProgress('Scheduling fixtures...');
    const fixtures = generateLeagueFixturesInternal(teams);
    fixtures.forEach(f => { f.refereeId = getRandom(referees).id; });
    teams.forEach(t => {
        const tPlayers = players.filter(p => p.teamId === t.id).sort((a,b) => b.stats.ovr - a.stats.ovr);
        autoFillLineup(t, tPlayers);
    });

    return {
        currentWeek: 1,
        totalWeeks: TOTAL_WEEKS,
        userTeamId: null,
        teams,
        players,
        managers,
        referees,
        fixtures,
        news: [],
        transferList: [],
        assistantCandidates: generateAssistantCandidates(),
        pendingOffers: [],
        userSettings: { audioEnabled: true, motionEffectsEnabled: true },
        dbVersion: 1
    };
};

const createPlayerFromReal = (data: any, teamId: string, teamName: string): Player => {
    return {
        id: `${teamName.substring(0,3)}_${data.n.replace(/\s/g,'')}_${randInt(1,999)}`,
        name: data.n,
        position: data.p as Position,
        specificRole: data.role || 'Box to Box',
        age: data.a,
        nationality: data.nat,
        teamId,
        value: data.r * 1.5,
        releaseClause: data.r * 2.5,
        marketValueHistory: [],
        hype: randInt(10, 90),
        wage: Math.round(data.r * 2),
        contractExpiry: 2028,
        stats: data.detailedStats || { att: 50, def: 50, mid: 50, pac: 50, gk: 10, ovr: data.r },
        statsSeason: { apps: 0, goals: 0, assists: 0, cleanSheets: 0, yellows: 0, reds: 0, ratingSum: 0, mom: 0, saves: 0, tackles: 0, passes: 0, shots: 0, aerialsWon: 0, xg: 0, xa: 0, xt: 0, xpress: 0, xsave: 0, minutesPlayed: 0 },
        condition: 100,
        injuryRisk: randInt(5, 20),
        morale: 80,
        mentalHealth: 90,
        form: 7.0,
        potential: data.r + randInt(0, 10),
        height: data.h || 180,
        preferredFoot: getRandom(['Left', 'Right', 'Right', 'Right']),
        traits: [],
        isFanFavorite: data.r > 85,
        followers: Math.round(data.r * 10000),
        following: 100,
        socialHandle: `@${data.n.replace(/\s/g,'')}`,
        socialFeed: [],
        commercialValue: data.r * 10
    };
};

const createFictionalPlayer = (teamId: string, division: Division, countryCode: string, forcePos?: Position): Player => {
    const pos = forcePos || getRandom([Position.GK, Position.DEF, Position.MID, Position.FWD]);
    const nat = getWeightedNationality(countryCode);
    const age = randInt(17, 34);
    
    let baseRating = division === Division.First ? randInt(70, 85) : randInt(60, 75);
    if (Math.random() < 0.05) baseRating += 5;

    const stats = generateStats(pos, baseRating);
    const getRoleForPos = (pos: Position): SpecificRole => {
        switch(pos) {
            case Position.GK: return 'Goalkeeper';
            case Position.DEF: return 'Stopper';
            case Position.MID: return 'Box to Box';
            case Position.FWD: return 'Poacher';
        }
    };

    return {
        id: `gen_${teamId}_${randInt(10000,99999)}`,
        name: generateName(nat),
        position: pos,
        specificRole: getRoleForPos(pos),
        age,
        nationality: nat,
        teamId,
        value: baseRating,
        releaseClause: baseRating * 1.5,
        marketValueHistory: [],
        hype: randInt(0, 50),
        wage: Math.round(baseRating * 0.8),
        contractExpiry: 2027,
        stats: { ...stats, ovr: baseRating },
        statsSeason: { apps: 0, goals: 0, assists: 0, cleanSheets: 0, yellows: 0, reds: 0, ratingSum: 0, mom: 0, saves: 0, tackles: 0, passes: 0, shots: 0, aerialsWon: 0, xg: 0, xa: 0, xt: 0, xpress: 0, xsave: 0, minutesPlayed: 0 },
        condition: 100,
        injuryRisk: randInt(10, 30),
        morale: 75,
        mentalHealth: randInt(70, 100),
        form: 6.0,
        potential: baseRating + (30 - age),
        height: randInt(170, 195),
        preferredFoot: 'Right',
        traits: [],
        isFanFavorite: false,
        followers: 1000,
        following: 50,
        socialHandle: '@player',
        socialFeed: [],
        commercialValue: baseRating * 2
    };
};

const generateStats = (pos: Position, ovr: number) => {
    if (pos === Position.GK) return { att: 10, def: 50, mid: 50, pac: 40, gk: ovr, ovr };
    if (pos === Position.DEF) return { att: ovr-30, def: ovr, mid: ovr-10, pac: ovr-5, gk: 10, ovr };
    if (pos === Position.MID) return { att: ovr-10, def: ovr-10, mid: ovr, pac: ovr-5, gk: 10, ovr };
    if (pos === Position.FWD) return { att: ovr, def: ovr-35, mid: ovr-10, pac: ovr, gk: 10, ovr };
    return { att: 50, def: 50, mid: 50, pac: 50, gk: 10, ovr };
};

const getBudget = (tier: string): number => {
    switch(tier) {
        case 'Titan': return randInt(150, 300);
        case 'High': return randInt(80, 150);
        case 'Mid': return randInt(30, 80);
        case 'Low': return randInt(10, 30);
        case 'Tiny': return randInt(1, 10);
        default: return 50;
    }
};

const generateAssistantCandidates = (): AssistantManager[] => {
    const arr: AssistantManager[] = [];
    const countries = ['ENG', 'ESP', 'FRA', 'GER', 'ITA'];
    countries.forEach(code => {
        for(let i=0; i<3; i++) {
            const nat = getWeightedNationality(code);
            arr.push({
                id: `cand_${code}_${i}_${Date.now()}`,
                name: generateName(nat),
                age: randInt(35, 65),
                nationality: nat,
                quality: randInt(60, 90),
                salary: randInt(1, 10) / 10,
                tacticalKnowledge: randInt(5, 20),
                manManagement: randInt(5, 20),
                motivation: randInt(5, 20),
                judgingAbility: randInt(5, 20)
            });
        }
    });
    return arr.sort(() => Math.random() - 0.5);
};

export const calculateXG = (player: Player, distance: number, type: string, isHeader: boolean): number => {
    let base = 0.5 * Math.exp(-0.15 * distance);
    if (type === 'shot') base *= 1.0;
    if (isHeader) base *= 0.7;
    const finishing = player.stats.att;
    base *= (finishing / 50);
    return Math.min(0.99, Math.max(0.01, base));
};

export const calculateXA = (player: Player, type: string, receiver: Player): number => {
    const passing = player.stats.mid;
    let base = passing / 100 * 0.5;
    if (type === 'through') base *= 1.2;
    if (type === 'cross') base *= 0.8;
    return parseFloat(base.toFixed(2));
};

export const calculateXT = (player: Player, startZone: number, endZone: number): number => {
    if (startZone >= endZone) return 0;
    const startVal = ZONE_VALUES[Math.min(5, startZone)] || 0;
    const endVal = ZONE_VALUES[Math.min(5, endZone)] || 0;
    return parseFloat((endVal - startVal).toFixed(3));
};

export const calculateXPress = (player: Player, zone: number): number => {
    const def = player.stats.def;
    const workRate = player.stats.pac;
    return (def + workRate) / 200 * (zone / 5);
};

export const getScoutReport = (player: Player, viewingTeam: Team): string => {
    return `Scout report for ${player.name}: Good player. Potential rating ${player.potential}.`;
};

export const trainPlayerTrait = (gameState: GameState, playerId: string, trait: string): { success: boolean, message: string } => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "Player not found" };
    if (player.traits.includes(trait)) return { success: false, message: "Player already has this trait" };
    player.traits.push(trait);
    return { success: true, message: `Training started for ${trait}` };
};

export const getAssistantRecommendation = (team: Team, squad: Player[], opponent?: Team): { focus: TrainingFocus, reason: string } => {
    if (opponent && opponent.rating > team.rating) return { focus: 'Defense', reason: "Opponent is strong." };
    return { focus: 'General', reason: "Standard training week." };
};

export const generateAssistantMatchReport = (gameState: GameState, matchId: string): AssistantMatchReport => {
    return {
        tacticalAnalysis: { verdict: "We played well.", possessionGrade: "A", statHighlight: "High xG" },
        physioReport: { fatiguedPlayers: [], injuries: [], generalStatus: "Squad is fit." },
        mentalHealthWatch: { concernedPlayers: [] },
        oppositionScout: { keyPlayer: "Unknown", threatAnalysis: "None" }
    };
};

export const processWeeklyFinances = (state: GameState): GameState => {
    state.teams.forEach(t => {
        const wages = state.players.filter(p => p.teamId === t.id).reduce((sum, p) => sum + p.wage, 0) / 1000;
        t.budget -= wages;
        t.financials.lastExpenses = wages;
        t.financials.breakdown.wages = wages;
    });
    return state;
};

export const simulateMatch = (fixture: Fixture, home: Team, away: Team, referee: Referee, players: Player[]): MatchResult => {
    const homeRating = home.rating + 5; 
    const awayRating = away.rating;
    let homeScore = 0;
    let awayScore = 0;
    const diff = homeRating - awayRating;
    const baseProb = 0.3 + (diff / 100);
    
    for(let i=0; i<10; i++) {
        if (Math.random() < baseProb) { if (Math.random() < 0.3) homeScore++; } 
        else { if (Math.random() < 0.3) awayScore++; }
    }

    return {
        matchId: fixture.id,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore,
        awayScore,
        stats: {
            possessionHome: 50, possessionAway: 50, ticksHome: 0, ticksAway: 0,
            shotsHome: homeScore + 5, shotsAway: awayScore + 5,
            shotsOnTargetHome: homeScore + 2, shotsOnTargetAway: awayScore + 2,
            xgHome: homeScore * 0.7, xgAway: awayScore * 0.7,
            xPressHome: 0, xPressAway: 0, passesHome: 0, passesAway: 0,
            tacklesHome: 0, tacklesAway: 0, headersWonHome: 0, headersWonAway: 0,
            dribblesHome: 0, dribblesAway: 0, savesHome: 0, savesAway: 0,
            cornersHome: 0, cornersAway: 0, foulsHome: 0, foulsAway: 0,
            yellowHome: 0, yellowAway: 0, interceptionsHome: 0, interceptionsAway: 0,
            clearancesHome: 0, clearancesAway: 0, freeKicksHome: 0, freeKicksAway: 0,
            offsidesHome: 0, offsidesAway: 0, crossesHome: 0, crossesAway: 0
        },
        events: [],
        momentumHistory: [],
        managerHomeId: home.managerId,
        managerAwayId: away.managerId,
        conditions: { weather: 'Clear', pitch: 'Good' },
        lineups: { home: [], away: [] }
    };
};

export const updateStatsAfterMatch = (state: GameState, result: MatchResult): GameState => {
    const home = state.teams.find(t => t.id === result.homeTeamId);
    const away = state.teams.find(t => t.id === result.awayTeamId);
    if (home) {
        home.stats.played++;
        home.stats.gf += result.homeScore;
        home.stats.ga += result.awayScore;
        if (result.homeScore > result.awayScore) { home.stats.won++; home.stats.points += 3; home.form.push('W'); }
        else if (result.homeScore === result.awayScore) { home.stats.drawn++; home.stats.points += 1; home.form.push('D'); }
        else { home.stats.lost++; home.form.push('L'); }
    }
    if (away) {
        away.stats.played++;
        away.stats.gf += result.awayScore;
        away.stats.ga += result.homeScore;
        if (result.awayScore > result.homeScore) { away.stats.won++; away.stats.points += 3; away.form.push('W'); }
        else if (result.awayScore === result.homeScore) { away.stats.drawn++; away.stats.points += 1; away.form.push('D'); }
        else { away.stats.lost++; away.form.push('L'); }
    }
    state.fixtures = state.fixtures.map(f => f.id === result.matchId ? { ...f, result } : f);
    return state;
};

export const generateWeeklyWorldEvents = (state: GameState): GameState => {
    // 1. News
    if (Math.random() < 0.3) {
        state.news.push({
            id: `news_${Date.now()}`,
            week: state.currentWeek,
            type: 'general',
            headline: 'Transfer Rumors Swirl',
            body: 'Big moves are expected in the upcoming window.',
            dramaScore: 50
        });
    }

    // 2. Random Press Conference (5% chance if user team manager exists)
    if (!state.activePressConference && Math.random() < 0.05 && state.userTeamId) {
        state.activePressConference = {
            id: `pc_${Date.now()}`,
            journalistName: "Fabrizio Romano",
            outlet: "The Athletic",
            question: "Rumors are circulating about player unrest. How are you managing the dressing room atmosphere?",
            options: [
                { id: 'calm', label: "Everything is fine.", style: 'Protective', risk: "Low" },
                { id: 'aggressive', label: "I am the boss.", style: 'Aggressive', risk: "High" },
                { id: 'dismiss', label: "No comment.", style: 'Arrogant' }
            ]
        };
    }

    // 3. Hostile Bid / Contract Negotiation (Release Clause Trigger)
    if (!state.activeContractNegotiation && isTransferWindowOpen(state.currentWeek) && Math.random() < 0.05 && state.userTeamId) {
        const userPlayers = state.players.filter(p => p.teamId === state.userTeamId);
        const target = getRandom(userPlayers.filter(p => p.value > 10)); // Valuable player
        if (target) {
            const buyer = getRandom(state.teams.filter(t => t.id !== state.userTeamId && t.budget > (target.releaseClause || target.value * 2)));
            if (buyer) {
                const clause = target.releaseClause || target.value * 2;
                state.activeContractNegotiation = {
                    playerId: target.id,
                    buyingTeamId: buyer.id,
                    offerAmount: clause,
                    wageDemands: Math.round(target.wage * 1.5),
                    newValue: Math.round(target.value * 1.2)
                };
            }
        }
    }

    return state;
};

export const generateNewsFromMatch = (state: GameState, result: MatchResult): GameState => {
    const home = state.teams.find(t => t.id === result.homeTeamId);
    const away = state.teams.find(t => t.id === result.awayTeamId);
    if (home && away) {
        state.news.push({
            id: `news_match_${result.matchId}`,
            week: state.currentWeek,
            type: 'match',
            matchId: result.matchId,
            headline: `${home.name} ${result.homeScore} - ${result.awayScore} ${away.name}`,
            body: `A thrilling encounter ended with ${result.homeScore > result.awayScore ? home.name + ' taking the win' : result.awayScore > result.homeScore ? away.name + ' securing victory' : 'a draw'}.`,
            dramaScore: 70
        });
    }
    return state;
};

// --- ACTION HANDLERS ---

export const scoutYouthAction = (state: GameState, teamId: string): { success: boolean, newState?: GameState, message?: string } => {
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return { success: false, message: "Team not found" };
    if (team.budget < 0.5) return { success: false, message: "Insufficient funds (0.5M required)" };

    const newState = JSON.parse(JSON.stringify(state));
    const newTeam = newState.teams.find((t: Team) => t.id === teamId);
    newTeam.budget -= 0.5;
    newTeam.financials.breakdown.academy += 0.5;

    const player = createFictionalPlayer(teamId, newTeam.division, newTeam.country);
    player.isAcademy = true;
    player.academyStatus = 'pending';
    player.age = randInt(15, 17);
    player.potential = Math.min(99, player.potential + (newTeam.facilities.youthLevel * 2));
    player.value = 0; 
    
    newState.players.push(player);
    return { success: true, newState };
};

export const upgradeFacilityAction = (state: GameState, teamId: string, type: 'stadium'|'training'|'youth'|'medical'): { success: boolean, newState?: GameState, message?: string } => {
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return { success: false };

    let cost = 0;
    let newLvl = 0;

    if (type === 'stadium') { newLvl = team.facilities.stadiumLevel + 1; cost = Math.max(2, 10 * newLvl); } 
    else if (type === 'training') { newLvl = team.facilities.trainingLevel + 1; cost = Math.max(2, 8 * newLvl); } 
    else if (type === 'youth') { newLvl = team.facilities.youthLevel + 1; cost = Math.max(2, 10 * newLvl); } 
    else if (type === 'medical') { newLvl = team.facilities.medicalLevel + 1; cost = Math.max(2, 5 * newLvl); }

    if (team.budget < cost) return { success: false, message: "Insufficient funds" };
    if (newLvl > 10) return { success: false, message: "Max level reached" };

    const newState = JSON.parse(JSON.stringify(state));
    const newTeam = newState.teams.find((t: Team) => t.id === teamId);
    
    newTeam.budget -= cost;
    newTeam.financials.breakdown.facilities += cost;

    if (type === 'stadium') { newTeam.facilities.stadiumLevel = newLvl; newTeam.stadium.capacity += 5000; newTeam.stadium.facilities++; }
    if (type === 'training') newTeam.facilities.trainingLevel = newLvl;
    if (type === 'youth') newTeam.facilities.youthLevel = newLvl;
    if (type === 'medical') newTeam.facilities.medicalLevel = newLvl;

    return { success: true, newState };
};

export const relayPitchAction = (state: GameState, teamId: string): { success: boolean, newState?: GameState, message?: string } => {
    const team = state.teams.find(t => t.id === teamId);
    if (!team || team.budget < 2.5) return { success: false, message: "Insufficient funds" };

    const newState = JSON.parse(JSON.stringify(state));
    const newTeam = newState.teams.find((t: Team) => t.id === teamId);
    newTeam.budget -= 2.5;
    newTeam.financials.breakdown.facilities += 2.5;
    newTeam.stadium.pitchState = 'Perfect';
    newTeam.stadium.pitchCondition = 100;
    return { success: true, newState };
};

export const promoteYouthAction = (state: GameState, playerId: string): { success: boolean, newState?: GameState } => {
    const newState = JSON.parse(JSON.stringify(state));
    const player = newState.players.find((x: Player) => x.id === playerId);
    if (!player) return { success: false };
    player.academyStatus = 'signed';
    player.isAcademy = false;
    player.wage = 0.5;
    player.value = player.potential / 2;
    return { success: true, newState };
};

export const rejectYouthAction = (state: GameState, playerId: string): { success: boolean, newState?: GameState } => {
    const newState = JSON.parse(JSON.stringify(state));
    const player = newState.players.find((x: Player) => x.id === playerId);
    if (player) player.academyStatus = 'rejected';
    return { success: true, newState };
};

export const signPlayerAction = (state: GameState, playerId: string, teamId: string): { success: boolean, newState?: GameState, message?: string } => {
    const team = state.teams.find(t => t.id === teamId);
    const p = state.players.find(x => x.id === playerId);
    if (!team || !p) return { success: false };
    const cost = p.teamId === 'free_agent' ? p.value * 0.5 : p.value * 1.2; 
    if (team.budget < cost) return { success: false, message: "Insufficient budget" };

    const newState = JSON.parse(JSON.stringify(state));
    const newTeam = newState.teams.find((t: Team) => t.id === teamId);
    const newPlayer = newState.players.find((x: Player) => x.id === playerId);
    
    if (p.teamId !== 'free_agent') {
        const oldTeam = newState.teams.find((t: Team) => t.id === p.teamId);
        if (oldTeam) { oldTeam.budget += cost; oldTeam.financials.breakdown.transfers -= cost; }
    }

    newTeam.budget -= cost;
    newTeam.financials.breakdown.transfers += cost;
    newPlayer.teamId = teamId;
    newPlayer.contractExpiry = state.currentWeek + (52 * 3);
    return { success: true, newState };
};

export const processTransferOfferAction = (state: GameState, offerId: string, accept: boolean): { success: boolean, newState?: GameState } => {
    const offer = state.pendingOffers.find(o => o.id === offerId);
    if (!offer) return { success: false };
    const newState = JSON.parse(JSON.stringify(state));
    newState.pendingOffers = newState.pendingOffers.filter((o: TransferOffer) => o.id !== offerId);

    if (accept) {
        const p = newState.players.find((x: Player) => x.id === offer.playerId);
        const buyer = newState.teams.find((t: Team) => t.id === offer.offeringTeamId);
        const seller = newState.teams.find((t: Team) => t.id === p?.teamId);
        if (p && buyer && seller) {
            p.teamId = buyer.id;
            buyer.budget -= offer.offerAmount;
            seller.budget += offer.offerAmount;
            newState.news.unshift({ id: `news_${Date.now()}`, week: state.currentWeek, type: 'transfer', headline: `${p.name} moves to ${buyer.name}`, body: `The transfer has been completed for a fee of €${offer.offerAmount}M.` });
        }
    }
    return { success: true, newState };
};

export const playerInteractionAction = (state: GameState, playerId: string, action: 'praise'|'criticize'|'encourage'|'warn'): { success: boolean, newState?: GameState } => {
    const newState = JSON.parse(JSON.stringify(state));
    const p = newState.players.find((x: Player) => x.id === playerId);
    if (!p) return { success: false };
    let moraleChange = 0;
    if (action === 'praise') moraleChange = 5;
    if (action === 'criticize') moraleChange = -5; 
    if (action === 'encourage') moraleChange = 3;
    if (action === 'warn') moraleChange = -2; 
    p.morale = Math.max(0, Math.min(100, p.morale + moraleChange));
    return { success: true, newState };
};

export const resolveContractNegotiationAction = (state: GameState, decision: 'renew' | 'sell'): { success: boolean, newState?: GameState } => {
    const negotiation = state.activeContractNegotiation;
    if (!negotiation) return { success: false };

    const newState = JSON.parse(JSON.stringify(state));
    newState.activeContractNegotiation = undefined; // Close modal

    const p = newState.players.find((x: Player) => x.id === negotiation.playerId);
    const team = newState.teams.find((t: Team) => t.id === state.userTeamId);
    
    if (!p || !team) return { success: false };

    if (decision === 'sell') {
        // Sell to buyer
        const buyer = newState.teams.find((t: Team) => t.id === negotiation.buyingTeamId);
        if (buyer) {
            p.teamId = buyer.id;
            buyer.budget -= negotiation.offerAmount;
            team.budget += negotiation.offerAmount;
            // News
            newState.news.unshift({ 
                id: `news_${Date.now()}`, week: state.currentWeek, type: 'transfer', 
                headline: `${p.name} leaves for ${buyer.name}`, 
                body: `${team.name} fans are shocked as the release clause of €${negotiation.offerAmount}M was met.` 
            });
        }
    } else {
        // Renew
        const cost = 2.0; // Renewal fee/bonus
        if (team.budget < cost) return { success: false }; // Should be checked in UI too
        team.budget -= cost;
        p.wage = negotiation.wageDemands;
        p.releaseClause = Math.round(negotiation.offerAmount * 1.5); // Increase clause
        p.contractExpiry += 52 * 3; // +3 Years
        p.morale = 100;
    }

    return { success: true, newState };
};

export const resolvePressConferenceAction = (state: GameState, optionId: string): { success: boolean, newState?: GameState } => {
    const pc = state.activePressConference;
    if (!pc) return { success: false };

    const newState = JSON.parse(JSON.stringify(state));
    newState.activePressConference = undefined;

    const manager = newState.managers.find((m: any) => m.teamId === state.userTeamId);
    if (!manager) return { success: true, newState };

    const selectedOption = pc.options.find(o => o.id === optionId);
    if (selectedOption) {
        if (selectedOption.style === 'Aggressive') {
            manager.approval.board -= 2;
            manager.approval.fans += 5; // Fans love passion
        } else if (selectedOption.style === 'Protective') {
            // Boost team morale
            newState.players.filter((p: Player) => p.teamId === state.userTeamId).forEach((p: Player) => p.morale = Math.min(100, p.morale + 2));
            manager.approval.fans += 2;
        } else if (selectedOption.style === 'Arrogant') {
            manager.approval.fans -= 5;
            manager.approval.board -= 5;
        }
    }

    return { success: true, newState };
};

// --- END OF SEASON LOGIC ---

export const processEndOfSeason = (state: GameState): GameState => {
    const newState: GameState = JSON.parse(JSON.stringify(state));
    const leagues = Array.from(new Set(newState.teams.map(t => t.country)));
    
    const summary: SeasonSummary = {
        champion: { name: 'Unknown', crest: {} as any },
        promoted: [],
        relegated: [],
        topScorer: { name: 'Unknown', goals: 0 },
        playerOfTheSeason: { name: 'Unknown', rating: 0 }
    };

    leagues.forEach(league => {
        const div1 = newState.teams.filter(t => t.country === league && t.division === Division.First)
            .sort((a, b) => b.stats.points - a.stats.points || (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga));
        
        const div2 = newState.teams.filter(t => t.country === league && t.division === Division.Second)
            .sort((a, b) => b.stats.points - a.stats.points || (b.stats.gf - b.stats.ga) - (a.stats.gf - a.stats.ga));

        const userTeam = newState.teams.find(t => t.id === state.userTeamId);
        if (userTeam && userTeam.country === league && userTeam.division === Division.First) {
            summary.champion = { name: div1[0].name, crest: div1[0].crest };
        }

        const relegated = div1.slice(-3);
        relegated.forEach(t => {
            t.division = Division.Second;
            t.history.push(`${new Date().getFullYear()}: Relegated from Div 1`);
            if (userTeam && userTeam.country === league) summary.relegated.push({ name: t.name, crest: t.crest });
        });

        const promoted = div2.slice(0, 3);
        promoted.forEach(t => {
            t.division = Division.First;
            t.history.push(`${new Date().getFullYear()}: Promoted to Div 1`);
            if (userTeam && userTeam.country === league) summary.promoted.push({ name: t.name, crest: t.crest });
        });

        div1.slice(0, -3).forEach((t, i) => t.history.push(`${new Date().getFullYear()}: ${i+1}th in Div 1`));
        div2.slice(3).forEach((t, i) => t.history.push(`${new Date().getFullYear()}: ${i+4}th in Div 2`));
    });

    let topScorer = newState.players[0];
    let topPlayer = newState.players[0];

    newState.players.forEach(p => {
        if (p.statsSeason.goals > topScorer.statsSeason.goals) topScorer = p;
        const pRtg = p.statsSeason.apps > 0 ? p.statsSeason.ratingSum / p.statsSeason.apps : 0;
        const topRtg = topPlayer.statsSeason.apps > 0 ? topPlayer.statsSeason.ratingSum / topPlayer.statsSeason.apps : 0;
        if (pRtg > topRtg && p.statsSeason.apps > 20) topPlayer = p;
    });

    summary.topScorer = { name: topScorer.name, goals: topScorer.statsSeason.goals };
    summary.playerOfTheSeason = { name: topPlayer.name, rating: topPlayer.statsSeason.apps > 0 ? topPlayer.statsSeason.ratingSum / topPlayer.statsSeason.apps : 0 };

    newState.players = newState.players.filter(p => {
        p.age += 1;
        if (p.age > 36 && Math.random() < 0.3) return false; 

        if (p.age < 24) {
            const potentialDiff = p.potential - p.stats.ovr;
            if (potentialDiff > 0) {
                const growth = randInt(1, 3);
                p.stats.ovr = Math.min(99, p.stats.ovr + growth);
                p.stats.att += growth; p.stats.def += growth; 
            }
        } else if (p.age > 32) {
            const decline = randInt(1, 3);
            p.stats.ovr = Math.max(50, p.stats.ovr - decline);
            p.stats.pac = Math.max(1, p.stats.pac - decline * 2); 
        }

        p.statsSeason = { apps: 0, goals: 0, assists: 0, cleanSheets: 0, yellows: 0, reds: 0, ratingSum: 0, mom: 0, saves: 0, tackles: 0, passes: 0, shots: 0, aerialsWon: 0, xg: 0, xa: 0, xt: 0, xpress: 0, xsave: 0, minutesPlayed: 0 };
        
        return true;
    });

    newState.teams.forEach(t => {
        const squadSize = newState.players.filter(p => p.teamId === t.id).length;
        if (squadSize < 18) {
            const needed = 18 - squadSize;
            for(let i=0; i<needed; i++) {
                const regen = createFictionalPlayer(t.id, t.division, t.country);
                regen.age = randInt(16, 19); 
                newState.players.push(regen);
            }
        }
        
        t.stats = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
        t.form = [];
    });

    newState.fixtures = generateLeagueFixturesInternal(newState.teams);
    newState.fixtures.forEach(f => {
        f.refereeId = getRandom(newState.referees).id;
    });

    newState.currentWeek = 1;
    newState.seasonSummary = summary;
    
    return newState;
};
