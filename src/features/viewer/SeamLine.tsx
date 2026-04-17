import React, { useMemo } from 'react';
import * as THREE from 'three';
import { calculateNotchGeometry } from '../../core/geometry-engine';
import { useDerivedProject } from '../../hooks/useDerivedProject';

export const SeamLine: React.FC = () => {
    const derivedProject = useDerivedProject();

    const { points, isValid } = useMemo(() => {
        const result = calculateNotchGeometry(derivedProject.geometry, 128);
        if (!result.isValid) return { points: null, isValid: false };

        const segmentCount = 128;

        // Extract first row of vertices (cut edge)
        const seamPoints: THREE.Vector3[] = [];
        for (let i = 0; i <= segmentCount; i++) {
            const v = result.vertices[i];
            seamPoints.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        return { points: seamPoints, isValid: true };
    }, [derivedProject.geometry]);

    const lineObj = useMemo(() => {
        if (!isValid || !points) return null;
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: "#ff3333", linewidth: 3 });
        return new THREE.Line(geo, mat);
    }, [isValid, points]);

    if (!lineObj) return null;

    return <primitive object={lineObj} />;
};
