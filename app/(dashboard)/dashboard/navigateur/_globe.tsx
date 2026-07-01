"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef, useMemo, Suspense, Component } from "react";
import * as THREE from "three";

// ── Helpers ────────────────────────────────────────────────────────────────
function toXYZ(lat: number, lon: number, r = 2): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

const CITIES = [
  { lat: 48.8,  lon: 2.3   }, // Paris
  { lat: 40.7,  lon: -74   }, // New York
  { lat: 35.6,  lon: 139.6 }, // Tokyo
  { lat: 5.3,   lon: -4    }, // Abidjan
  { lat: -23.5, lon: -46.6 }, // São Paulo
  { lat: 51.5,  lon: -0.1  }, // London
  { lat: 1.3,   lon: 103.8 }, // Singapore
  { lat: 25.2,  lon: 55.3  }, // Dubai
  { lat: -33.8, lon: 151.2 }, // Sydney
  { lat: 52.5,  lon: 13.4  }, // Berlin
  { lat: 55.7,  lon: 37.6  }, // Moscow
  { lat: 19.4,  lon: -99.1 }, // Mexico City
];

const CONNECTIONS: [number, number][] = [
  [0,3],[3,1],[1,5],[5,7],[7,6],[6,8],[0,4],[2,6],[9,1],[3,7],[10,5],[11,1],[4,8],[0,7],
];

// ── Arc using THREE.Line primitive ──────────────────────────────────────────
function Arc({ a, b }: { a: number; b: number }) {
  const line = useMemo(() => {
    const p1  = toXYZ(CITIES[a].lat, CITIES[a].lon);
    const p2  = toXYZ(CITIES[b].lat, CITIES[b].lon);
    const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(3.1);
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    const pts   = curve.getPoints(60);
    const geo   = new THREE.BufferGeometry().setFromPoints(pts);
    const mat   = new THREE.LineBasicMaterial({ color: "#00D4FF", transparent: true, opacity: 0.7 });
    return new THREE.Line(geo, mat);
  }, [a, b]);

  return <primitive object={line} />;
}

// ── Globe inner ────────────────────────────────────────────────────────────
function Globe() {
  const groupRef  = useRef<THREE.Group>(null!);
  const orbit1Ref = useRef<THREE.Mesh>(null!);
  const orbit2Ref = useRef<THREE.Mesh>(null!);
  const atmosRef  = useRef<THREE.Mesh>(null!);
  const elapsed   = useRef(0);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (groupRef.current)  groupRef.current.rotation.y  += delta * 0.18;
    if (orbit1Ref.current) orbit1Ref.current.rotation.z += delta * 0.25;
    if (orbit2Ref.current) {
      orbit2Ref.current.rotation.z -= delta * 0.16;
      orbit2Ref.current.rotation.x += delta * 0.06;
    }
    if (atmosRef.current) {
      const mat = atmosRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.055 + Math.sin(elapsed.current * 1.3) * 0.025;
    }
  });

  const nodes = useMemo(() => CITIES.map(c => toXYZ(c.lat, c.lon, 2.06)), []);

  const ringDots = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => {
      const a = (i / 80) * Math.PI * 2;
      const r = 2.65;
      return new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 0.08, Math.sin(a) * r);
    }),
  []);

  return (
    <>
      {/* Pulsing atmosphere */}
      <mesh ref={atmosRef}>
        <sphereGeometry args={[2.42, 32, 32]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* Outer blue haze */}
      <mesh>
        <sphereGeometry args={[2.72, 32, 32]} />
        <meshBasicMaterial color="#0033ff" transparent opacity={0.022} side={THREE.BackSide} />
      </mesh>

      {/* Rotating globe group */}
      <group ref={groupRef}>
        {/* Core sphere */}
        <mesh>
          <sphereGeometry args={[2, 72, 72]} />
          <meshStandardMaterial color="#020218" metalness={0.95} roughness={0.05} emissive="#000c30" emissiveIntensity={1.5} />
        </mesh>

        {/* Equator */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.014, 0.008, 8, 256]} />
          <meshBasicMaterial color="#F5A623" />
        </mesh>

        {/* Latitude rings */}
        {[-60, -30, 30, 60].map((lat, i) => {
          const rr = Math.cos(lat * Math.PI / 180) * 2.014;
          const y  = Math.sin(lat * Math.PI / 180) * 2.014;
          return (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[rr, 0.0028, 8, 180]} />
              <meshBasicMaterial color="#F5A623" transparent opacity={0.38} />
            </mesh>
          );
        })}

        {/* Meridians */}
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, (i / 12) * Math.PI, 0]}>
            <torusGeometry args={[2.014, 0.0018, 8, 256]} />
            <meshBasicMaterial color="#F5A623" transparent opacity={0.18} />
          </mesh>
        ))}

        {/* Connection arcs */}
        {CONNECTIONS.map(([a, b], i) => <Arc key={i} a={a} b={b} />)}

        {/* City nodes */}
        {nodes.map((pos, i) => (
          <group key={i}>
            <mesh position={[pos.x, pos.y, pos.z]}>
              <sphereGeometry args={[0.046, 8, 8]} />
              <meshBasicMaterial color="#00FFFF" />
            </mesh>
            <mesh position={[pos.x, pos.y, pos.z]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshBasicMaterial color="#00FFFF" transparent opacity={0.14} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Orbital ring 1 — orange */}
      <mesh ref={orbit1Ref} rotation={[0.42, 0.18, 0.1]}>
        <torusGeometry args={[2.9, 0.007, 8, 256]} />
        <meshBasicMaterial color="#F5A623" transparent opacity={0.55} />
      </mesh>

      {/* Orbital ring 2 — cyan */}
      <mesh ref={orbit2Ref} rotation={[-0.52, 0.75, 0.28]}>
        <torusGeometry args={[3.28, 0.004, 8, 256]} />
        <meshBasicMaterial color="#00D4FF" transparent opacity={0.3} />
      </mesh>

      {/* Equatorial particle ring */}
      {ringDots.map((pos, i) => (
        <mesh key={i} position={[pos.x, pos.y, pos.z]}>
          <sphereGeometry args={[0.013, 4, 4]} />
          <meshBasicMaterial color="#F5A623" transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  );
}

// ── Error boundary (class component) ───────────────────────────────────────
type EBProps = { children: React.ReactNode };
type EBState = { err: boolean };
class GlobeBoundary extends Component<EBProps, EBState> {
  state: EBState = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? null : this.props.children; }
}

// ── Exported scene ─────────────────────────────────────────────────────────
type Props = { compact?: boolean };

export default function GlobeScene({ compact = false }: Props) {
  return (
    <GlobeBoundary>
      <Canvas
        camera={{ position: [0, compact ? 0.3 : 0.6, compact ? 5.5 : 5.8], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.15} color="#112244" />
        <pointLight position={[8, 8, 6]}   intensity={2.2} color="#ffffff" />
        <pointLight position={[-6, 4, -4]} intensity={1.3} color="#00D4FF" />
        <pointLight position={[0, -6, 4]}  intensity={0.9} color="#F5A623" />

        <Stars radius={120} depth={60} count={7000} factor={3} saturation={0} fade />

        <Suspense fallback={null}>
          <Globe />
        </Suspense>
      </Canvas>
    </GlobeBoundary>
  );
}
