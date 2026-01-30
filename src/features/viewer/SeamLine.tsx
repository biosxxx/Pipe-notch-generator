import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useParamStore } from '../../store/useParamStore';
import { calculateNotchGeometry } from '../../core/geometry-engine';

export const SeamLine: React.FC = () => {
    // Select only geometry parameters using useShallow
    const params = useParamStore(useShallow(state => ({
        d1: state.d1,
        d2: state.d2,
        thickness: state.thickness,
        angle: state.angle,
        offset: state.offset,
        weldingGap: state.weldingGap,
        startAngle: state.startAngle,
        paddingD1: state.paddingD1,
        paddingD2: state.paddingD2,
        calcByID: state.calcByID
    })));

    const { points, isValid } = useMemo(() => {
        const result = calculateNotchGeometry(params, 128);
        if (!result.isValid) return { points: null, isValid: false };

        const segmentCount = 128;

        // Extract first row of vertices (cut edge)
        const seamPoints: THREE.Vector3[] = [];
        for (let i = 0; i <= segmentCount; i++) {
            const v = result.vertices[i];
            seamPoints.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        return { points: seamPoints, isValid: true };
    }, [params]);

    if (!isValid || !points) return null;

    const lineObj = useMemo(() => {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: "#ff3333", linewidth: 3 });
        return new THREE.Line(geo, mat);
    }, [points]);

    return <primitive object={lineObj} />;
};
