import COUNTRIES from '../countryConfig';
import './CountrySelector.css';

function CountrySelector({ selectedCountry, onCountryChange }) {
    return (
        <div className="country-selector">
            <div className="country-selector-track">
                {Object.values(COUNTRIES).map((country) => (
                    <button
                        key={country.code}
                        className={`country-pill ${selectedCountry === country.code ? 'active' : ''}`}
                        onClick={() => onCountryChange(country.code)}
                        aria-pressed={selectedCountry === country.code}
                        aria-label={`Ver peloteros ${country.adjective}`}
                    >
                        <span className="country-flag">{country.flag}</span>
                        <span className="country-name">{country.demonym}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default CountrySelector;
