'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { hashStringToSeed } from '@/engine/rng';
import { MatchEvent, PlayerPositionSnapshot, Vector2D } from '@/engine/types';
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

const SKIN_TONES_3D = ['#f8d5b8', '#eec199', '#d99b66', '#b87644', '#854d27', '#522c13'];
const HAIR_COLORS_3D = ['#0f172a', '#1e293b', '#451a03', '#78350f', '#d97706'];

// Convert 0..100 pitch coords to 3D world coords (-50..50 X, -32..32 Z)
function toWorldX(x: number): number {
  return (x - 50) * 1.0;
}
function toWorldZ(y: number): number {
  return (y - 50) * 0.64;
}

function InstancedCrowd({ quality }: { quality: QualityLevel }) {
  const count = quality === 'high' ? 1100 : quality === 'medium' ? 550 : 180;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { transforms, colors } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const mats: THREE.Matrix4[] = [];
    const cols = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#38bdf8'),
      new THREE.Color('#f43f5e'),
      new THREE.Color('#fbbf24'),
      new THREE.Color('#f8fafc'),
      new THREE.Color('#10b981'),
      new THREE.Color('#a855f7'),
    ];

    for (let i = 0; i < count; i++) {
      const side = i % 4;
      const t = ((i * 73) % 100) / 100;
      const row = (i % 7) + 1;
      let x = 0;
      let z = 0;
      if (side === 0) {
        x = (t - 0.5) * 102;
        z = -37 - row * 1.35;
      } else if (side === 1) {
        x = (t - 0.5) * 102;
        z = 37 + row * 1.35;
      } else if (side === 2) {
        x = -56 - row * 1.35;
        z = (t - 0.5) * 64;
      } else {
        x = 56 + row * 1.35;
        z = (t - 0.5) * 64;
      }
      dummy.position.set(x, 1.5 + row * 0.85, z);
      dummy.updateMatrix();
      mats.push(dummy.matrix.clone());

      const c = palette[i % palette.length];
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return { transforms: mats, colors: cols };
  }, [count]);

  React.useLayoutEffect(() => {
    if (!meshRef.current) return;
    transforms.forEach((mat, i) => {
      meshRef.current!.setMatrixAt(i, mat);
      meshRef.current!.setColorAt(
        i,
        new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2])
      );
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [transforms, colors]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <capsuleGeometry args={[0.25, 0.55, 4, 8]} />
      <meshStandardMaterial roughness={0.75} />
    </instancedMesh>
  );
}

/**
 * Articulated Human-Proportioned 3D Footballer Rig:
 * - Head, hair cap, neck, jersey torso, shorts
 * - Left & right shoulder pivots -> upper arm + elbow -> lower arm + hand
 * - Left & right hip pivots -> upper leg + knee pivot -> lower leg (sock) + boot
 * - Driven by `snapshot.action` (`idle`, `walk`, `run`, `sprint`, `pass`, `shoot`, `tackle`, `header`, `dive`, `celebrate`)
 */
