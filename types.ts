export enum Division {
  First = 'First',
  Second = 'Second'
}

export enum Position {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD'
}

export type WeatherType = 'Clear' | 'Cloudy' | 'Rain' | 'Heavy Rain' | 'Snow' | 'Windy';
export type PitchState = 'Perfect' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
export type Climate = 'Atlantic' | 'Continental' | 'Mediterranean';
export type SpecificRole = 'Goalkeeper' | 'Stopper' | 'Ball Playing Defender' | 'Full Back' | 'Anchor' | 'Box to Box' | 'Playmaker' | 'Winger' | 'Target Man' | 'Poacher' | 'Inside Forward';
export type TrainingFocus = 'General' | 'Attack' | 'Defense' | 'Possession' | 'Physical';
export type AutoSubMode = 'off' | 'basic' | 'auto';

export interface TeamCrest {
  shape: 'shield' | 'round' | 'crest' | 'diamond' | 'hexagon' | 'star';
  pattern: 'solid' | 'stripes' | 'hoops' | 'half' | 'quarters' | 'cross' | 'sash' | 'checkered';
  icon: 'crown' | 'ball' | 'star' | 'tower' | 'shield' | 'sword' | 'anchor' | 'eagle' | 'lion' | 'wings' | 'tree' | 'horse' | 'bat' | 'bird' | 'cross' | 'wolf' | 'lily' | 'bull' | 'bear' | 'skull' | 'dog' | 'ship' | 'dragon' | 'tiger' | 'moose' | 'rose' | 'owl' | 'lamb' | 'animal' | 'fish' | 'lady' | 'castle' | 'ladder' | 'church' | 'arm' | 'sailor' | 'fort' | 'cock' | 'seahorse' | 'wasp' | 'wheel' | 'leaf' | 'hammer' | 'none';
  color1?: string;
  color2?: string;
}

export interface TeamFinancials {
  lastRevenue: number;
  lastExpenses: number;
  breakdown: {
    wages: number;
    transfers: number;
    academy: number;
    facilities: number;
    matchday: number;
  };
}

export interface AssistantSettings {
  autoSubsMode: AutoSubMode;
  autoTactics: boolean;
  autoTalks: boolean;
  autoOppInstructions: boolean;
}

export interface TeamStadium {
    name: string;
    capacity: number;
    yearBuilt: number;
    imageKeyword: string;
    facilities: number;
    pitchCondition: number;
    pitchState: PitchState;
    pitchType: string;
    climateType: Climate;
}

export interface TeamFacilities {
    stadiumLevel: number;
    trainingLevel: number;
    youthLevel: number;
    medicalLevel: number;
}

export interface TeamTraining {
    focus: TrainingFocus;
    streak: number;
}

export interface TeamTactics {
    formation: string;
    lineup: string[]; // Player IDs
    style: string;
}

export interface TeamStats {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number;
    ga: number;
    points: number;
}

export interface AssistantManager {
    id: string;
    name: string;
    age: number;
    nationality: string;
    quality: number;
    salary: number;
    tacticalKnowledge: number;
    manManagement: number;
    motivation: number;
    judgingAbility: number;
}

export interface Team {
  id: string;
  name: string;
  country: string;
  division: Division;
  rating: number;
  budget: number;
  budgetTier: string;
  colors: string[];
  crest: TeamCrest;
  managerId: string;
  assistantSettings: AssistantSettings;
  stadium: TeamStadium;
  facilities: TeamFacilities;
  training: TeamTraining;
  tactics: TeamTactics;
  formationFamiliarity: Record<string, number>;
  financials: TeamFinancials;
  ticketPrice: 'Low' | 'Medium' | 'High';
  foundedYear: number;
  stats: TeamStats;
  form: string[];
  chemistry: number;
  rivalId: string;
  history: string[]; 
  assistant?: AssistantManager;
  lastTeamMeetingWeek?: number;
}

export interface ManagerApproval {
    board: number;
    fans: number;
}

export interface ManagerStats {
    won: number;
    drawn: number;
    lost: number;
}

export interface SocialPost {
    id: string;
    authorName: string;
    authorHandle: string;
    content: string;
    timestamp: number;
    type: 'praise' | 'criticize' | 'rumor' | 'news' | 'stalker';
    likes: number;
    shares: number;
    contextTag?: string;
}

export interface Manager {
    id: string;
    name: string;
    teamId: string;
    rating: number;
    style: string;
    stats: ManagerStats;
    followers: number;
    following: number;
    mentalHealth: number;
    socialFeed: SocialPost[];
    approval: ManagerApproval;
    tacticalAptitude: number;
}

export interface PlayerStats {
    att: number;
    def: number;
    mid: number;
    pac: number;
    gk: number;
    ovr: number;
}

export interface PlayerSeasonStats {
    apps: number;
    goals: number;
    assists: number;
    cleanSheets: number;
    yellows: number;
    reds: number;
    ratingSum: number;
    mom: number;
    saves: number;
    tackles: number;
    passes: number;
    shots: number;
    aerialsWon: number;
    xg: number;
    xa: number;
    xt: number;
    xpress: number;
    xsave: number;
    minutesPlayed: number;
}

