import React from 'react';

interface NumericInputProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    helperText?: string;
    min?: number;
    max?: number;
    step?: number;
}

export const NumericInput: React.FC<NumericInputProps> = ({
    label,
    value,
    onChange,
    helperText,
    min,
    max,
    step = 1,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = 0; // Simple sanitation, better visual handling could be done
        onChange(val);
    };

    return (
        <div className="relative mb-6">
            <label className="absolute -top-2.5 left-3 bg-surface px-1 text-xs font-medium text-primary">
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={handleChange}
                min={min}
                max={max}
                step={step}
                className="w-full rounded-lg border border-white/20 bg-[#2d2d2d] px-4 py-3 text-sm text-white transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {helperText && (
                <p className="mt-1 ml-1 text-xs text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
