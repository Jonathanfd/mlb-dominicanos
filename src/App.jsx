import { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import DatePicker from "./components/DatePicker";
import TabNavigation from "./components/TabNavigation";
import BettingTab from "./components/BettingTab";
import Leaderboard from "./components/Leaderboard";
import {
  getSchedule,
  getBoxScore,
  extractDominicanPlayers,
} from "./services/mlbApi";

function App() {
  // Default to today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [games, setGames] = useState([]);
  const [gamesWithPlayers, setGamesWithPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dominicanos');
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Fetch games for selected date
  const fetchGames = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setLoading(true);
    setError(null);

    try {
      const scheduleData = await getSchedule(selectedDate);
      setGames(scheduleData);

      // Fetch boxscores for all games in parallel
      const boxscorePromises = scheduleData.map(async (game) => {
        const boxscore = await getBoxScore(game.gamePk);
        const dominicanPlayers = extractDominicanPlayers(boxscore);
        return { gamePk: game.gamePk, players: dominicanPlayers };
      });

      const boxscores = await Promise.all(boxscorePromises);
      const playersMap = {};
      boxscores.forEach(({ gamePk, players }) => {
        playersMap[gamePk] = players;
      });

      setGamesWithPlayers(playersMap);
    } catch (err) {
      // Only show error state if it's not a background refresh
      if (!isBackgroundRefresh) {
        setError("Error al cargar los juegos. Por favor intente de nuevo.");
      }
      console.error("Error fetching games:", err);
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  }, [selectedDate]);

  // Initial fetch when date changes
  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Auto-refresh interval (polling)
  useEffect(() => {
    const today = new Date();
    const isToday =
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    if (isToday) {
      setIsAutoRefreshing(true);
      // Poll every 30 seconds if viewing today's games
      const intervalId = setInterval(() => {
        fetchGames(true); // true = background refresh (no loading state)
      }, 30000);

      return () => {
        clearInterval(intervalId);
        setIsAutoRefreshing(false);
      };
    } else {
      setIsAutoRefreshing(false);
    }
  }, [selectedDate, fetchGames]);

  // Filter games that have Dominican players, sorted: Live → Scheduled → Final
  const gamesWithDominicanPlayers = useMemo(() => {
    const filtered = games.filter((game) => {
      const players = gamesWithPlayers[game.gamePk];
      if (!players) return true;
      return players.home.length > 0 || players.away.length > 0;
    });

    const statusPriority = (game) => {
      const status = game.status?.abstractGameState;
      if (status === 'Live') return 0;
      if (status === 'Final') return 2;
      return 1; // Scheduled / Preview
    };

    return filtered.sort((a, b) => statusPriority(a) - statusPriority(b));
  }, [games, gamesWithPlayers]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setGamesWithPlayers({});
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="main-content">
        <div className="container">
          <div className="content-header">
            <div className="title-section">
              <h2 className="page-title">
                {activeTab === 'dominicanos' && <span className="dr-flag"></span>}
                {activeTab === 'dominicanos' ? 'Peloteros Dominicanos' :
                  activeTab === 'apuestas' ? 'Líneas de Apuestas' : 'Líderes de la Liga'}
              </h2>
              <p className="page-subtitle">
                {activeTab === 'dominicanos' ? 'Sigue el rendimiento de los dominicanos en la MLB' :
                  activeTab === 'apuestas' ? 'Odds en vivo y recomendaciones de parlays' :
                    'Top 5 dominicanos en la MLB (2025)'}
              </p>
            </div>

            {activeTab !== 'leaderboard' && (
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            )}

            {(isAutoRefreshing && activeTab === 'dominicanos') && (
              <div className="auto-refresh-indicator" aria-live="polite" role="status">
                <span className="refresh-dot" aria-hidden="true"></span>
                Actualizando en vivo cada 30s
              </div>
            )}
          </div>

          {activeTab === 'dominicanos' ? (
            /* Dominican Players Tab */
            <>
              {loading ? (
                <div className="games-grid">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="game-card-skeleton glass-card">
                      <div className="skeleton skeleton-header"></div>
                      <div className="skeleton skeleton-teams"></div>
                      <div className="skeleton skeleton-players"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="error-state glass-card animate-fadeIn">
                  <div className="error-icon">⚠️</div>
                  <h3>Error</h3>
                  <p>{error}</p>
                  <button className="btn btn-primary" onClick={fetchGames}>
                    Reintentar
                  </button>
                </div>
              ) : gamesWithDominicanPlayers.length === 0 ? (
                <div className="empty-state glass-card animate-fadeIn">
                  <div className="empty-icon">⚾</div>
                  <h3>No hay juegos con dominicanos</h3>
                  {games.length === 0 ? (
                    <>
                      <p>No se encontraron juegos MLB para esta fecha.</p>
                      <p className="empty-hint">
                        La temporada regular MLB va de finales de marzo a octubre.
                        Selecciona una fecha durante la temporada.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Hay {games.length} juego{games.length !== 1 ? 's' : ''} programado{games.length !== 1 ? 's' : ''}, pero ninguno tiene peloteros dominicanos.
                      </p>
                      <p className="empty-hint">Intenta seleccionar otra fecha</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="games-grid">
                  {gamesWithDominicanPlayers.map((game, index) => (
                    <GameCard
                      key={game.gamePk}
                      game={game}
                      dominicanPlayers={
                        gamesWithPlayers[game.gamePk] || { home: [], away: [] }
                      }
                      animationDelay={index * 0.1}
                    />
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'apuestas' ? (
            /* Betting Tab */
            <BettingTab games={games} selectedDate={selectedDate} />
          ) : (
            /* Leaderboards Tab */
            <Leaderboard />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="flag-stripe"></div>
          <p>Datos proporcionados por MLB Stats API</p>
          <p className="footer-note">
            🇩🇴 Orgullo Dominicano en las Grandes Ligas
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
