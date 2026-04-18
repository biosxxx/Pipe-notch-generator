import React from 'react';

interface SegmentedOption<T extends string> {
    label: string;
    value: T;
}

interface SegmentedControlProps<T extends string> {
    label: string;
    value: T;
    options: Array<SegmentedOption<T>>;
    onChange: (value: T) => void;
    helperText?: string;
}

export function SegmentedControl<T extends string>({
    label,
    value,
    options,
    onChange,
    helperText,
}: SegmentedControlProps<T>) {
    return (
        <div className="flex flex-col gap-2.5">
            <label className="text-[11px] font-medium tracking-[0.08em] text-gray-300">
                {label}
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#141821] p-1.5 ring-1 ring-white/8">
                {options.map((option) => {
                    const active = option.value === value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                                active
                                    ? 'bg-[var(--color-primary)] text-[#0b1d46]'
                                    : 'bg-transparent text-gray-300 hover:bg-white/5'
                            }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
            {helperText && (
                <p className="text-[11px] leading-4 text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
