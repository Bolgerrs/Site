"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

// Page background tone — the floor fogs into exactly this so the horizon dissolves
// (no gradient texture → no banding / stripes).
const PAGE_BG = "#0d0b09";

// Slow life: gentle drift + pointer parallax so the volume feels inhabited, never busy.
function Rig({ children }: { children: React.ReactNode }) {
  const ref = useRef<Group | null>(null);
  const { size } = useThree();
  const isMobile = size.width < 640;

  useFrame(({ clock, pointer }, delta) => {
    const group = ref.current;
    if (!group) return;
    const px = isMobile ? 0 : pointer.x;
    const py = isMobile ? 0 : pointer.y;
    group.rotation.y += (Math.sin(clock.elapsedTime * 0.12) * 0.05 + px * 0.05 - group.rotation.y) * Math.min(1, delta * 2.4);
    group.rotation.x += (py * -0.03 - group.rotation.x) * Math.min(1, delta * 2.4);
  });

  return <group ref={ref}>{children}</group>;
}

function Studio({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      {/* floor fades into the page colour at the horizon — seamless, no banner edge */}
      <fog attach="fog" args={[PAGE_BG, 4.5, 15]} />
      <ambientLight intensity={0.22} />

      {/* studio light lives in the environment map — it lights and reflects in the floor
          without ever appearing as a raw shape in frame */}
      <Environment resolution={isMobile ? 128 : 256}>
        <color attach="background" args={["#070504"]} />
        <Lightformer form="rect" intensity={2.6} color="#ffe6bd" position={[0, 6, -9]} scale={[14, 3.2, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#c8884a" position={[-7, 2, -1]} rotation-y={Math.PI / 2} scale={[12, 2.4, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#e7bd78" position={[7, 2, -1]} rotation-y={-Math.PI / 2} scale={[12, 2.4, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#f1cf90" position={[0, 3, -12]} scale={7} />
      </Environment>

      {/* glossy studio floor — soft blurred environment reflections give the real depth */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]}>
        <planeGeometry args={[90, 90]} />
        <MeshReflectorMaterial
          resolution={isMobile ? 256 : 512}
          blur={[450, 170]}
          mixBlur={1.1}
          mixStrength={22}
          roughness={0.84}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#0c0a07"
          metalness={0.68}
          mirror={0.45}
        />
      </mesh>
    </>
  );
}

export function DacSceneBackdrop({ onReady }: { onReady?: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(true);
  const [staticMode, setStaticMode] = useState(false);

  // tell the parent once at least one frame has been committed, so the whole scene
  // can be revealed as one unit (no separate backdrop pop)
  useEffect(() => {
    let r1 = 0;
    let r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => onReady?.());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [onReady]);

  // render a single static frame (no continuous GPU work) on touch/mobile — where the
  // pointer-parallax doesn't apply anyway — and whenever reduced-motion is requested
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (max-width: 768px)");
    const sync = () => setStaticMode(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // pause the render loop entirely when the scene is scrolled off-screen
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true), {
      rootMargin: "140px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const frameloop = staticMode ? "demand" : visible ? "always" : "never";

  return (
    <div className="dac-scene-backdrop" aria-hidden="true" ref={hostRef}>
      <Canvas
        frameloop={frameloop}
        dpr={[1, staticMode ? 1.5 : 2]}
        camera={{ position: [0, 0.55, 8], fov: 38 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearAlpha(0)}
        style={{ display: "block", height: "100%", width: "100%" }}
      >
        <BackdropContents />
      </Canvas>
    </div>
  );
}

// in static (demand) mode the loop is off — push a few renders after mount so the
// environment map and the floor reflection are fully resolved on the single frame
function WarmUp() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let n = 0;
    const tick = () => {
      invalidate();
      n += 1;
      if (n < 8) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);
  return null;
}

function BackdropContents() {
  const { size } = useThree();
  const isMobile = size.width < 640;
  return (
    <Rig>
      <Studio isMobile={isMobile} />
      <WarmUp />
    </Rig>
  );
}
