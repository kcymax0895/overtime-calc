import { useState, useMemo } from 'react';
import { format, parse, isSameWeek, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarView } from './components/CalendarView';
import { TimeInput } from './components/TimeInput';
import { Dashboard, calcOvertimePay } from './components/Dashboard';
import { useRecords } from './hooks/useRecords';
import { calculateDay } from './lib/calculator';

function App() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const { wage, setWage, records, saveRecord, deleteRecord } = useRecords();

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentRecord = records[selectedDateStr];

    const handleSave = (clockInStr: string, clockOutStr: string, clockOutNextDay: boolean, newWage: number) => {
        if (newWage > 0) setWage(newWage);
        const usedWage = newWage > 0 ? newWage : wage;

        const result = calculateDay(selectedDateStr, clockInStr, clockOutStr, clockOutNextDay, usedWage);

        saveRecord({
            dateStr: selectedDateStr,
            clockInStr,
            clockOutStr,
            clockOutNextDay,
            result,
        });
    };

    const handleDelete = () => {
        deleteRecord(selectedDateStr);
    };

    const agg = useMemo(() => {
        let weeklyOvertimeMins = 0;
        let weeklyOvertimePay = 0;
        let monthlyWorkMins = 0;
        let monthlyOvertimeMins = 0;
        let monthlyOvertimePay = 0;

        Object.values(records).forEach(record => {
            if (!record.result) return;
            const recordDate = parse(record.dateStr, 'yyyy-MM-dd', new Date());
            const overtimePay = calcOvertimePay(record.result, wage);

            if (isSameWeek(recordDate, selectedDate, { weekStartsOn: 1 })) {
                weeklyOvertimeMins += record.result.overtimeMinutes;
                weeklyOvertimePay += overtimePay;
            }

            if (isSameMonth(recordDate, selectedDate)) {
                monthlyWorkMins += record.result.totalWorkMinutes;
                monthlyOvertimeMins += record.result.overtimeMinutes;
                monthlyOvertimePay += overtimePay;
            }
        });

        return { weeklyOvertimeMins, weeklyOvertimePay, monthlyWorkMins, monthlyOvertimeMins, monthlyOvertimePay };
    }, [records, selectedDate, wage]);

    const dateLabel = format(selectedDate, 'M월 d일 (EEEE)', { locale: ko });

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/70 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
                            <span className="text-white text-xs font-black">야</span>
                        </div>
                        <h1 className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                            야근 요정
                        </h1>
                    </div>
                    <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                        {dateLabel}
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left: Calendar */}
                    <div className="lg:col-span-5">
                        <CalendarView
                            selectedDate={selectedDate}
                            onSelectDate={setSelectedDate}
                            records={records}
                        />
                    </div>

                    {/* Right: Input + Dashboard */}
                    <div className="lg:col-span-7 space-y-5">
                        <TimeInput
                            key={selectedDateStr}
                            dateLabel={dateLabel}
                            clockIn={currentRecord?.clockInStr ?? '09:00'}
                            clockOut={currentRecord?.clockOutStr ?? '18:00'}
                            clockOutNextDay={currentRecord?.clockOutNextDay ?? false}
                            wage={wage}
                            hasRecord={!!currentRecord}
                            onSave={handleSave}
                            onDelete={handleDelete}
                        />

                        <Dashboard
                            result={currentRecord?.result ?? null}
                            agg={agg}
                            wage={wage}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="text-center text-xs text-slate-400 py-8 pb-safe">
                <p>근로기준법(5인 이상 사업장) 기준 · 수당 계산은 참고용입니다</p>
            </footer>
        </div>
    );
}

export default App;
