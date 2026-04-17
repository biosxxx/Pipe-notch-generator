import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AlertCircle, AlertTriangle, Download, FileText } from 'lucide-react';
import { Checkbox } from '../../components/ui/Checkbox';
import { DebouncedInput } from '../../components/ui/DebouncedInput';
import { ReadonlyField } from '../../components/ui/ReadonlyField';
import { Section } from '../../components/ui/Section';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { calculateNotchGeometry } from '../../core/geometry-engine';
import { useDerivedProject } from '../../hooks/useDerivedProject';
import { useDownloadAction } from '../../hooks/useDownloadAction';
import type { ConnectionType, PenetrationMode, ValidationMessage } from '../../domain/model/types';
import { useProjectStore } from '../../store/useProjectStore';

declare const __APP_VERSION__: string;

const connectionOptions: Array<{ label: string; value: ConnectionType }> = [
    { label: 'Set On', value: 'set_on' },
    { label: 'Set In', value: 'set_in' },
];

const penetrationOptions: Array<{ label: string; value: PenetrationMode }> = [
    { label: 'By Rule', value: 'by_rule' },
    { label: 'Manual', value: 'by_value' },
];

function formatMm(value: number) {
    if (!Number.isFinite(value)) return '0 mm';
    const rounded = Math.round(value * 100) / 100;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)} mm`;
}

function ExportButton({
    label,
    accent,
    icon,
    onClick,
    disabled,
}: {
    label: string;
    accent: 'blue' | 'red' | 'neutral';
    icon: React.ReactNode;
    onClick: () => void;
    disabled: boolean;
}) {
    const accentClass = accent === 'blue'
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20'
        : accent === 'red'
            ? 'border-red-500/30 bg-red-500/10 text-red-100 hover:bg-red-500/20'
            : 'border-white/10 bg-transparent text-gray-200 hover:bg-white/5';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${accentClass}`}
        >
            <span className="flex items-center gap-2">
                {icon}
                {label}
            </span>
        </button>
    );
}

