import React from 'react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWeekend,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { DailyRecord } from '../types';

interface CalendarViewProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    records: Record<string, DailyRecord>;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarView({ selectedDate, onSelectDate, records }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
    });

    const today = new Date();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                    aria-label="이전 달"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-bold text-white">
                    {format(currentMonth, 'yyyy년 M월', { locale: ko })}
                </h2>
                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
                    aria-label="다음 달"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                {DAY_LABELS.map((day, i) => (
                    <div
                        key={day}
                        className={cn(
                            'text-center text-xs font-semibold py-2',
                            i === 0 && 'text-red-400',
                            i === 6 && 'text-blue-400',
                            i > 0 && i < 6 && 'text-slate-500'
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 p-2 bg-white">
                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const record = records[dateStr];
                    const hasRecord = !!record;
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, today);
                    const isSun = day.getDay() === 0;
                    const isSat = day.getDay() === 6;
                    const isWknd = isWeekend(day);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onSelectDate(day)}
                            className={cn(
                                'relative h-11 flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-150 font-medium select-none',
                                // Not current month
                                !isCurrentMonth && 'opacity-30',
                                // Default
                                isCurrentMonth && !isSelected && !isToday && 'hover:bg-slate-100',
                                // Today ring
                                isToday && !isSelected && 'ring-2 ring-blue-400 ring-offset-1',
                                // Selected
                                isSelected && 'bg-blue-600 text-white shadow-md shadow-blue-300',
                                // Weekend color (not selected)
                                !isSelected && isSun && 'text-red-500',
                                !isSelected && isSat && 'text-blue-500',
                                !isSelected && !isWknd && 'text-slate-700',
                            )}
                        >
                            <span className="leading-none">{format(day, 'd')}</span>
                            {/* Record dot */}
                            {hasRecord && (
                                <span
                                    className={cn(
                                        'absolute bottom-1.5 w-1 h-1 rounded-full',
                                        isSelected ? 'bg-white/70' : 'bg-emerald-500'
                                    )}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
