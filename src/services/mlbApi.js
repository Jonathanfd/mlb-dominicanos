// MLB Stats API Service
// Direct API calls — MLB Stats API is public and CORS-friendly

const BASE_URL = 'https://statsapi.mlb.com/api/v1';

// Get schedule for a specific date with full boxscore data
export async function getSchedule(date) {
  const formattedDate = date instanceof Date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : date;

  try {
    // Hydrate with boxscore to get player data directly
    const response = await fetch(
      `${BASE_URL}/schedule?sportId=1&date=${formattedDate}&hydrate=team(roster(person)),linescore,decisions,probablePitcher,boxscore`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch schedule: ${response.status}`);
    }

    const data = await response.json();
    return data.dates?.[0]?.games || [];
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return [];
  }
}

// Get boxscore for a specific game
export async function getBoxScore(gamePk) {
  try {
    // Use the game endpoint with boxscore and hydrate persons with birthCountry
    const response = await fetch(
      `${BASE_URL}/game/${gamePk}/boxscore?hydrate=person`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch boxscore: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching boxscore:', error);
    return null;
  }
}

// Cache for player birth countries
const playerBirthCountryCache = new Map();

// Get player info to determine birth country
export async function getPlayerBirthCountry(playerId) {
  if (playerBirthCountryCache.has(playerId)) {
    return playerBirthCountryCache.get(playerId);
  }

  try {
    const response = await fetch(`${BASE_URL}/people/${playerId}`);
    if (response.ok) {
      const data = await response.json();
      const birthCountry = data.people?.[0]?.birthCountry || null;
      playerBirthCountryCache.set(playerId, birthCountry);
      return birthCountry;
    }
  } catch (error) {
    console.error('Error fetching player:', error);
  }
  return null;
}

// Filter Dominican players from boxscore
export function extractDominicanPlayers(boxscore) {
  if (!boxscore) return { home: [], away: [] };

  const dominicanPlayers = { home: [], away: [] };

  // Process both teams
  ['home', 'away'].forEach(team => {
    const teamData = boxscore.teams?.[team];
    if (!teamData) return;

    const players = teamData.players || {};
    const batters = new Set((teamData.batters || []).map(id => `ID${id}`));
    const pitchers = new Set((teamData.pitchers || []).map(id => `ID${id}`));

    Object.entries(players).forEach(([playerId, player]) => {
      const person = player.person || {};
      const stats = player.stats || {};
      const position = player.position || {};
      const playerName = person.fullName || '';

      // Check if player is Dominican by birthCountry from MLB API
      const isDominican =
        person.birthCountry === 'Dominican Republic' ||
        person.birthCountry === 'D.R.' ||
        person.birthCountry === 'Republica Dominicana';

      if (isDominican) {
        const battingStats = stats.batting || {};
        const pitchingStats = stats.pitching || {};

        // Participation check: in batters/pitchers list OR has non-zero stats
        const hasBattingParticipation = Object.keys(battingStats).length > 0 &&
          (battingStats.atBats > 0 || battingStats.plateAppearances > 0 || battingStats.runs > 0);
        const hasPitchingParticipation = Object.keys(pitchingStats).length > 0 &&
          (pitchingStats.inningsPitched !== '0.0' && pitchingStats.inningsPitched !== 0);

        const participated = batters.has(playerId) || pitchers.has(playerId) ||
          hasBattingParticipation || hasPitchingParticipation;

        dominicanPlayers[team].push({
          id: person.id,
          name: playerName,
          position: position.abbreviation || 'N/A',
          jerseyNumber: player.jerseyNumber,
          batting: {
            atBats: battingStats.atBats || 0,
            hits: battingStats.hits || 0,
            runs: battingStats.runs || 0,
            rbi: battingStats.rbi || 0,
            homeRuns: battingStats.homeRuns || 0,
            strikeOuts: battingStats.strikeOuts || 0,
            baseOnBalls: battingStats.baseOnBalls || 0,
            avg: battingStats.avg || '.000',
            ops: battingStats.ops || '.000'
          },
          pitching: {
            inningsPitched: pitchingStats.inningsPitched || '0.0',
            hits: pitchingStats.hits || 0,
            runs: pitchingStats.runs || 0,
            earnedRuns: pitchingStats.earnedRuns || 0,
            strikeOuts: pitchingStats.strikeOuts || 0,
            walks: pitchingStats.baseOnBalls || 0,
            era: pitchingStats.era || '0.00'
          },
          isPitcher: position.type === 'Pitcher' || Object.keys(pitchingStats).length > 0,
          participated: participated
        });
      }
    });

    // Sort: participated players first
    dominicanPlayers[team].sort((a, b) => {
      if (a.participated === b.participated) return 0;
      return a.participated ? -1 : 1;
    });
  });

  return dominicanPlayers;
}

// Get team logo URL
export function getTeamLogoUrl(teamId) {
  return `https://www.mlbstatic.com/team-logos/${teamId}.svg`;
}

// Format game status
export function formatGameStatus(game) {
  const status = game.status?.abstractGameState;
  const detailedState = game.status?.detailedState;

  if (status === 'Live') {
    const inning = game.linescore?.currentInning || 1;
    const inningState = game.linescore?.inningState || 'Top';
    return {
      text: `${inningState} ${inning}`,
      isLive: true,
      isFinal: false
    };
  } else if (status === 'Final') {
    return {
      text: detailedState || 'Final',
      isLive: false,
      isFinal: true
    };
  } else {
    // Scheduled or Preview
    const gameTime = new Date(game.gameDate);
    return {
      text: gameTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      isLive: false,
      isFinal: false
    };
  }
}

// Fetch full player profile with season + career stats
export async function fetchPlayerProfile(playerId) {
  try {
    const response = await fetch(
      `${BASE_URL}/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=[season,career])`
    );
    if (!response.ok) throw new Error('Failed to fetch player profile');
    const data = await response.json();
    return data.people?.[0] || null;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

// Get player headshot URL from MLB CDN
export function getPlayerHeadshotUrl(playerId) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

// Fetch Dominican leaders across different categories
export async function getDominicanLeaders(season = 2025) {
  try {
    const hittingCategories = 'homeRuns,runsBattedIn,battingAverage,onBasePlusSlugging,hits,doubles,triples,stolenBases,onBasePercentage,sluggingPercentage,runs';
    const pitchingCategories = 'earnedRunAverage,strikeOuts,saves,whip,wins,strikeoutsPer9Inn,inningsPitched,gamesPlayed,walks,walksPer9Inn';

    // We request a large limit (100) to ensure we get enough Dominicans after filtering
    const [hittingRes, pitchingRes] = await Promise.all([
      fetch(`${BASE_URL}/stats/leaders?leaderCategories=${hittingCategories}&statGroup=hitting&limit=100&season=${season}&hydrate=person`),
      fetch(`${BASE_URL}/stats/leaders?leaderCategories=${pitchingCategories}&statGroup=pitching&limit=100&season=${season}&hydrate=person`)
    ]);

    if (!hittingRes.ok || !pitchingRes.ok) throw new Error('Failed to fetch leaders');

    const [hittingData, pitchingData] = await Promise.all([
      hittingRes.json(),
      pitchingRes.json()
    ]);

    const processCategory = (categoryData) => {
      if (!categoryData || !categoryData.leaders) return [];

      // Filter only Dominican players
      const dominicans = categoryData.leaders.filter(leader => {
        const country = leader.person?.birthCountry;
        return country === 'Dominican Republic' || country === 'D.R.' || country === 'Republica Dominicana';
      });

      // Map to a clean object and return top 5
      return dominicans.slice(0, 5).map(leader => ({
        id: leader.person.id,
        name: leader.person.fullName,
        teamName: leader.team.name,
        value: leader.value,
        rank: leader.rank
      }));
    };

    const leaders = {
      hitting: {},
      pitching: {}
    };

    // Process hitting categories
    hittingData.leagueLeaders?.forEach(category => {
      leaders.hitting[category.leaderCategory] = processCategory(category);
    });

    // Process pitching categories
    pitchingData.leagueLeaders?.forEach(category => {
      leaders.pitching[category.leaderCategory] = processCategory(category);
    });

    return leaders;
  } catch (error) {
    console.error('Error fetching dominican leaders:', error);
    return null;
  }
}
