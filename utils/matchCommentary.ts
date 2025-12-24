
import { Player, Team, MatchEvent } from '../types';
import { getRandom } from '../constants';

export interface CommentaryContext {
    player: Player;
    team: Team;
    opponent?: Team;
    minute: number;
    score?: { home: number, away: number };
    isHome?: boolean;
    weather?: string;
    atmosphere?: number;
    subsStats?: { homeUsed: number, awayUsed: number, homeWindows: number, awayWindows: number };
    isDerby?: boolean;
    managerPersonality?: { style: string, tacticalAptitude: number }; 
}

export type CommentaryStyle = 'poetic' | 'analytical' | 'neutral' | 'critical';

const NICKNAMES: Record<string, string> = {
    'Kylian Mbappé': 'The Turtle',
    'Vinícius Jr': 'Vini',
    'Jude Bellingham': 'Hey Jude',
    'Lamine Yamal': 'The Prodigy',
    'Robert Lewandowski': 'Lewy',
    'Antoine Griezmann': 'The Little Prince',
    'Isco': 'Magico',
    'Iago Aspas': 'The Wizard of Moaña'
};

const IDIOMS = [
    "corridor of uncertainty", "parking the bus", "game of two halves", 
    "ploughing a lone furrow", "with aplomb", "leaving it all on the pitch", 
    "schoolboy defending", "fox in the box", "playing a blinder"
];

