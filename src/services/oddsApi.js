// The Odds API Service
// Free tier: 500 requests/month
// Docs: https://the-odds-api.com/liveapi/guides/v4/

const ODDS_API_KEY = import.meta.env.VITE_ODDS_API_KEY || 'DEMO';
const ODDS_BASE_URL = 'https://api.the-odds-api.com/v4';

// Check if a real API key is configured
export function hasApiKey() {
    return ODDS_API_KEY !== 'DEMO';
}

// Demo/fallback data when no API key is configured
function generateDemoOdds(games) {
    const bookmakers = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'];

    return games.map(game => {
        const homeTeam = game.teams?.home?.team?.name || 'Home';
        const awayTeam = game.teams?.away?.team?.name || 'Away';
        const homeRecord = game.teams?.home?.leagueRecord || { wins: 50, losses: 50 };
        const awayRecord = game.teams?.away?.leagueRecord || { wins: 50, losses: 50 };

        // Generate realistic odds based on team records
        const homeWinPct = homeRecord.wins / (homeRecord.wins + homeRecord.losses) || 0.5;
        const awayWinPct = awayRecord.wins / (awayRecord.wins + awayRecord.losses) || 0.5;

        const homeML = homeWinPct > 0.55 ? -(100 + Math.floor(homeWinPct * 100))
            : homeWinPct < 0.45 ? +(100 + Math.floor((1 - homeWinPct) * 80))
                : (Math.random() > 0.5 ? -110 : +105);
        const awayML = -homeML + Math.floor(Math.random() * 20 - 10);

        const totalRuns = 7.5 + Math.random() * 2;

        return {
            id: game.gamePk,
            sport_key: 'baseball_mlb',
            home_team: homeTeam,
            away_team: awayTeam,
            commence_time: game.gameDate,
            bookmakers: bookmakers.map(name => ({
                key: name.toLowerCase().replace(/\s/g, ''),
                title: name,
                markets: [
                    {
                        key: 'h2h',
                        outcomes: [
                            { name: homeTeam, price: homeML > 0 ? homeML : homeML },
                            { name: awayTeam, price: awayML > 0 ? awayML : awayML }
                        ]
                    },
                    {
                        key: 'spreads',
                        outcomes: [
                            { name: homeTeam, price: -110, point: homeML < 0 ? -1.5 : 1.5 },
                            { name: awayTeam, price: -110, point: homeML < 0 ? 1.5 : -1.5 }
                        ]
                    },
                    {
                        key: 'totals',
                        outcomes: [
                            { name: 'Over', price: -110, point: Math.round(totalRuns * 2) / 2 },
                            { name: 'Under', price: -110, point: Math.round(totalRuns * 2) / 2 }
                        ]
                    }
                ]
            }))
        };
    });
}

// Fetch live MLB odds from The Odds API
export async function getMLBOdds() {
    if (ODDS_API_KEY === 'DEMO') {
        return null; // Will use demo data
    }

    try {
        const response = await fetch(
            `${ODDS_BASE_URL}/sports/baseball_mlb/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
        );

        if (!response.ok) {
            console.warn('Odds API error, using demo data');
            return null;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching odds:', error);
        return null;
    }
}

// Match odds data with MLB schedule games
export function matchOddsToGames(games, oddsData) {
    if (!oddsData) {
        // Generate demo odds from game data
        return generateDemoOdds(games);
    }

    // Try to match by team name
    return games.map(game => {
        const homeTeam = game.teams?.home?.team?.name || '';
        const awayTeam = game.teams?.away?.team?.name || '';

        const matchedOdds = oddsData.find(event => {
            const eventHome = event.home_team || '';
            const eventAway = event.away_team || '';
            return (eventHome.includes(homeTeam.split(' ').pop()) || homeTeam.includes(eventHome.split(' ').pop())) &&
                (eventAway.includes(awayTeam.split(' ').pop()) || awayTeam.includes(eventAway.split(' ').pop()));
        });

        if (matchedOdds) {
            return { ...matchedOdds, gamePk: game.gamePk };
        }

        // Fallback to demo odds for unmatched games
        return generateDemoOdds([game])[0];
    });
}

// Extract best odds across bookmakers
export function getBestOdds(gameOdds) {
    if (!gameOdds?.bookmakers?.length) {
        return { moneyline: null, spread: null, total: null };
    }

    const result = {
        moneyline: { home: null, away: null, bestBook: '' },
        spread: { home: null, away: null, point: null, bestBook: '' },
        total: { over: null, under: null, point: null, bestBook: '' },
        allBooks: []
    };

    gameOdds.bookmakers.forEach(book => {
        const bookData = { name: book.title, moneyline: {}, spread: {}, total: {} };

        book.markets.forEach(market => {
            if (market.key === 'h2h') {
                const home = market.outcomes.find(o => o.name === gameOdds.home_team);
                const away = market.outcomes.find(o => o.name === gameOdds.away_team);
                bookData.moneyline = { home: home?.price, away: away?.price };

                if (!result.moneyline.home || (home?.price > 0 && home.price > result.moneyline.home) ||
                    (home?.price < 0 && home.price > result.moneyline.home)) {
                    result.moneyline.home = home?.price;
                    result.moneyline.away = away?.price;
                    result.moneyline.bestBook = book.title;
                }
            }

            if (market.key === 'spreads') {
                const home = market.outcomes.find(o => o.name === gameOdds.home_team);
                const away = market.outcomes.find(o => o.name === gameOdds.away_team);
                bookData.spread = { home: home?.price, away: away?.price, point: home?.point };

                if (!result.spread.home) {
                    result.spread.home = home?.price;
                    result.spread.away = away?.price;
                    result.spread.point = home?.point;
                    result.spread.bestBook = book.title;
                }
            }

            if (market.key === 'totals') {
                const over = market.outcomes.find(o => o.name === 'Over');
                const under = market.outcomes.find(o => o.name === 'Under');
                bookData.total = { over: over?.price, under: under?.price, point: over?.point };

                if (!result.total.over) {
                    result.total.over = over?.price;
                    result.total.under = under?.price;
                    result.total.point = over?.point;
                    result.total.bestBook = book.title;
                }
            }
        });

        result.allBooks.push(bookData);
    });

    return result;
}

// Format American odds for display
export function formatOdds(odds) {
    if (odds === null || odds === undefined) return 'N/A';
    return odds > 0 ? `+${odds}` : `${odds}`;
}

// Calculate implied probability from American odds
export function impliedProbability(odds) {
    if (!odds) return 0;
    if (odds > 0) return 100 / (odds + 100);
    return Math.abs(odds) / (Math.abs(odds) + 100);
}
