import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { fetchPlayerProfile, getPlayerHeadshotUrl } from '../services/mlbApi';
import './PlayerModal.css';

function PlayerModal({ playerId, onClose }) {
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        if (!playerId) return;
        setLoading(true);
        setImgError(false);
        fetchPlayerProfile(playerId).then((data) => {
            setPlayer(data);
            setLoading(false);
        });
    }, [playerId]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    // Close on overlay click
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    if (!playerId) return null;

    // Extract stats by type and group
    const getStats = (group, type) => {
        if (!player?.stats) return null;
        const statGroup = player.stats.find(
            (s) => s.group?.displayName === group && s.type?.displayName === type
        );
        return statGroup?.splits?.[0]?.stat || null;
    };

    const isPitcher = player?.primaryPosition?.type === 'Pitcher';
    const seasonHitting = getStats('hitting', 'season');
    const careerHitting = getStats('hitting', 'career');
    const seasonPitching = getStats('pitching', 'season');
    const careerPitching = getStats('pitching', 'career');

    const currentYear = new Date().getFullYear();

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return createPortal(
        <div className="player-modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label={player?.fullName || 'Perfil del jugador'}>
            <div className="player-modal">
                {/* Close button */}
                <button className="player-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>

                {loading ? (
                    <div className="player-modal-loading">
                        <div className="modal-skeleton-header">
                            <div className="skeleton skeleton-circle"></div>
                            <div className="skeleton-text-group">
                                <div className="skeleton skeleton-line-lg"></div>
                                <div className="skeleton skeleton-line-sm"></div>
                            </div>
                        </div>
                        <div className="skeleton skeleton-table"></div>
                        <div className="skeleton skeleton-table"></div>
                    </div>
                ) : player ? (
                    <>
                        {/* Header Banner */}
                        <div className="player-modal-header">
                            <div className="player-headshot-container">
                                {!imgError ? (
                                    <img
                                        src={getPlayerHeadshotUrl(player.id)}
                                        alt={player.fullName}
                                        className="player-headshot"
                                        width="120"
                                        height="120"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <div className="player-headshot-fallback">
                                        <span>{player.primaryNumber ? `#${player.primaryNumber}` : player.useName?.charAt(0)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="player-header-info">
                                <h2 className="player-modal-name">
                                    {player.fullName}
                                    {player.primaryNumber && <span className="player-number">#{player.primaryNumber}</span>}
                                </h2>
                                <div className="player-meta">
                                    <span className="player-pos-badge">{player.primaryPosition?.abbreviation}</span>
                                    <span>B/T: {player.batSide?.code}/{player.pitchHand?.code}</span>
                                    <span>{player.height} / {player.weight} lbs</span>
                                </div>
                                {player.birthCountry === 'Dominican Republic' && (
                                    <div className="player-country-badge">
                                        <span className="dr-flag" aria-hidden="true"></span> República Dominicana
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Section */}
                        <div className="player-modal-body">
                            {/* Batting Stats */}
                            {(!isPitcher && (seasonHitting || careerHitting)) && (
                                <div className="stats-section">
                                    <h3 className="stats-section-title">
                                        {isPitcher ? 'Bateo' : '⚾ Estadísticas de Bateo'}
                                    </h3>
                                    <div className="stats-table-wrapper">
                                        <table className="stats-table">
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>AB</th>
                                                    <th>R</th>
                                                    <th>H</th>
                                                    <th>HR</th>
                                                    <th>RBI</th>
                                                    <th>SB</th>
                                                    <th>AVG</th>
                                                    <th>OBP</th>
                                                    <th>OPS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {seasonHitting && (
                                                    <tr>
                                                        <td className="stats-label">{currentYear}</td>
                                                        <td>{seasonHitting.atBats}</td>
                                                        <td>{seasonHitting.runs}</td>
                                                        <td>{seasonHitting.hits}</td>
                                                        <td className="stat-highlight">{seasonHitting.homeRuns}</td>
                                                        <td>{seasonHitting.rbi}</td>
                                                        <td>{seasonHitting.stolenBases}</td>
                                                        <td>{seasonHitting.avg}</td>
                                                        <td>{seasonHitting.obp}</td>
                                                        <td>{seasonHitting.ops}</td>
                                                    </tr>
                                                )}
                                                {careerHitting && (
                                                    <tr className="career-row">
                                                        <td className="stats-label">Carrera</td>
                                                        <td>{careerHitting.atBats}</td>
                                                        <td>{careerHitting.runs}</td>
                                                        <td>{careerHitting.hits}</td>
                                                        <td className="stat-highlight">{careerHitting.homeRuns}</td>
                                                        <td>{careerHitting.rbi}</td>
                                                        <td>{careerHitting.stolenBases}</td>
                                                        <td>{careerHitting.avg}</td>
                                                        <td>{careerHitting.obp}</td>
                                                        <td>{careerHitting.ops}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Pitching Stats */}
                            {(seasonPitching || careerPitching) && (
                                <div className="stats-section">
                                    <h3 className="stats-section-title">
                                        {isPitcher ? '⚾ Estadísticas de Pitcheo' : 'Pitcheo'}
                                    </h3>
                                    <div className="stats-table-wrapper">
                                        <table className="stats-table">
                                            <thead>
                                                <tr>
                                                    <th></th>
                                                    <th>W</th>
                                                    <th>L</th>
                                                    <th>ERA</th>
                                                    <th>G</th>
                                                    <th>IP</th>
                                                    <th>H</th>
                                                    <th>K</th>
                                                    <th>BB</th>
                                                    <th>WHIP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {seasonPitching && (
                                                    <tr>
                                                        <td className="stats-label">{currentYear}</td>
                                                        <td>{seasonPitching.wins}</td>
                                                        <td>{seasonPitching.losses}</td>
                                                        <td className="stat-highlight">{seasonPitching.era}</td>
                                                        <td>{seasonPitching.gamesPlayed}</td>
                                                        <td>{seasonPitching.inningsPitched}</td>
                                                        <td>{seasonPitching.hits}</td>
                                                        <td>{seasonPitching.strikeOuts}</td>
                                                        <td>{seasonPitching.baseOnBalls}</td>
                                                        <td>{seasonPitching.whip}</td>
                                                    </tr>
                                                )}
                                                {careerPitching && (
                                                    <tr className="career-row">
                                                        <td className="stats-label">Carrera</td>
                                                        <td>{careerPitching.wins}</td>
                                                        <td>{careerPitching.losses}</td>
                                                        <td className="stat-highlight">{careerPitching.era}</td>
                                                        <td>{careerPitching.gamesPlayed}</td>
                                                        <td>{careerPitching.inningsPitched}</td>
                                                        <td>{careerPitching.hits}</td>
                                                        <td>{careerPitching.strikeOuts}</td>
                                                        <td>{careerPitching.baseOnBalls}</td>
                                                        <td>{careerPitching.whip}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Bio Info */}
                            <div className="player-bio">
                                {player.nickName && (
                                    <div className="bio-item">
                                        <span className="bio-label">Apodo</span>
                                        <span className="bio-value">{player.nickName}</span>
                                    </div>
                                )}
                                <div className="bio-item">
                                    <span className="bio-label">Nacido</span>
                                    <span className="bio-value">
                                        {formatDate(player.birthDate)}
                                        {player.birthCity && ` — ${player.birthCity}, ${player.birthCountry}`}
                                    </span>
                                </div>
                                <div className="bio-item">
                                    <span className="bio-label">Edad</span>
                                    <span className="bio-value">{player.currentAge} años</span>
                                </div>
                                {player.mlbDebutDate && (
                                    <div className="bio-item">
                                        <span className="bio-label">Debut MLB</span>
                                        <span className="bio-value">{formatDate(player.mlbDebutDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="player-modal-error">
                        <p>No se pudo cargar el perfil del jugador.</p>
                        <button onClick={onClose}>Cerrar</button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

export default PlayerModal;
