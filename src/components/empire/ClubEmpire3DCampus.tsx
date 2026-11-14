'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CLUB_EMPIRE_BUILDINGS_CATALOG } from '@/engine/clubEmpireConfig';
import { ClubBuildingState, ClubEmpireBuildingId, ClubEmpireState, LandPlot } from '@/engine/types';

function ConstructionCrane({ position }: { position: [number, number, number] }) {
  const armRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (armRef.current) {
      armRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.6;
    }
  });
  return (
    <group position={position}>
      <mesh position={[0, 4.5, 0]}>
        <boxGeometry args={[0.45, 9, 0.45]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.4} />
      </mesh>
      <group ref={armRef} position={[0, 9, 0]}>
        <mesh position={[2.2, 0, 0]}>
          <boxGeometry args={[6.5, 0.35, 0.35]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function CampusBuildingMesh({
  plot,
  building,
  isConstructing,
  selected,
  onSelect,
}: {
  plot: LandPlot;
  building?: ClubBuildingState;
  isConstructing: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const level = building?.level ?? 0;
  const height = level === 0 ? 0.3 : 1.8 + level * 0.65;
  const baseColor = !plot.owned
    ? '#1e293b'
    : level === 0
      ? '#334155'
      : plot.zone === 'stadium'
        ? '#059669'
        : plot.zone === 'medical'
          ? '#0284c7'
          : plot.zone === 'training'
            ? '#16a34a'
            : plot.zone === 'commercial'
              ? '#d97706'
              : '#6366f1';

  return (
    <group position={[plot.gridX, 0, plot.gridZ]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Plot Ground Pad */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[plot.size === 'stadium' ? 18 : plot.size === 'large' ? 12 : 9, 0.1, plot.size === 'stadium' ? 14 : 9]} />
        <meshStandardMaterial
          color={selected ? '#38bdf8' : plot.owned ? '#0f172a' : '#020617'}
          roughness={0.85}
        />
      </mesh>

      {/* Building Structure */}
      {plot.owned && level > 0 && (
        <mesh position={[0, height / 2 + 0.1, 0]} castShadow receiveShadow>
          <boxGeometry
            args={[
              plot.size === 'stadium' ? 14 : 7.5,
              height,
              plot.size === 'stadium' ? 10 : 6.5,
            ]}
          />
          <meshStandardMaterial
            color={baseColor}
            metalness={level >= 6 ? 0.45 : 0.15}
            roughness={level >= 6 ? 0.35 : 0.65}
          />
        </mesh>
      )}

      {/* Construction Crane if actively building */}
      {isConstructing && <ConstructionCrane position={[3.5, 0, 2.5]} />}

      {/* Floating Label */}
      <Text
        position={[0, height + 1.4, 0]}
        fontSize={1.05}
        color={plot.owned ? '#f8fafc' : '#64748b'}
        anchorX="center"
        anchorY="middle"
      >
        {building
          ? `${CLUB_EMPIRE_BUILDINGS_CATALOG[building.buildingId].name} (Lv.${level})`
          : plot.owned
            ? `${plot.name} (Open)`
            : `Locked: $${(plot.purchaseCost / 1000).toFixed(0)}k`}
      </Text>
    </group>
  );
}

export function ClubEmpire3DCampus({
  empire,
  selectedBuildingId,
  onSelectBuilding,
}: {
  empire: ClubEmpireState;
  selectedBuildingId: ClubEmpireBuildingId;
  onSelectBuilding: (id: ClubEmpireBuildingId) => void;
}) {
  const constructingIds = useMemo(
    () => new Set(empire.activeConstructions.map((c) => c.buildingId)),
    [empire.activeConstructions]
  );

  return (
    <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-navy-950 relative">
      <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-navy-900/90 border border-slate-700 text-[11px] font-bold text-slate-200">
        Interactive 3D Club Campus &bull; Drag to Rotate &bull; Scroll to Zoom &bull; Click Facility
      </div>
      <Canvas shadows camera={{ position: [0, 38, 52], fov: 45 }}>
        <color attach="background" args={['#060a17']} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[25, 45, 20]} intensity={1.1} castShadow />
        <OrbitControls enablePan enableZoom maxPolarAngle={Math.PI / 2.2} minDistance={18} maxDistance={95} />

        {/* Campus Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[140, 110]} />
          <meshStandardMaterial color="#064e3b" roughness={0.95} />
        </mesh>

        {empire.landPlots.map((plot) => {
          const bState = plot.assignedBuildingId
            ? empire.buildings[plot.assignedBuildingId]
            : undefined;
          return (
            <CampusBuildingMesh
              key={plot.plotId}
              plot={plot}
              building={bState}
              isConstructing={bState ? constructingIds.has(bState.buildingId) : false}
              selected={bState?.buildingId === selectedBuildingId}
              onSelect={() => {
                if (bState) onSelectBuilding(bState.buildingId);
              }}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
