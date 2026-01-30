import React, { useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { MainPipe } from './MainPipe';
import { BranchPipe } from './BranchPipe';
import { SeamLine } from './SeamLine';
import { useParamStore } from '../../store/useParamStore';

import { CameraController } from './CameraController';

const DynamicGrid: React.FC = () => {
    // Dynamic Grid Size
    // Need to access store but standard gridHelper args are not reactive by default in JSX unless key changes or new instance
    // We can use a simple subscriber or just pass large enough default.
    // Spec says: args={[d1 * 10, 50]}

    // We need to subscribe inside here
    const d1 = useParamStore(state => state.d1);

    // Use key to force remount if size changes heavily? Or just update args?
    // args update usually requires key change for helpers.

    return <gridHelper args={[d1 * 10, 50, 0x333333, 0x1a1a1a]} key={d1} />;
};

export const Scene: React.FC = () => {
    return (
        <div className="h-full w-full bg-[#0f0f0f]">
            <Canvas
                // Increase Far Plane prevents clipping large pipes
                camera={{ position: [150, 100, 150], fov: 45, far: 100000 }}
                shadows
                style={{ width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#0f0f0f']} />

                {/* Lighting attached to camera? Or just fixed far away? 
                    Prompt said "Switch DirectionalLight to follow the camera or ensure the position scales".
                    Simpler: ensure position scales. 
                    Actually, if we just put lights very far away and increase intensity, it works.
                    But point lights fall off. Directional lights do not.
                    However shadows need shadow camera bounds.
                    For now, let's stick to standard lights but boost position.
                */}
                <ambientLight intensity={0.5} />
                <directionalLight position={[5000, 10000, 5000]} intensity={1.5} castShadow />
                <directionalLight position={[-5000, 0, -5000]} intensity={0.5} color="#445566" />

                {/* Objects */}
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

            {/* Overlay Instructions */}
            <div className="absolute bottom-4 right-4 pointer-events-none text-xs text-gray-500 bg-black/50 p-2 rounded">
                LMB: Rotate | RMB: Pan | Scroll: Zoom
            </div>
        </div>
    );
};