const TEMPLATES: Record<string, Record<CommentaryStyle, string[]>> = {
    goal: {
        poetic: [
            "{player} paints a masterpiece into the top corner! Artistry in motion! 🔥",
            "Bedlam in the stands! {player} sends the stadium into the stratosphere!",
            "A thunderbolt from {player}! The net is still trembling!",
            "Pure magic! {player} waves his wand and the ball disappears into the goal! 🪄",
            "Destiny calls and {player} answers! A goal for the history books!",
            "Pandemonium! {player} writes his name in the stars tonight!"
        ],
        analytical: [
            "{player} exploits the gap between the center backs perfectly.",
            "A clinical transition finished off by {player}. Textbook counter-attack.",
            "{player} finds the pocket of space and punishes the defensive line.",
            "Poor marking leaves {player} free to convert the chance.",
            "The xG on that must be low, but {player} makes it look easy.",
            "{player} beats the offside trap and slots it home calmly."
        ],
        neutral: [
            "Goal for {team}. {player} scores.",
            "It's {player} with the finish. {team} take the lead.",
            "{player} puts the ball in the back of the net.",
            "The score changes as {player} finds the target.",
            "A goal from {player} inside the box.",
            "{player} converts the opportunity."
        ],
        critical: [
            "The defense has gone missing. {player} walks it in. Embarrassing.",
            "Goalkeeping error gifts {player} a goal. Shocking mistake.",
            "Too easy for {player}. Where was the pressure?",
            "Defensive suicide from the opponent allows {player} to score.",
            "{player} scores, but the defending was absolutely pathetic.",
            "You cannot give {player} that much room. Amateur hour at the back."
        ]
    },
    save: {
        poetic: [
            "The hand of God! {player} defies the laws of physics! 🧤",
            "A wall of brick and mortar! {player} says NO!",
            "Flying through the air like a superhero! {player} to the rescue!",
            "Fingertips of steel from {player}! Incredible!"
        ],
        analytical: [
            "Great positioning from {player} to narrow the angle.",
            "{player} reacts quickly to the deflection. Solid goalkeeping.",
            "The keeper stood tall and made himself big there.",
            "{player} parries it into a safe zone. Smart play."
        ],
        neutral: [
            "Save by {player}.",
            "{player} catches the ball.",
            "Shot blocked by {player}.",
            "{player} tips it over the bar."
        ],
        critical: [
            "{player} makes the save, but he should have caught that.",
            "Unconvincing stop from {player}, but it stays out.",
            "The striker hit it straight at {player}. Lucky escape.",
            "Nervous keeping from {player}, spills it but recovers."
        ]
    },
    miss: {
        poetic: [
            "Agony! {player} holds his head in his hands!",
            "It kisses the paint of the post and stays out! Heartbreak! 💔",
            " Inches from glory! {player} watches it sail wide.",
            "The crowd gasps as {player} misses by a whisker!"
        ],
        analytical: [
            "{player} leaned back too much and skied the effort.",
            "Poor technique from {player} on the volley.",
            "{player} rushed the shot instead of taking a touch.",
            "The angle was too tight for {player} there."
        ],
        neutral: [
            "{player} shoots wide.",
            "Goal kick. {player} misses the target.",
            "Hit the post by {player}.",
            "{player} sends it over the bar."
        ],
        critical: [
            "That is a sitter! {player} has to score there! 🤡",
            "Wasteful from {player}. The manager will be furious.",
            "Shocking effort from {player}. Not even close.",
            "Pathetic finish. {player} let the team down there."
        ]
    },
    tackle: {
        poetic: [
            "A gladiator's challenge from {player}! 🛡️",
            "{player} puts his body on the line! Heroic defending!",
            "Thou shall not pass! {player} is a rock!"
        ],
        analytical: [
            "Perfectly timed challenge from {player}.",
            "{player} reads the play and intercepts the pass.",
            "Clean tackle by {player} to win possession."
        ],
        neutral: [
            "Tackle by {player}.",
            "{player} wins the ball.",
            "Possession regained by {player}."
        ],
        critical: [
            "Risky challenge from {player}, lucky to get the ball.",
            "Opponent dawdled on the ball, allowing {player} to tackle.",
            "Messy play, but {player} comes away with it."
        ]
    },
    injury: {
        poetic: ["A warrior falls! {player} is down and in pain.", "The physio is sprinting onto the pitch. Concern for {player}."],
        analytical: ["{player} pulled up holding their hamstring.", "Looks like an impact injury for {player}."],
        neutral: ["{player} is down injured.", "Stoppage in play for an injury to {player}."],
        critical: ["That looked nasty. {player} might be done.", "Hopefully just a knock for {player}."]
    },
    red_card: {
        poetic: ["A moment of madness! {player} takes the long walk!", "Red mist descends! {player} is off!"],
        analytical: ["Reckless challenge. The referee had no choice.", "Straight red for {player}. Dangerous play."],
        neutral: ["Red card for {player}.", "The referee shows the red card to {player}."],
        critical: ["Stupid foul by {player}. He's let his team down.", "Absolutely unnecessary. {player} is sent off."]
    },
    second_yellow: {
        poetic: ["Deja vu! A second yellow and {player} is gone!", "He knew the risk! {player} sent for an early shower!"],
        analytical: ["{player} was already on a booking. Careless.", "Second yellow card. Correct decision."],
        neutral: ["Second yellow for {player}. He is sent off.", "Red card following a second yellow for {player}."],
        critical: ["Why make that tackle on a yellow? {player} lacks discipline.", "The manager will be furious. {player} sent off."]
    },
    var_check: {
        poetic: ["The finger to the ear! The drama isn't over yet!", "Hold your breath! VAR is intervening!"],
        analytical: ["Checking for a possible infringement.", "VAR review in progress."],
        neutral: ["VAR check underway.", "Referee consulting with VAR."],
        critical: ["This is taking too long.", "VAR checking the goal."]
    },
    var_goal: {
        poetic: ["The goal stands! Relief washes over the stadium!", "Celebrations reignited! It counts!"],
        analytical: ["Check complete. Goal confirmed.", "No clear error found. The goal stands."],
        neutral: ["Goal confirmed by VAR.", "The referee points to the center circle."],
        critical: ["Right decision in the end.", "Goal given."]
    },
    var_no_goal: {
        poetic: ["Heartbreak! The goal is chalked off!", "Silence falls! VAR rules it out!"],
        analytical: ["Disallowed. Offside in the buildup.", "Foul spotted by VAR. Goal cancelled."],
        neutral: ["Goal disallowed by VAR.", "No goal."],
        critical: ["Cruel blow, but correct call.", "Goal ruled out."]
    },
    weather: {
        poetic: [
            "The heavens have opened! An epic battle in the rain!",
            "Swirling winds are wreaking havoc! Chaos in the air!",
            "The snow is falling, painting a beautiful but treacherous scene."
        ],
        analytical: [
            "The ball is stopping dead in the wet patches. Players need to adapt.",
            "Wind carrying the ball out of play. Crosses are difficult today.",
            "Slippery surface is making goalkeeping a nightmare."
        ],
        neutral: [
            "Play continues despite the heavy rain.",
            "Conditions are worsening here.",
            "Visibility dropping slightly due to the snow."
        ],
        critical: [
            "This pitch is a mud bath! Impossible to play good football.",
            "Players slipping all over the place. Wrong stud selection?",
            "The game is descending into a farce with this weather."
        ]
    },
    shout: {
        poetic: [
            "The manager is losing his mind on the touchline!",
            "A roar from the bench! The players respond!",
            "Touchline theatrics! Trying to ignite a spark!"
        ],
        analytical: [
            "Instructions barking from the technical area.",
            "Manager demands higher intensity.",
            "Tactical adjustment shouted to the captain."
        ],
        neutral: [
            "The manager shouts instructions.",
            "Touchline shout: Demand More.",
            "Manager signals to the team."
        ],
        critical: [
            "Manager looks desperate on the sideline.",
            "Screaming at the players won't fix this shape.",
            "Arguments breaking out between bench and players."
        ]
    },
    tactical: {
        poetic: [
            "Rolling the dice! A change in shape!",
            "Throwing caution to the wind! All out attack!",
            "Batten down the hatches! Parking the bus!"
        ],
        analytical: [
            "Tactical shift. Changing the formation structure.",
            "Adjusting the defensive line depth.",
            "Changing pressing triggers and mentality."
        ],
        neutral: [
            "Formation change for {team}.",
            "Tactical adjustment confirmed.",
            "Team shape reorganized."
        ],
        critical: [
            "Confusing change. Players look lost.",
            "Defensive mindset invites pressure.",
            "Too aggressive? Leaving gaps at the back."
        ]
    },
    default: {
        poetic: ["{player} is weaving magic out there!"],
        analytical: ["{player} maintains tactical discipline."],
        neutral: ["{player} is involved in the play."],
        critical: ["{player} needs to do better."]
    }
};