export interface PlayerTrainingTarget {
    type: string;
    progress: number;
}

export interface Player {
    id: string;
    name: string;
    position: Position;
    specificRole: SpecificRole;
    age: number;
    nationality: string;
    teamId: string;
    value: number;
    releaseClause?: number;
    marketValueHistory: number[];
    hype: number;
    wage: number;
    contractExpiry: number;
    stats: PlayerStats;
    statsSeason: PlayerSeasonStats;
    condition: number;
    injuryRisk?: number;
    morale: number;
    mentalHealth: number;
    form: number;
    potential: number;
    height: number;
    preferredFoot: string;
    traits: string[];
    isFanFavorite: boolean;
    followers: number;
    following: number;
    socialHandle: string;
    socialFeed: SocialPost[];
    commercialValue: number;
    isAcademy?: boolean;
    academyStatus?: 'pending' | 'signed' | 'rejected';
    suspendedUntilWeek?: number;
    trainingTarget?: PlayerTrainingTarget;
    potentialStats?: PlayerStats;
}

export interface MatchStats {
    possessionHome: number;
    possessionAway: number;
    ticksHome: number;
    ticksAway: number;
    shotsHome: number;
    shotsAway: number;
    shotsOnTargetHome: number;
    shotsOnTargetAway: number;
    xgHome: number;
    xgAway: number;
    xPressHome: number;
    xPressAway: number;
    passesHome: number;
    passesAway: number;
    tacklesHome: number;
    tacklesAway: number;
    headersWonHome: number;
    headersWonAway: number;
    dribblesHome: number;
    dribblesAway: number;
    savesHome: number;
    savesAway: number;
    cornersHome: number;
    cornersAway: number;
    foulsHome: number;
    foulsAway: number;
    yellowHome: number;
    yellowAway: number;
    interceptionsHome: number;
    interceptionsAway: number;
    clearancesHome: number;
    clearancesAway: number;
    freeKicksHome: number;
    freeKicksAway: number;
    offsidesHome: number;
    offsidesAway: number;
    crossesHome: number;
    crossesAway: number;
}

export interface PlayerMatchStats {
    playerId: string;
    name: string;
    position: string;
    rating: number;
    goals: number;
    assists: number;
    shots: number;
    xg: number;
    xa: number;
    xt: number;
    xpress: number;
    xsave: number;
    passes: number;
    keyPasses: number;
    tackles: number;
    saves: number;
    interceptions: number;
    clearances: number;
    crosses: number;
    headersWon: number;
    dribblesAttempted: number;
    dribblesCompleted: number;
    yellow: boolean;
    red: boolean;
    aerialsWon: number;
    fouls: number;
    minutesPlayed: number;
    cardReason?: string;
}

export interface MatchEvent {
    minute: number;
    type: 'goal' | 'sub' | 'injury' | 'var' | 'red' | 'crowd' | 'weather' | 'save' | 'miss' | 'tackle' | 'pass' | 'dribble' | 'header' | 'shout' | 'tactical' | 'neutral' | 'whistle' | 'keane';
    teamId: string;
    playerId: string;
    playerName: string;
    assistId?: string;
    assistName?: string;
    visualClass?: string;
    xg?: number;
    location?: {x: number, y: number};
    impactRating?: number;
    style?: 'poetic' | 'analytical' | 'neutral' | 'critical';
    extraInfo?: string;
}

export interface MatchLineupPlayer extends PlayerMatchStats {}

export interface MatchLineups {
    home: MatchLineupPlayer[];
    away: MatchLineupPlayer[];
}

export interface SubsStats {
    homeUsed: number;
    awayUsed: number;
    homeWindows: number;
    awayWindows: number;
}

export interface RefereePerformance {
    refereeId: string;
    rating: number;
    controversyScore: number;
    varInterventions: number;
    correctDecisions: number;
}

export interface MatchConditions {
    weather: string;
    pitch: string;
}

export interface MatchResult {
    matchId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    stats: MatchStats;
    events: MatchEvent[];
    momentumHistory: number[];
    managerHomeId: string;
    managerAwayId: string;
    conditions: MatchConditions;
    lineups: MatchLineups;
    subsStats?: SubsStats;
    refereePerformance?: RefereePerformance;
}

export interface Fixture {
    id: string;
    week: number;
    leagueId: string;
    homeTeamId: string;
    awayTeamId: string;
    refereeId: string;
    result?: MatchResult;
    postponed?: boolean;
}

export interface RefereeStats {
    strictness: number;
    yellowCardAvg: number;
    redCardAvg: number;
    homeBias: number;
    varAccuracy: number;
    penaltyAvg: number;
    fatigueDrop: number;
}

export interface RefereeHistory {
    week: number;
    homeTeamId: string;
    awayTeamId: string;
    rating: number;
    cards: number;
}

