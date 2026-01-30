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
        <div className="mb-3 md:mb-4 px-1">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-[#2d2d2d] text-primary focus:ring-primary accent-primary cursor-pointer"
                    id={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
                />
                <label
                    htmlFor={`checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    className="ml-3 text-xs md:text-sm text-gray-200 cursor-pointer select-none"
                >
                    {label}
                </label>
            </div>
            {helperText && (
                <p className="mt-1 ml-7 text-[10px] md:text-xs text-gray-500">{helperText}</p>
            )}
        </div>
    );
};
