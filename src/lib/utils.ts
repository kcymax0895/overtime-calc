import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatMinutes(mins: number): string {
    if (mins <= 0) return '0분';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}분`;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
}

export function formatWon(amount: number): string {
    return amount.toLocaleString('ko-KR') + '원';
}
