import React from 'react';
import * as THREE from 'three';
import { findPrimitiveById } from '../../domain/geometry/solids';
import { useDerivedProject } from '../../hooks/useDerivedProject';
import { createFrameTransform, getPrimitiveLength } from './solidPreview';

export const MainPipe: React.FC = () => {
    const derivedProject = useDerivedProject();
    const mainPrimitive = findPrimitiveById(derivedProject.solids, derivedProject.solids.outputs.mainPrimitiveId);
    if (!mainPrimitive || mainPrimitive.kind !== 'hollow-cylinder') {
        return null;
    }

    const transform = createFrameTransform(mainPrimitive.frame);
    const tubeLength = getPrimitiveLength(mainPrimitive);
    const outerRadius = mainPrimitive.outerRadius;
    const innerRadius = Math.max(mainPrimitive.innerRadius, 0.1);
    const transparentPreview = derivedProject.connection.type === 'set_in';
    const outerOpacity = transparentPreview ? 0.34 : 0.98;
    const innerOpacity = transparentPreview ? 0.2 : 0.9;

    return (
        <group position={transform.position} quaternion={transform.quaternion}>
            <mesh renderOrder={1} rotation={[Math.PI / 2, 0, 0]}>
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
            <mesh renderOrder={2} rotation={[Math.PI / 2, 0, 0]}>
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
