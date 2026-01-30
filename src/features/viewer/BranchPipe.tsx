import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useShallow } from 'zustand/react/shallow';
import { useParamStore } from '../../store/useParamStore';
import { calculateNotchGeometry } from '../../core/geometry-engine';

export const BranchPipe: React.FC = () => {
    // Select only geometry parameters to avoid re-renders on unrelated state changes (like errorMessage)
    // This breaks the infinite update loop
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

    // Select the error setter action separately (stable reference)
    const setErrorMessage = useParamStore(state => state.setErrorMessage);

    const { geometry, isValid, error } = useMemo(() => {
        const result = calculateNotchGeometry(params, 128); // 128 segments

        if (!result.isValid) {
            return { geometry: null, isValid: false, error: result.error };
        }

        const geo = new THREE.BufferGeometry();

        // Convert vertices to Float32Array
        const positions = new Float32Array(result.vertices.length * 3);
        result.vertices.forEach((v, i) => {
            positions[i * 3] = v.x;
            positions[i * 3 + 1] = v.y;
            positions[i * 3 + 2] = v.z;
        });

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(result.uvs), 2));
        geo.setIndex(result.indices);
        geo.computeVertexNormals();

        return { geometry: geo, isValid: true, error: null };
    }, [params]);

    // Effect to Update Error State
    useEffect(() => {
        const newError = isValid ? null : (error || "Unknown Error");
        // Check current store value to prevent loop
        if (useParamStore.getState().errorMessage !== newError) {
            setErrorMessage(newError);
        }
    }, [isValid, error, setErrorMessage]);

    // Conditional rendering of mesh
    const meshComponent = useMemo(() => {
        if (!isValid || !geometry) return null;
        return (
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color="#3c83f6"
                    roughness={0.4}
                    metalness={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        );
    }, [geometry, isValid]);

    return meshComponent;
};
