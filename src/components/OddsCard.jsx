import { getBestOdds, formatOdds } from '../services/oddsApi';
import './OddsCard.css';

function OddsCard({ game, odds }) {
    const homeTeam = game.teams?.home;
    const awayTeam = game.teams?.away;
    const bestOdds = getBestOdds(odds);

    const homeTeamName = homeTeam?.team?.name || 'Home';
    const awayTeamName = awayTeam?.team?.name || 'Away';
    const homeRecord = homeTeam?.leagueRecord;
    const awayRecord = awayTeam?.leagueRecord;

    const getTeamLogoUrl = (teamId) =>
        `https://www.mlb.com/team-information/${teamId}/logo`;

    const homeAbbrId = homeTeam?.team?.id;
    const awayAbbrId = awayTeam?.team?.id;

    const getOddsClass = (odds) => {
        if (odds === null || odds === undefined) return '';
        return odds < 0 ? 'odds-favorite' : 'odds-underdog';
    };

    return (
        <div className="odds-card glass-card">
            <div className="odds-card-header">
                <span className="odds-game-time">
                    {game.status?.detailedState || 'Programado'}
                </span>
                {bestOdds.moneyline.bestBook && (
                    <span className="odds-source">{bestOdds.moneyline.bestBook}</span>
                )}
            </div>

            <div className="odds-teams">
                {/* Away Team */}
                <div className="odds-team-row">
                    <div className="odds-team-info">
                        <img
                            src={getTeamLogoUrl(awayAbbrId)}
                            alt={awayTeamName}
                            className="odds-team-logo"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                            <span className="odds-team-name">{awayTeamName}</span>
                            {awayRecord && (
                                <span className="odds-team-record">{awayRecord.wins}-{awayRecord.losses}</span>
                            )}
                        </div>
                    </div>
                    <div className="odds-values">
                        <span className={`odds-value ml ${getOddsClass(bestOdds.moneyline.away)}`}>
                            {formatOdds(bestOdds.moneyline.away)}
                        </span>
                        <span className="odds-value spread">
                            {bestOdds.spread.away !== null ?
                                `${bestOdds.spread.point > 0 ? '+' : ''}${-bestOdds.spread.point || ''}` : '--'}
                        </span>
                        <span className="odds-value total">
                            O {bestOdds.total.point || '--'}
                        </span>
                    </div>
                </div>

                {/* Home Team */}
                <div className="odds-team-row">
                    <div className="odds-team-info">
                        <img
                            src={getTeamLogoUrl(homeAbbrId)}
                            alt={homeTeamName}
                            className="odds-team-logo"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div>
                            <span className="odds-team-name">{homeTeamName}</span>
                            {homeRecord && (
                                <span className="odds-team-record">{homeRecord.wins}-{homeRecord.losses}</span>
                            )}
                        </div>
                    </div>
                    <div className="odds-values">
                        <span className={`odds-value ml ${getOddsClass(bestOdds.moneyline.home)}`}>
                            {formatOdds(bestOdds.moneyline.home)}
                        </span>
                        <span className="odds-value spread">
                            {bestOdds.spread.home !== null ?
                                `${bestOdds.spread.point > 0 ? '+' : ''}${bestOdds.spread.point || ''}` : '--'}
                        </span>
                        <span className="odds-value total">
                            U {bestOdds.total.point || '--'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="odds-labels">
                <span></span>
                <div className="odds-label-row">
                    <span className="odds-label">ML</span>
                    <span className="odds-label">RL</span>
                    <span className="odds-label">O/U</span>
                </div>
            </div>
        </div>
    );
}

export default OddsCard;