function ArticulatedPlayerMesh({
  snapshot,
  color,
  ballWorld,
  isActive,
}: {
  snapshot: PlayerPositionSnapshot;
  color: string;
  ballWorld: Vector2D;
  isActive: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyTiltRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const rightShoulderRef = useRef<THREE.Group>(null);
  const leftHipRef = useRef<THREE.Group>(null);
  const rightHipRef = useRef<THREE.Group>(null);
  const leftKneeRef = useRef<THREE.Group>(null);
  const rightKneeRef = useRef<THREE.Group>(null);

  const cfg = DEFAULT_PLAYER_MODEL_CONFIG;
  const anim = cfg.animationParams[snapshot.action] ?? cfg.animationParams.run;

  const seed = useMemo(() => hashStringToSeed(snapshot.playerId), [snapshot.playerId]);
  const skinColor = SKIN_TONES_3D[seed % SKIN_TONES_3D.length];
  const hairColor = HAIR_COLORS_3D[(seed >>> 3) % HAIR_COLORS_3D.length];
  const phaseOffset = (seed % 100) * 0.06;

  useFrame(({ clock }) => {
    if (!rootRef.current) return;
    const t = clock.getElapsedTime() * anim.bobSpeed + phaseOffset;

    const wx = toWorldX(snapshot.x);
    const wz = toWorldZ(snapshot.y);
    const bob = Math.abs(Math.sin(t)) * 0.09 + anim.jumpOffset;

    rootRef.current.position.set(wx, Math.max(0, bob), wz);

    // Face toward the ball
    const dx = ballWorld.x - wx;
    const dz = ballWorld.y - wz;
    if (Math.abs(dx) + Math.abs(dz) > 0.05) {
      rootRef.current.rotation.y = Math.atan2(dx, dz);
    }

    if (bodyTiltRef.current) {
      if (snapshot.action === 'dive') {
        bodyTiltRef.current.rotation.z = anim.leanAngle;
        bodyTiltRef.current.rotation.x = 0.25;
      } else {
        bodyTiltRef.current.rotation.z = 0;
        bodyTiltRef.current.rotation.x = anim.leanAngle;
      }
    }

    // Joint animations
    const swing = Math.sin(t) * anim.limbSwing;
    const oppSwing = Math.sin(t + Math.PI) * anim.limbSwing;

    if (leftShoulderRef.current && rightShoulderRef.current) {
      if (snapshot.action === 'celebrate' || snapshot.action === 'dive') {
        leftShoulderRef.current.rotation.z = anim.armRaise;
        rightShoulderRef.current.rotation.z = -anim.armRaise;
        leftShoulderRef.current.rotation.x = Math.sin(t * 1.5) * 0.35;
        rightShoulderRef.current.rotation.x = Math.cos(t * 1.5) * 0.35;
      } else {
        leftShoulderRef.current.rotation.z = 0.14;
        rightShoulderRef.current.rotation.z = -0.14;
        leftShoulderRef.current.rotation.x = oppSwing * 0.85;
        rightShoulderRef.current.rotation.x = swing * 0.85;
      }
    }

    if (leftHipRef.current && rightHipRef.current) {
      if (snapshot.action === 'shoot' || snapshot.action === 'pass') {
        leftHipRef.current.rotation.x = 0.25;
        rightHipRef.current.rotation.x = -Math.abs(Math.sin(t)) * anim.kickSwing;
      } else if (snapshot.action === 'tackle') {
        leftHipRef.current.rotation.x = -0.85;
        rightHipRef.current.rotation.x = 0.45;
      } else {
        leftHipRef.current.rotation.x = swing;
        rightHipRef.current.rotation.x = oppSwing;
      }
    }

    if (leftKneeRef.current && rightKneeRef.current) {
      leftKneeRef.current.rotation.x = Math.max(0, -swing) * anim.kneeBend;
      rightKneeRef.current.rotation.x = Math.max(0, -oppSwing) * anim.kneeBend;
    }
  });

  return (
    <group ref={rootRef} position={[toWorldX(snapshot.x), 0, toWorldZ(snapshot.y)]}>
      {/* Active Player Ground Ring */}
      {isActive && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.65, 0.9, 24]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
        </mesh>
      )}

      <group ref={bodyTiltRef}>
        {/* Shorts / Pelvis */}
        <mesh position={[0, 0.86, 0]} castShadow>
          <boxGeometry args={[0.42, 0.26, 0.26]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>

        {/* Jersey Torso */}
        <mesh position={[0, 1.28, 0]} castShadow>
          <capsuleGeometry args={[0.21, 0.42, 6, 12]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>

        {/* Jersey Collar Accent */}
        <mesh position={[0, 1.56, 0]}>
          <cylinderGeometry args={[0.14, 0.17, 0.08, 12]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.64, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.12, 10]} />
          <meshStandardMaterial color={skinColor} />
        </mesh>

        {/* Head */}
        <group position={[0, 1.82, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[cfg.headRadius, 14, 14]} />
            <meshStandardMaterial color={skinColor} roughness={0.5} />
          </mesh>
          {/* Hair Cap */}
          <mesh position={[0, 0.05, -0.02]}>
            <sphereGeometry args={[cfg.headRadius * 1.02, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            <meshStandardMaterial color={hairColor} roughness={0.8} />
          </mesh>
        </group>

        {/* Left Arm Rig */}
        <group ref={leftShoulderRef} position={[-0.29, 1.48, 0]}>
          {/* Jersey Sleeve */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.16, 4, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.34, 0.04]} castShadow>
            <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </group>

        {/* Right Arm Rig */}
        <group ref={rightShoulderRef} position={[0.29, 1.48, 0]}>
          {/* Jersey Sleeve */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.075, 0.16, 4, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.34, 0.04]} castShadow>
            <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
        </group>

        {/* Left Leg Rig */}
        <group ref={leftHipRef} position={[-0.13, 0.78, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.24, 4, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* Knee & Lower Leg (Sock + Boot) */}
          <group ref={leftKneeRef} position={[0, -0.38, 0]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.24, 4, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {/* Football Boot */}
            <mesh position={[0, -0.36, 0.06]} castShadow>
              <boxGeometry args={[0.13, 0.09, 0.26]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        </group>

        {/* Right Leg Rig */}
        <group ref={rightHipRef} position={[0.13, 0.78, 0]}>
          {/* Thigh */}
          <mesh position={[0, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.24, 4, 8]} />
            <meshStandardMaterial color={skinColor} />
          </mesh>
          {/* Knee & Lower Leg (Sock + Boot) */}
          <group ref={rightKneeRef} position={[0, -0.38, 0]}>
            <mesh position={[0, -0.18, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.24, 4, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
            {/* Football Boot */}
            <mesh position={[0, -0.36, 0.06]} castShadow>
              <boxGeometry args={[0.13, 0.09, 0.26]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Complete White Pitch Line Markings in 3D:
 * Touchlines, goal lines, halfway line, center circle, penalty boxes, 6-yard boxes, penalty spots.
 */
function PitchMarkings3D() {
  const lineMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff' }), []);

  return (
    <group position={[0, 0.025, 0]}>
      {/* Outer Touchlines (Length 100, Z at -32 and +32) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -32]} material={lineMat}>
        <planeGeometry args={[100, 0.3]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 32]} material={lineMat}>
        <planeGeometry args={[100, 0.3]} />
      </mesh>

      {/* Outer Goal Lines (Width 64, X at -50 and +50) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-50, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.3, 64]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[50, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.3, 64]} />
      </mesh>

      {/* Halfway Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.3, 64]} />
      </mesh>

      {/* Center Circle & Spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[8.9, 9.2, 48]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} material={lineMat}>
        <circleGeometry args={[0.45, 16]} />
      </mesh>

      {/* Left Penalty Area (16.5m deep -> X from -50 to -33.5, width 40m -> Z from -20 to 20) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-33.5, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.28, 40]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-41.75, 0, -20]} material={lineMat}>
        <planeGeometry args={[16.5, 0.28]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-41.75, 0, 20]} material={lineMat}>
        <planeGeometry args={[16.5, 0.28]} />
      </mesh>
      {/* Left 6-Yard Box */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-44.5, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.25, 18]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-47.25, 0, -9]} material={lineMat}>
        <planeGeometry args={[5.5, 0.25]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-47.25, 0, 9]} material={lineMat}>
        <planeGeometry args={[5.5, 0.25]} />
      </mesh>
      {/* Left Penalty Spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-39, 0.01, 0]} material={lineMat}>
        <circleGeometry args={[0.35, 12]} />
      </mesh>

      {/* Right Penalty Area (X from 33.5 to 50, Z from -20 to 20) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[33.5, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.28, 40]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[41.75, 0, -20]} material={lineMat}>
        <planeGeometry args={[16.5, 0.28]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[41.75, 0, 20]} material={lineMat}>
        <planeGeometry args={[16.5, 0.28]} />
      </mesh>
      {/* Right 6-Yard Box */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[44.5, 0, 0]} material={lineMat}>
        <planeGeometry args={[0.25, 18]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[47.25, 0, -9]} material={lineMat}>
        <planeGeometry args={[5.5, 0.25]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[47.25, 0, 9]} material={lineMat}>
        <planeGeometry args={[5.5, 0.25]} />
      </mesh>
      {/* Right Penalty Spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[39, 0.01, 0]} material={lineMat}>
        <circleGeometry args={[0.35, 12]} />
      </mesh>
    </group>
  );
}

/**
 * Realistic Goalposts, Crossbar, Stanchions & Netting
 */
function RealisticGoal3D({ side }: { side: 'left' | 'right' }) {
  const xPos = side === 'left' ? -50 : 50;
  const depthDir = side === 'left' ? -1 : 1;

  return (
    <group position={[xPos, 0, 0]}>
      {/* Left & Right Cylindrical Goalposts */}
      <mesh position={[0, 1.45, -3.7]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.9, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.45, 3.7]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.9, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.2} />
      </mesh>
      {/* Cylindrical Crossbar */}
      <mesh position={[0, 2.9, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 7.5, 12]} />
        <meshStandardMaterial color="#ffffff" metalness={0.3} roughness={0.2} />
      </mesh>
      {/* Goal Net Box */}
      <mesh position={[depthDir * 1.15, 1.45, 0]}>
        <boxGeometry args={[2.3, 2.85, 7.4]} />
        <meshStandardMaterial
          color="#e2e8f0"
          wireframe
          transparent
          opacity={0.55}
        />
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
    if (cameraPreset === 'followBall') return [ballX * 0.65, 20, ballZ + 26];
    if (cameraPreset === 'goalReplay') {
      const side = frame.ball.x >= 50 ? 64 : -64;
      return [side, 13, 18];
    }
    // broadcast default
    return [0, 36, 56];
  }, [cameraPreset, ballX, ballZ, frame.ball.x]);

  return (
    <>
      <PerspectiveCamera makeDefault position={cameraPos} fov={44} />
      <OrbitControls
        target={cameraPreset === 'followBall' ? [ballX, 0, ballZ] : [0, 0, 0]}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.12}
        minDistance={14}
        maxDistance={115}
      />

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[35, 65, 30]}
        intensity={1.35}
        castShadow={quality !== 'low'}
      />
      <hemisphereLight args={['#38bdf8', '#064e3b', 0.35]} />

      {/* Outer Stadium Apron Track */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[124, 88]} />
        <meshStandardMaterial color="#0f172a" roughness={0.95} />
      </mesh>

      {/* Striped Stadium Pitch Turf */}
      {Array.from({ length: 10 }).map((_, i) => {
        const stripeX = -45 + i * 10;
        const isEven = i % 2 === 0;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[stripeX, 0, 0]}
            receiveShadow
          >
            <planeGeometry args={[10, 68]} />
            <meshStandardMaterial
              color={isEven ? '#047857' : '#065f46'}
              roughness={0.88}
            />
          </mesh>
        );
      })}

      {/* Full Pitch White Line Markings */}
      <PitchMarkings3D />

      {/* Realistic Left & Right Goals */}
      <RealisticGoal3D side="left" />
      <RealisticGoal3D side="right" />

      {/* LED Advertising Boards */}
      <mesh position={[0, 0.9, -35.2]}>
        <boxGeometry args={[104, 1.5, 0.5]} />
        <meshStandardMaterial color="#020617" emissive="#10b981" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.9, 35.2]}>
        <boxGeometry args={[104, 1.5, 0.5]} />
        <meshStandardMaterial color="#020617" emissive="#f59e0b" emissiveIntensity={0.2} />
      </mesh>

      {/* Technical Area Dugouts */}
      <mesh position={[-12, 1.3, 34]}>
        <boxGeometry args={[7, 2.4, 2.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[12, 1.3, 34]}>
        <boxGeometry args={[7, 2.4, 2.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Multi-Tier Stadium Stands & Roof Canopies */}
      <group>
        {/* North Stand */}
        <mesh position={[0, 5.5, -42]}>
          <boxGeometry args={[110, 11, 11]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 13.5, -41]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[112, 0.8, 14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* South Stand */}
        <mesh position={[0, 5.5, 42]}>
          <boxGeometry args={[110, 11, 11]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 13.5, 41]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[112, 0.8, 14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* West & East Ends */}
        <mesh position={[-61, 5.5, 0]}>
          <boxGeometry args={[11, 11, 76]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[61, 5.5, 0]}>
          <boxGeometry args={[11, 11, 76]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Floodlight Towers */}
      {[
        [-55, 26, -39],
        [55, 26, -39],
        [-55, 26, 39],
        [55, 26, 39],
      ].map(([fx, fy, fz], idx) => (
        <group key={idx} position={[fx, fy / 2, fz]}>
          <mesh>
            <cylinderGeometry args={[0.5, 0.85, fy, 8]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          <mesh position={[0, fy / 2, 0]}>
            <boxGeometry args={[4.2, 2.2, 1.4]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* Instanced Crowd */}
      <InstancedCrowd quality={quality} />

      {/* 22 Articulated Human-Proportioned Footballers */}
      {frame.players.map((snap) => (
        <ArticulatedPlayerMesh
          key={snap.playerId}
          snapshot={snap}
          color={snap.teamId === homeClubId ? homeColor : awayColor}
          ballWorld={{ x: ballX, y: ballZ }}
          isActive={frame.latestEvent.playerId === snap.playerId}
        />
      ))}

      {/* Football with Shadow & Highlights */}
      <mesh position={[ballX, 0.42, ballZ]} castShadow>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshStandardMaterial color="#ffffff" emissive="#fbbf24" emissiveIntensity={0.22} />
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
