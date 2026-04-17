import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useDerivedProject } from '../../hooks/useDerivedProject';
import { estimateSolidModelBounds } from './solidPreview';

export const CameraController: React.FC = () => {
    const { camera, controls } = useThree();
    const { solids, main, branch } = useDerivedProject();
    const bounds = React.useMemo(() => estimateSolidModelBounds(solids), [solids]);
    const d1 = main.od;
    const d2 = branch.od;
    const [targetX, targetY, targetZ] = bounds.center;

    // Track scene size to prevent jitter if inputs change by tiny amounts.
    const prevSceneSize = useRef(bounds.size);
    const isFirstRun = useRef(true);

    useEffect(() => {
        const sceneSize = Math.max(bounds.size, d1, d2);
        const shouldUpdate = isFirstRun.current || Math.abs(sceneSize - prevSceneSize.current) > 1;

        if (shouldUpdate && controls) {
            const ctrl = controls as OrbitControlsImpl;
            const dist = sceneSize * 2.35 + 50;

            const x = targetX + dist;
            const y = targetY + dist * 0.78;
            const z = targetZ + dist;

            camera.position.set(x, y, z);
            camera.lookAt(targetX, targetY, targetZ);
            camera.updateProjectionMatrix();

            ctrl.target.set(targetX, targetY, targetZ);
            ctrl.update();

            prevSceneSize.current = sceneSize;
            isFirstRun.current = false;
        }
    }, [bounds.size, camera, controls, d1, d2, targetX, targetY, targetZ]);

    return null;
};