export const Sidebar: React.FC = () => {
    const {
        project,
        updateMain,
        updateBranch,
        updateConnection,
        updateExport,
    } = useProjectStore(useShallow((state) => ({
        project: state.project,
        updateMain: state.updateMain,
        updateBranch: state.updateBranch,
        updateConnection: state.updateConnection,
        updateExport: state.updateExport,
    })));

    const derivedProject = useDerivedProject();
    const handleDownload = useDownloadAction();
    const geometryResult = React.useMemo(
        () => calculateNotchGeometry(derivedProject.geometry, 128),
        [derivedProject.geometry],
    );

    const geometryErrors = React.useMemo<ValidationMessage[]>(() => {
        if (geometryResult.isValid || !geometryResult.error) {
            return [];
        }

        return [{
            severity: 'error',
            code: 'geometry-runtime',
            message: geometryResult.error,
        }];
    }, [geometryResult.error, geometryResult.isValid]);

    const errors = React.useMemo(
        () => [...derivedProject.validation.errors, ...geometryErrors],
        [derivedProject.validation.errors, geometryErrors],
    );

    const warnings = derivedProject.validation.warnings;
    const exportDisabled = errors.length > 0;

    const triggerExport = (type: 'pipe' | 'hole', format: 'dxf' | 'pdf') => {
        if (exportDisabled) return;
        handleDownload(type, format);
    };

    const versionLabel = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0';

    return (
        <aside className="z-20 flex w-full flex-shrink-0 flex-col border-b border-[#333] bg-surface shadow-2xl md:h-full md:w-[430px] md:overflow-y-auto md:border-b-0 md:border-r">
            <div className="border-b border-white/10 p-5 md:p-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-[#e2e2e2] md:text-2xl">Pipe Notch Generator</h1>
                    <span className="rounded-full bg-[#13213f] px-2.5 py-1 text-[11px] font-semibold text-[#a8c7fa]">
                        Build {versionLabel}
                    </span>
                </div>
                <p className="mt-2 max-w-[30ch] text-sm leading-5 text-[#aaaaaa]">
                    Engineering cut templates with a connection-aware preview and cleaner pipe fit parameters.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="rounded-2xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">Mode</div>
                        <div className="mt-1 text-sm font-semibold text-gray-100">{derivedProject.summary.connectionLabel}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">Main ID</div>
                        <div className="mt-1 text-sm font-semibold text-gray-100">{formatMm(derivedProject.main.id)}</div>
                    </div>
                    <div className="rounded-2xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
                        <div className="text-[10px] uppercase tracking-wide text-gray-500">Branch ID</div>
                        <div className="mt-1 text-sm font-semibold text-gray-100">{formatMm(derivedProject.branch.id)}</div>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-5 md:overflow-y-auto md:p-6">
                {errors.length > 0 && (
                    <div className="mb-5 rounded-xl border border-red-900/50 bg-red-900/20 p-4 text-red-200 md:mb-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                            <div className="space-y-1.5 text-sm">
                                {errors.map((message) => (
                                    <p key={message.code}>{message.message}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {warnings.length > 0 && (
                    <div className="mb-5 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4 text-amber-100 md:mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-300" />
                            <div className="space-y-1.5 text-sm">
                                {warnings.map((message) => (
                                    <p key={message.code}>{message.message}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <Section title="Main Pipe">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DebouncedInput
                            label="Outer Diameter"
                            value={project.main.od}
                            onChange={(value) => updateMain('od', value)}
                            min={1}
                        />
                        <DebouncedInput
                            label="Wall Thickness"
                            value={project.main.wall}
                            onChange={(value) => updateMain('wall', value)}
                            min={0.1}
                        />
                        <ReadonlyField
                            label="Computed ID"
                            value={formatMm(derivedProject.main.id)}
                            helperText="Derived from OD - 2 x wall."
                            className="sm:col-span-2"
                        />
                    </div>
                </Section>

                <Section title="Branch Pipe">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DebouncedInput
                            label="Outer Diameter"
                            value={project.branch.od}
                            onChange={(value) => updateBranch('od', value)}
                            min={1}
                        />
                        <DebouncedInput
                            label="Wall Thickness"
                            value={project.branch.wall}
                            onChange={(value) => updateBranch('wall', value)}
                            min={0.1}
                        />
                        <ReadonlyField
                            label="Computed ID"
                            value={formatMm(derivedProject.branch.id)}
                            helperText="Used for flow opening or ID-based trim."
                            className="sm:col-span-2"
                        />
                    </div>
                </Section>

                <Section title="Connection">
                    <SegmentedControl
                        label="Connection Type"
                        value={project.connection.type}
                        options={connectionOptions}
                        onChange={(value) => updateConnection('type', value)}
                        helperText="Set On seats on the OD. Set In targets the receiver inner wall."
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DebouncedInput
                            label="Axis Angle"
                            value={project.connection.axisAngleDeg}
                            onChange={(value) => updateConnection('axisAngleDeg', value)}
                            min={1}
                            max={90}
                            helperText="1 to 90 degrees."
                        />
                        <DebouncedInput
                            label="Center Offset"
                            value={project.connection.offset}
                            onChange={(value) => {
                                const max = derivedProject.limits.maxOffset;
                                const clamped = Math.max(-max, Math.min(max, value));
                                updateConnection('offset', clamped);
                            }}
                            min={-derivedProject.limits.maxOffset}
                            max={derivedProject.limits.maxOffset}
                            helperText={`Valid range: +/- ${formatMm(derivedProject.limits.maxOffset)}.`}
                        />
                        <DebouncedInput
                            label="Welding Gap"
                            value={project.connection.weldingGap}
                            onChange={(value) => updateConnection('weldingGap', value)}
                            min={0}
                        />
                        <DebouncedInput
                            label="Seam Rotation"
                            value={project.connection.seamAngleDeg}
                            onChange={(value) => updateConnection('seamAngleDeg', value)}
                        />
                    </div>

                    {project.connection.type === 'set_in' && (
                        <>
                            <SegmentedControl
                                label="Penetration Mode"
                                value={project.connection.penetrationMode}
                                options={penetrationOptions}
                                onChange={(value) => updateConnection('penetrationMode', value)}
                                helperText="By Rule uses the main wall thickness as the insertion target."
                            />
                            {project.connection.penetrationMode === 'by_value' && (
                                <DebouncedInput
                                    label="Penetration Depth"
                                    value={project.connection.penetrationDepth}
                                    onChange={(value) => updateConnection('penetrationDepth', value)}
                                    min={0}
                                    helperText="Manual insertion along the branch axis."
                                />
                            )}
                        </>
                    )}

                    <Checkbox
                        label="Use branch OD for trim"
                        checked={project.connection.useOuterBranchContour}
                        onChange={(value) => updateConnection('useOuterBranchContour', value)}
                        helperText="Turn off to use the branch ID as the reference contour."
                    />
                </Section>

                <Section title="Templates">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DebouncedInput
                            label="Branch Margin"
                            value={project.export.branchPadding}
                            onChange={(value) => updateExport('branchPadding', value)}
                            min={0}
                        />
                        <DebouncedInput
                            label="Main-Hole Margin"
                            value={project.export.mainPadding}
                            onChange={(value) => updateExport('mainPadding', value)}
                            min={0}
                        />
                    </div>
                </Section>

                <Section title="Export">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <ExportButton
                            label="Branch DXF"
                            accent="blue"
                            icon={<Download className="h-4 w-4" />}
                            onClick={() => triggerExport('pipe', 'dxf')}
                            disabled={exportDisabled}
                        />
                        <ExportButton
                            label="Main Hole DXF"
                            accent="neutral"
                            icon={<Download className="h-4 w-4" />}
                            onClick={() => triggerExport('hole', 'dxf')}
                            disabled={exportDisabled}
                        />
                        <ExportButton
                            label="Branch PDF"
                            accent="red"
                            icon={<FileText className="h-4 w-4" />}
                            onClick={() => triggerExport('pipe', 'pdf')}
                            disabled={exportDisabled}
                        />
                        <ExportButton
                            label="Main Hole PDF"
                            accent="neutral"
                            icon={<FileText className="h-4 w-4" />}
                            onClick={() => triggerExport('hole', 'pdf')}
                            disabled={exportDisabled}
                        />
                    </div>
                    <p className="mt-3 text-[11px] leading-4 text-gray-500">
                        STEP export stays disabled until the solid-model layer is implemented.
                    </p>
                </Section>
            </div>
        </aside>
    );
};
