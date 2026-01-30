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

    return (
        <aside className="h-full w-full md:w-[400px] flex-shrink-0 flex-col overflow-y-auto bg-surface border-r border-[#333] shadow-2xl transition-all z-20 flex">

            {/* Header */}
            <div className="p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-[#e2e2e2]">Pipe Notch Generator</h1>
                    <span className="text-xs font-semibold text-[#a8c7fa]">V{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0'}</span>
                </div>
                <p className="mt-2 text-sm text-[#aaaaaa]">
                    Calculate pipe cutting templates.
                    <br />
                    <span className="text-[#ff3333] font-medium">Red line</span> in 3D — ideal cutting contour.
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">

                {/* Error Display */}
                {errorMessage && (
                    <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-red-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400 mt-0.5" />
                        <div className="text-sm font-medium">{errorMessage}</div>
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
                        onChange={(val) => updateParam('offset', val)}
                        helperText="Offset of branch axis from D1 center."
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
                    <div className="grid grid-cols-2 gap-4">
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
            <div className="p-6 border-t border-white/10 bg-[#1a1a1a] flex-shrink-0 space-y-3">
                {/* DXF Section */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">DXF Export</h3>
                    <button
                        onClick={() => handleDownload('pipe', 'dxf')}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-[#0b1d46] transition-colors hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!!errorMessage}
                    >
                        <Download className="h-4 w-4" />
                        Download Template (D2)
                    </button>

                    <button
                        onClick={() => handleDownload('hole', 'dxf')}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent py-3 text-sm font-medium text-primary transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!!errorMessage}
                    >
                        <Download className="h-4 w-4" />
                        Download Hole Template (D1)
                    </button>
                </div>

                {/* PDF Section */}
                <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">PDF Export (1:1 Scale)</h3>
                    <button
                        onClick={() => handleDownload('pipe', 'pdf')}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-900/40 border border-red-700/50 py-3 text-sm font-bold text-red-200 transition-colors hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!!errorMessage}
                    >
                        <FileText className="h-4 w-4" />
                        Download PDF (D2)
                    </button>

                    <button
                        onClick={() => handleDownload('hole', 'pdf')}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!!errorMessage}
                    >
                        <FileText className="h-4 w-4" />
                        Download PDF Hole (D1)
                    </button>
                </div>
            </div>
        </aside>
    );
};
