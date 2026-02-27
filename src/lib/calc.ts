import { isWeekend, addMinutes } from 'date-fns';

export interface DailyStats {
    totalWorkMinutes: number;
    regularMinutes: number;
    overtimeMinutes: number; // Weekday overtime
    nightMinutes: number; // Total night minutes (for display)
    weekendMinutes: number; // Weekend hours <= 8h
    weekendOvertimeMinutes: number; // Weekend hours > 8h
    totalPay: number;
}

export function calculateStats(clockIn: Date, clockOut: Date, hourlyWage: number): DailyStats {
    let regularMins = 0;
    let overtimeMins = 0;
    let nightMins = 0;
    let weekendMins = 0; // up to 8h
    let weekendOvertimeMins = 0; // > 8h
    let weekendNightMins = 0;

    // If clockOut is before clockIn, we assume they span past midnight and user meant the next day
    // BUT we should handle this at the UI level. Assume clockIn and clockOut are correct absolute Date objects.

    let current = new Date(clockIn);
    let currentContinuousWeekendMins = 0;

    while (current < clockOut) {
        const h = current.getHours();
        const m = current.getMinutes();
        const isWknd = isWeekend(current);

        // Check breaks
        // Lunch: 12:00 to 12:59
        const isLunch = h === 12;
        // Dinner: 18:00 to 18:29
        const isDinner = h === 18 && m < 30;

        if (!isLunch && !isDinner) {
            const isNight = h >= 22 || h < 6;

            if (isWknd) {
                currentContinuousWeekendMins++;
                if (currentContinuousWeekendMins <= 8 * 60) {
                    weekendMins++;
                } else {
                    weekendOvertimeMins++;
                }
                if (isNight) {
                    weekendNightMins++;
                }
            } else {
                // Weekday
                const isRegularTime = h >= 9 && h < 18; // 09:00 - 17:59

                if (isRegularTime) {
                    regularMins++;
                } else {
                    overtimeMins++;
                }
                if (isNight) {
                    nightMins++;
                }
            }
        }

        current = addMinutes(current, 1);
    }

    const baseRate = hourlyWage / 60;

    let pay = 0;
    // Weekday
    pay += regularMins * baseRate * 1.0;
    pay += overtimeMins * baseRate * 1.5;
    pay += nightMins * baseRate * 0.5;

    // Weekend
    pay += weekendMins * baseRate * 1.5;
    pay += weekendOvertimeMins * baseRate * 2.0;
    pay += weekendNightMins * baseRate * 0.5;

    return {
        totalWorkMinutes: regularMins + overtimeMins + weekendMins + weekendOvertimeMins,
        regularMinutes: regularMins,
        overtimeMinutes: overtimeMins,
        nightMinutes: nightMins + weekendNightMins,
        weekendMinutes: weekendMins + weekendOvertimeMins,
        weekendOvertimeMinutes: weekendOvertimeMins,
        totalPay: Math.floor(pay)
    };
}
