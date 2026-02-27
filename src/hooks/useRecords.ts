import { useState, useEffect, useCallback } from 'react';
import { DailyRecord } from '../types';

const RECORDS_KEY = 'overtime_records_v2';
const WAGE_KEY = 'overtime_wage_v2';

const DEFAULT_WAGE = 10000;

type RecordMap = Record<string, DailyRecord>;

interface UseRecordsReturn {
    wage: number;
    setWage: (w: number) => void;
    records: RecordMap;
    saveRecord: (record: DailyRecord) => void;
    deleteRecord: (dateStr: string) => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function useRecords(): UseRecordsReturn {
    const [wage, setWageState] = useState<number>(() =>
        loadFromStorage<number>(WAGE_KEY, DEFAULT_WAGE)
    );
    const [records, setRecords] = useState<RecordMap>(() =>
        loadFromStorage<RecordMap>(RECORDS_KEY, {})
    );

    const setWage = useCallback((w: number) => {
        setWageState(w);
        localStorage.setItem(WAGE_KEY, JSON.stringify(w));
    }, []);

    const saveRecord = useCallback((record: DailyRecord) => {
        setRecords(prev => {
            const next = { ...prev, [record.dateStr]: record };
            localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const deleteRecord = useCallback((dateStr: string) => {
        setRecords(prev => {
            const next = { ...prev };
            delete next[dateStr];
            localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    // Sync wage to localStorage when changed externally (e.g. hot reload)
    useEffect(() => {
        localStorage.setItem(WAGE_KEY, JSON.stringify(wage));
    }, [wage]);

    return { wage, setWage, records, saveRecord, deleteRecord };
}
