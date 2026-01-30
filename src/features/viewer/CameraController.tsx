import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useParamStore } from '../../store/useParamStore';
import { useShallow } from 'zustand/react/shallow';
import * as THREE from 'three';

export const CameraController: React.FC = () => {
    // Access Three state
    const { camera, controls } = useThree();

    // Subscribe to D1/D2 to trigger auto-fit
    const { d1, d2 } = useParamStore(
        useShallow(state => ({
            d1: state.d1,
            d2: state.d2
        }))
    );

    // Track D1 to prevent jitter if it changes frequent (though debounced now)
    const prevD1 = useRef(d1);
    const isFirstRun = useRef(true);

    useEffect(() => {
        // We trigger if d1 significantly changes or on mount
        const shouldUpdate = isFirstRun.current || Math.abs(d1 - prevD1.current) > 1;

        if (shouldUpdate && controls) {
            const ctrl = controls as OrbitControlsImpl;
            const size = Math.max(d1, d2);

            // Calculate new position (Iso-like)
            // Distance needs to be enough to fit the object
            // d1 is diameter. Height is d1 * 3 approx.
            // Bounding Sphere radius approx d1 * 1.5.

            const dist = size * 2.5 + 50; // +50 for min distance for small objects

            const x = dist;
            const y = dist * 0.8;
            const z = dist;

            // Move Camera
            camera.position.set(x, y, z);
            camera.lookAt(0, 0, 0); // Although controls usually override lookAt
            camera.updateProjectionMatrix();

            // Reset Controls
            ctrl.target.set(0, 0, 0);
            ctrl.update();

            prevD1.current = d1;
            isFirstRun.current = false;
        }
    }, [d1, d2, camera, controls]);

    // Update Far Plane dynamically? 
    // Usually handled in Canvas, but we can update here too.
    useEffect(() => {
        if (camera instanceof THREE.PerspectiveCamera) {
            camera.far = 100000;
            camera.updateProjectionMatrix();
        }
    }, [camera]);

    return null;
};
