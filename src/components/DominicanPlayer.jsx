import './DominicanPlayer.css';

function DominicanPlayer({ player, delay = 0 }) {
    const { name, position, jerseyNumber, batting, pitching, isPitcher, participated } = player;

    return (
        <div
            className={`player-card animate-slideInLeft ${!participated ? 'not-participated' : ''}`}
            style={{ animationDelay: `${delay}s` }}
        >
            <div className="player-main">
                <div className="player-avatar">
                    <span className="jersey-number">#{jerseyNumber || '00'}</span>
                </div>
                <div className="player-info">
                    <span className="player-name">{name}</span>
                    <span className="player-position">{position}</span>
                </div>
            </div>

            <div className="player-stats">
                {isPitcher ? (
                    // Pitching Stats (Game Only)
                    <div className="stat-row">
                        <div className="stat">
                            <span className="stat-value">{pitching.inningsPitched}</span>
                            <span className="stat-label">IP</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{pitching.hits}</span>
                            <span className="stat-label">H</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{pitching.strikeOuts}</span>
                            <span className="stat-label">K</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{pitching.walks}</span>
                            <span className="stat-label">BB</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{pitching.earnedRuns}</span>
                            <span className="stat-label">ER</span>
                        </div>
                    </div>
                ) : (
                    // Batting Stats (Game Only)
                    <div className="stat-row">
                        <div className="stat">
                            <span className="stat-value">{batting.hits}-{batting.atBats}</span>
                            <span className="stat-label">H-AB</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{batting.runs}</span>
                            <span className="stat-label">R</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{batting.rbi}</span>
                            <span className="stat-label">RBI</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{batting.baseOnBalls}</span>
                            <span className="stat-label">BB</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{batting.strikeOuts}</span>
                            <span className="stat-label">K</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DominicanPlayer;
