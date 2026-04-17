import React from 'react';
import * as THREE from 'three';
import { useDerivedProject } from '../../hooks/useDerivedProject';

export const MainPipe: React.FC = () => {
    const { main, connection } = useDerivedProject();
    const outerRadius = main.outerRadius;
    const innerRadius = Math.max(main.innerRadius, 0.1);
    const tubeLength = main.od * 3;
    const transparentPreview = connection.type === 'set_in';
    const outerOpacity = transparentPreview ? 0.34 : 0.98;
    const innerOpacity = transparentPreview ? 0.2 : 0.9;

    return (
        <group>
            <mesh renderOrder={1}>
                <cylinderGeometry args={[outerRadius, outerRadius, tubeLength, 64, 1, true]} />
                <meshStandardMaterial
                    color="#6a7079"
                    roughness={0.26}
                    metalness={0.18}
                    emissive="#151c28"
                    emissiveIntensity={0.32}
                    side={THREE.FrontSide}
                    transparent={transparentPreview}
                    opacity={outerOpacity}
                    depthWrite={!transparentPreview}
                    polygonOffset={transparentPreview}
                    polygonOffsetFactor={1}
                    polygonOffsetUnits={1}
                />
            </mesh>
            <mesh renderOrder={2}>
                <cylinderGeometry args={[innerRadius, innerRadius, tubeLength, 64, 1, true]} />
                <meshStandardMaterial
                    color="#3b4658"
                    roughness={0.44}
                    metalness={0.06}
                    emissive="#111825"
                    emissiveIntensity={0.26}
                    side={THREE.BackSide}
                    transparent={transparentPreview}
                    opacity={innerOpacity}
                    depthWrite={!transparentPreview}
                    polygonOffset={transparentPreview}
                    polygonOffsetFactor={-1}
                    polygonOffsetUnits={-1}
                />
            </mesh>
        </group>
    );
};
