import { formatOdds } from '../services/oddsApi';
import './ParlayCard.css';

function ParlayCard({ parlay }) {
    const confidencePct = Math.round(parlay.combinedConfidence * 100);

    return (
        <div className={`parlay-card glass-card parlay-${parlay.type.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="parlay-header">
                <div className="parlay-type">
                    <span className="parlay-emoji">{parlay.emoji}</span>
                    <h3 className="parlay-title">{parlay.type}</h3>
                </div>
                <div className="parlay-payout">
                    <span className="payout-label">Pago est. por $100</span>
                    <span className="payout-value">${parlay.estimatedPayout}</span>
                </div>
            </div>

            <p className="parlay-description">{parlay.description}</p>

            <div className="parlay-picks">
                {parlay.picks.map((pick, idx) => (
                    <div key={idx} className="parlay-pick">
                        <div className="pick-header">
                            <span className="pick-number">#{idx + 1}</span>
                            <span className="pick-team">{pick.favoredTeam}</span>
                            <span className={`pick-confidence confidence-${pick.confidenceLevel.label.toLowerCase()}`}>
                                {pick.confidenceLevel.emoji} {Math.round(pick.confidence * 100)}%
                            </span>
                        </div>
                        <div className="pick-details">
                            <span className="pick-matchup">
                                vs {pick.opposingTeam}
                            </span>
                            {pick.moneyline && (
                                <span className="pick-odds">{formatOdds(pick.moneyline)}</span>
                            )}
                        </div>
                        <div className="pick-reasons">
                            {pick.reasons.slice(0, 2).map((reason, i) => (
                                <span key={i} className="pick-reason">• {reason}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="parlay-footer">
                <span className={`risk-badge risk-${parlay.riskLevel.toLowerCase().replace(/\s/g, '-')}`}>
                    Riesgo: {parlay.riskLevel}
                </span>
                <span className="parlay-confidence">
                    Confianza combinada: {confidencePct > 100 ? Math.round(parlay.combinedConfidence * 100) : confidencePct}%
                </span>
            </div>
        </div>
    );
}

export default ParlayCard;
