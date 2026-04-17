import React, { useEffect, useRef } from 'react';

interface DebouncedInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    helperText?: string;
    className?: string;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    helperText,
    className
}) => {
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const scheduleChange = (rawValue: string) => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current);
        }

        timerRef.current = window.setTimeout(() => {
            const parsed = parseFloat(rawValue);

            if (rawValue === '' || Number.isNaN(parsed)) return;
            if (parsed === value) return;
            if (min !== undefined && parsed < min) return;
            if (max !== undefined && parsed > max) return;

            onChange(parsed);
        }, 500);
    };

    return (
        <div className={`flex flex-col gap-1.5 ${className || ''}`}>
            <label className="text-[11px] font-medium tracking-[0.08em] text-gray-300">
                {label}
            </label>
            <input
                key={value}
                defaultValue={value.toString()}
                type="number"
                onChange={(e) => scheduleChange(e.target.value)}
                step="any"
                className="w-full rounded-lg bg-[#141821] px-3.5 py-2.5 text-sm font-medium tabular-nums text-slate-100 outline-none ring-1 ring-white/8 transition-all focus:bg-[#171d28] focus:ring-[var(--color-primary)] active:scale-[0.995]"
            />
            {helperText && (
                <p className="text-[11px] leading-4 text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
