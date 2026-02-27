import { useState, type ReactNode } from 'react';
import {
    Moon, CalendarDays, Wallet, TrendingUp,
    ChevronRight, Sunrise, Sunset, Star, Zap
} from 'lucide-react';
import { DayResult } from '../types';
import { cn, formatMinutes, formatWon } from '../lib/utils';

// ─── 야근 수당 계산 헬퍼 ───────────────────────────────────────────────────
// 야근한 시간 전체에 대해 해당 배율로 계산합니다.
//   - 조기출근·저녁 연장: 1.5배
//   - 심야 연장 (22:00~): 2.0배 (연장 1.5 + 심야 0.5)
//   - 주말 낮 8h이내: 1.5배
//   - 주말 심야 8h이내: 2.0배
//   - 주말 낮 8h초과: 2.0배
//   - 주말 심야 8h초과: 2.5배
export function calcOvertimePay(result: DayResult, wage: number): number {
    const r = wage / 60;
    return Math.floor(
        result.earlyOvertimeMinutes * r * 1.5 +
        result.eveningOvertimeMinutes * r * 1.5 +
        result.nightOvertimeMinutes * r * 2.0 +
        result.weekendDayUnder8Minutes * r * 1.5 +
        result.weekendNightUnder8Minutes * r * 2.0 +
        result.weekendDayOver8Minutes * r * 2.0 +
        result.weekendNightOver8Minutes * r * 2.5
    );
}

// ─── 집계 인터페이스 ─────────────────────────────────────────────────────────
interface AggStats {
    weeklyOvertimeMins: number;
    weeklyOvertimePay: number;
    monthlyWorkMins: number;
    monthlyOvertimeMins: number;
    monthlyOvertimePay: number;
}

interface DashboardProps {
    result: DayResult | null;
    agg: AggStats;
    wage: number;
}

// ─── 탭 ─────────────────────────────────────────────────────────────────────
type TabId = 'daily' | 'weekly' | 'monthly';
const TABS: { id: TabId; label: string }[] = [
    { id: 'daily', label: '오늘' },
    { id: 'weekly', label: '이번 주' },
    { id: 'monthly', label: '이번 달' },
];

