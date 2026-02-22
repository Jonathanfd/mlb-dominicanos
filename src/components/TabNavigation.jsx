import './TabNavigation.css';
import COUNTRIES from '../countryConfig';

function TabNavigation({ activeTab, onTabChange, country = 'DR' }) {
    const countryConfig = COUNTRIES[country];
    return (
        <nav className="tab-navigation">
            <button
                className={`tab-btn ${activeTab === 'dominicanos' ? 'active' : ''}`}
                onClick={() => onTabChange('dominicanos')}
            >
                <span className="tab-icon">{countryConfig.flag}</span>
                <span className="tab-label">Juegos</span>
            </button>
            <button
                className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => onTabChange('leaderboard')}
            >
                <span className="tab-icon">🏆</span>
                <span className="tab-label">Líderes</span>
            </button>
            <button
                className={`tab-btn ${activeTab === 'apuestas' ? 'active' : ''}`}
                onClick={() => onTabChange('apuestas')}
            >
                <span className="tab-icon">📊</span>
                <span className="tab-label">Apuestas</span>
            </button>
        </nav>
    );
}

export default TabNavigation;
