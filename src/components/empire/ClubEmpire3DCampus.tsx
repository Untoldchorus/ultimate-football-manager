'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { CLUB_EMPIRE_BUILDINGS_CATALOG } from '@/engine/clubEmpireConfig';
import {
  ClubEmpireBuildingId,
  ClubEmpireState,
  ClubBuildingState,
  LandPlot,
  ConstructionProject,
  Club,
} from '@/engine/types';
import { soundManager } from '@/lib/audio';
import {
  Trophy,
  Dumbbell,
  HeartPulse,
  GraduationCap,
  Building2,
  Sparkles,
  Clock,
  Zap,
  Play,
  CheckCircle2,
  ArrowUpRight,
  Plus,
  Coins,
} from 'lucide-react';

// ============================================================================
// CAMERA CONTROLLER WITH SMOOTH POSITION GLIDING
// ============================================================================
export interface CameraTarget {
  position: [number, number, number];
  target: [number, number, number];
}

const DEFAULT_CAMERA_POS: [number, number, number] = [36, 42, 58];
const DEFAULT_LOOK_AT: [number, number, number] = [0, 4, 0];

function CameraManager({
  cameraTarget,
  controlsRef,
}: {
  cameraTarget: CameraTarget | null;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!cameraTarget || !controlsRef.current) return;
    const [tx, ty, tz] = cameraTarget.position;
    const [lx, ly, lz] = cameraTarget.target;

    camera.position.lerp(new THREE.Vector3(tx, ty, tz), 0.05);
    controlsRef.current.target.lerp(new THREE.Vector3(lx, ly, lz), 0.05);
    controlsRef.current.update();
  });

  return null;
}

// ============================================================================
// REALISTIC 3D TREES (Pine Conifers & Leafy Deciduous)
// ============================================================================
function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 1.8, 6]} />
        <meshStandardMaterial color="#452714" roughness={0.9} />
      </mesh>
      {/* Foliage Cones */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <coneGeometry args={[1.6, 2.0, 7]} />
        <meshStandardMaterial color="#1b4d24" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <coneGeometry args={[1.25, 1.8, 7]} />
        <meshStandardMaterial color="#235c2e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.1, 0]} castShadow>
        <coneGeometry args={[0.85, 1.5, 7]} />
        <meshStandardMaterial color="#2d733b" roughness={0.8} />
      </mesh>
    </group>
  );
}

function ShadeTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.45, 2.4, 7]} />
        <meshStandardMaterial color="#543821" roughness={0.9} />
      </mesh>
      {/* Canopy Spheres */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <sphereGeometry args={[1.9, 7, 7]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.75} />
      </mesh>
      <mesh position={[0.6, 3.8, 0.4]} castShadow>
        <sphereGeometry args={[1.4, 6, 6]} />
        <meshStandardMaterial color="#388e3c" roughness={0.75} />
      </mesh>
      <mesh position={[-0.5, 3.6, -0.3]} castShadow>
        <sphereGeometry args={[1.3, 6, 6]} />
        <meshStandardMaterial color="#43a047" roughness={0.75} />
      </mesh>
    </group>
  );
}

