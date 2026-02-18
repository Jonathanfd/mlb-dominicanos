import { useState, useEffect, useCallback } from 'react';
import OddsCard from './OddsCard';
import ParlayCard from './ParlayCard';
import { getMLBOdds, matchOddsToGames, hasApiKey } from '../services/oddsApi';
import { analyzeGamesForBetting } from '../services/bettingAnalysis';
import './BettingTab.css';

function BettingTab({ games, selectedDate }) {
    const [odds, setOdds] = useState([]);
    const [analysis, setAnalysis] = useState({ picks: [], parlays: [] });
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('parlays');
    const [oddsSource, setOddsSource] = useState('demo'); // 'live', 'offseason', 'demo'

    const fetchOdds = useCallback(async () => {
        setLoading(true);
        try {
            // Try fetching live odds
            const liveOdds = await getMLBOdds();

            if (liveOdds && liveOdds.length > 0) {
                setOddsSource('live');
            } else if (hasApiKey()) {
                setOddsSource('offseason');
            } else {
                setOddsSource('demo');
            }

            // Match odds to games or generate demo odds
            const matchedOdds = matchOddsToGames(games, liveOdds);
            setOdds(matchedOdds);

            // Run analysis
            const result = analyzeGamesForBetting(games, matchedOdds);
            setAnalysis(result);
        } catch (err) {
            console.error('Error fetching odds:', err);
            setOddsSource(hasApiKey() ? 'offseason' : 'demo');
            // Fallback to demo analysis
            const matchedOdds = matchOddsToGames(games, null);
            setOdds(matchedOdds);
            const result = analyzeGamesForBetting(games, matchedOdds);
            setAnalysis(result);
        } finally {
            setLoading(false);
        }
    }, [games]);

    useEffect(() => {
        if (games.length > 0) {
            fetchOdds();
        } else {
            setLoading(false);
        }
    }, [fetchOdds, games]);

    if (games.length === 0) {
        return (
            <div className="betting-empty glass-card animate-fadeIn">
                <div className="empty-icon">📊</div>
                <h3>No hay juegos disponibles</h3>
                <p>Selecciona una fecha con juegos programados para ver las líneas.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="betting-loading">
                <div className="betting-loading-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="game-card-skeleton glass-card">
                            <div className="skeleton skeleton-header"></div>
                            <div className="skeleton skeleton-teams"></div>
                            <div className="skeleton skeleton-players"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="betting-tab">
            {/* Status banner */}
            {oddsSource === 'live' ? (
                <div className="live-banner">
                    <span className="live-icon">🟢</span>
                    <span>Odds en vivo — Datos reales de DraftKings, FanDuel, BetMGM y más</span>
                </div>
            ) : oddsSource === 'offseason' ? (
                <div className="offseason-banner">
                    <span className="demo-icon">📅</span>
                    <span>Fuera de temporada — API Key configurada ✅ Las odds en vivo se activarán cuando inicie la temporada MLB. Usando datos simulados.</span>
                </div>
            ) : (
                <div className="demo-banner">
                    <span className="demo-icon">🔬</span>
                    <span>Modo Demo — Odds simuladas basadas en récords de equipos. </span>
                    <a href="https://the-odds-api.com" target="_blank" rel="noopener noreferrer">
                        Obtén API Key para odds en vivo
                    </a>
                </div>
            )}

            {/* Disclaimer */}
            <div className="betting-disclaimer">
                ⚠️ Las recomendaciones son informativas y basadas en análisis estadístico. No constituyen consejo financiero. Apuesta responsablemente.
            </div>

            {/* Section toggle */}
            <div className="section-toggle">
                <button
                    className={`toggle-btn ${activeSection === 'parlays' ? 'active' : ''}`}
                    onClick={() => setActiveSection('parlays')}
                >
                    🎯 Recomendaciones
                </button>
                <button
                    className={`toggle-btn ${activeSection === 'lines' ? 'active' : ''}`}
                    onClick={() => setActiveSection('lines')}
                >
                    📋 Todas las Líneas
                </button>
            </div>

            {/* Parlays Section */}
            {activeSection === 'parlays' && (
                <div className="parlays-section animate-fadeIn">
                    <h3 className="section-title">
                        <span className="section-icon">🧠</span>
                        Recomendaciones del Día
                    </h3>
                    <p className="section-subtitle">
                        Análisis basado en récords, pitchers, localía y consenso de odds
                    </p>

                    {analysis.parlays.length > 0 ? (
                        <div className="parlays-grid">
                            {analysis.parlays.map((parlay, idx) => (
                                <ParlayCard key={idx} parlay={parlay} />
                            ))}
                        </div>
                    ) : (
                        <div className="betting-empty glass-card">
                            <p>No hay suficientes juegos para generar recomendaciones.</p>
                        </div>
                    )}
                </div>
            )}

            {/* All Lines Section */}
            {activeSection === 'lines' && (
                <div className="lines-section animate-fadeIn">
                    <h3 className="section-title">
                        <span className="section-icon">📊</span>
                        Líneas del Día — {games.length} Juegos
                    </h3>

                    <div className="odds-grid">
                        {games.map((game, idx) => {
                            const gameOdds = odds.find(o =>
                                o.id === game.gamePk || o.gamePk === game.gamePk
                            ) || odds[idx];

                            return (
                                <OddsCard
                                    key={game.gamePk}
                                    game={game}
                                    odds={gameOdds}
                                />
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BettingTab;
