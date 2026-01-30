import React from 'react';
import * as THREE from 'three';
import { useParamStore } from '../../store/useParamStore';
import { useShallow } from 'zustand/react/shallow';

export const MainPipe: React.FC = () => {
    const { d1, thickness } = useParamStore(
        useShallow((state) => ({
            d1: state.d1,
            thickness: state.thickness,
        }))
    );

    const outerRadius = d1 / 2;
    const safeWall = Math.min(
        Math.max(thickness > 0 ? thickness : outerRadius * 0.05, 0.5),
        Math.max(outerRadius - 0.5, 0.5)
    );
    const innerRadius = Math.max(outerRadius - safeWall, 0.1);

    return (
        <group>
            <mesh>
                <cylinderGeometry args={[outerRadius, outerRadius, d1 * 3, 64, 1, true]} />
                <meshStandardMaterial color="#444444" roughness={0.4} />
            </mesh>
            <mesh>
                <cylinderGeometry args={[innerRadius, innerRadius, d1 * 3, 64, 1, true]} />
                <meshStandardMaterial color="#444444" roughness={0.4} side={THREE.BackSide} />
            </mesh>
        </group>
    );
};
