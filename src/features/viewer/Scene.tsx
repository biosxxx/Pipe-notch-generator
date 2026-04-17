import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { MainPipe } from './MainPipe';
import { BranchPipe } from './BranchPipe';
import { SeamLine } from './SeamLine';
import { CameraController } from './CameraController';
import { useDerivedProject } from '../../hooks/useDerivedProject';

const DynamicGrid: React.FC = () => {
    const { main } = useDerivedProject();
    const d1 = main.od;

    return <gridHelper args={[d1 * 10, 50, 0x4a5464, 0x1d222b]} key={d1} />;
};

export const Scene: React.FC = () => {
    const derivedProject = useDerivedProject();
    const sceneScale = Math.max(derivedProject.main.od, derivedProject.branch.od);
    const angleRad = derivedProject.connection.axisAngleRad;
    const keyLightPosition: [number, number, number] = [sceneScale * 2.2, sceneScale * 2.8, sceneScale * 2.1];
    const fillLightPosition: [number, number, number] = [-sceneScale * 2.8, sceneScale * 1.1, sceneScale * 1.8];
    const rimLightPosition: [number, number, number] = [sceneScale * 0.8, sceneScale * 1.9, -sceneScale * 3.4];
    const branchDirX = Math.sin(angleRad);
    const branchDirY = Math.cos(angleRad);
    const mainInnerTopLight: [number, number, number] = [0, sceneScale * 0.92, 0];
    const mainInnerBottomLight: [number, number, number] = [0, -sceneScale * 0.92, 0];
    const branchInnerNearLight: [number, number, number] = [branchDirX * sceneScale * 0.55, branchDirY * sceneScale * 0.55, 0];
    const branchInnerFarLight: [number, number, number] = [branchDirX * sceneScale * 1.5, branchDirY * sceneScale * 1.5, 0];

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
                    intensity={2.3}
                    distance={sceneScale * 6}
                    decay={1.4}
                    color="#dce7ff"
                />
                <pointLight
                    position={branchInnerFarLight}
                    intensity={1.9}
                    distance={sceneScale * 7}
                    decay={1.6}
                    color="#8fb6ff"
                />
                <pointLight
                    position={[0, 0, 0]}
                    intensity={1.35}
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

                <axesHelper args={[100]} />

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
