import React, { ReactNode } from 'react';

interface SectionProps {
    title: string;
    children: ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children }) => {
    return (
        <div className="mb-6 border-b border-white/10 pb-5 last:border-0 md:mb-7 md:pb-6">
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 md:mb-5">
                {title}
            </h3>
            <div className="space-y-3 md:space-y-3.5">{children}</div>
        </div>
    );
};
