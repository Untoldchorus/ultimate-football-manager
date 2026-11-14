'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';
import { CanonicalCutsceneId } from '@/engine/types';

export interface UnityCutsceneParams {
  primaryColor: string;
  secondaryColor: string;
  skinColor: string;
  hairColor: string;
  heightScale: number;
  buildScale: number;
  shirtNumber: number;
  playerName: string;
  clubName: string;
}

function cloneSkinnedScene(source: THREE.Object3D): THREE.Object3D {
  const clone = source.clone(true);
  const sourceSkinned: THREE.SkinnedMesh[] = [];
  const cloneSkinned: THREE.SkinnedMesh[] = [];
  const cloneBones: Record<string, THREE.Bone> = {};

  source.traverse((node) => {
    if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
      sourceSkinned.push(node as THREE.SkinnedMesh);
    }
  });

  clone.traverse((node) => {
    if ((node as THREE.Bone).isBone) {
      cloneBones[node.name] = node as THREE.Bone;
    }
    if ((node as THREE.SkinnedMesh).isSkinnedMesh) {
      cloneSkinned.push(node as THREE.SkinnedMesh);
    }
  });

  for (let i = 0; i < sourceSkinned.length; i++) {
    const srcMesh = sourceSkinned[i];
    const dstMesh = cloneSkinned[i];
    const orderedBones = srcMesh.skeleton.bones.map(
      (b) => cloneBones[b.name] || b
    );
    dstMesh.bind(
      new THREE.Skeleton(orderedBones, srcMesh.skeleton.boneInverses),
      dstMesh.matrixWorld
    );
  }

  return clone;
}