// ============================================================================
// ACTIVE 3D TOWER CRANE FOR ONGOING CONSTRUCTION
// ============================================================================
function AnimatedTowerCrane({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  const armRef = useRef<THREE.Group>(null);
  const cableRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (armRef.current) {
      armRef.current.rotation.y = Math.sin(t * 0.45) * 0.85 + 0.4;
    }
    if (cableRef.current) {
      cableRef.current.position.y = -1.2 + Math.sin(t * 1.2) * 0.5;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Concrete Counterweight Base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.8, 0.7, 1.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>
      {/* Yellow Lattice Mast */}
      <mesh position={[0, 6.0, 0]} castShadow>
        <boxGeometry args={[0.5, 11.5, 0.5]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.35} />
      </mesh>
      {/* Operator Cabin & Swivel Ring */}
      <mesh position={[0.2, 11.2, 0.2]} castShadow>
        <boxGeometry args={[1.1, 1.2, 0.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      {/* Rotating Jib Arm */}
      <group ref={armRef} position={[0, 12.0, 0]}>
        {/* Main Jib Boom */}
        <mesh position={[4.5, 0, 0]} castShadow>
          <boxGeometry args={[10.5, 0.45, 0.45]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.45} roughness={0.35} />
        </mesh>
        {/* Counter Jib & Counterweight */}
        <mesh position={[-2.4, 0, 0]} castShadow>
          <boxGeometry args={[4.8, 0.45, 0.45]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh position={[-4.2, -0.4, 0]} castShadow>
          <boxGeometry args={[1.4, 1.0, 1.1]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Trolley and Hoist Cable */}
        <group position={[6.0, 0, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.6, 0.3, 0.6]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <group ref={cableRef} position={[0, -1.2, 0]}>
            <mesh position={[0, -1.8, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 3.6, 4]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
            {/* Hook Block / Suspended Load */}
            <mesh position={[0, -3.8, 0]} castShadow>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color="#f97316" metalness={0.2} roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

// ============================================================================
// REGULATION FOOTBALL TRAINING PITCH (Center Campus)
// ============================================================================
function RegulationFootballPitch({
  position,
  width = 24,
  length = 16,
  rotation = 0,
  label = 'Training Pitch 1',
  isActive = true,
}: {
  position: [number, number, number];
  width?: number;
  length?: number;
  rotation?: number;
  label?: string;
  isActive?: boolean;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Perimeter Concrete Curb */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[width + 1.2, 0.08, length + 1.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </mesh>
      {/* Striped Mown Grass Surface (alternating bands) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const bandW = width / 8;
        const xOffset = -width / 2 + bandW * i + bandW / 2;
        const isDark = i % 2 === 0;
        return (
          <mesh key={i} position={[xOffset, 0.09, 0]} receiveShadow>
            <planeGeometry args={[bandW, length]} />
            <meshStandardMaterial
              color={isDark ? '#2e7d32' : '#388e3c'}
              roughness={0.9}
            />
          </mesh>
        );
      })}

      {/* Regulation White Pitch Markings */}
      {/* Touchline Borders */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.05, 4]} />
      </mesh>
      {/* Outer Boundary Line */}
      <group position={[0, 0.11, 0]}>
        {/* Top & Bottom Touchlines */}
        <mesh position={[0, 0, length / 2 - 0.4]}>
          <boxGeometry args={[width - 0.8, 0.02, 0.12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, -length / 2 + 0.4]}>
          <boxGeometry args={[width - 0.8, 0.02, 0.12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Goal Lines */}
        <mesh position={[width / 2 - 0.4, 0, 0]}>
          <boxGeometry args={[0.12, 0.02, length - 0.8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-width / 2 + 0.4, 0, 0]}>
          <boxGeometry args={[0.12, 0.02, length - 0.8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Halfway Line */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.12, 0.02, length - 0.8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Center Circle */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.62, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Penalty Boxes (Left & Right) */}
        <mesh position={[-width / 2 + 2.4, 0, 0]}>
          <boxGeometry args={[4.0, 0.02, 6.5]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
        <mesh position={[width / 2 - 2.4, 0, 0]}>
          <boxGeometry args={[4.0, 0.02, 6.5]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      </group>

      {/* 3D Goalposts (Left & Right) */}
      {[-width / 2 + 0.4, width / 2 - 0.4].map((xPos, idx) => (
        <group key={idx} position={[xPos, 0, 0]} rotation={[0, idx === 0 ? 0 : Math.PI, 0]}>
          {/* Uprights */}
          <mesh position={[0, 0.85, 1.4]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.7, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.85, -1.4]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.7, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.6} />
          </mesh>
          {/* Crossbar */}
          <mesh position={[0, 1.7, 0]} castShadow>
            <boxGeometry args={[0.1, 0.1, 2.8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.6} />
          </mesh>
          {/* Netting Back Box */}
          <mesh position={[-0.45, 0.85, 0]}>
            <boxGeometry args={[0.9, 1.7, 2.8]} />
            <meshStandardMaterial
              color="#ffffff"
              wireframe
              transparent
              opacity={0.35}
            />
          </mesh>
        </group>
      ))}

      {/* Team Dugouts / Covered Benches (along touchline) */}
      <group position={[0, 0, -length / 2 - 0.8]}>
        <mesh position={[-2.5, 0.5, 0]} castShadow>
          <boxGeometry args={[3.4, 1.0, 1.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        <mesh position={[2.5, 0.5, 0]} castShadow>
          <boxGeometry args={[3.4, 1.0, 1.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
      </group>

      {/* Pitch Corner Floodlight Towers */}
      {[
        [-width / 2, -length / 2],
        [width / 2, -length / 2],
        [-width / 2, length / 2],
        [width / 2, length / 2],
      ].map(([fx, fz], fIdx) => (
        <group key={fIdx} position={[fx, 0, fz]}>
          <mesh position={[0, 3.5, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 7.0, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[0, 7.1, 0]} castShadow>
            <boxGeometry args={[0.8, 0.45, 0.35]} />
            <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={isActive ? 0.35 : 0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// ARCHITECTURAL 3D GRAND STADIUM (Top-Right / North-East)
// ============================================================================
function GrandStadiumComplex({
  position,
  club,
  level = 2,
  isConstructing = false,
  onClick,
}: {
  position: [number, number, number];
  club: Club;
  level?: number;
  isConstructing?: boolean;
  onClick: () => void;
}) {
  const primaryColor = club.primaryColor || '#0ea5e9';
  const secondaryColor = club.secondaryColor || '#0369a1';

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Stadium Tiered Oval Bowl Outer Shell */}
      <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[19, 23, 8.0, 32, 1, false]} />
        <meshStandardMaterial
          color="#f1f5f9"
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Interior Pitch Grass */}
      <mesh position={[0, 2.5, 0]} receiveShadow>
        <cylinderGeometry args={[13.5, 13.5, 0.3, 32]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.9} />
      </mesh>

      {/* Seating Tiers (Club Primary Color) */}
      <mesh position={[0, 4.6, 0]}>
        <cylinderGeometry args={[18.2, 14.0, 4.2, 32, 1, true]} />
        <meshStandardMaterial color={primaryColor} roughness={0.7} />
      </mesh>

      {/* Grand Arch Superstructure (Matching Image 2 Arch) */}
      <group position={[0, 8.2, 0]} rotation={[0, 0, Math.PI / 18]}>
        <mesh castShadow>
          <torusGeometry args={[18.5, 0.45, 12, 32, Math.PI * 0.95]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      <group position={[0, 8.2, 0]} rotation={[0, Math.PI, -Math.PI / 18]}>
        <mesh castShadow>
          <torusGeometry args={[18.5, 0.45, 12, 32, Math.PI * 0.95]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* 4 Corner Floodlight Pylon Towers */}
      {[
        [-17, -12],
        [17, -12],
        [-17, 12],
        [17, 12],
      ].map(([px, pz], pIdx) => (
        <group key={pIdx} position={[px, 0, pz]} rotation={[0, 0, px > 0 ? -0.15 : 0.15]}>
          <mesh position={[0, 7.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.45, 15, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[0, 15.2, 0]} castShadow>
            <boxGeometry args={[2.4, 1.2, 0.6]} />
            <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Modern Stadium Entrance Glass Concourse */}
      <mesh position={[0, 1.8, 19.5]} castShadow>
        <boxGeometry args={[14, 3.6, 3.2]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Club Ribbon Banner over Concourse */}
      <mesh position={[0, 3.2, 21.2]}>
        <boxGeometry args={[12, 0.7, 0.15]} />
        <meshStandardMaterial color={secondaryColor} roughness={0.3} />
      </mesh>

      {/* Exterior Plaza & Coach Parking */}
      <mesh position={[0, 0.05, 26]} receiveShadow>
        <boxGeometry args={[32, 0.1, 10]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>

      {isConstructing && <AnimatedTowerCrane position={[16, 0, 12]} scale={1.2} />}
    </group>
  );
}

// ============================================================================
// ARCHITECTURAL MEDICAL CAMPUS WITH OUTDOOR SWIMMING POOL (Right Wing)
// ============================================================================
function MedicalCampusWithPool({
  position,
  level = 1,
  isConstructing = false,
  onClick,
}: {
  position: [number, number, number];
  level?: number;
  isConstructing?: boolean;
  onClick: () => void;
}) {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      // Subtle natural water shimmering
      waterRef.current.position.y = -0.1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.025;
    }
  });

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Main Ground Concrete Plaza */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[26, 0.12, 18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </mesh>

      {/* Main Modern 2-Story Clinic Facility */}
      <mesh position={[-4, 2.2, -2.5]} castShadow receiveShadow>
        <boxGeometry args={[14, 4.4, 10]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Reflective Glass Facade & Solar Skylights */}
      <mesh position={[-4, 2.2, 2.6]}>
        <boxGeometry args={[13.2, 3.8, 0.2]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.8} transparent opacity={0.85} />
      </mesh>
      <mesh position={[-4, 4.5, -2.5]}>
        <boxGeometry args={[11, 0.25, 7.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Red Cross Emblem on Clinic Wall */}
      <group position={[-4, 3.2, 2.75]}>
        <mesh>
          <boxGeometry args={[0.3, 1.0, 0.05]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
        <mesh>
          <boxGeometry args={[1.0, 0.3, 0.05]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* OUTDOOR HYDROTHERAPY & RECOVERY SWIMMING POOL (Directly matching Image 2) */}
      <group position={[7.5, 0.08, 1.5]}>
        {/* Pool Surround Sun Deck (Terracotta/Limestone) */}
        <mesh position={[0, 0.04, 0]} receiveShadow>
          <boxGeometry args={[9.5, 0.08, 13.5]} />
          <meshStandardMaterial color="#fef08a" roughness={0.8} />
        </mesh>
        {/* Sunken Pool Basin */}
        <mesh position={[0, -0.6, 0]} receiveShadow>
          <boxGeometry args={[7.2, 1.2, 11.0]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.3} />
        </mesh>
        {/* Glistening Azure Blue Pool Water */}
        <mesh ref={waterRef} position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7.0, 10.8]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.15}
            metalness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Lounging Chairs & Parasols along the pool */}
        {[-3.0, 0, 3.0].map((lz, idx) => (
          <group key={idx} position={[4.0, 0.15, lz]}>
            <mesh castShadow>
              <boxGeometry args={[0.8, 0.2, 1.5]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          </group>
        ))}
      </group>

      {isConstructing && <AnimatedTowerCrane position={[-11, 0, 4]} scale={0.85} />}
    </group>
  );
}

// ============================================================================
// ARCHITECTURAL COMMERCIAL DISTRICT & MEGASTORE (Foreground East - Oval Shape)
// ============================================================================
function CommercialMegastorePavilion({
  position,
  level = 1,
  isConstructing = false,
  onClick,
}: {
  position: [number, number, number];
  level?: number;
  isConstructing?: boolean;
  onClick: () => void;
}) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Plaza Deck */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[22, 0.12, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* Modern Oval/Curved Building (Matching Image 2's oval commercial pavilion) */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7.0, 8.2, 5.0, 32, 1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.6} />
      </mesh>
      {/* Ribbon Bronze Solar Glass Windows */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[7.15, 7.6, 2.2, 32, 1, true]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.7} transparent opacity={0.8} />
      </mesh>
      {/* Solar Panel Roof */}
      <mesh position={[0, 5.1, 0]}>
        <cylinderGeometry args={[6.2, 6.2, 0.25, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Fan Outdoor Café Patio with Umbrellas (Image 2 style) */}
      {[-6.0, 6.0].map((cx, idx) => (
        <group key={idx} position={[cx, 0.15, 5.5]}>
          {/* Umbrella */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <coneGeometry args={[1.4, 0.6, 8]} />
            <meshStandardMaterial color="#d97706" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          {/* Table */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.1, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>
      ))}

      {isConstructing && <AnimatedTowerCrane position={[8, 0, -4]} scale={0.85} />}
    </group>
  );
}

// ============================================================================
// ARCHITECTURAL OCTAGONAL INDOOR ARENA & GYM (Left Wing Foreground)
// ============================================================================
function OctagonalIndoorArena({
  position,
  level = 1,
  isConstructing = false,
  onClick,
}: {
  position: [number, number, number];
  level?: number;
  isConstructing?: boolean;
  onClick: () => void;
}) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Ground Pad */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[18, 0.12, 18]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* Distinct 8-Sided Octagonal Building Body (Direct match to Image 2) */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.8, 7.8, 5.0, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Metallic Dark Blue Roof with Solar Banks */}
      <mesh position={[0, 5.2, 0]} castShadow>
        <cylinderGeometry args={[6.2, 7.0, 0.6, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 5.55, 0]}>
        <boxGeometry args={[5.5, 0.15, 5.5]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.8} />
      </mesh>

      {isConstructing && <AnimatedTowerCrane position={[-6, 0, -5]} scale={0.8} />}
    </group>
  );
}

// ============================================================================
// ARCHITECTURAL HEADQUARTERS & ADMIN COMPLEX (Left Wing Mid)
// ============================================================================
function ClubHeadquartersComplex({
  position,
  level = 2,
  isConstructing = false,
  onClick,
}: {
  position: [number, number, number];
  level?: number;
  isConstructing?: boolean;
  onClick: () => void;
}) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Base Foundation */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[18, 0.12, 14]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* 3-Story Modern Corporate Office (White & Reflective Glass) */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[14, 6.4, 9]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.15} />
      </mesh>
      {/* Window Louver Grids */}
      {[-1.5, 0.5, 2.5].map((yOffset, idx) => (
        <mesh key={idx} position={[0, 3.2 + yOffset, 4.58]}>
          <boxGeometry args={[13.2, 0.9, 0.1]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.8} />
        </mesh>
      ))}

      {/* Executive Penthouse Atrium */}
      <mesh position={[0, 6.9, 0]} castShadow>
        <boxGeometry args={[8, 1.2, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
      </mesh>

      {isConstructing && <AnimatedTowerCrane position={[7, 0, 5]} scale={0.85} />}
    </group>
  );
}

// ============================================================================
// ARCHITECTURAL YOUTH ACADEMY & BOARDING RESIDENCE (Far Left)
// ============================================================================
function YouthAcademyComplex({
  position,
  level = 1,
  isConstructing = false,
  onClick,
}: {
  position: [number, number, number];
  level?: number;
  isConstructing?: boolean;
  onClick: () => void;
}) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Ground */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[16, 0.12, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>

      {/* Modern Student Residence Block */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 5.0, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      {/* Balcony Overhangs */}
      <mesh position={[0, 4.2, 4.2]}>
        <boxGeometry args={[10, 0.4, 0.8]} />
        <meshStandardMaterial color="#10b981" roughness={0.5} />
      </mesh>

      {isConstructing && <AnimatedTowerCrane position={[-6, 0, 4]} scale={0.75} />}
    </group>
  );
}

// ============================================================================
// CAR PARKING LOT WITH SOLAR CANOPIES (Top-Left)
// ============================================================================
function CarParkingFacility({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Dark Asphalt Ground */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[22, 0.1, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* White Parking Stall Lines */}
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={i} position={[x, 0.11, 0]}>
          <boxGeometry args={[0.1, 0.02, 11]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* 2 Solar Shade Canopies */}
      {[-4, 4].map((z, idx) => (
        <group key={idx} position={[0, 2.2, z]}>
          {/* Canopy Roof */}
          <mesh castShadow>
            <boxGeometry args={[18, 0.15, 3.8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Steel Pillars */}
          {[-7, 0, 7].map((px, pIdx) => (
            <mesh key={pIdx} position={[px, -1.1, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 2.2, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// UNOWNED / EXPANDABLE LAND PLOT WITH SURVEYOR SIGNS
// ============================================================================
function UnownedLandPlotMesh({
  plot,
  onPurchase,
}: {
  plot: LandPlot;
  onPurchase: () => void;
}) {
  return (
    <group position={[plot.gridX, 0, plot.gridZ]}>
      {/* Marked Flat Plot Ground */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[14, 0.08, 11]} />
        <meshStandardMaterial color="#15803d" roughness={0.9} />
      </mesh>

      {/* Surveyor Perimeter Corner Stakes */}
      {[
        [-6.5, -5.0],
        [6.5, -5.0],
        [-6.5, 5.0],
        [6.5, 5.0],
      ].map(([sx, sz], sIdx) => (
        <mesh key={sIdx} position={[sx, 0.6, sz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 6]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Interactive 3D Signpost in Plot Center */}
      <group position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); onPurchase(); }}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 1.6, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[2.2, 1.0, 0.1]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>

        {/* Floating Evony Action Bubble */}
        <Html position={[0, 2.8, 0]} center distanceFactor={28}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playUiClick();
              onPurchase();
            }}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-950/90 border border-gold-400 text-gold-300 shadow-[0_0_20px_rgba(251,191,36,0.35)] hover:scale-105 transition-all text-xs font-black uppercase whitespace-nowrap cursor-pointer animate-bounce"
          >
            <Plus className="w-3.5 h-3.5 text-gold-400" />
            <span>Expand Land • €{(plot.purchaseCost / 1000).toFixed(0)}k</span>
          </button>
        </Html>
      </group>
    </group>
  );
}

// ============================================================================
// EVONY-STYLE FLOATING INTERACTIVE ACTION BUBBLES
// ============================================================================
function EvonyActionBubble({
  position,
  icon: Icon,
  title,
  subtitle,
  variant = 'gold',
  pulsing = false,
  onClick,
}: {
  position: [number, number, number];
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  variant?: 'gold' | 'emerald' | 'amber' | 'blue';
  pulsing?: boolean;
  onClick: () => void;
}) {
  const colorMap = {
    gold: 'border-gold-400 text-gold-300 bg-navy-950/90 shadow-[0_0_22px_rgba(251,191,36,0.4)]',
    emerald: 'border-emerald-400 text-emerald-300 bg-navy-950/90 shadow-[0_0_22px_rgba(16,185,129,0.4)]',
    amber: 'border-amber-400 text-amber-300 bg-navy-950/90 shadow-[0_0_22px_rgba(245,158,11,0.4)]',
    blue: 'border-sky-400 text-sky-300 bg-navy-950/90 shadow-[0_0_22px_rgba(56,189,248,0.4)]',
  };

  return (
    <Html position={position} center distanceFactor={32}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all hover:scale-110 cursor-pointer text-left ${colorMap[variant]} ${
          pulsing ? 'animate-pulse' : ''
        }`}
      >
        <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-xs font-black uppercase text-white tracking-wide">{title}</div>
          {subtitle && <div className="text-[10px] text-slate-300 font-semibold">{subtitle}</div>}
        </div>
      </button>
    </Html>
  );
}

// ============================================================================
// MAIN 3D CAMPUS COMPONENT EXPORT
// ============================================================================
export function ClubEmpire3DScene({
  empire,
  club,
  selectedBuildingId,
  onSelectBuilding,
  onSelectPlot,
  onClaimBooster,
  cameraTarget,
}: {
  empire: ClubEmpireState;
  club: Club;
  selectedBuildingId: ClubEmpireBuildingId | null;
  onSelectBuilding: (id: ClubEmpireBuildingId) => void;
  onSelectPlot: (plot: LandPlot) => void;
  onClaimBooster: (type: 'individual' | 'team') => void;
  cameraTarget: CameraTarget | null;
}) {
  const controlsRef = useRef<any>(null);

  const activeConstructionMap = useMemo(() => {
    const map = new Map<ClubEmpireBuildingId, ConstructionProject>();
    for (const c of empire.activeConstructions) {
      map.set(c.buildingId, c);
    }
    return map;
  }, [empire.activeConstructions]);

  const hasHospitalBoosterReady =
    empire.hospitalProduction.individualBoostersStored > 0 ||
    empire.hospitalProduction.teamBoostersStored > 0;

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows
        camera={{ position: DEFAULT_CAMERA_POS, fov: 38 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#87ceeb']} />

        {/* Daylight Sun & Ambient Skylight (Image 2 style) */}
        <ambientLight intensity={0.65} color="#bae6fd" />
        <directionalLight
          position={[45, 65, 35]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={10}
          shadow-camera-far={180}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          color="#fffbeb"
        />
        <directionalLight position={[-35, 25, -20]} intensity={0.35} color="#38bdf8" />

        {/* Orbit Controls with bounded angles */}
        <OrbitControls
          ref={controlsRef}
          target={DEFAULT_LOOK_AT}
          enablePan
          enableZoom
          enableRotate
          maxPolarAngle={Math.PI / 2.25}
          minDistance={18}
          maxDistance={125}
          dampingFactor={0.08}
        />

        <CameraManager cameraTarget={cameraTarget} controlsRef={controlsRef} />

        {/* Huge Green Campus Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[280, 240]} />
          <meshStandardMaterial color="#2d7a36" roughness={0.95} />
        </mesh>

        {/* Distant Blue Hills / Horizon (Background) */}
        <group position={[0, 0, -100]}>
          <mesh position={[-60, 12, 0]}>
            <coneGeometry args={[45, 32, 7]} />
            <meshStandardMaterial color="#1e3a24" roughness={0.9} />
          </mesh>
          <mesh position={[25, 14, -10]}>
            <coneGeometry args={[55, 36, 7]} />
            <meshStandardMaterial color="#18331e" roughness={0.9} />
          </mesh>
          <mesh position={[85, 10, 0]}>
            <coneGeometry args={[40, 26, 7]} />
            <meshStandardMaterial color="#1f4227" roughness={0.9} />
          </mesh>
        </group>

        {/* ================================================================= */}
        {/* 1. BACKGROUND: GRAND MATCHDAY STADIUM COMPLEX (Top-Right)         */}
        {/* ================================================================= */}
        <GrandStadiumComplex
          position={[38, 0, -42]}
          club={club}
          level={empire.buildings.stadium_stands?.level ?? 2}
          isConstructing={activeConstructionMap.has('stadium_stands')}
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('stadium_stands');
          }}
        />

        {/* Stadium Floating Badge */}
        <EvonyActionBubble
          position={[38, 17, -42]}
          icon={Trophy}
          title={club.name + ' Arena'}
          subtitle={`Stands Lv.${empire.buildings.stadium_stands?.level ?? 2} • 2,000 Cap`}
          variant="gold"
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('stadium_stands');
          }}
        />

        {/* ================================================================= */}
        {/* 2. CENTER CAMPUS: 4 REGULATION FOOTBALL TRAINING PITCHES          */}
        {/* ================================================================= */}
        {/* Main 1st Team Training Pitch */}
        <RegulationFootballPitch
          position={[2, 0, -16]}
          width={22}
          length={15}
          label="First Team Pitch"
          isActive
        />
        {/* Pitch 2 */}
        <RegulationFootballPitch
          position={[2, 0, 4]}
          width={22}
          length={15}
          label="Tactical Training Pitch"
          isActive
        />
        {/* Pitch 3 (Foreground Left) */}
        <RegulationFootballPitch
          position={[-6, 0, 25]}
          width={22}
          length={15}
          label="Set-Piece Pitch"
          isActive={false}
        />

        {/* ================================================================= */}
        {/* 3. RIGHT WING: MEDICAL CENTER WITH HYDROTHERAPY POOL (Image 2)    */}
        {/* ================================================================= */}
        <MedicalCampusWithPool
          position={[30, 0, 0]}
          level={empire.buildings.club_hospital?.level ?? 1}
          isConstructing={activeConstructionMap.has('club_hospital')}
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('club_hospital');
          }}
        />

        {/* Medical / Booster Floating Action Bubble */}
        <EvonyActionBubble
          position={[30, 7.5, 0]}
          icon={HeartPulse}
          title="Medical Center"
          subtitle={
            hasHospitalBoosterReady
              ? '💊 Collect +1 Recovery Booster'
              : `Recovery Pool Lv.${empire.buildings.club_hospital?.level ?? 1}`
          }
          variant={hasHospitalBoosterReady ? 'emerald' : 'blue'}
          pulsing={hasHospitalBoosterReady}
          onClick={() => {
            if (hasHospitalBoosterReady) {
              soundManager.playBoosterCollect();
              onClaimBooster('individual');
            } else {
              soundManager.playUiClick();
              onSelectBuilding('club_hospital');
            }
          }}
        />

        {/* ================================================================= */}
        {/* 4. FOREGROUND EAST: COMMERCIAL MEGASTORE & TROPHY MUSEUM          */}
        {/* ================================================================= */}
        <CommercialMegastorePavilion
          position={[24, 0, 22]}
          level={empire.buildings.club_merchandise_store?.level ?? 1}
          isConstructing={activeConstructionMap.has('club_merchandise_store')}
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('club_merchandise_store');
          }}
        />

        <EvonyActionBubble
          position={[24, 8.5, 22]}
          icon={Coins}
          title="Club Megastore"
          subtitle="🪙 +€24.5k Commercial Yield"
          variant="gold"
          onClick={() => {
            soundManager.playCoinCollect();
            onSelectBuilding('club_merchandise_store');
          }}
        />

        {/* ================================================================= */}
        {/* 5. LEFT WING: HEADQUARTERS, GYM & OCTAGONAL ARENA                 */}
        {/* ================================================================= */}
        {/* Club Headquarters */}
        <ClubHeadquartersComplex
          position={[-26, 0, -28]}
          level={empire.buildings.club_headquarters?.level ?? 2}
          isConstructing={activeConstructionMap.has('club_headquarters')}
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('club_headquarters');
          }}
        />
        <EvonyActionBubble
          position={[-26, 9.5, -28]}
          icon={Building2}
          title="Club Headquarters"
          subtitle={`Admin Lv.${empire.buildings.club_headquarters?.level ?? 2}`}
          variant="blue"
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('club_headquarters');
          }}
        />

        {/* Octagonal Indoor Arena / Training Dome */}
        <OctagonalIndoorArena
          position={[-25, 0, 14]}
          level={empire.buildings.fitness_gym?.level ?? 1}
          isConstructing={activeConstructionMap.has('fitness_gym')}
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('fitness_gym');
          }}
        />
        <EvonyActionBubble
          position={[-25, 8.5, 14]}
          icon={Dumbbell}
          title="Performance Gym"
          subtitle={`Indoor Dome Lv.${empire.buildings.fitness_gym?.level ?? 1}`}
          variant="emerald"
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('fitness_gym');
          }}
        />

        {/* Youth Academy & Lodging */}
        <YouthAcademyComplex
          position={[-28, 0, -6]}
          level={empire.buildings.youth_academy?.level ?? 1}
          isConstructing={activeConstructionMap.has('youth_academy')}
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('youth_academy');
          }}
        />
        <EvonyActionBubble
          position={[-28, 7.5, -6]}
          icon={GraduationCap}
          title="Youth Academy"
          subtitle={`Academy Lv.${empire.buildings.youth_academy?.level ?? 1}`}
          variant="amber"
          onClick={() => {
            soundManager.playUiClick();
            onSelectBuilding('youth_academy');
          }}
        />

        {/* Car Park with Solar Canopies (Top-Left) */}
        <CarParkingFacility position={[-38, 0, -22]} />

        {/* ================================================================= */}
        {/* 6. EXPANDABLE LAND PLOTS (Unowned Surveyor Plots)                 */}
        {/* ================================================================= */}
        {empire.landPlots
          .filter((plot) => !plot.owned)
          .map((plot) => (
            <UnownedLandPlotMesh
              key={plot.plotId}
              plot={plot}
              onPurchase={() => onSelectPlot(plot)}
            />
          ))}

        {/* ================================================================= */}
        {/* 7. LUSH TREES & CAMPUS LANDSCAPING (Matching Image 2 Clusters)     */}
        {/* ================================================================= */}
        {/* Left Wing Tree Clusters */}
        <PineTree position={[-16, 0, -32]} scale={1.2} />
        <PineTree position={[-18, 0, -30]} scale={1.0} />
        <ShadeTree position={[-14, 0, -24]} scale={1.1} />
        <ShadeTree position={[-15, 0, -12]} scale={1.0} />
        <PineTree position={[-16, 0, -4]} scale={1.15} />
        <ShadeTree position={[-14, 0, 8]} scale={1.2} />
        <PineTree position={[-15, 0, 18]} scale={1.3} />

        {/* Center Pathway Trees */}
        <ShadeTree position={[14, 0, -30]} scale={1.1} />
        <PineTree position={[16, 0, -32]} scale={1.3} />
        <ShadeTree position={[15, 0, -8]} scale={1.05} />
        <PineTree position={[16, 0, 10]} scale={1.2} />

        {/* Far Right Perimeter Trees */}
        <PineTree position={[44, 0, -8]} scale={1.2} />
        <ShadeTree position={[45, 0, 4]} scale={1.3} />
        <PineTree position={[42, 0, 16]} scale={1.1} />
        <PineTree position={[38, 0, 28]} scale={1.4} />

        {/* Stadium Perimeter Grove */}
        <PineTree position={[22, 0, -48]} scale={1.4} />
        <PineTree position={[24, 0, -44]} scale={1.2} />
        <ShadeTree position={[55, 0, -42]} scale={1.3} />
        <PineTree position={[58, 0, -38]} scale={1.4} />
      </Canvas>
    </div>
  );
}
