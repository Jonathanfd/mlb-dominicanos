// Betting Analysis Engine
// Generates parlay recommendations based on team stats, odds, and situational factors

import { impliedProbability } from './oddsApi';

// Confidence levels
const CONFIDENCE = {
    HIGH: { label: 'Alta', emoji: '🔥', min: 0.65 },
    MEDIUM: { label: 'Media', emoji: '⚡', min: 0.55 },
    LOW: { label: 'Baja', emoji: '💡', min: 0 }
};

function getConfidenceLevel(score) {
    if (score >= CONFIDENCE.HIGH.min) return CONFIDENCE.HIGH;
    if (score >= CONFIDENCE.MEDIUM.min) return CONFIDENCE.MEDIUM;
    return CONFIDENCE.LOW;
}

// Analyze a single game and produce a pick
function analyzeGame(game, odds) {
    const home = game.teams?.home;
    const away = game.teams?.away;

    if (!home || !away) return null;

    const homeRecord = home.leagueRecord || { wins: 0, losses: 0 };
    const awayRecord = away.leagueRecord || { wins: 0, losses: 0 };

    const homeWinPct = homeRecord.wins / (homeRecord.wins + homeRecord.losses) || 0.5;
    const awayWinPct = awayRecord.wins / (awayRecord.wins + awayRecord.losses) || 0.5;

    // Factor 1: Record strength (30%)
    const recordDiff = homeWinPct - awayWinPct;

    // Factor 2: Home advantage (~54% historically in MLB) (15%)
    const homeAdvantage = 0.04;

    // Factor 3: Odds consensus / implied probability (35%)
    let oddsConfidence = 0;
    let homeImplied = 0.5;
    let awayImplied = 0.5;
    let homeML = null;
    let awayML = null;

    if (odds?.bookmakers?.length) {
        const market = odds.bookmakers[0]?.markets?.find(m => m.key === 'h2h');
        if (market) {
            const homeOutcome = market.outcomes.find(o => o.name === odds.home_team);
            const awayOutcome = market.outcomes.find(o => o.name === odds.away_team);
            homeML = homeOutcome?.price;
            awayML = awayOutcome?.price;
            homeImplied = impliedProbability(homeML);
            awayImplied = impliedProbability(awayML);
            oddsConfidence = Math.abs(homeImplied - awayImplied);
        }
    }

    // Factor 4: Pitcher analysis (20%) - from probable pitcher data
    let pitcherAdvantage = 0;
    const homePitcher = game.teams?.home?.probablePitcher;
    const awayPitcher = game.teams?.away?.probablePitcher;

    if (homePitcher?.era && awayPitcher?.era) {
        const homeERA = parseFloat(homePitcher.era) || 4.5;
        const awayERA = parseFloat(awayPitcher.era) || 4.5;
        pitcherAdvantage = (awayERA - homeERA) / 10; // Normalized
    }

    // Calculate total confidence score
    const homeScore = 0.5 + (recordDiff * 0.3) + (homeAdvantage * 0.15) +
        ((homeImplied - 0.5) * 0.35) + (pitcherAdvantage * 0.2);
    const awayScore = 1 - homeScore;

    // Determine the favored team
    const favoredHome = homeScore >= awayScore;
    const confidence = Math.max(homeScore, awayScore);
    const favoredTeam = favoredHome ? home : away;
    const opposingTeam = favoredHome ? away : home;
    const favoredRecord = favoredHome ? homeRecord : awayRecord;
    const favoredML = favoredHome ? homeML : awayML;

    // Build reasons
    const reasons = [];

    if (Math.abs(recordDiff) > 0.05) {
        const better = homeWinPct > awayWinPct ? home : away;
        const betterRecord = homeWinPct > awayWinPct ? homeRecord : awayRecord;
        reasons.push(`${better.team.name} tiene récord ${betterRecord.wins}-${betterRecord.losses}`);
    }

    if (favoredHome) {
        reasons.push(`Ventaja de localía`);
    }

    if (Math.abs(homeImplied - awayImplied) > 0.1) {
        reasons.push(`Favorito según las casas de apuestas`);
    }

    if (pitcherAdvantage !== 0) {
        const betterPitcher = pitcherAdvantage > 0 ? homePitcher : awayPitcher;
        if (betterPitcher?.fullName) {
            reasons.push(`${betterPitcher.fullName} en la loma`);
        }
    }

    if (reasons.length === 0) {
        reasons.push('Análisis estadístico general');
    }

    return {
        gamePk: game.gamePk,
        favoredTeam: favoredTeam.team.name,
        favoredTeamId: favoredTeam.team.id,
        opposingTeam: opposingTeam.team.name,
        confidence: Math.min(confidence, 0.85),
        confidenceLevel: getConfidenceLevel(confidence),
        moneyline: favoredML,
        record: `${favoredRecord.wins}-${favoredRecord.losses}`,
        reasons,
        isHome: favoredHome,
        homeTeam: home.team.name,
        awayTeam: away.team.name,
        homeML,
        awayML
    };
}

