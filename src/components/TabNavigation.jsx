import './TabNavigation.css';

function TabNavigation({ activeTab, onTabChange }) {
    return (
        <nav className="tab-navigation">
            <button
                className={`tab-btn ${activeTab === 'dominicanos' ? 'active' : ''}`}
                onClick={() => onTabChange('dominicanos')}
            >
                <span className="tab-icon">🇩🇴</span>
                <span className="tab-label">Dominicanos</span>
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
