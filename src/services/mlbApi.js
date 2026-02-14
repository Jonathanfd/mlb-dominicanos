// MLB Stats API Service
// Using Vite proxy to bypass CORS restrictions

const BASE_URL = '/mlb-api/api/v1';

// Get schedule for a specific date with full boxscore data
export async function getSchedule(date) {
  const formattedDate = date instanceof Date
    ? date.toISOString().split('T')[0]
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

      // Check if player is Dominican by birthCountry or by known players list
      const isDominican =
        person.birthCountry === 'Dominican Republic' ||
        person.birthCountry === 'D.R.' ||
        person.birthCountry === 'Republica Dominicana' ||
        KNOWN_DOMINICAN_PLAYERS.has(playerName);

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

// Comprehensive list of known Dominican MLB players (for fallback when API doesn't return birthCountry)
export const KNOWN_DOMINICAN_PLAYERS = new Set([
  // Superstars
  'Juan Soto', 'Vladimir Guerrero Jr.', 'Fernando Tatis Jr.', 'Manny Machado',
  'Rafael Devers', 'José Ramírez', 'Julio Rodríguez', 'Willy Adames',
  // Infielders
  'Elly De La Cruz', 'Ketel Marte', 'Jeremy Peña', 'Jorge Polanco',
  'Carlos Santana', 'Santiago Espinal', 'Geraldo Perdomo', 'Wander Franco',
  'Jean Segura', 'Hanser Alberto', 'Jeimer Candelario', 'Luis Arraez',
  'Nelson Cruz', 'Robinson Canó', 'Starlin Castro', 'Alcides Escobar',
  'Eduardo Escobar', 'Maikel Garcia', 'José Iglesias', 'Amed Rosario',
  // Outfielders
  'Teoscar Hernández', 'Starling Marte', 'Bryan De La Cruz', 'Jesús Sánchez',
  'Victor Robles', 'Manuel Margot', 'Oscar Gonzalez', 'Randy Arozarena',
  'Harold Ramirez', 'Leody Taveras', 'Eloy Jiménez', 'Marcell Ozuna',
  'Juan Lagares', 'Gregory Polanco', 'Yasiel Puig', 'Nelson Cruz',
  // Catchers
  'Gary Sánchez', 'Yainer Diaz', 'Francisco Mejía', 'Robinson Chirinos',
  'Martín Maldonado', 'Pedro Severino', 'Willson Contreras', 'Sandy León',
  // Pitchers
  'Sandy Alcántara', 'Luis Castillo', 'Framber Valdez', 'Emmanuel Clase',
  'Jhoan Durán', 'Freddy Peralta', 'Luis Severino', 'Camilo Doval',
  'Cristian Javier', 'Bryan Abreu', 'Brayan Bello', 'Luis Gil',
  'Eury Pérez', 'Frankie Montas', 'Reynaldo López', 'Ronel Blanco',
  'Carlos Estévez', 'Génesis Cabrera', 'Wandy Peralta', 'Jimmy Cordero',
  'Yohan Ramírez', 'Domingo Germán', 'Michael Pineda', 'Erasmo Ramírez',
  'Ranger Suárez', 'José Ureña', 'Johnny Cueto', 'Bartolo Colón',
  'Edwin Díaz', 'Dellin Betances', 'Hansel Robles', 'José Alvarado',
  'Gregory Soto', 'Yimi García', 'Diego Castillo', 'Félix Bautista'
]);

// Check if player is Dominican by name (fallback)
export function isDominicanByName(playerName) {
  return KNOWN_DOMINICAN_PLAYERS.has(playerName);
}