// ─── 소형 카드 ───────────────────────────────────────────────────────────────
function StatCard({
    icon, label, value, sub, accent = 'blue',
}: {
    icon: ReactNode;
    label: string;
    value: string;
    sub?: string;
    accent?: 'blue' | 'emerald' | 'violet' | 'rose' | 'amber';
}) {
    const accentMap = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        violet: 'bg-violet-50 text-violet-600',
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className={cn('p-2.5 rounded-xl flex-shrink-0', accentMap[accent])}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                <p className="text-base font-bold text-slate-800 truncate">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── 야근 수당 내역 행 ───────────────────────────────────────────────────────
function OvertimeRow({
    label, minutes, rate, wage, color = 'text-slate-700',
}: {
    label: string;
    minutes: number;
    rate: number;   // 적용 배율 전체 (예: 1.5, 2.0, 2.5)
    wage: number;
    color?: string;
}) {
    if (minutes <= 0) return null;
    const pay = Math.floor((wage / 60) * minutes * rate);
    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                <span className={cn('text-sm font-medium', color)}>{label}</span>
                <span className="text-xs font-semibold text-slate-400">{rate}배</span>
            </div>
            <div className="text-right">
                <span className="text-sm font-semibold text-slate-800">{formatWon(pay)}</span>
                <span className="text-xs text-slate-400 ml-1.5">{formatMinutes(minutes)}</span>
            </div>
        </div>
    );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export function Dashboard({ result, agg, wage }: DashboardProps) {
    const [tab, setTab] = useState<TabId>('daily');

    const dailyOvertimePay = result && wage > 0 ? calcOvertimePay(result, wage) : 0;
    const dailyOvertimeMins = result?.overtimeMinutes ?? 0;

    return (
        <div className="space-y-4">
            {/* Tab Bar */}
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                            tab === t.id
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── 오늘 탭 ─────────────────────────────────────────────────── */}
            {tab === 'daily' && (
                <div className="space-y-4">
                    {/* Hero: 야근 수당 */}
                    <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 opacity-80" />
                            <p className="text-sm font-semibold text-orange-100">당일 야근 수당</p>
                        </div>
                        <div className="text-4xl font-extrabold tracking-tight mb-1">
                            {result ? formatWon(dailyOvertimePay) : '—'}
                        </div>
                        {result && (
                            <div className="flex items-center gap-4 mt-4 text-sm text-orange-100">
                                <span className="flex items-center gap-1.5">
                                    <Moon className="w-4 h-4" />
                                    야근 {formatMinutes(dailyOvertimeMins)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <TrendingUp className="w-4 h-4" />
                                    정규 {formatMinutes(result.regularMinutes)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 야근 항목 카드 */}
                    {result ? (
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard
                                icon={<Sunrise className="w-4 h-4" />}
                                label="조기출근 (1.5배)"
                                value={formatMinutes(result.earlyOvertimeMinutes)}
                                sub={result.earlyOvertimeMinutes > 0
                                    ? formatWon(Math.floor((wage / 60) * result.earlyOvertimeMinutes * 1.5))
                                    : '해당 없음'}
                                accent="amber"
                            />
                            <StatCard
                                icon={<Sunset className="w-4 h-4" />}
                                label="저녁 연장 (1.5배)"
                                value={formatMinutes(result.eveningOvertimeMinutes)}
                                sub={result.eveningOvertimeMinutes > 0
                                    ? formatWon(Math.floor((wage / 60) * result.eveningOvertimeMinutes * 1.5))
                                    : '해당 없음'}
                                accent="rose"
                            />
                            <StatCard
                                icon={<Moon className="w-4 h-4" />}
                                label="심야 연장 (2.0배)"
                                value={formatMinutes(result.nightOvertimeMinutes)}
                                sub={result.nightOvertimeMinutes > 0
                                    ? formatWon(Math.floor((wage / 60) * result.nightOvertimeMinutes * 2.0))
                                    : '해당 없음'}
                                accent="violet"
                            />
                            {(result.weekendDayUnder8Minutes + result.weekendNightUnder8Minutes +
                                result.weekendDayOver8Minutes + result.weekendNightOver8Minutes) > 0 && (
                                    <StatCard
                                        icon={<Star className="w-4 h-4" />}
                                        label="주말 수당"
                                        value={formatMinutes(
                                            result.weekendDayUnder8Minutes + result.weekendNightUnder8Minutes +
                                            result.weekendDayOver8Minutes + result.weekendNightOver8Minutes
                                        )}
                                        sub={formatWon(
                                            Math.floor((wage / 60) * (
                                                result.weekendDayUnder8Minutes * 1.5 +
                                                result.weekendNightUnder8Minutes * 2.0 +
                                                result.weekendDayOver8Minutes * 2.0 +
                                                result.weekendNightOver8Minutes * 2.5
                                            ))
                                        )}
                                        accent="emerald"
                                    />
                                )}
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
                            <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">출퇴근 시간을 입력하고</p>
                            <p className="text-sm text-slate-500">'저장 및 계산' 을 눌러주세요</p>
                        </div>
                    )}

                    {/* 야근 수당 내역 */}
                    {result && dailyOvertimePay > 0 && wage > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">야근 수당 내역</p>
                            <OvertimeRow label="조기출근 연장" minutes={result.earlyOvertimeMinutes} rate={1.5} wage={wage} color="text-amber-600" />
                            <OvertimeRow label="저녁 야근" minutes={result.eveningOvertimeMinutes} rate={1.5} wage={wage} color="text-rose-600" />
                            <OvertimeRow label="심야 야근" minutes={result.nightOvertimeMinutes} rate={2.0} wage={wage} color="text-violet-600" />
                            <OvertimeRow label="주말(8h이내)낮" minutes={result.weekendDayUnder8Minutes} rate={1.5} wage={wage} color="text-emerald-600" />
                            <OvertimeRow label="주말(8h이내)심야" minutes={result.weekendNightUnder8Minutes} rate={2.0} wage={wage} color="text-emerald-700" />
                            <OvertimeRow label="주말(8h초과)낮" minutes={result.weekendDayOver8Minutes} rate={2.0} wage={wage} color="text-teal-600" />
                            <OvertimeRow label="주말(8h초과)심야" minutes={result.weekendNightOver8Minutes} rate={2.5} wage={wage} color="text-teal-700" />
                        </div>
                    )}
                </div>
            )}

            {/* ── 이번 주 탭 ───────────────────────────────────────────────── */}
            {tab === 'weekly' && (
                <div className="space-y-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="w-5 h-5 opacity-80" />
                            <p className="text-sm font-semibold text-emerald-100">이번 주 야근 수당</p>
                        </div>
                        <div className="text-4xl font-extrabold tracking-tight">
                            {formatWon(agg.weeklyOvertimePay)}
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-emerald-100">
                            <span className="flex items-center gap-1.5">
                                <Moon className="w-4 h-4" />
                                야근 {formatMinutes(agg.weeklyOvertimeMins)}
                            </span>
                        </div>
                    </div>
                    <StatCard
                        icon={<Moon className="w-4 h-4" />}
                        label="주간 야근 시간"
                        value={formatMinutes(agg.weeklyOvertimeMins)}
                        sub="연장·심야·주말 합산"
                        accent="emerald"
                    />
                </div>
            )}

            {/* ── 이번 달 탭 ───────────────────────────────────────────────── */}
            {tab === 'monthly' && (
                <div className="space-y-3">
                    <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Wallet className="w-5 h-5 opacity-80" />
                            <p className="text-sm font-semibold text-violet-100">이번 달 야근 수당</p>
                        </div>
                        <div className="text-4xl font-extrabold tracking-tight">
                            {formatWon(agg.monthlyOvertimePay)}
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-violet-100">
                            <span className="flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4" />
                                총 근무 {formatMinutes(agg.monthlyWorkMins)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Moon className="w-4 h-4" />
                                야근 {formatMinutes(agg.monthlyOvertimeMins)}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon={<TrendingUp className="w-4 h-4" />}
                            label="월간 총근무"
                            value={formatMinutes(agg.monthlyWorkMins)}
                            accent="violet"
                        />
                        <StatCard
                            icon={<Moon className="w-4 h-4" />}
                            label="월간 야근"
                            value={formatMinutes(agg.monthlyOvertimeMins)}
                            accent="rose"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