export interface Referee {
    id: string;
    name: string;
    age: number;
    nationality: string;
    division: Division;
    rating: number;
    gamesOfficiated: number;
    cardsGiven: { yellow: number, red: number };
    foulsCalled: number;
    history: RefereeHistory[];
    stats: RefereeStats;
    traits: string[];
    mentalHealth: number;
    followers: number;
    following: number;
    socialHandle: string;
    socialFeed: SocialPost[];
}

export interface NewsItem {
    id: string;
    week: number;
    type: 'match' | 'transfer' | 'injury' | 'general' | 'scandal';
    headline: string;
    body: string;
    matchId?: string;
    dramaScore?: number;
    socialReactions?: { user: string, handle: string, text: string, sentiment: 'positive'|'negative'|'neutral' }[];
}

export interface TransferOffer {
    id: string;
    playerId: string;
    offeringTeamId: string;
    offerAmount: number;
    type: 'transfer' | 'loan';
    status: 'pending' | 'accepted' | 'rejected';
    week: number;
}

export interface PressConferenceOption {
    id: string;
    label: string;
    style: string;
    risk?: string;
}

export interface PressConference {
    id: string;
    journalistName: string;
    outlet: string;
    question: string;
    options: PressConferenceOption[];
}

export interface ContractNegotiation {
    playerId: string;
    buyingTeamId: string;
    offerAmount: number;
    wageDemands: number;
    newValue: number;
}

export interface UserSettings {
    audioEnabled: boolean;
    motionEffectsEnabled: boolean;
}

export interface LoadingState {
    status: 'idle' | 'validating' | 'connecting' | 'scouting' | 'parsing' | 'finalizing' | 'complete' | 'error';
    stepsCompleted: string[];
    error?: { title: string, message: string };
}

export interface SeasonSummary {
    champion: { name: string, crest: TeamCrest };
    promoted: { name: string, crest: TeamCrest }[];
    relegated: { name: string, crest: TeamCrest }[];
    topScorer: { name: string, goals: number };
    playerOfTheSeason: { name: string, rating: number };
}

export interface GameState {
    currentWeek: number;
    totalWeeks: number;
    userTeamId: string | null;
    teams: Team[];
    players: Player[];
    managers: Manager[];
    referees: Referee[];
    fixtures: Fixture[];
    news: NewsItem[];
    transferList: string[];
    assistantCandidates: AssistantManager[];
    pendingOffers: TransferOffer[];
    userSettings: UserSettings;
    dbVersion: number;
    activePressConference?: PressConference;
    activeContractNegotiation?: ContractNegotiation;
    seasonSummary?: SeasonSummary;
}

export interface RealPlayerSchema {
    n: string; // name
    p: string; // position
    a: number; // age
    r: number; // rating
    nat: string; // nationality
    h?: number; // height
    role?: SpecificRole;
    detailedStats?: PlayerStats;
}

export type RealWorldData = Record<string, RealPlayerSchema[]>;

export interface AssistantMatchReport {
    tacticalAnalysis: { verdict: string, possessionGrade: string, statHighlight: string };
    physioReport: { fatiguedPlayers: string[], injuries: string[], generalStatus: string };
    mentalHealthWatch: { concernedPlayers: { name: string, issue: string }[] };
    oppositionScout: { keyPlayer: string, threatAnalysis: string };
}

export interface GameContextType {
  gameState: GameState | null;
  isSimulating: boolean;
  loadingState: LoadingState;
  apiKey: string;
  grokApiKey: string;
  activeMatch: Fixture | null;
  hasSaveFile: boolean;
  actions: {
    startNewGame: (explicitKey?: string) => void;
    startFictionalGame: () => void;
    startImportedGame: (data: RealWorldData) => void;
    retryWorldGeneration: () => void;
    loadSavedGame: () => void;
    selectTeam: (id: string) => void;
    updateTeam: (team: Team) => void;
    holdTeamMeeting: () => void;
    simulateWeek: () => Promise<void>;
    startNextSeason: () => void;
    startLiveMatch: (fixture: Fixture) => void;
    completeLiveMatch: (result: MatchResult) => void;
    scoutYouth: () => void;
    upgradeFacility: (type: 'stadium'|'training'|'youth'|'medical') => void;
    relayPitch: () => void;
    promoteYouthPlayer: (id: string) => void;
    rejectYouthPlayer: (id: string) => void;
    respondToOffer: (id: string, accept: boolean) => void;
    signPlayer: (id: string) => void;
    fireAssistant: () => void;
    hireAssistant: (candidate: AssistantManager) => void;
    updateAssistantSettings: (settings: AssistantSettings) => void;
    interactWithPlayer: (id: string, action: 'praise'|'criticize'|'encourage'|'warn') => void;
    resolvePressConference: (optionId: string) => void;
    resolveContractNegotiation: (decision: 'renew' | 'sell') => void;
    updateSettings: (settings: UserSettings) => void;
    resign: () => void;
    factoryReset: () => void;
    setApiKey: (key: string) => void;
    setGrokApiKey: (key: string) => void;
    clearCache: () => void;
    forceUpdateState: (newState: GameState) => void;
  };
}