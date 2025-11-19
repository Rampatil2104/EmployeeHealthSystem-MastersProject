import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Grid, Billboard, Text, Effects } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef, useState } from "react";

/**
 * True3DScatter (polished)
 * x = WorkLife (0..1), y = Stress (0..1), z = Sleep (0..1)
 * Color = Risk; Size = AvgSteps (fallback constant)
 */
export default function True3DScatter({ employee, cohort = [] }) {
  if (!employee || cohort.length === 0) {
    return (
      <div className="h-[300px] grid place-content-center text-gray-400">
        Select a row →
      </div>
    );
  }

  const scale = 8; // cube side length
  const to01 = (v, kind) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 0;
    if (kind === "sleep") return clamp01(n / 9);
    if (kind === "p") return clamp01(n > 1 ? n / 100 : n);
    if (n <= 1) return clamp01(n);
    if (n <= 5) return clamp01(n / 5);
    if (n <= 10) return clamp01(n / 10);
    return clamp01(n / 100);
  };
  const clamp01 = (v) => Math.max(0, Math.min(1, v ?? 0));

  const riskColor = (r) => (r === "High" ? "#ef4444" : r === "Medium" ? "#f59e0b" : "#22c55e");

  const toPoint = (row) => {
    const x = to01(row["WorkLifeBalance"] ?? row.WorkLifeBalance, "p");
    const y = to01(row["Stress Level"] ?? row.Stress, "p");
    const z = to01(row["Sleep Duration"] ?? row.SleepDuration, "sleep");
    const steps = Number(row.AvgSteps ?? row["Daily Steps"] ?? 6000);
    const r = 0.15 + Math.min(0.6, Math.max(0.05, steps / 20000) * 0.5);
    const risk = (row.RiskCategory2 || "").toString();
    return {
      id: row._id ?? row.EmployeeID,
      label: `${row.EmployeeID} • ${row.JobRole ?? ""}`.trim(),
      x: (x - 0.5) * scale,
      y: (y - 0.5) * scale,
      z: (z - 0.5) * scale,
      r,
      risk,
    };
  };

  const points = useMemo(() => cohort.map(toPoint), [cohort]);
  const me = useMemo(() => toPoint(employee), [employee]);

  return (
    <div className="relative h-[300px] rounded-md overflow-hidden bg-white dark:bg-slate-900 border dark:border-slate-700">
      <Canvas
        camera={{ position: [7, 6.5, 7.5], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ scene }) => {
          scene.fog = new THREE.Fog(0xf7f7fb, 12, 26); // subtle depth
          scene.background = new THREE.Color(0xfafafb);
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 10, 6]} intensity={0.9} castShadow />

        {/* Floor grid */}
        <Grid
          args={[scale * 1.3, scale * 1.3]}
          position={[0, -scale * 0.5, 0]}
          sectionSize={1}
          cellColor="#e2e8f0"
          sectionColor="#cbd5e1"
          infiniteGrid
          fadeDistance={20}
          fadeStrength={1}
        />

        {/* Axes with arrows + labels */}
        <Axes scale={scale} />

        {/* Cohort points */}
        <group>
          {points.map((p) => (
            <ShadedSphere key={p.id} p={p} color="#64748b" />
          ))}
        </group>

        {/* Selected person (glow + outline) */}
        <HighlightedSphere p={me} color={riskColor(me.risk)} />

        {/* Name tag above selected */}
        <Html
          position={[me.x, me.y + (me.r * 1.6), me.z]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div className="px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] whitespace-nowrap shadow">
            {me.label}
          </div>
        </Html>

        {/* Camera controls */}
        <OrbitControls
          enablePan
          minDistance={5}
          maxDistance={20}
          maxPolarAngle={Math.PI * 0.9}
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-xs text-slate-600 bg-white/80 dark:bg-slate-900/60 backdrop-blur rounded px-2 py-1 border border-slate-200 dark:border-slate-700">
        <Legend swatch="#22c55e" label="Low" />
        <Legend swatch="#f59e0b" label="Medium" />
        <Legend swatch="#ef4444" label="High" />
        <span className="ml-2 text-slate-500">Size ∝ AvgSteps</span>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

function Legend({ swatch, label }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: swatch }} />
      {label}
    </span>
  );
}

function Axes({ scale }) {
  const axisColor = "#94a3b8";
  const arrow = (pos, rot) => (
    <mesh position={pos} rotation={rot}>
      <cylinderGeometry args={[0.02, 0.02, scale, 8]} />
      <meshBasicMaterial color={axisColor} />
      {/* arrow head */}
      <mesh position={[0, scale / 2, 0]}>
        <coneGeometry args={[0.08, 0.24, 16]} />
        <meshBasicMaterial color={axisColor} />
      </mesh>
    </mesh>
  );

  return (
    <group>
      {/* Y (Stress ↑) */}
      {arrow([0, 0, 0], [0, 0, 0])}
      <Billboard position={[0, scale / 2 + 0.5, 0]}>
        <Text fontSize={0.35} color="#64748b">Stress</Text>
      </Billboard>

      {/* X (WorkLife →) */}
      <group rotation={[0, 0, Math.PI / 2]}>{arrow([0, 0, 0], [0, 0, 0])}</group>
      <Billboard position={[scale / 2 + 0.5, 0, 0]}>
        <Text fontSize={0.35} color="#64748b">WorkLife</Text>
      </Billboard>

      {/* Z (Sleep ↗) */}
      <group rotation={[0, -Math.PI / 2, 0]}>{arrow([0, 0, 0], [0, 0, 0])}</group>
      <Billboard position={[0, 0, scale / 2 + 0.5]}>
        <Text fontSize={0.35} color="#64748b">Sleep</Text>
      </Billboard>
    </group>
  );
}

function ShadedSphere({ p, color }) {
  // outline via second mesh slightly larger & transparent
  return (
    <group position={[p.x, p.y, p.z]}>
      <mesh>
        <sphereGeometry args={[p.r, 32, 32]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.4} envMapIntensity={0.7} />
      </mesh>
      <mesh>
        <sphereGeometry args={[p.r * 1.06, 32, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

function HighlightedSphere({ p, color }) {
  const ref = useRef();
  const [t] = useState(() => Math.random() * Math.PI * 2);
  useFrame((state) => {
    // soft pulsing
    const s = 1 + Math.sin(state.clock.elapsedTime + t) * 0.06;
    if (ref.current) ref.current.scale.setScalar(s);
  });

  return (
    <group position={[p.x, p.y, p.z]}>
      <mesh ref={ref}>
        <sphereGeometry args={[p.r * 1.15, 48, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          metalness={0.2}
          roughness={0.35}
        />
      </mesh>
      {/* subtle outer glow */}
      <mesh>
        <sphereGeometry args={[p.r * 1.35, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}
