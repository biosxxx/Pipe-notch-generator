import React, { useState, useEffect } from 'react';

interface DebouncedInputProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    helperText?: string;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    helperText
}) => {
    // Local state to hold the immediate input value (can be string to allow empty/typing)
    const [inputValue, setInputValue] = useState<string>(value.toString());

    // Sync local state if external value changes (e.g. preset loaded)
    // We only sync if the parsed local value is different to avoid cursor jumps
    useEffect(() => {
        const parsed = parseFloat(inputValue);
        if (parsed !== value && !isNaN(parsed)) {
            setInputValue(value.toString());
        } else if (isNaN(parsed) && inputValue === '') {
            // If currently empty, user is typing, don't force it? 
            // Actually if store changes externally, we should force it.
            // But usually store changes only via this input.
            // Let's assume store is source of truth.
            setInputValue(value.toString());
        }
    }, [value]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const parsed = parseFloat(inputValue);

            // Validation Logic
            if (isNaN(parsed)) return; // Don't push NaNs
            if (parsed === value) return; // No change

            // If min/max defined, we might clamp or just ignore?
            // Usually standard <input> logic let's you type invalid, then validation happens.
            // Requirement: "if input is empty string "" or "0", DO NOT update the global store".

            if (min !== undefined && parsed < min) return; // Don't update if below min (e.g. 0)
            if (max !== undefined && parsed > max) return;

            // Push to parent
            onChange(parsed);
        }, 500);

        return () => clearTimeout(timer);
    }, [inputValue, onChange, min, max, value]);

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-gray-400">
                {label}
            </label>
            <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                step="any"
                className="w-full rounded bg-black/20 px-3 py-1.5 md:py-2 text-xs md:text-sm text-[var(--color-primary)] placeholder-white/20 outline-none ring-1 ring-white/10 transition-all focus:bg-black/40 focus:ring-[var(--color-primary)] active:scale-[0.99]"
            />
            {helperText && (
                <p className="text-[9px] md:text-[10px] text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
