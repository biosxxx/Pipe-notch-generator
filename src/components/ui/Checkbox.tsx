import React from 'react';

interface CheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    helperText?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    label,
    checked,
    onChange,
    helperText,
}) => {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-start">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-[#2d2d2d] text-primary accent-primary focus:ring-primary cursor-pointer"
                    id={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
                />
                <label
                    htmlFor={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    className="ml-3 text-sm font-medium text-gray-200 cursor-pointer select-none"
                >
                    {label}
                </label>
            </div>
            {helperText && (
                <p className="ml-7 text-[11px] leading-4 text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
