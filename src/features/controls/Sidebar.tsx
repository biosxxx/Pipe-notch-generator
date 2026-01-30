import React from 'react';
import { useParamStore } from '../../store/useParamStore';
import { useShallow } from 'zustand/react/shallow';
// import { NumericInput } from '../../components/ui/NumericInput'; (Replaced)
import { DebouncedInput } from '../../components/ui/DebouncedInput';
import { Checkbox } from '../../components/ui/Checkbox';
import { Section } from '../../components/ui/Section';
import { AlertCircle, FileText, Download } from 'lucide-react';
import { useDownloadAction } from '../../hooks/useDownloadAction';

// Simplify version access if global not typed, or just assume it works as it was there
declare const __APP_VERSION__: string;

export const Sidebar: React.FC = () => {
    const {
        d1,
        d2,
        thickness,
        angle,
        offset,
        weldingGap,
        startAngle,
        paddingD1,
        paddingD2,
        calcByID,
        errorMessage,
        updateParam
    } = useParamStore(
        useShallow((state) => ({
            d1: state.d1,
            d2: state.d2,
            thickness: state.thickness,
            angle: state.angle,
            offset: state.offset,
            weldingGap: state.weldingGap,
            startAngle: state.startAngle,
            paddingD1: state.paddingD1,
            paddingD2: state.paddingD2,
            calcByID: state.calcByID,
            errorMessage: state.errorMessage,
            updateParam: state.updateParam,
        }))
    );

    const handleDownload = useDownloadAction();
    const [isExportOpen, setIsExportOpen] = React.useState(false);
    const exportMenuRef = React.useRef<HTMLDivElement | null>(null);
    const exportDisabled = !!errorMessage;
    const maxOffset = React.useMemo(() => {
        const R1 = d1 / 2;
        const R2_outer = d2 / 2;
        const R2_inner = R2_outer - thickness;
        const R2_calc = Math.max(0, calcByID ? R2_outer : R2_inner);
        const max = R1 - R2_calc;
        if (!Number.isFinite(max)) return 0;
        return Math.max(0, max);
    }, [d1, d2, thickness, calcByID]);

    const maxOffsetLabel = React.useMemo(() => {
        if (!Number.isFinite(maxOffset)) return '0';
        const rounded = Math.round(maxOffset * 100) / 100;
        return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
    }, [maxOffset]);

    React.useEffect(() => {
        if (!isExportOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (!exportMenuRef.current) return;
            if (!exportMenuRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsExportOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isExportOpen]);

    const triggerExport = (type: 'pipe' | 'hole', format: 'dxf' | 'pdf') => {
        if (exportDisabled) return;
        setIsExportOpen(false);
        handleDownload(type, format);
    };

    return (
        <aside className="w-full md:w-[400px] flex-shrink-0 flex-col bg-surface border-b md:border-b-0 md:border-r border-[#333] shadow-2xl transition-all z-20 flex md:h-full md:overflow-y-auto">

            {/* Header */}
            <div className="p-4 md:p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl md:text-2xl font-bold text-[#e2e2e2]">Pipe Notch Generator</h1>
                    <span className="text-xs font-semibold text-[#a8c7fa]">V{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0'}</span>
                </div>
                <p className="mt-2 text-xs md:text-sm text-[#aaaaaa]">
                    Calculate pipe cutting templates.
                    <br />
                    <span className="text-[#ff3333] font-medium">Red line</span> in 3D — ideal cutting contour.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-6 md:overflow-y-auto">

                {/* Error Display */}
                {errorMessage && (
                    <div className="mb-4 md:mb-6 flex items-start gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-3 md:p-4 text-red-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
                        <div className="text-xs md:text-sm font-medium">{errorMessage}</div>
                    </div>
                )}

                <Section title="Primary Controls">
                    <DebouncedInput
                        label="Main Pipe Diameter (D1)"
                        value={d1}
                        onChange={(val) => updateParam('d1', val)}
                        min={1}
                    />
                    <DebouncedInput
                        label="Branch Pipe Diameter (D2)"
                        value={d2}
                        onChange={(val) => updateParam('d2', val)}
                        min={1}
                    />
                    <DebouncedInput
                        label="Wall Thickness D2 (T)"
                        value={thickness}
                        onChange={(val) => updateParam('thickness', val)}
                        helperText="Used for ID calculation."
                        min={0}
                    />
                    <Checkbox
                        label="Deep Cut (Sharp Template)"
                        checked={calcByID}
                        onChange={(val) => updateParam('calcByID', val)}
                        helperText="Makes the cut deeper and sharper (using OD logic), ensuring the inner edge fits tight without gaps."
                    />
                </Section>

                <Section title="Geometry Settings">
                    <DebouncedInput
                        label="Intersection Angle (°)"
                        value={angle}
                        onChange={(val) => updateParam('angle', val)}
                        helperText="Angle between axes (1-90)."
                        min={1}
                        max={90}
                    />
                    <DebouncedInput
                        label="Center Offset"
                        value={offset}
                        onChange={(val) => {
                            const clamped = Math.max(-maxOffset, Math.min(maxOffset, val));
                            updateParam('offset', clamped);
                        }}
                        min={-maxOffset}
                        max={maxOffset}
                        helperText={`Offset of branch axis from D1 center. Max: +/- ${maxOffsetLabel} mm.`}
                    />
                    <DebouncedInput
                        label="Welding Gap"
                        value={weldingGap}
                        onChange={(val) => updateParam('weldingGap', val)}
                    />
                </Section>

                <Section title="Advanced">
                    <DebouncedInput
                        label="Seam Rotation (°)"
                        value={startAngle}
                        onChange={(val) => updateParam('startAngle', val)}
                        helperText="Rotates template around pipe axis."
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                        <DebouncedInput
                            label="Padding D2 (mm)"
                            value={paddingD2}
                            onChange={(val) => updateParam('paddingD2', val)}
                        />
                        <DebouncedInput
                            label="Padding D1 (mm)"
                            value={paddingD1}
                            onChange={(val) => updateParam('paddingD1', val)}
                        />
                    </div>
                </Section>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 md:p-6 border-t border-white/10 bg-[#1a1a1a] flex-shrink-0">
                <div ref={exportMenuRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setIsExportOpen((open) => !open)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 md:py-3 text-xs md:text-sm font-bold text-[#0b1d46] transition-colors hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={exportDisabled}
                        aria-haspopup="menu"
                        aria-expanded={isExportOpen}
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>

                    <div
                        className={`absolute bottom-full mb-3 left-0 right-0 rounded-xl border border-white/10 bg-[#161616] shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition-all duration-150 ${
                            isExportOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
                        }`}
                        role="menu"
                    >
                        <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                            DXF Export
                        </div>
                        <div className="px-3 pb-3 space-y-2">
                            <button
                                type="button"
                                onClick={() => triggerExport('pipe', 'dxf')}
                                className="w-full flex items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-left text-xs font-semibold text-blue-100 transition-colors hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={exportDisabled}
                                role="menuitem"
                            >
                                <span className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Template (D2)
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-blue-200/70">DXF</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => triggerExport('hole', 'dxf')}
                                className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-left text-xs font-medium text-gray-200 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={exportDisabled}
                                role="menuitem"
                            >
                                <span className="flex items-center gap-2">
                                    <Download className="h-4 w-4" />
                                    Hole Template (D1)
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-400">DXF</span>
                            </button>
                        </div>
                        <div className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-t border-white/5">
                            PDF Export (1:1)
                        </div>
                        <div className="px-3 pb-3 space-y-2">
                            <button
                                type="button"
                                onClick={() => triggerExport('pipe', 'pdf')}
                                className="w-full flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-left text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={exportDisabled}
                                role="menuitem"
                            >
                                <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Template (D2)
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-red-200/70">PDF</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => triggerExport('hole', 'pdf')}
                                className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-left text-xs font-medium text-gray-200 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={exportDisabled}
                                role="menuitem"
                            >
                                <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Hole (D1)
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-gray-400">PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