const VAR_TEMPLATES = [
    "VAR CHECK! The referee is touching his earpiece... 📺",
    "Hold on! VAR is reviewing the incident...",
    "Drama! The goal is under review by VAR.",
    "The referee signals for a VAR check. Tension!"
];

const KEANE_TEMPLATES = [
    "Roy Keane: 'Finally showing some bottle! That's what I want to see!'",
    "Roy Keane: 'Pathetic. Absolute schoolboy stuff. Do your job!'",
    "Roy Keane: 'About time they woke up. Should have done that 20 minutes ago.'",
    "Roy Keane: 'I've seen milk turn faster than that defender. Shocking.'",
    "Roy Keane: 'He's gone down like he's been shot. Get up!'"
];

export const generateCommentary = (type: string, ctx: CommentaryContext): { text: string, style: CommentaryStyle } => {
    let style: CommentaryStyle = 'neutral';
    const rand = Math.random();
    
    // Default weights
    let wPoetic = 0.25;
    let wAnalytical = 0.30;
    let wNeutral = 0.30;
    let wCritical = 0.15;

    if (ctx.isDerby) {
        wPoetic += 0.15;
        wCritical += 0.10;
        wNeutral -= 0.25;
    }
    
    if (ctx.minute > 85 && (ctx.score && Math.abs(ctx.score.home - ctx.score.away) <= 1)) {
        wPoetic += 0.30;
        wAnalytical -= 0.20;
    }

    if (rand < wPoetic) style = 'poetic';
    else if (rand < wPoetic + wAnalytical) style = 'analytical';
    else if (rand < wPoetic + wAnalytical + wNeutral) style = 'neutral';
    else style = 'critical';

    let templates = TEMPLATES[type]?.[style] || TEMPLATES['default'][style];
    
    // Specific overrides
    if (type === 'var') templates = VAR_TEMPLATES;
    if (type === 'keane') {
        templates = KEANE_TEMPLATES;
        style = 'critical';
    }

    let text = getRandom(templates);

    const nickname = NICKNAMES[ctx.player.name];
    const nameToUse = (nickname && Math.random() < 0.3) ? nickname : ctx.player.name;

    text = text.replace(/{player}/g, nameToUse);
    text = text.replace(/{team}/g, ctx.team.name);
    text = text.replace(/{minute}/g, ctx.minute.toString());

    if ((style === 'analytical' || style === 'neutral') && Math.random() < 0.1) {
        text += ` ${getRandom(IDIOMS)}.`;
    }

    return { text, style };
};

export const generateCrowdReaction = (type: string, ctx: CommentaryContext, isHomeEvent: boolean): string | null => {
    // Placeholder for future Crowd SFX logic mapping
    return null;
};
