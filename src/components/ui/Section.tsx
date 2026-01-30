import React, { ReactNode } from 'react';

interface SectionProps {
    title: string;
    children: ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children }) => {
    return (
        <div className="mb-6 border-b border-white/10 pb-4 last:border-0">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {title}
            </h3>
            <div className="space-y-1">{children}</div>
        </div>
    );
};
