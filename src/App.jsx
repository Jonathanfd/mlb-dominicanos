import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Header from "./components/Header";
import GameCard from "./components/GameCard";
import DatePicker from "./components/DatePicker";
import {
  getSchedule,
  getBoxScore,
  extractDominicanPlayers,
} from "./services/mlbApi";

function App() {
  // Default to August 15, 2025 - during MLB regular season with games
  const [selectedDate, setSelectedDate] = useState(new Date("2025-08-15"));
  const [games, setGames] = useState([]);
  const [gamesWithPlayers, setGamesWithPlayers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      // Poll every 30 seconds if viewing today's games
      const intervalId = setInterval(() => {
        fetchGames(true); // true = background refresh (no loading state)
      }, 30000);

      return () => clearInterval(intervalId);
    }
  }, [selectedDate, fetchGames]);

  // Filter games that have Dominican players
  const gamesWithDominicanPlayers = games.filter((game) => {
    const players = gamesWithPlayers[game.gamePk];
    if (!players) return true; // Show while loading
    return players.home.length > 0 || players.away.length > 0;
  });

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setGamesWithPlayers({});
  };

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        <div className="container">
          <div className="content-header">
            <div className="title-section">
              <h2 className="page-title">
                <span className="dr-flag"></span>
                Peloteros Dominicanos
              </h2>
              <p className="page-subtitle">
                Sigue el rendimiento de los dominicanos en la MLB
              </p>
            </div>

            <DatePicker
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>

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
              <p>
                No se encontraron juegos con peloteros dominicanos para esta
                fecha.
              </p>
              <p className="empty-hint">Intenta seleccionar otra fecha</p>
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
