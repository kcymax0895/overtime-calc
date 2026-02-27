// 하루 계산 결과 (수당 항목별 분리)
export interface DayResult {
    // 시간 (분 단위)
    regularMinutes: number;         // 기본 근무 (09:00~18:00, 점심·석식 제외)
    earlyOvertimeMinutes: number;   // 조기출근 연장 (~09:00)
    eveningOvertimeMinutes: number; // 저녁 연장 (18:30~22:00)
    nightOvertimeMinutes: number;   // 심야 연장 (22:00~06:00, 평일)
    weekendDayUnder8Minutes: number;  // 주말 낮 8시간 이내 (1.5배)
    weekendNightUnder8Minutes: number; // 주말 심야 8시간 이내 (2.0배)
    weekendDayOver8Minutes: number;   // 주말 낮 8시간 초과 (2.0배)
    weekendNightOver8Minutes: number;  // 주말 심야 8시간 초과 (2.5배)

    // 집계
    totalWorkMinutes: number;       // 총 근무 시간 (휴게 제외)
    overtimeMinutes: number;        // 총 연장근로 시간 (조기+저녁+심야+주말)
    totalPay: number;               // 총 수당
}

// 하루 출퇴근 기록
export interface DailyRecord {
    dateStr: string;          // 'yyyy-MM-dd'
    clockInStr: string;       // 'HH:mm'
    clockOutStr: string;      // 'HH:mm'
    clockOutNextDay: boolean; // 익일 퇴근 여부
    result: DayResult;
}
