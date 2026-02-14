import { useState, useRef, useEffect } from 'react';
import './DatePicker.css';
import CalendarModal from './CalendarModal';

function DatePicker({ selectedDate, onDateChange }) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [dateRange, setDateRange] = useState(3); // Default to 3 days before/after (7 total)
    const dateListRef = useRef(null);

    // Responsive date range
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 600) {
                setDateRange(2); // 2 days before/after (5 total) for mobile to prevent scroll
            } else {
                setDateRange(3); // 3 days before/after for desktop
            }
        };

        handleResize(); // Set initial
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Generate dates centered around selected date
    const getRibbonDates = () => {
        const dates = [];
        for (let i = -dateRange; i <= dateRange; i++) {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const isSameDate = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const navigateDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        onDateChange(newDate);
    };

    const handleCalendarChange = (newDate) => {
        onDateChange(newDate);
        setIsCalendarOpen(false);
    };

    return (
        <div className="date-picker-container">
            <div className="date-ribbon">
                <button
                    className="date-nav-btn"
                    onClick={() => navigateDate(-1)}
                    aria-label="Previous Day"
                >
                    ‹
                </button>

                <div className="date-list" ref={dateListRef}>
                    {getRibbonDates().map((date, index) => (
                        <button
                            key={index}
                            className={`date-item ${isSameDate(date, selectedDate) ? 'selected' : ''}`}
                            onClick={() => onDateChange(date)}
                        >
                            <span className="day-name">
                                {date.toLocaleDateString('es-DO', { weekday: 'short' }).replace('.', '')}
                            </span>
                            <span className="day-number">
                                {date.getDate()}
                            </span>
                        </button>
                    ))}
                </div>

                <button
                    className="date-nav-btn"
                    onClick={() => navigateDate(1)}
                    aria-label="Next Day"
                >
                    ›
                </button>

                <div style={{ position: 'relative' }}>
                    <button
                        className="calendar-trigger"
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        title="Seleccionar fecha"
                    >
                        📅
                    </button>
                    <CalendarModal
                        isOpen={isCalendarOpen}
                        onClose={() => setIsCalendarOpen(false)}
                        selectedDate={selectedDate}
                        onDateSelect={handleCalendarChange}
                    />
                </div>
            </div>

            <div className="current-date-display" style={{ marginTop: '10px', color: '#666', fontSize: '0.9rem', fontWeight: '600' }}>
                {selectedDate.toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    );
}

export default DatePicker;
