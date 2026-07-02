"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { MathUtils, type Group } from "three";

type ProductDisassemblyLabel = {
  title: string;
  text: string;
  at: number;
};

type ProductDisassemblyStageProps = {
  labels: ProductDisassemblyLabel[];
};

type StagePartProps = {
  children: ReactNode;
  progressRef: MutableRefObject<number>;
  base?: [number, number, number];
  target?: [number, number, number];
  baseRotation?: [number, number, number];
  targetRotation?: [number, number, number];
  delay?: number;
  range?: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const ease = (value: number) => value * value * (3 - 2 * value);
const progressInRange = (progress: number, delay: number, range: number) => ease(clamp((progress - delay) / range));

function StagePart({
  children,
  progressRef,
  base = [0, 0, 0],
  target = [0, 0, 0],
  baseRotation = [0, 0, 0],
  targetRotation = [0, 0, 0],
  delay = 0,
  range = 0.76,
}: StagePartProps) {
  const ref = useRef<Group | null>(null);

  useFrame(({ clock }) => {
    const part = ref.current;

    if (!part) {
      return;
    }

    const progress = progressInRange(progressRef.current, delay, range);
    const breath = Math.sin(clock.elapsedTime * 0.55) * 0.012;

    part.position.set(
      MathUtils.lerp(base[0], target[0], progress),
      MathUtils.lerp(base[1], target[1], progress) + breath * progress,
      MathUtils.lerp(base[2], target[2], progress),
    );
    part.rotation.set(
      MathUtils.lerp(baseRotation[0], targetRotation[0], progress),
      MathUtils.lerp(baseRotation[1], targetRotation[1], progress),
      MathUtils.lerp(baseRotation[2], targetRotation[2], progress),
    );
  });

  return <group ref={ref}>{children}</group>;
}

function DriverAssembly({
  y,
  radius,
  progressRef,
  delay,
}: {
  y: number;
  radius: number;
  progressRef: MutableRefObject<number>;
  delay: number;
}) {
  return (
    <StagePart
      base={[0, y, 0.52]}
      delay={delay}
      progressRef={progressRef}
      target={[-1.32, y + 0.06, 1.08]}
      targetRotation={[0.02, -0.22, -0.04]}
    >
      <mesh castShadow receiveShadow>
        <torusGeometry args={[radius, 0.022, 20, 72]} />
        <meshStandardMaterial color="#b78d54" metalness={0.72} roughness={0.23} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0.012]}>
        <cylinderGeometry args={[radius * 0.78, radius * 0.78, 0.048, 72]} />
        <meshStandardMaterial color="#050505" metalness={0.34} roughness={0.28} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.048]}>
        <sphereGeometry args={[radius * 0.3, 32, 16]} />
        <meshStandardMaterial color="#17130f" metalness={0.62} roughness={0.18} />
      </mesh>
    </StagePart>
  );
}

function SpeakerDisassemblyScene({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const { camera, size } = useThree();
  const isMobile = size.width < 700;
  const accentLines = useMemo<Array<[number, number, number, number, number, number]>>(
    () => [
      [-1.92, 0.74, 1.26, -0.9, 0.66, 0.82],
      [-1.86, -0.02, 1.2, -0.84, -0.02, 0.72],
      [-1.78, -0.76, 1.12, -0.8, -0.7, 0.68],
      [0.82, 0.94, -0.52, 1.42, 0.9, -0.86],
    ],
    [],
  );

  useEffect(() => {
    camera.position.set(0.05, isMobile ? 0.18 : 0.26, isMobile ? 8.8 : 7.15);
    camera.updateProjectionMatrix();
  }, [camera, isMobile]);

  return (
    <>
      <color attach="background" args={["#070604"]} />
      <fog attach="fog" args={["#070604", 6, 11]} />
      <ambientLight intensity={1.05} />
      <directionalLight color="#f9ead1" intensity={1.6} position={[0.3, 1.4, 4.8]} />
      <spotLight angle={0.42} castShadow color="#f3d49f" intensity={18.5} penumbra={0.78} position={[-2.8, 4.9, 5.4]} />
      <pointLight color="#9c6738" intensity={6.4} position={[2.8, 2.0, 3.2]} />
      <group position={[0.06, isMobile ? -0.08 : -0.02, 0]} rotation={[0.02, -0.12, 0]} scale={isMobile ? 0.68 : 0.9}>
        <StagePart
          delay={0.05}
          progressRef={progressRef}
          target={[0.78, 0.04, -0.32]}
          targetRotation={[0, -0.3, 0.02]}
        >
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.02, 2.64, 0.74]} />
            <meshStandardMaterial color="#845832" metalness={0.18} roughness={0.32} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.54, 0, 0]}>
            <boxGeometry args={[0.08, 2.62, 0.72]} />
            <meshStandardMaterial color="#b07a49" metalness={0.14} roughness={0.36} />
          </mesh>
        </StagePart>

        <StagePart
          base={[0, 0, 0.43]}
          delay={0.12}
          progressRef={progressRef}
          target={[-0.56, 0.02, 0.64]}
          targetRotation={[0, 0.18, 0.015]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 2.42, 0.08]} />
            <meshStandardMaterial color="#100d0a" metalness={0.42} roughness={0.28} />
          </mesh>
          <mesh position={[0, 1.02, 0.06]}>
            <boxGeometry args={[0.54, 0.32, 0.04]} />
            <meshStandardMaterial color="#17110c" metalness={0.48} roughness={0.24} />
          </mesh>
        </StagePart>

        <DriverAssembly delay={0.18} progressRef={progressRef} radius={0.2} y={0.55} />
        <DriverAssembly delay={0.24} progressRef={progressRef} radius={0.27} y={-0.1} />
        <DriverAssembly delay={0.3} progressRef={progressRef} radius={0.27} y={-0.78} />

        <StagePart
          base={[0, -1.62, 0.02]}
          delay={0.26}
          progressRef={progressRef}
          target={[0.24, -1.88, -0.04]}
          targetRotation={[0, -0.1, 0]}
        >
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.62, 32]} />
            <meshStandardMaterial color="#17110d" metalness={0.78} roughness={0.2} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.36, 0]}>
            <boxGeometry args={[0.96, 0.08, 0.62]} />
            <meshStandardMaterial color="#120d09" metalness={0.54} roughness={0.24} />
          </mesh>
        </StagePart>

        <StagePart
          base={[1.34, -0.72, -0.92]}
          delay={0.5}
          progressRef={progressRef}
          target={[1.58, -0.6, -0.62]}
          targetRotation={[0, -0.16, 0]}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.92, 0.28, 0.54]} />
            <meshStandardMaterial color="#1b1510" metalness={0.72} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.01, 0.29]}>
            <boxGeometry args={[0.78, 0.18, 0.035]} />
            <meshStandardMaterial color="#c29c66" metalness={0.68} roughness={0.2} />
          </mesh>
        </StagePart>

        {accentLines.map((line, index) => (
          <StagePart
            base={[0, 0, 0]}
            delay={0.34 + index * 0.04}
            key={line.join("-")}
            progressRef={progressRef}
            target={[0, 0, 0]}
          >
            <mesh position={[(line[0] + line[3]) / 2, (line[1] + line[4]) / 2, (line[2] + line[5]) / 2]} rotation={[0, 0, -0.03]}>
              <boxGeometry args={[Math.abs(line[3] - line[0]), 0.008, 0.008]} />
              <meshBasicMaterial color="#d5b274" transparent opacity={0.52} />
            </mesh>
          </StagePart>
        ))}
      </group>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.02, -0.2]}>
        <planeGeometry args={[8, 4.8]} />
        <meshStandardMaterial color="#090705" metalness={0.08} roughness={0.58} />
      </mesh>
    </>
  );
}

