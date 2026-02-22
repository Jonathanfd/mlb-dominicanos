import './Header.css';

function Header() {
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
                    <a href="/" className="logo" onClick={scrollToTop} aria-label="Peloteros RD — Volver al inicio">
                        <div className="logo-icon-container">
                            <div className="baseball-body">
                                <div className="stitch-curve-left"></div>
                                <div className="stitch-curve-right"></div>
                                <div className="center-flag">
                                    <div className="flag-top-left"></div>
                                    <div className="flag-top-right"></div>
                                    <div className="flag-bottom-left"></div>
                                    <div className="flag-bottom-right"></div>
                                    <div className="flag-cross-h"></div>
                                    <div className="flag-cross-v"></div>
                                    <div className="flag-shield"></div>
                                </div>
                            </div>
                        </div>
                        <div className="logo-text">
                            <span className="logo-brand">PELOTEROS RD</span>
                            <span className="logo-tagline">EN GRANDES LIGAS</span>
                        </div>
                    </a>
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
