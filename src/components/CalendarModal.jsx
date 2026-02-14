import { useState, useEffect } from 'react';
import './CalendarModal.css';

const DAYS_OF_WEEK = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function CalendarModal({ isOpen, onClose, selectedDate, onDateSelect }) {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));

    useEffect(() => {
        if (isOpen) {
            setViewDate(new Date(selectedDate));
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const days = [];
    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isSelected = date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

        const isToday = new Date().toDateString() === date.toDateString();

        days.push(
            <button
                key={day}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => {
                    onDateSelect(date);
                    onClose();
                }}
            >
                {day}
            </button>
        );
    }

    const prevMonth = () => {
        setViewDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const goToToday = () => {
        const today = new Date();
        onDateSelect(today);
        onClose();
    };

    return (
        <div className="calendar-modal-overlay" onClick={onClose}>
            <div className="calendar-modal-content" onClick={e => e.stopPropagation()}>
                <div className="calendar-header">
                    <button className="nav-btn" onClick={prevMonth}>‹</button>
                    <span className="month-year-label">
                        {MONTHS[currentMonth]} {currentYear}
                    </span>
                    <button className="nav-btn" onClick={nextMonth}>›</button>
                </div>

                <div className="calendar-grid">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="calendar-day-header">{day}</div>
                    ))}
                    {days}
                </div>

                <div className="calendar-footer">
                    <button className="footer-btn clear" onClick={onClose}>Cancelar</button>
                    <button className="footer-btn today" onClick={goToToday}>Hoy</button>
                </div>
            </div>
        </div>
    );
}

export default CalendarModal;
