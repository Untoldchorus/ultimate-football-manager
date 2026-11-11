'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MatchEvent, PlayerPositionSnapshot } from '@/engine/types';
import { interpolateMatchStateAtClock } from '@/components/match/Pitch2DViewer';
import { DEFAULT_PLAYER_MODEL_CONFIG } from './playerModelConfig';

export type CameraPreset = 'broadcast' | 'overhead' | 'followBall' | 'goalReplay';
export type QualityLevel = 'low' | 'medium' | 'high';

interface Pitch3DViewerProps {
  events: MatchEvent[];
  currentClockSeconds: number;
  homeClubId: string;
  homeColor: string;
  awayColor: string;
  cameraPreset: CameraPreset;
  quality: QualityLevel;
}

// Convert 0..100 pitch coords to 3D world coords (-50..50 X, -32..32 Z)
function toWorldX(x: number): number {
  return (x - 50) * 1.0;
}
function toWorldZ(y: number): number {
  return (y - 50) * 0.64;
}

function InstancedCrowd({ quality }: { quality: QualityLevel }) {
  const count = quality === 'high' ? 900 : quality === 'medium' ? 450 : 150;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const transforms = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    for (let i = 0; i < count; i++) {
      const side = i % 4;
      const t = ((i * 73) % 100) / 100;
      const row = (i % 6) + 1;
      let x = 0;
      let z = 0;
      if (side === 0) {
        x = (t - 0.5) * 102;
        z = -37 - row * 1.4;
      } else if (side === 1) {
        x = (t - 0.5) * 102;
        z = 37 + row * 1.4;
      } else if (side === 2) {
        x = -56 - row * 1.4;
        z = (t - 0.5) * 64;
      } else {
        x = 56 + row * 1.4;
        z = (t - 0.5) * 64;
      }
      dummy.position.set(x, 1.5 + row * 0.85, z);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());
    }
    return mats;
  }, [count]);

  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    transforms.forEach((mat, i) => {
      meshRef.current!.setMatrixAt(i, mat);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.7, 1.1, 0.7]} />
      <meshStandardMaterial color="#38bdf8" roughness={0.8} />
    </instancedMesh>
  );
}

function ArticulatedPlayerMesh({
  snapshot,
  color,
}: {
  snapshot: PlayerPositionSnapshot;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cfg = DEFAULT_PLAYER_MODEL_CONFIG;
  const anim = cfg.animationParams[snapshot.action] ?? cfg.animationParams.run;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const bob = Math.abs(Math.sin(t * anim.bobSpeed)) * 0.12 + anim.jumpOffset;
    groupRef.current.position.set(toWorldX(snapshot.x), Math.max(0, bob), toWorldZ(snapshot.y));
    groupRef.current.rotation.z = anim.leanAngle;
  });

  return (
    <group ref={groupRef} position={[toWorldX(snapshot.x), 0, toWorldZ(snapshot.y)]}>
      {/* Torso */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[cfg.torsoWidth, cfg.torsoHeight, 0.34]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <sphereGeometry args={[cfg.headRadius, 10, 10]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.14, 0.35, 0]}>
        <boxGeometry args={[0.18, cfg.limbLength, 0.18]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <mesh position={[0.14, 0.35, 0]}>
        <boxGeometry args={[0.18, cfg.limbLength, 0.18]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

function StadiumScene({
  events,
  currentClockSeconds,
  homeClubId,
  homeColor,
  awayColor,
  cameraPreset,
  quality,
}: Pitch3DViewerProps) {
  const frame = interpolateMatchStateAtClock(events, currentClockSeconds);
  const ballX = toWorldX(frame.ball.x);
  const ballZ = toWorldZ(frame.ball.y);

  const cameraPos = useMemo((): [number, number, number] => {
    if (cameraPreset === 'overhead') return [0, 78, 0.1];
    if (cameraPreset === 'followBall') return [ballX * 0.65, 22, ballZ + 28];
    if (cameraPreset === 'goalReplay') {
      const side = frame.ball.x >= 50 ? 64 : -64;
      return [side, 14, 18];
    }
    // broadcast default
    return [0, 38, 58];
  }, [cameraPreset, ballX, ballZ, frame.ball.x]);

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPos} fov={45} />
      <OrbitControls
        target={cameraPreset === 'followBall' ? [ballX, 0, ballZ] : [0, 0, 0]}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.15}
        minDistance={15}
        maxDistance={110}
      />

      <ambientLight intensity={0.65} />
      <directionalLight
        position={[35, 60, 30]}
        intensity={1.25}
        castShadow={quality !== 'low'}
      />

      {/* Stadium Pitch Turf */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[106, 70]} />
        <meshStandardMaterial color="#047857" roughness={0.9} />
      </mesh>

      {/* Pitch Center Line & Touchlines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.35, 64]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Left & Right Goals + Nets */}
      <group position={[-50, 1.4, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 2.8, 7.5]} />
          <meshStandardMaterial color="#ffffff" wireframe />
        </mesh>
      </group>
      <group position={[50, 1.4, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 2.8, 7.5]} />
          <meshStandardMaterial color="#ffffff" wireframe />
        </mesh>
      </group>

      {/* Advertising Boards & Stands */}
      <mesh position={[0, 1.0, -35.5]}>
        <boxGeometry args={[104, 1.5, 0.6]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 1.0, 35.5]}>
        <boxGeometry args={[104, 1.5, 0.6]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Stadium Stands */}
      <mesh position={[0, 5, -42]}>
        <boxGeometry args={[108, 10, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 5, 42]}>
        <boxGeometry args={[108, 10, 10]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-60, 5, 0]}>
        <boxGeometry args={[10, 10, 74]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[60, 5, 0]}>
        <boxGeometry args={[10, 10, 74]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Floodlight Towers */}
      {[
        [-54, 24, -38],
        [54, 24, -38],
        [-54, 24, 38],
        [54, 24, 38],
      ].map(([fx, fy, fz], idx) => (
        <group key={idx} position={[fx, fy / 2, fz]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.8, fy, 8]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          <mesh position={[0, fy / 2, 0]}>
            <boxGeometry args={[3.5, 1.8, 1.2]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* Instanced Crowd */}
      <InstancedCrowd quality={quality} />

      {/* 22 Articulated Players */}
      {frame.players.map((snap) => (
        <ArticulatedPlayerMesh
          key={snap.playerId}
          snapshot={snap}
          color={snap.teamId === homeClubId ? homeColor : awayColor}
        />
      ))}

      {/* Football */}
      <mesh position={[ballX, 0.45, ballZ]} castShadow>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#fbbf24" emissiveIntensity={0.25} />
      </mesh>
    </>
  );
}

export default function Pitch3DViewer(props: Pitch3DViewerProps) {
  return (
    <div
      data-testid="pitch-3d-viewer"
      className="relative w-full aspect-[16/10] max-h-[460px] rounded-2xl overflow-hidden border-2 border-pitch-500/50 shadow-2xl bg-navy-950"
    >
      <Canvas shadows={props.quality !== 'low'} dpr={props.quality === 'high' ? [1, 2] : [1, 1.25]}>
        <StadiumScene {...props} />
      </Canvas>
    </div>
  );
}