function ParametricFootballer({
  params,
  cutsceneId,
  positionOffset = [0, 0, 0],
  rotationY = 0,
  isSupportingActor = false,
}: {
  params: UnityCutsceneParams;
  cutsceneId: CanonicalCutsceneId;
  positionOffset?: [number, number, number];
  rotationY?: number;
  isSupportingActor?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/cutscenes/footballer_unveiling.glb');

  const clonedScene = useMemo(() => cloneSkinnedScene(scene), [scene]);
  const { actions } = useAnimations(animations, clonedScene);

  useEffect(() => {
    const primary = new THREE.Color(params.primaryColor || '#dc2626');
    const secondary = new THREE.Color(params.secondaryColor || '#ffffff');
    const skin = new THREE.Color(params.skinColor || '#8c5332');
    const hair = new THREE.Color(params.hairColor || '#0f0c0a');

    clonedScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        const mName = mat.name || '';
        if (mName.includes('KitShirtMat') || mName.includes('SocksMat')) {
          mat.color.copy(primary);
          mat.roughness = 0.62;
        } else if (mName.includes('KitSleeveMat')) {
          mat.color.copy(secondary);
          mat.roughness = 0.62;
        } else if (mName.includes('SkinMat')) {
          mat.color.copy(skin);
          mat.roughness = 0.58;
        } else if (mName.includes('HairMat')) {
          mat.color.copy(hair);
          mat.roughness = 0.82;
        }
        mesh.material = mat;
      }
    });
  }, [clonedScene, params]);

  useEffect(() => {
    const firstAction =
      actions['shirt_presentation'] || Object.values(actions)[0];
    if (firstAction) {
      firstAction.reset().fadeIn(0.2).play();
    }
  }, [actions]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() % 6.0;
    const [ox, oy, oz] = positionOffset;

    if (cutsceneId === 'player_signing' || cutsceneId === 'manager_intro') {
      const walkProgress = Math.min(1, t / 2.4);
      const eased = 1 - Math.pow(1 - walkProgress, 2);
      groupRef.current.position.set(ox, oy, THREE.MathUtils.lerp(-2.1, oz, eased));
      groupRef.current.rotation.y = rotationY;
    } else if (cutsceneId === 'goal_celebration') {
      // Sprint toward corner flag & celebratory jump/fist-pump
      const runProgress = Math.min(1, t / 1.8);
      const jump =
        t > 1.8 && t < 3.0
          ? Math.max(0, Math.sin(((t - 1.8) / 1.2) * Math.PI) * 0.42)
          : 0;
      groupRef.current.position.set(
        THREE.MathUtils.lerp(ox - 1.8, ox, runProgress),
        oy + jump,
        THREE.MathUtils.lerp(oz - 1.6, oz, runProgress)
      );
      groupRef.current.rotation.y =
        rotationY + (t > 1.8 ? Math.sin(t * 3.5) * 0.22 : 0.35);
    } else if (
      cutsceneId === 'trophy_presentation' ||
      cutsceneId === 'league_championship'
    ) {
      // Celebratory bounce on champions podium
      const bounce = Math.abs(Math.sin(t * 4.5 + ox)) * 0.14;
      groupRef.current.position.set(ox, oy + bounce, oz);
      groupRef.current.rotation.y = rotationY + Math.sin(t * 2.0) * 0.12;
    } else if (cutsceneId === 'tunnel_walkout') {
      // Squad marching out of tunnel onto pitch
      const walkProgress = Math.min(1, t / 4.8);
      groupRef.current.position.set(
        ox,
        oy,
        THREE.MathUtils.lerp(oz - 3.4, oz + 0.8, walkProgress)
      );
      groupRef.current.rotation.y = rotationY;
    } else if (
      cutsceneId === 'red_card_reaction' ||
      cutsceneId === 'missed_penalty'
    ) {
      // Dramatic slow step back & head shake
      groupRef.current.position.set(ox, oy, oz);
      groupRef.current.rotation.y =
        rotationY + (isSupportingActor ? 0 : Math.sin(t * 5.0) * 0.18);
    } else {
      groupRef.current.position.set(ox, oy, oz);
      groupRef.current.rotation.y = rotationY + Math.sin(t * 1.5) * 0.08;
    }
  });

  const sx = (params.heightScale || 1.05) * (params.buildScale || 1.0);
  const sy = params.heightScale || 1.05;
  const numStr = String(params.shirtNumber || 9);
  const surname =
    (params.playerName || 'SIGNING').trim().split(' ').pop()?.toUpperCase() ||
    'SIGNING';

  return (
    <group
      ref={groupRef}
      position={positionOffset}
      rotation={[0, rotationY, 0]}
      scale={[sx, sy, sx]}
    >
      <primitive object={clonedScene} />
      {!isSupportingActor && (
        <>
          <Text
            position={[0, 1.31, 0.19]}
            fontSize={0.11}
            color={params.secondaryColor || '#ffffff'}
            outlineWidth={0.012}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {numStr}
          </Text>
          <Text
            position={[0, 1.28, -0.19]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.21}
            color={params.secondaryColor || '#ffffff'}
            outlineWidth={0.015}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {numStr}
          </Text>
          <Text
            position={[0, 1.44, -0.19]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.08}
            color={params.secondaryColor || '#ffffff'}
            outlineWidth={0.01}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {surname}
          </Text>
        </>
      )}
    </group>
  );
}