export function ProductDisassemblyStage({ labels }: ProductDisassemblyStageProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [activeLabel, setActiveLabel] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const orderedLabels = useMemo(() => [...labels].sort((first, second) => first.at - second.at), [labels]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => {
      const shouldReduce = mediaQuery.matches;
      setReducedMotion(shouldReduce);
      progressRef.current = shouldReduce ? 0.64 : progressRef.current;
    };

    syncReducedMotion();
    mediaQuery.addEventListener("change", syncReducedMotion);

    return () => mediaQuery.removeEventListener("change", syncReducedMotion);
  }, []);

  const updateFromScroll = useCallback(() => {
    rafRef.current = null;

    if (reducedMotion) {
      progressRef.current = 0.64;
      setActiveLabel(1);
      return;
    }

    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = Math.max(1, window.innerHeight);
    const holdTravel = Math.max(1, rect.height - viewportHeight);
    const progress = window.innerWidth > 900
      ? clamp(-rect.top / holdTravel)
      : clamp((viewportHeight * 0.58 - rect.top) / Math.max(1, rect.height * 0.72));

    progressRef.current = progress;

    let nextLabel = 0;
    for (let index = 0; index < orderedLabels.length; index += 1) {
      const label = orderedLabels[index];

      if (label && progress >= label.at) {
        nextLabel = index;
      }
    }

    setActiveLabel((currentLabel) => (currentLabel === nextLabel ? currentLabel : nextLabel));
  }, [orderedLabels, reducedMotion]);

  const requestScrollUpdate = useCallback(() => {
    if (rafRef.current !== null) {
      return;
    }

    rafRef.current = window.requestAnimationFrame(updateFromScroll);
  }, [updateFromScroll]);

  useEffect(() => {
    requestScrollUpdate();
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    window.addEventListener("scroll", requestScrollUpdate, { passive: true });

    return () => {
      window.removeEventListener("resize", requestScrollUpdate);
      window.removeEventListener("scroll", requestScrollUpdate);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [requestScrollUpdate]);

  return (
    <section className="product-disassembly-stage" ref={sectionRef}>
      <div className="product-disassembly-stage__sticky">
        <div className="product-disassembly-stage__canvas" data-reduced-motion={reducedMotion ? "true" : "false"}>
          <Canvas camera={{ fov: 42, position: [0.05, 0.26, 7.15] }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: false }}>
            <SpeakerDisassemblyScene progressRef={progressRef} />
          </Canvas>
        </div>
        <div className="product-disassembly-stage__shade" aria-hidden="true" />
        <div className="product-disassembly-stage__readout">
          <span>{String(activeLabel + 1).padStart(2, "0")}</span>
          <strong>{orderedLabels[activeLabel]?.title}</strong>
          <p>{orderedLabels[activeLabel]?.text}</p>
        </div>
        <ol className="product-disassembly-stage__steps" aria-label="Montelar product disassembly stages">
          {orderedLabels.map((label, index) => (
            <li className={index === activeLabel ? "is-active" : undefined} key={label.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{label.title}</strong>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
