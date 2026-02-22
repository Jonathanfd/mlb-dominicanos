import './Header.css';

function Header({ theme, toggleTheme }) {
    const scrollToTop = (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <header className="header">
            <div className="container header-content">
                <div className="logo-section">
                    <a href="/" className="logo" onClick={scrollToTop} aria-label="Diamante Latino — Volver al inicio">
                        <div className="logo-icon-container">
                            <img
                                src="/diamante-latino-logo-white.png"
                                alt="Diamante Latino Logo"
                                className="brand-logo-img"
                            />
                        </div>
                        <div className="logo-text">
                            <span className="logo-brand">DIAMANTE LATINO</span>
                            <span className="logo-tagline">EN GRANDES LIGAS</span>
                        </div>
                    </a>
                </div>

                <div className="header-actions">
                    <button
                        className="theme-toggle-btn"
                        onClick={toggleTheme}
                        aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
                        title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                </div>

                <div className="header-right">
                    <div className="live-badge" role="status" aria-live="polite">
                        <span className="live-dot" aria-hidden="true"></span>
                        EN VIVO
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
