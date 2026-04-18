import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { findPrimitiveById } from '../../domain/geometry/solids';
import { useDerivedProject } from '../../hooks/useDerivedProject';
import { MainPipe } from './MainPipe';
import { BranchPipe } from './BranchPipe';
import { SeamLine } from './SeamLine';
import { CameraController } from './CameraController';
import { estimateSolidModelBounds, samplePointOnFrame } from './solidPreview';

const DynamicGrid: React.FC = () => {
    const { solids, main } = useDerivedProject();
    const bounds = React.useMemo(() => estimateSolidModelBounds(solids), [solids]);
    const gridSize = Math.max(main.od * 10, bounds.size * 2.4);

    return <gridHelper args={[gridSize, 56, 0x4a5464, 0x1d222b]} key={gridSize} />;
};

export const Scene: React.FC = () => {
    const derivedProject = useDerivedProject();
    const bounds = React.useMemo(() => estimateSolidModelBounds(derivedProject.solids), [derivedProject.solids]);
    const sceneScale = Math.max(bounds.size, derivedProject.main.od, derivedProject.branch.od);
    const mainPrimitive = findPrimitiveById(derivedProject.solids, derivedProject.solids.outputs.mainPrimitiveId);
    const branchPrimitive = findPrimitiveById(derivedProject.solids, derivedProject.solids.outputs.branchPrimitiveId);
    const keyLightPosition: [number, number, number] = [sceneScale * 2.2, sceneScale * 2.8, sceneScale * 2.1];
    const fillLightPosition: [number, number, number] = [-sceneScale * 2.8, sceneScale * 1.1, sceneScale * 1.8];
    const rimLightPosition: [number, number, number] = [sceneScale * 0.8, sceneScale * 1.9, -sceneScale * 3.4];
    const mainInnerTopLight: [number, number, number] = mainPrimitive && mainPrimitive.kind === 'hollow-cylinder'
        ? samplePointOnFrame(mainPrimitive.frame, mainPrimitive.axialRange.end * 0.38)
        : [0, sceneScale * 0.92, 0];
    const mainInnerBottomLight: [number, number, number] = mainPrimitive && mainPrimitive.kind === 'hollow-cylinder'
        ? samplePointOnFrame(mainPrimitive.frame, mainPrimitive.axialRange.start * 0.38)
        : [0, -sceneScale * 0.92, 0];
    const branchNearAxial = branchPrimitive && branchPrimitive.kind === 'hollow-cylinder'
        ? THREE.MathUtils.lerp(branchPrimitive.axialRange.start, branchPrimitive.axialRange.end, 0.28)
        : sceneScale * 0.55;
    const branchFarAxial = branchPrimitive && branchPrimitive.kind === 'hollow-cylinder'
        ? THREE.MathUtils.lerp(branchPrimitive.axialRange.start, branchPrimitive.axialRange.end, 0.7)
        : sceneScale * 1.5;
    const branchInnerNearLight: [number, number, number] = branchPrimitive && branchPrimitive.kind === 'hollow-cylinder'
        ? samplePointOnFrame(branchPrimitive.frame, branchNearAxial)
        : [sceneScale * 0.55, sceneScale * 0.55, 0];
    const branchInnerFarLight: [number, number, number] = branchPrimitive && branchPrimitive.kind === 'hollow-cylinder'
        ? samplePointOnFrame(branchPrimitive.frame, branchFarAxial)
        : [sceneScale * 1.5, sceneScale * 1.5, 0];
    const intersectionLight: [number, number, number] = branchPrimitive && branchPrimitive.kind === 'hollow-cylinder'
        ? samplePointOnFrame(branchPrimitive.frame, branchPrimitive.axialRange.start + derivedProject.branch.od * 0.35)
        : [0, 0, 0];
    const axesSize = Math.max(sceneScale * 0.8, 100);

    return (
        <div className="h-full w-full bg-[#090b10]">
            <Canvas
                gl={{ antialias: true }}
                camera={{ position: [150, 100, 150], fov: 45, far: 100000 }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.14;
                }}
                shadows={{ type: THREE.PCFSoftShadowMap }}
                style={{ width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#090b10']} />
                <fog attach="fog" args={['#090b10', sceneScale * 5, sceneScale * 16]} />

                <hemisphereLight args={['#e4efff', '#050608', 0.52]} />
                <ambientLight intensity={0.34} color="#d8e4ff" />

                <spotLight
                    position={keyLightPosition}
                    angle={0.42}
                    penumbra={0.7}
                    intensity={3.4}
                    distance={sceneScale * 18}
                    color="#fff0d2"
                />
                <directionalLight
                    position={fillLightPosition}
                    intensity={1.45}
                    color="#9cbcff"
                />
                <directionalLight
                    position={rimLightPosition}
                    intensity={1.95}
                    color="#f4f8ff"
                />

                <pointLight
                    position={mainInnerTopLight}
                    intensity={2.6}
                    distance={sceneScale * 7}
                    decay={1.5}
                    color="#bcd2ff"
                />
                <pointLight
                    position={mainInnerBottomLight}
                    intensity={2.2}
                    distance={sceneScale * 7}
                    decay={1.6}
                    color="#a9c0ff"
                />
                <pointLight
                    position={branchInnerNearLight}
                    intensity={2.7}
                    distance={sceneScale * 6}
                    decay={1.4}
                    color="#dce7ff"
                />
                <pointLight
                    position={branchInnerFarLight}
                    intensity={2.25}
                    distance={sceneScale * 7}
                    decay={1.6}
                    color="#8fb6ff"
                />
                <pointLight
                    position={intersectionLight}
                    intensity={1.75}
                    distance={sceneScale * 5}
                    decay={1.2}
                    color="#fff4dc"
                />

                <group position={[0, 0, 0]}>
                    <MainPipe />
                    <BranchPipe />
                    <SeamLine />
                </group>

                <DynamicGrid />

                <axesHelper args={[axesSize]} />

                <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                    <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
                </GizmoHelper>

                <OrbitControls makeDefault enableDamping dampingFactor={0.05} />
                <CameraController />
            </Canvas>

            <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/45 px-3 py-2 text-[11px] text-gray-200 backdrop-blur-sm">
                <div className="font-semibold text-white">{derivedProject.summary.connectionLabel}</div>
                <div className="mt-1 text-gray-300">
                    Main {Math.round(derivedProject.main.od)} / {Math.round(derivedProject.main.id)}
                    {' '}| Branch {Math.round(derivedProject.branch.od)} / {Math.round(derivedProject.branch.id)}
                </div>
                {derivedProject.connection.type === 'set_in' && (
                    <div className="mt-1 text-gray-400">
                        Penetration {Math.round(derivedProject.connection.resolvedPenetrationDepth * 10) / 10} mm
                    </div>
                )}
            </div>

            <div className="absolute bottom-4 right-4 pointer-events-none rounded bg-black/50 p-2 text-xs text-gray-400">
                LMB: Rotate | RMB: Pan | Scroll: Zoom
            </div>
        </div>
    );
};
