import React, { useMemo } from 'react';
import * as THREE from 'three';
import { calculateNotchGeometry } from '../../core/geometry-engine';
import { useDerivedProject } from '../../hooks/useDerivedProject';

export const BranchPipe: React.FC = () => {
    const derivedProject = useDerivedProject();

    const { geometry, isValid } = useMemo(() => {
        const result = calculateNotchGeometry(derivedProject.geometry, 128);

        if (!result.isValid) {
            return { geometry: null, isValid: false };
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

        return { geometry: geo, isValid: true };
    }, [derivedProject.geometry]);

    // Conditional rendering of mesh
    const meshComponent = useMemo(() => {
        if (!isValid || !geometry) return null;
        return (
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color="#2f7eff"
                    roughness={0.24}
                    metalness={0.42}
                    emissive="#0b1d45"
                    emissiveIntensity={0.28}
                    side={THREE.DoubleSide}
                    transparent={derivedProject.connection.type === 'set_in'}
                    opacity={derivedProject.connection.type === 'set_in' ? 0.96 : 1}
                />
            </mesh>
        );
    }, [derivedProject.connection.type, geometry, isValid]);

    return meshComponent;
};
