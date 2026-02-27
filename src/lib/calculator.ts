import { isWeekend, addDays, parse, differenceInMinutes, isValid } from 'date-fns';
import { DayResult } from '../types';

/**
 * 하루 근무 시간과 시급을 받아 수당 항목별로 정확하게 계산합니다.
 *
 * 규칙:
 * - 점심 휴게: 12:00 ~ 13:00 (60분) → 완전 제외
 * - 석식 휴게: 18:00 ~ 18:30 (30분) → 완전 제외
 * - 평일 기본: 09:00 ~ 18:00 (점심 제외 = 8시간)
 * - 평일 조기출근: ~09:00 → 연장근로 1.5배
 * - 평일 저녁 연장: 18:30 ~ 22:00 → 연장근로 1.5배
 * - 평일 심야 연장: 22:00 ~ 06:00 → 연장+심야 2.0배
 * - 주말 8시간 이내 낮: 1.5배
 * - 주말 8시간 이내 심야(22:00~): 2.0배
 * - 주말 8시간 초과 낮: 2.0배
 * - 주말 8시간 초과 심야: 2.5배
 */
export function calculateDay(
    dateStr: string,
    clockInStr: string,
    clockOutStr: string,
    clockOutNextDay: boolean,
    baseWagePerHour: number
): DayResult {
    const baseDate = new Date(dateStr);
    const start = parse(clockInStr, 'HH:mm', baseDate);
    let end = parse(clockOutStr, 'HH:mm', baseDate);

    if (!isValid(start) || !isValid(end)) {
        return emptyResult();
    }

    // 익일 퇴근 처리: 명시적 nextDay 또는 퇴근이 출근보다 이른 경우
    if (clockOutNextDay || end <= start) {
        end = addDays(end, 1);
    }

    const totalMin = differenceInMinutes(end, start);
    if (totalMin <= 0 || totalMin > 48 * 60) {
        return emptyResult();
    }

    let regularMinutes = 0;
    let earlyOvertimeMinutes = 0;
    let eveningOvertimeMinutes = 0;
    let nightOvertimeMinutes = 0;
    let weekendDayUnder8Minutes = 0;
    let weekendNightUnder8Minutes = 0;
    let weekendDayOver8Minutes = 0;
    let weekendNightOver8Minutes = 0;

    let weekendWorkedMinutes = 0; // 주말 실근무 누적 (휴게 제외)

    for (let i = 0; i < totalMin; i++) {
        const time = new Date(start.getTime() + i * 60_000);
        const h = time.getHours();
        const m = time.getMinutes();
        const totalMinOfDay = h * 60 + m;

        // 휴게 시간 제외
        // 점심: 12:00(720분) ~ 13:00(780분) 미만
        const isLunch = totalMinOfDay >= 720 && totalMinOfDay < 780;
        // 석식: 18:00(1080분) ~ 18:30(1110분) 미만
        const isDinner = totalMinOfDay >= 1080 && totalMinOfDay < 1110;

        if (isLunch || isDinner) continue;

        const isWeekendDay = isWeekend(time);
        // 심야: 22:00(1320분) 이상 또는 06:00(360분) 미만
        const isNight = totalMinOfDay >= 1320 || totalMinOfDay < 360;

        if (isWeekendDay) {
            weekendWorkedMinutes++;
            const under8 = weekendWorkedMinutes <= 480;
            if (under8) {
                if (isNight) weekendNightUnder8Minutes++;
                else weekendDayUnder8Minutes++;
            } else {
                if (isNight) weekendNightOver8Minutes++;
                else weekendDayOver8Minutes++;
            }
        } else {
            // 평일
            // 기본 근무 구간: 09:00(540분) ~ 18:00(1080분) 미만
            const isRegular = totalMinOfDay >= 540 && totalMinOfDay < 1080;
            // 조기 출근: 00:00 ~ 09:00 (석식·점심 제외 이미 처리됨)
            const isEarlyOvertime = totalMinOfDay < 540;
            // 저녁 연장: 18:30(1110분) ~ 22:00(1320분) 미만
            const isEveningOvertime = totalMinOfDay >= 1110 && totalMinOfDay < 1320;
            // 심야 연장: 22:00 이상 또는 06:00(360분) 미만
            const isNightOvertime = totalMinOfDay >= 1320 || totalMinOfDay < 360;

            if (isRegular) {
                regularMinutes++;
            } else if (isEarlyOvertime) {
                earlyOvertimeMinutes++;
            } else if (isEveningOvertime) {
                eveningOvertimeMinutes++;
            } else if (isNightOvertime) {
                nightOvertimeMinutes++;
            }
        }
    }

    const r = baseWagePerHour / 60; // 분당 기본 시급

    const totalPay = Math.floor(
        regularMinutes * r * 1.0 +
        earlyOvertimeMinutes * r * 1.5 +
        eveningOvertimeMinutes * r * 1.5 +
        nightOvertimeMinutes * r * 2.0 +
        weekendDayUnder8Minutes * r * 1.5 +
        weekendNightUnder8Minutes * r * 2.0 +
        weekendDayOver8Minutes * r * 2.0 +
        weekendNightOver8Minutes * r * 2.5
    );

    const overtimeMinutes =
        earlyOvertimeMinutes +
        eveningOvertimeMinutes +
        nightOvertimeMinutes +
        weekendDayUnder8Minutes +
        weekendNightUnder8Minutes +
        weekendDayOver8Minutes +
        weekendNightOver8Minutes;

    const totalWorkMinutes = regularMinutes + overtimeMinutes;

    return {
        regularMinutes,
        earlyOvertimeMinutes,
        eveningOvertimeMinutes,
        nightOvertimeMinutes,
        weekendDayUnder8Minutes,
        weekendNightUnder8Minutes,
        weekendDayOver8Minutes,
        weekendNightOver8Minutes,
        totalWorkMinutes,
        overtimeMinutes,
        totalPay,
    };
}

function emptyResult(): DayResult {
    return {
        regularMinutes: 0,
        earlyOvertimeMinutes: 0,
        eveningOvertimeMinutes: 0,
        nightOvertimeMinutes: 0,
        weekendDayUnder8Minutes: 0,
        weekendNightUnder8Minutes: 0,
        weekendDayOver8Minutes: 0,
        weekendNightOver8Minutes: 0,
        totalWorkMinutes: 0,
        overtimeMinutes: 0,
        totalPay: 0,
    };
}
