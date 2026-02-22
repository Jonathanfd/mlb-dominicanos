import { useState } from 'react';
import './GameCard.css';
import DominicanPlayer from './DominicanPlayer';
import { getTeamLogoUrl, formatGameStatus } from '../services/mlbApi';
import COUNTRIES from '../countryConfig';

function GameCard({ game, dominicanPlayers, country = 'DR', animationDelay = 0 }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const countryConfig = COUNTRIES[country];

    const homeTeam = game.teams?.home?.team;
    const awayTeam = game.teams?.away?.team;
    const homeScore = game.teams?.home?.score ?? '-';
    const awayScore = game.teams?.away?.score ?? '-';
    const status = formatGameStatus(game);

    const totalDominicanPlayers =
        (dominicanPlayers?.home?.length || 0) +
        (dominicanPlayers?.away?.length || 0);

    return (
        <div
            className="game-card card animate-fadeIn"
            style={{ animationDelay: `${animationDelay}s` }}
        >
            {/* Status Header */}
            <div className="game-status-bar">
                {status.isLive ? (
                    <div className="status-live" role="status" aria-live="polite">
                        <span className="live-dot" aria-hidden="true"></span>
                        {status.text}
                    </div>
                ) : (
                    <span className="status-text">{status.text}</span>
                )}
                {totalDominicanPlayers > 0 && (
                    <span className="dominican-count">
                        <span aria-hidden="true">{countryConfig.flag}</span> {totalDominicanPlayers}
                    </span>
                )}
            </div>

            {/* Teams */}
            <div className="teams-container">
                {/* Away Team */}
                <div className={`team-row ${Number(awayScore) > Number(homeScore) ? 'winner' : ''}`}>
                    <div className="team-info">
                        <img
                            src={getTeamLogoUrl(awayTeam?.id)}
                            alt={awayTeam?.name}
                            className="team-logo"
                            width="40"
                            height="40"
                            loading="lazy"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                        <div className="team-details">
                            <span className="team-name">{awayTeam?.teamName || 'Away'}</span>
                            <span className="team-record">
                                {game.teams?.away?.leagueRecord?.wins || 0}-{game.teams?.away?.leagueRecord?.losses || 0}
                            </span>
                        </div>
                    </div>
                    <span className="team-score" style={{ fontVariantNumeric: 'tabular-nums' }}>{awayScore}</span>
                </div>

                {/* Home Team */}
                <div className={`team-row ${Number(homeScore) > Number(awayScore) ? 'winner' : ''}`}>
                    <div className="team-info">
                        <img
                            src={getTeamLogoUrl(homeTeam?.id)}
                            alt={homeTeam?.name}
                            className="team-logo"
                            width="40"
                            height="40"
                            loading="lazy"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                        <div className="team-details">
                            <span className="team-name">{homeTeam?.teamName || 'Home'}</span>
                            <span className="team-record">
                                {game.teams?.home?.leagueRecord?.wins || 0}-{game.teams?.home?.leagueRecord?.losses || 0}
                            </span>
                        </div>
                    </div>
                    <span className="team-score" style={{ fontVariantNumeric: 'tabular-nums' }}>{homeScore}</span>
                </div>
            </div>

            {/* Line Score (simplified for updated design) */}
            {game.linescore && (
                <div className="linescore-container">
                    <div className="linescore">
                        <div className="linescore-header">
                            <span></span>
                            {game.linescore.innings?.map((_, i) => (
                                <span key={i}>{i + 1}</span>
                            ))}
                            <span className="linescore-total">R</span>
                            <span className="linescore-total">H</span>
                            <span className="linescore-total">E</span>
                        </div>
                        <div className="linescore-row">
                            <span className="linescore-team">{awayTeam?.abbreviation}</span>
                            {game.linescore.innings?.map((inning, i) => (
                                <span key={i}>{inning.away?.runs ?? '-'}</span>
                            ))}
                            <span className="linescore-total">{game.linescore.teams?.away?.runs ?? 0}</span>
                            <span className="linescore-total">{game.linescore.teams?.away?.hits ?? 0}</span>
                            <span className="linescore-total">{game.linescore.teams?.away?.errors ?? 0}</span>
                        </div>
                        <div className="linescore-row">
                            <span className="linescore-team">{homeTeam?.abbreviation}</span>
                            {game.linescore.innings?.map((inning, i) => (
                                <span key={i}>{inning.home?.runs ?? '-'}</span>
                            ))}
                            <span className="linescore-total">{game.linescore.teams?.home?.runs ?? 0}</span>
                            <span className="linescore-total">{game.linescore.teams?.home?.hits ?? 0}</span>
                            <span className="linescore-total">{game.linescore.teams?.home?.errors ?? 0}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dominican Players Section */}
            {totalDominicanPlayers > 0 && (
                <div className="dominican-section">
                    <button
                        className="gamecard-player-toggle"
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? `Ocultar jugadores ${countryConfig.adjective}` : `Ver jugadores ${countryConfig.adjective}`}
                    >
                        {isExpanded ? `Ocultar ${countryConfig.demonym}` : `Ver ${countryConfig.demonym}`}
                        <span className="toggle-icon" aria-hidden="true">{isExpanded ? '▼' : '▶'}</span>
                    </button>

                    {isExpanded && (
                        <div className="players-list animate-fadeIn">
                            {/* Away Dominican Players */}
                            {dominicanPlayers?.away?.length > 0 && (
                                <div className="team-players">
                                    <h4 className="team-players-title">
                                        <img
                                            src={getTeamLogoUrl(awayTeam?.id)}
                                            alt=""
                                            className="mini-logo"
                                        />
                                        {awayTeam?.teamName}
                                    </h4>
                                    {dominicanPlayers.away.map((player, index) => (
                                        <DominicanPlayer
                                            key={player.id || index}
                                            player={player}
                                            delay={index * 0.05}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Home Dominican Players */}
                            {dominicanPlayers?.home?.length > 0 && (
                                <div className="team-players">
                                    <h4 className="team-players-title">
                                        <img
                                            src={getTeamLogoUrl(homeTeam?.id)}
                                            alt=""
                                            className="mini-logo"
                                        />
                                        {homeTeam?.teamName}
                                    </h4>
                                    {dominicanPlayers.home.map((player, index) => (
                                        <DominicanPlayer
                                            key={player.id || index}
                                            player={player}
                                            delay={index * 0.05}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GameCard;