// Generate parlay combinations
function generateParlays(picks) {
    const sorted = [...picks].sort((a, b) => b.confidence - a.confidence);
    const parlays = [];

    // Pick del Día - single best pick
    if (sorted.length >= 1) {
        parlays.push({
            type: 'Pick del Día',
            emoji: '⭐',
            description: 'La apuesta individual más fuerte del día',
            picks: [sorted[0]],
            combinedConfidence: sorted[0].confidence,
            estimatedPayout: calculatePayout([sorted[0]], 100),
            riskLevel: 'Bajo'
        });
    }

    // Tripleta - top 3 picks
    if (sorted.length >= 3) {
        const tripletaPicks = sorted.slice(0, 3);
        parlays.push({
            type: 'Tripleta',
            emoji: '🎯',
            description: '3 picks seleccionados - balance óptimo',
            picks: tripletaPicks,
            combinedConfidence: tripletaPicks.reduce((acc, p) => acc * p.confidence, 1),
            estimatedPayout: calculatePayout(tripletaPicks, 100),
            riskLevel: 'Moderado'
        });
    }

    // Cuarteta - top 4 picks  
    if (sorted.length >= 4) {
        const cuartetaPicks = sorted.slice(0, 4);
        parlays.push({
            type: 'Cuarteta',
            emoji: '🔥',
            description: '4 picks de alta confianza',
            picks: cuartetaPicks,
            combinedConfidence: cuartetaPicks.reduce((acc, p) => acc * p.confidence, 1),
            estimatedPayout: calculatePayout(cuartetaPicks, 100),
            riskLevel: 'Alto'
        });
    }

    // Quinteta - top 5 picks
    if (sorted.length >= 5) {
        const quintetaPicks = sorted.slice(0, 5);
        parlays.push({
            type: 'Quinteta',
            emoji: '💎',
            description: '5 picks premium - mayor riesgo, mayor pago',
            picks: quintetaPicks,
            combinedConfidence: quintetaPicks.reduce((acc, p) => acc * p.confidence, 1),
            estimatedPayout: calculatePayout(quintetaPicks, 100),
            riskLevel: 'Muy Alto'
        });
    }

    return parlays;
}

// Calculate estimated payout for a parlay
function calculatePayout(picks, wager) {
    let multiplier = 1;

    picks.forEach(pick => {
        const ml = pick.moneyline || -130;
        if (ml > 0) {
            multiplier *= 1 + (ml / 100);
        } else {
            multiplier *= 1 + (100 / Math.abs(ml));
        }
    });

    return Math.round(wager * multiplier);
}

// Main analysis function
export function analyzeGamesForBetting(games, oddsData) {
    const picks = [];

    games.forEach(game => {
        // Find matching odds
        const gameOdds = oddsData?.find(o =>
            o.id === game.gamePk || o.gamePk === game.gamePk
        ) || oddsData?.find(o => {
            const homeTeam = game.teams?.home?.team?.name || '';
            return o.home_team?.includes(homeTeam.split(' ').pop());
        });

        const pick = analyzeGame(game, gameOdds);
        if (pick) {
            picks.push(pick);
        }
    });

    const parlays = generateParlays(picks);

    return { picks, parlays };
}