function ChampionsConfettiAndTrophy({
  primaryColor,
  clubName,
}: {
  primaryColor: string;
  clubName: string;
}) {
  const trophyRef = useRef<THREE.Group>(null);
  const confettiRef = useRef<THREE.Group>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 48 }).map((_, i) => ({
        x: ((i * 73) % 600) / 100 - 3.0,
        y: ((i * 41) % 350) / 100 + 0.5,
        z: ((i * 29) % 300) / 100 - 1.5,
        speed: 0.6 + (i % 5) * 0.22,
        color: ['#fbbf24', '#ffffff', primaryColor, '#10b981', '#38bdf8'][
          i % 5
        ],
      })),
    [primaryColor]
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (trophyRef.current) {
      trophyRef.current.position.y = 1.45 + Math.sin(t * 3.2) * 0.12;
      trophyRef.current.rotation.y = t * 1.1;
    }
    if (confettiRef.current) {
      confettiRef.current.children.forEach((child, idx) => {
        const p = particles[idx];
        if (!p) return;
        const ny = ((p.y - t * p.speed) % 3.6 + 3.6) % 3.6;
        child.position.set(
          p.x + Math.sin(t * 2 + idx) * 0.15,
          ny + 0.2,
          p.z
        );
        child.rotation.x = t * 3 + idx;
        child.rotation.y = t * 2 + idx;
      });
    }
  });

  return (
    <group>
      {/* Champions Stage Podium */}
      <mesh position={[0, 0.18, -0.3]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 0.36, 2.2]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.37, 0.78]}>
        <boxGeometry args={[4.45, 0.06, 0.08]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
      </mesh>
      <Text
        position={[0, 0.18, 0.82]}
        fontSize={0.18}
        color="#fbbf24"
        outlineWidth={0.014}
        outlineColor="#020617"
        anchorX="center"
        anchorY="middle"
      >
        {`${clubName.toUpperCase()} • CHAMPIONS`}
      </Text>

      {/* 3D Golden Trophy Cup */}
      <group ref={trophyRef} position={[0, 1.45, 0.35]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.09, 0.14, 0.22, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.26, 24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.18} metalness={0.92} />
        </mesh>
        <mesh position={[0, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.09, 0.36, 32]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.14} metalness={0.95} />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <torusGeometry args={[0.21, 0.025, 16, 32]} />
          <meshStandardMaterial color="#fef08a" roughness={0.12} metalness={0.95} />
        </mesh>
      </group>

      {/* Falling 3D Confetti */}
      <group ref={confettiRef}>
        {particles.map((p, i) => (
          <mesh key={i} position={[p.x, p.y, p.z]}>
            <boxGeometry args={[0.07, 0.04, 0.01]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={0.35}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function UnityCinematicCameraDirector({
  cutsceneId,
}: {
  cutsceneId: CanonicalCutsceneId;
}) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime() % 6.0;
    const p = t / 6.0;

    if (cutsceneId === 'goal_celebration') {
      // Dynamic low-angle tracking camera following the goalscorer
      camera.position.set(
        THREE.MathUtils.lerp(-2.4, 1.4, p),
        THREE.MathUtils.lerp(1.15, 1.45, p),
        THREE.MathUtils.lerp(3.2, 2.0, p)
      );
      camera.lookAt(0, 1.35, 0);
      return;
    }

    if (
      cutsceneId === 'trophy_presentation' ||
      cutsceneId === 'league_championship'
    ) {
      // Sweeping heroic crane shot around the trophy podium
      const angle = THREE.MathUtils.lerp(-0.55, 0.55, p);
      const radius = THREE.MathUtils.lerp(4.2, 2.7, p);
      camera.position.set(
        Math.sin(angle) * radius,
        THREE.MathUtils.lerp(1.3, 1.75, p),
        Math.cos(angle) * radius
      );
      camera.lookAt(0, 1.45, 0);
      return;
    }

    if (cutsceneId === 'tunnel_walkout') {
      // Tracking backwards ahead of the players walking out of the tunnel
      camera.position.set(
        THREE.MathUtils.lerp(-0.8, 0.8, p),
        THREE.MathUtils.lerp(1.35, 1.55, p),
        THREE.MathUtils.lerp(2.2, 3.8, p)
      );
      camera.lookAt(0, 1.35, -1.0);
      return;
    }

    if (p < 0.45) {
      const k = p / 0.45;
      camera.position.set(
        THREE.MathUtils.lerp(-3.6, 2.1, k),
        THREE.MathUtils.lerp(1.85, 1.52, k),
        THREE.MathUtils.lerp(4.6, 3.0, k)
      );
      camera.lookAt(0, 1.28, THREE.MathUtils.lerp(-1.2, 0, k));
    } else if (p < 0.78) {
      const k = (p - 0.45) / 0.33;
      camera.position.set(
        THREE.MathUtils.lerp(1.5, -1.1, k),
        THREE.MathUtils.lerp(1.45, 1.5, k),
        THREE.MathUtils.lerp(2.5, 2.2, k)
      );
      camera.lookAt(0, 1.38, 0);
    } else {
      const k = (p - 0.78) / 0.22;
      camera.position.set(
        THREE.MathUtils.lerp(-0.45, 0.42, k),
        THREE.MathUtils.lerp(1.44, 1.48, k),
        THREE.MathUtils.lerp(1.68, 1.58, k)
      );
      camera.lookAt(0, 1.42, 0);
    }
  });

  return null;
}

function StadiumPBRStage({
  params,
  cutsceneId,
}: {
  params: UnityCutsceneParams;
  cutsceneId: CanonicalCutsceneId;
}) {
  const flashRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!flashRef.current) return;
    const t = state.clock.getElapsedTime();
    const pulse = Math.sin(t * 19.0) * Math.cos(t * 11.0);
    flashRef.current.intensity = pulse > 0.68 ? 1.8 : 0.0;
  });

  const primary = params.primaryColor || '#dc2626';
  const secondary = params.secondaryColor || '#ffffff';
  const clubUpper = (params.clubName || 'FOOTBALL CLUB').toUpperCase();
  const heroUpper = params.playerName
    ? `#${params.shirtNumber || 9} ${params.playerName.toUpperCase()}`
    : `#${params.shirtNumber || 9} NEW SIGNING`;

  const isTrophy =
    cutsceneId === 'trophy_presentation' ||
    cutsceneId === 'league_championship';
  const isTalk =
    cutsceneId === 'pre_match_talk' || cutsceneId === 'half_time_talk';
  const isRedCard = cutsceneId === 'red_card_reaction';
  const isTunnel = cutsceneId === 'tunnel_walkout';
  const isGoal = cutsceneId === 'goal_celebration';

  return (
    <group>
      {/* PBR Lighting & Stadium Floodlights */}
      <ambientLight intensity={0.65} color="#e2e8f0" />
      <directionalLight
        position={[18, 32, 24]}
        intensity={1.35}
        color="#fffbeb"
        castShadow
      />
      <directionalLight
        position={[-22, 20, -24]}
        intensity={0.55}
        color="#bae6fd"
      />
      <pointLight
        ref={flashRef}
        position={[1.6, 1.9, 2.6]}
        distance={12}
        color="#f8fafc"
        intensity={0}
      />

      {/* Alternating Mowed Pitch Stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-45 + i * 10, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[10, 68]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? '#047857' : '#065f46'}
            roughness={0.88}
          />
        </mesh>
      ))}

      {/* Presentation Navy Carpet */}
      <mesh position={[0, 0.02, -1.2]} receiveShadow>
        <boxGeometry args={[4.8, 0.04, 5.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.75} />
      </mesh>

      {/* Scene-Specific 3D Centerpiece */}
      {isTrophy ? (
        <ChampionsConfettiAndTrophy
          primaryColor={primary}
          clubName={clubUpper}
        />
      ) : isTalk ? (
        /* Dressing Room Tactical Board */
        <group position={[0, 0, -2.6]}>
          <mesh position={[0, 1.45, 0]} castShadow>
            <boxGeometry args={[3.8, 2.1, 0.14]} />
            <meshStandardMaterial color="#064e3b" roughness={0.5} />
          </mesh>
          <mesh position={[0, 2.52, 0]}>
            <boxGeometry args={[3.9, 0.1, 0.18]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
          </mesh>
          <Text
            position={[0, 2.22, 0.09]}
            fontSize={0.18}
            color="#fbbf24"
            outlineWidth={0.012}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {`${clubUpper} • TACTICAL BRIEFING`}
          </Text>
          {[-0.9, -0.3, 0.3, 0.9].map((mx, idx) => (
            <mesh key={idx} position={[mx, 1.3 + (idx % 2) * 0.35, 0.09]}>
              <cylinderGeometry args={[0.09, 0.09, 0.04, 20]} />
              <meshStandardMaterial color={primary} />
            </mesh>
          ))}
        </group>
      ) : isTunnel ? (
        /* Stadium Tunnel Archway */
        <group position={[0, 0, -3.2]}>
          <mesh position={[-1.6, 1.4, 0]}>
            <boxGeometry args={[0.6, 2.8, 2.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[1.6, 1.4, 0]}>
            <boxGeometry args={[0.6, 2.8, 2.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, 2.7, 0]}>
            <boxGeometry args={[3.8, 0.45, 2.5]} />
            <meshStandardMaterial color={primary} roughness={0.4} />
          </mesh>
          <Text
            position={[0, 2.7, 1.28]}
            fontSize={0.2}
            color={secondary}
            outlineWidth={0.015}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {`WELCOME TO ${clubUpper}`}
          </Text>
        </group>
      ) : (
        /* Club Unveiling / Broadcast Backdrop Arch + Gold Trim */
        <group>
          <mesh position={[0, 1.42, -3.8]} castShadow receiveShadow>
            <boxGeometry args={[4.9, 2.8, 0.18]} />
            <meshStandardMaterial
              color={primary}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          <mesh position={[0, 2.84, -3.8]}>
            <boxGeometry args={[5.0, 0.12, 0.22]} />
            <meshStandardMaterial
              color="#fbbf24"
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
          <Text
            position={[0, 2.52, -3.68]}
            fontSize={0.22}
            color="#fbbf24"
            outlineWidth={0.015}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {isGoal
              ? `GOAL!! ${clubUpper}`
              : isRedCard
                ? `DISCIPLINARY DECISION`
                : clubUpper}
          </Text>
          <Text
            position={[0, 2.2, -3.68]}
            fontSize={0.17}
            color={secondary}
            outlineWidth={0.012}
            outlineColor="#020617"
            anchorX="center"
            anchorY="middle"
          >
            {heroUpper}
          </Text>
        </group>
      )}

      {/* Glowing Red Card Prop when red_card_reaction is active */}
      {isRedCard && (
        <mesh position={[-0.38, 1.72, 0.42]} rotation={[0, 0.3, -0.15]}>
          <boxGeometry args={[0.14, 0.21, 0.012]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={1.6}
          />
        </mesh>
      )}

      {/* Corner Flag Prop for Goal Celebrations */}
      {isGoal && (
        <group position={[1.35, 0, 0.65]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.5, 12]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0.18, 1.38, 0]}>
            <boxGeometry args={[0.35, 0.24, 0.01]} />
            <meshStandardMaterial
              color={primary}
              emissive={primary}
              emissiveIntensity={0.35}
            />
          </mesh>
        </group>
      )}

      {/* Regulation Multi-Panel Match Football (0.115m radius) */}
      <group position={[0.45, 0.115, 0.52]}>
        <mesh castShadow>
          <sphereGeometry args={[0.115, 24, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.28} metalness={0.1} />
        </mesh>
        <mesh rotation={[0.4, 0.5, 0]}>
          <torusGeometry args={[0.116, 0.014, 12, 32]} />
          <meshStandardMaterial color={primary} roughness={0.35} />
        </mesh>
        <mesh rotation={[-0.7, -0.4, 0.5]}>
          <torusGeometry args={[0.116, 0.014, 12, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} />
        </mesh>
      </group>

      {/* Tiered Stadium Stands, Crowd Rows, LED Boards & Roof Canopy */}
      {[-1, 1].map((zDir) => (
        <group key={zDir} position={[0, 0, zDir * 19]}>
          {/* Pitchside LED Ad Board */}
          <mesh position={[0, 0.52, -zDir * 2.2]}>
            <boxGeometry args={[96, 1.05, 0.35]} />
            <meshStandardMaterial
              color="#0f172a"
              emissive={primary}
              emissiveIntensity={0.45}
            />
          </mesh>
          {/* 6 Stepped Seating Tiers */}
          {Array.from({ length: 6 }).map((_, t) => {
            const ty = 0.9 + t * 1.65;
            const tz = zDir * (t * 2.4);
            const crowdPalette = [primary, '#f8fafc', '#fbbf24', '#1e293b', secondary];
            return (
              <group key={t}>
                <mesh position={[0, ty, tz]}>
                  <boxGeometry args={[96, 1.8, 2.6]} />
                  <meshStandardMaterial
                    color={t % 2 === 0 ? '#1e293b' : '#0f172a'}
                    roughness={0.8}
                  />
                </mesh>
                <mesh position={[0, ty + 1.15, tz - zDir * 0.4]}>
                  <boxGeometry args={[92, 0.65, 1.1]} />
                  <meshStandardMaterial
                    color={crowdPalette[t % crowdPalette.length]}
                    roughness={0.65}
                  />
                </mesh>
              </group>
            );
          })}
          {/* Roof Canopy & Floodlight Strip */}
          <mesh position={[0, 12.8, zDir * 6.0]}>
            <boxGeometry args={[100, 0.7, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 12.35, -zDir * 1.2]}>
            <boxGeometry args={[84, 0.25, 0.6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fef08a"
              emissiveIntensity={2.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function UnityCutsceneHost({
  cutsceneId,
  params,
}: {
  cutsceneId: CanonicalCutsceneId;
  params: UnityCutsceneParams;
}) {
  const [hasUnityWasmBuild, setHasUnityWasmBuild] = useState(false);

  useEffect(() => {
    fetch('/unity/index.html', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) setHasUnityWasmBuild(true);
      })
      .catch(() => {});
  }, []);

  if (hasUnityWasmBuild) {
    return (
      <iframe
        src="/unity/index.html"
        title={`Unity 6 WebGL Cutscene: ${cutsceneId}`}
        className="w-full h-full border-0"
      />
    );
  }

  const isMultiActorScene =
    cutsceneId === 'goal_celebration' ||
    cutsceneId === 'trophy_presentation' ||
    cutsceneId === 'league_championship' ||
    cutsceneId === 'tunnel_walkout';

  const heroYOffset =
    cutsceneId === 'trophy_presentation' ||
    cutsceneId === 'league_championship'
      ? 0.36
      : 0;

  return (
    <div
      data-testid="unity-pbr-cutscene-stage"
      className="w-full h-full bg-[#070b19]"
    >
      <Canvas
        shadows
        camera={{ position: [-3.6, 1.85, 4.6], fov: 38 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#070b19']} />
        <StadiumPBRStage params={params} cutsceneId={cutsceneId} />
        <React.Suspense fallback={null}>
          {/* Primary Hero Player */}
          <ParametricFootballer
            params={params}
            cutsceneId={cutsceneId}
            positionOffset={[0, heroYOffset, 0]}
          />
          {/* Supporting Squad Teammates for Celebrations, Trophy Lifts & Tunnel Walkouts */}
          {isMultiActorScene && (
            <>
              <ParametricFootballer
                params={{
                  ...params,
                  skinColor: '#d8a07a',
                  shirtNumber: ((params.shirtNumber || 9) % 11) + 1,
                }}
                cutsceneId={cutsceneId}
                positionOffset={[-1.05, heroYOffset, -0.55]}
                rotationY={0.22}
                isSupportingActor
              />
              <ParametricFootballer
                params={{
                  ...params,
                  skinColor: '#52301c',
                  shirtNumber: ((params.shirtNumber || 9) % 10) + 4,
                }}
                cutsceneId={cutsceneId}
                positionOffset={[1.05, heroYOffset, -0.55]}
                rotationY={-0.22}
                isSupportingActor
              />
            </>
          )}
        </React.Suspense>
        <UnityCinematicCameraDirector cutsceneId={cutsceneId} />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/cutscenes/footballer_unveiling.glb');
