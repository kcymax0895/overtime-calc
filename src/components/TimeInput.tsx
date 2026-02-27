import { useState, useEffect } from 'react';
import { Clock, Moon, Save, Trash2, BadgeCheck, ChevronDown } from 'lucide-react';
import { cn, formatWon } from '../lib/utils';

interface TimeInputProps {
    dateLabel: string;
    clockIn: string;
    clockOut: string;
    clockOutNextDay: boolean;
    wage: number;
    hasRecord: boolean;
    onSave: (clockIn: string, clockOut: string, nextDay: boolean, wage: number) => void;
    onDelete: () => void;
}

// 시간 문자열 'HH:mm' → { hour, minute } 파싱 (분은 10단위로 반올림)
function parseTime(timeStr: string): { hour: number; minute: number } {
    const [hStr, mStr] = timeStr.split(':');
    const h = Math.min(23, Math.max(0, parseInt(hStr ?? '9', 10)));
    const rawMin = parseInt(mStr ?? '0', 10);
    const m = Math.round(rawMin / 10) * 10;
    return { hour: h, minute: m >= 60 ? 50 : m };
}

function toTimeStr(hour: number, minute: number): string {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);      // 0~23
const MINUTES = [0, 10, 20, 30, 40, 50];                     // 10분 단위

interface TimeSelectorProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    rightSlot?: React.ReactNode;
}

function TimeSelector({ label, value, onChange, rightSlot }: TimeSelectorProps) {
    const { hour, minute } = parseTime(value);

    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                {label}
            </label>
            <div className="flex gap-2 items-center">
                {/* Hour select */}
                <div className="relative flex-1">
                    <select
                        value={hour}
                        onChange={e => onChange(toTimeStr(Number(e.target.value), minute))}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-semibold cursor-pointer"
                    >
                        {HOURS.map(h => (
                            <option key={h} value={h}>
                                {String(h).padStart(2, '0')}시
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {/* Minute select */}
                <div className="relative flex-1">
                    <select
                        value={minute}
                        onChange={e => onChange(toTimeStr(hour, Number(e.target.value)))}
                        className="w-full appearance-none pl-3 pr-8 py-2.5 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-semibold cursor-pointer"
                    >
                        {MINUTES.map(m => (
                            <option key={m} value={m}>
                                {String(m).padStart(2, '0')}분
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                {rightSlot}
            </div>
        </div>
    );
}

export function TimeInput({
    dateLabel,
    clockIn,
    clockOut,
    clockOutNextDay,
    wage,
    hasRecord,
    onSave,
    onDelete,
}: TimeInputProps) {
    const [inTime, setInTime] = useState(clockIn || '09:00');
    const [outTime, setOutTime] = useState(clockOut || '18:00');
    const [nextDay, setNextDay] = useState(clockOutNextDay ?? false);
    const [wageInput, setWageInput] = useState(wage > 0 ? wage.toString() : '');

    // 날짜 변경 시 부모 props 동기화
    useEffect(() => {
        setInTime(clockIn || '09:00');
        setOutTime(clockOut || '18:00');
        setNextDay(clockOutNextDay ?? false);
    }, [clockIn, clockOut, clockOutNextDay]);

    useEffect(() => {
        setWageInput(wage > 0 ? wage.toString() : '');
    }, [wage]);

    const handleSave = () => {
        const parsedWage = parseInt(wageInput.replace(/,/g, ''), 10);
        const finalWage = !isNaN(parsedWage) && parsedWage > 0 ? parsedWage : wage;
        onSave(inTime, outTime, nextDay, finalWage);
    };

    const parsedWage = parseInt(wageInput.replace(/,/g, ''), 10);
    const displayWage = !isNaN(parsedWage) && parsedWage > 0 ? parsedWage : wage;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="text-base font-bold text-slate-800">근무 시간 입력</h3>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {dateLabel}
                </span>
            </div>

            <div className="p-5 space-y-5">
                {/* Clock-in */}
                <TimeSelector
                    label="출근"
                    value={inTime}
                    onChange={setInTime}
                />

                {/* Clock-out + next-day toggle */}
                <TimeSelector
                    label="퇴근"
                    value={outTime}
                    onChange={setOutTime}
                    rightSlot={
                        <button
                            onClick={() => setNextDay(p => !p)}
                            title="익일 퇴근 (자정 이후)"
                            className={cn(
                                'flex-shrink-0 h-[42px] px-3 flex items-center gap-1 rounded-xl border text-xs font-semibold transition-all',
                                nextDay
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                            )}
                        >
                            <Moon className="w-3.5 h-3.5" />
                            <span>익일</span>
                        </button>
                    }
                />

                {/* Wage */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                        시급 (원/시간)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={wageInput}
                            onChange={e => setWageInput(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="예: 10000"
                            className="w-full pl-4 pr-12 py-2.5 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">원</span>
                    </div>
                    {displayWage > 0 && (
                        <p className="text-xs text-slate-400 pl-1">
                            현재 설정: <span className="font-semibold text-slate-600">{formatWon(displayWage)}</span>/시간
                        </p>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-blue-200"
                    >
                        <Save className="w-4 h-4" />
                        저장 및 계산
                    </button>
                    {hasRecord && (
                        <button
                            onClick={onDelete}
                            className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-500 font-semibold rounded-xl flex items-center gap-2 transition-all border border-red-100"
                            title="기록 삭제"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {hasRecord && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                        <BadgeCheck className="w-4 h-4" />
                        저장된 기록이 있습니다
                    </div>
                )}
            </div>
        </div>
    );
}
