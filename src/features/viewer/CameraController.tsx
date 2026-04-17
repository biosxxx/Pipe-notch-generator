import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useDerivedProject } from '../../hooks/useDerivedProject';

export const CameraController: React.FC = () => {
    const { camera, controls } = useThree();
    const { main, branch } = useDerivedProject();
    const d1 = main.od;
    const d2 = branch.od;

    // Track D1 to prevent jitter if it changes frequent (though debounced now)
    const prevD1 = useRef(d1);
    const isFirstRun = useRef(true);

    useEffect(() => {
        const shouldUpdate = isFirstRun.current || Math.abs(d1 - prevD1.current) > 1;

        if (shouldUpdate && controls) {
            const ctrl = controls as OrbitControlsImpl;
            const size = Math.max(d1, d2);
            const dist = size * 2.5 + 50; // +50 for min distance for small objects

            const x = dist;
            const y = dist * 0.8;
            const z = dist;

            camera.position.set(x, y, z);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();

            ctrl.target.set(0, 0, 0);
            ctrl.update();

            prevD1.current = d1;
            isFirstRun.current = false;
        }
    }, [d1, d2, camera, controls]);

    return null;
};
