import { useState, useEffect, useMemo } from 'react';
import { getDominicanLeaders, getPlayerHeadshotUrl, getTeamLogoUrl } from '../services/mlbApi';
import PlayerModal from './PlayerModal';
import './Leaderboard.css';

function Leaderboard() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => currentYear - i);

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [subTab, setSubTab] = useState('hitters'); // 'hitters' or 'pitchers'
    const [leaders, setLeaders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

    useEffect(() => {
        async function fetchLeaders() {
            try {
                setLoading(true);
                const data = await getDominicanLeaders(selectedYear);
                setLeaders(data);
            } catch (err) {
                console.error('Failed to load leaders', err);
                setError('Error al cargar la tabla de líderes. Por favor intente más tarde.');
            } finally {
                setLoading(false);
            }
        }

        fetchLeaders();
    }, [selectedYear]);

    const isEmpty = useMemo(() => {
        if (!leaders) return true;
        const hittingEmpty = Object.values(leaders.hitting).every(cat => !cat || cat.length === 0);
        const pitchingEmpty = Object.values(leaders.pitching).every(cat => !cat || cat.length === 0);
        return hittingEmpty && pitchingEmpty;
    }, [leaders]);

    if (loading) {
        return (
            <div className="leaderboard-loading">
                <div className="skeleton-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-card skeleton-card"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state glass-card animate-fadeIn">
                <div className="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!leaders) return null;

    const renderCategory = (title, items, valueLabel, isPitching = false) => {
        if (!items || items.length === 0) return null;

        return (
            <div className="leaderboard-category glass-card animate-fadeIn">
                <div className="category-header">
                    <h3>{title}</h3>
                    <span className="category-badge">{isPitching ? 'Pitcheo' : 'Bateo'}</span>
                </div>

                <div className="leaders-list">
                    {items.map((player, index) => (
                        <div
                            key={player.id}
                            className={`leader-item ${index === 0 ? 'top-leader' : ''}`}
                            onClick={() => setSelectedPlayerId(player.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedPlayerId(player.id);
                                }
                            }}
                            aria-label={`Ver perfil de ${player.name}`}
                        >
                            <div className="leader-rank">{index + 1}</div>

                            <div className="leader-avatar-container">
                                <img
                                    src={getPlayerHeadshotUrl(player.id)}
                                    alt={player.name}
                                    className="leader-avatar"
                                    onError={(e) => { e.target.src = 'https://www.mlbstatic.com/team-logos/league-on-dark/1.svg'; }}
                                />
                            </div>

                            <div className="leader-info">
                                <div className="leader-name">{player.name}</div>
                                <div className="leader-team">{player.teamName}</div>
                            </div>

                            <div className="leader-stat">
                                <div className="stat-value">{player.value}</div>
                                <div className="stat-label">{valueLabel}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="leaderboard-container">
            <div className="leaderboard-intro text-center mb-4">
                <div className="season-selector-container">
                    <label htmlFor="season-select" className="season-label">Temporada:</label>
                    <select
                        id="season-select"
                        className="season-select"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <p className="intro-text">Mostrando los líderes dominicanos de la temporada {selectedYear}.</p>
            </div>

            {isEmpty ? (
                <div className="empty-state glass-card animate-fadeIn" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div className="empty-icon">📅</div>
                    <h3>Aún no hay estadísticas para {selectedYear}</h3>
                    <p>La temporada regular aún no ha comenzado o no hay datos suficientes de líderes.</p>
                    <p className="empty-hint">Por favor, selecciona una temporada anterior en el menú de arriba.</p>
                </div>
            ) : (
                <>
                    <div className="leaderboard-tabs mb-4">
                        <button
                            className={`sub-tab-btn ${subTab === 'hitters' ? 'active' : ''}`}
                            onClick={() => setSubTab('hitters')}
                        >
                            Bateadores
                            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: '6px', verticalAlign: '-4px' }}>
                                <g transform="rotate(45 12 12)">
                                    <path d="M10 4C10 2.895 10.895 2 12 2C13.105 2 14 2.895 14 4V13H10V4Z" fill="#D27D46" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                    <path d="M10.5 13H13.5V19H10.5V13Z" fill="#e2e8f0" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                    <line x1="10.5" y1="14" x2="13.5" y2="15" stroke="currentColor" strokeWidth="1.5" />
                                    <line x1="10.5" y1="16" x2="13.5" y2="17" stroke="currentColor" strokeWidth="1.5" />
                                    <line x1="10.5" y1="18" x2="13.5" y2="19" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M9 19C9 18.448 9.448 18 10 18H14C14.552 18 15 18.448 15 19C15 19.552 14.552 20 14 20H10C9.448 20 9 19.552 9 19Z" fill="#D27D46" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                </g>
                            </svg>
                        </button>
                        <button
                            className={`sub-tab-btn ${subTab === 'pitchers' ? 'active' : ''}`}
                            onClick={() => setSubTab('pitchers')}
                        >
                            Lanzadores ⚾️
                        </button>
                    </div>

                    <div className="leaderboard-grid">
                        {subTab === 'hitters' ? (
                            <>
                                {renderCategory('Promedio de Bateo', leaders.hitting.battingAverage, 'AVG')}
                                {renderCategory('Porcentaje de Embasarse', leaders.hitting.onBasePercentage, 'OBP')}
                                {renderCategory('Slugging', leaders.hitting.sluggingPercentage, 'SLG')}
                                {renderCategory('OPS', leaders.hitting.onBasePlusSlugging, 'OPS')}
                                {renderCategory('Hits', leaders.hitting.hits, 'H')}
                                {renderCategory('Dobles', leaders.hitting.doubles, '2B')}
                                {renderCategory('Triples', leaders.hitting.triples, '3B')}
                                {renderCategory('Home Runs', leaders.hitting.homeRuns, 'HR')}
                                {renderCategory('Carreras Anotadas', leaders.hitting.runs, 'R')}
                                {renderCategory('Carreras Remolcadas', leaders.hitting.runsBattedIn, 'RBI')}
                                {renderCategory('Bases Robadas', leaders.hitting.stolenBases, 'SB')}
                            </>
                        ) : (
                            <>
                                {renderCategory('Victorias', leaders.pitching.wins, 'W', true)}
                                {renderCategory('Efectividad', leaders.pitching.earnedRunAverage, 'ERA', true)}
                                {renderCategory('WHIP', leaders.pitching.whip, 'WHIP', true)}
                                {renderCategory('Juegos Salvados', leaders.pitching.saves, 'SV', true)}
                                {renderCategory('Ponches', leaders.pitching.strikeOuts, 'SO', true)}
                                {renderCategory('Ponches por 9 Innings', leaders.pitching.strikeoutsPer9Inn, 'K/9', true)}
                                {renderCategory('Bases por Bolas', leaders.pitching.walks, 'BB', true)}
                                {renderCategory('BB por cada 9 inning', leaders.pitching.walksPer9Inn, 'BB/9', true)}
                                {renderCategory('Entradas Lanzadas', leaders.pitching.inningsPitched, 'IP', true)}
                                {renderCategory('Juegos Jugados', leaders.pitching.gamesPlayed, 'G', true)}
                            </>
                        )}
                    </div>
                </>
            )}

            {selectedPlayerId && (
                <PlayerModal
                    playerId={selectedPlayerId}
                    onClose={() => setSelectedPlayerId(null)}
                />
            )}
        </div>
    );
}

export default Leaderboard;
