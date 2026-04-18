import React from 'react';

interface ReadonlyFieldProps {
    label: string;
    value: string;
    helperText?: string;
    className?: string;
}

export const ReadonlyField: React.FC<ReadonlyFieldProps> = ({ label, value, helperText, className }) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className || ''}`}>
            <label className="text-[11px] font-medium tracking-[0.08em] text-gray-300">
                {label}
            </label>
            <div className="rounded-lg bg-white/[0.05] px-3.5 py-2.5 text-sm font-medium tabular-nums text-gray-100 ring-1 ring-white/8">
                {value}
            </div>
            {helperText && (
                <p className="text-[11px] leading-4 text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
