"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ModelCube = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    frameId: number;
  } | null>(null);

  const [isScrambling, setIsScrambling] = useState(false);

  const rotateLayerRef = useRef<
    (axis: "x" | "y" | "z", idx: number, cw: boolean, dur?: number) => void
  >(() => {});

  const runScramble = useCallback(() => {
    if (isScrambling) return;          // guard re-entry
    setIsScrambling(true);

    // list of six face options
    const moves: ["x" | "y" | "z", 1 | -1][] = [
      ["x", 1],
      ["x", -1],
      ["y", 1],
      ["y", -1],
      ["z", 1],
      ["z", -1],
    ];

    const seq = Array.from({ length: 25 }, () => {
      const [axis, idx] = moves[Math.floor(Math.random() * moves.length)];
      const cw = Math.random() < 0.5;
      return { axis, idx, cw };
    });

    seq.forEach(({ axis, idx, cw }, i) => {
      setTimeout(
        () => rotateLayerRef.current(axis, idx, cw, 150),
        i * 200
      );
    });

    // re-enable button after animation finishes
    setTimeout(() => setIsScrambling(false), seq.length * 200 + 150);
  }, [isScrambling]);

  useEffect(() => {
    if (sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f0f10");
    scene.add(new THREE.AmbientLight(0xffffff, 2));
    const dirLight = new THREE.DirectionalLight(0xffffff, 4);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(5, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    if (mountRef.current) {
      const { clientWidth, clientHeight } = mountRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      mountRef.current.appendChild(renderer.domElement);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    const faceColorMap: Record<string, string> = {
      "1,0,0": "red",
      "-1,0,0": "orange",
      "0,1,0": "white",
      "0,-1,0": "yellow",
      "0,0,1": "green",
      "0,0,-1": "blue",
    };

    const cubies: THREE.Mesh[] = [];
    const createSticker = (dir: THREE.Vector3, c: THREE.Mesh) => {
      const col = faceColorMap[`${dir.x},${dir.y},${dir.z}`];
      const geo = new THREE.PlaneGeometry(0.9, 0.9);
      const mat = new THREE.MeshStandardMaterial({ color: col, side: THREE.DoubleSide });
      const s = new THREE.Mesh(geo, mat);
      s.position.copy(dir.clone().multiplyScalar(0.51));
      s.lookAt(dir);
      c.add(s);
    };

    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const cubie = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            Array(6).fill(0).map(() => new THREE.MeshBasicMaterial({ color: 0x000000 }))
          );
          cubie.position.set(x, y, z);

          if (x === 1) createSticker(new THREE.Vector3(1, 0, 0), cubie);
          if (x === -1) createSticker(new THREE.Vector3(-1, 0, 0), cubie);
          if (y === 1) createSticker(new THREE.Vector3(0, 1, 0), cubie);
          if (y === -1) createSticker(new THREE.Vector3(0, -1, 0), cubie);
          if (z === 1) createSticker(new THREE.Vector3(0, 0, 1), cubie);
          if (z === -1) createSticker(new THREE.Vector3(0, 0, -1), cubie);

          scene.add(cubie);
          cubies.push(cubie);
        }

    // rotation helpers
    let isAnimating = false;
    const snap = (m: THREE.Mesh) => {
      ["x", "y", "z"].forEach((a) => {
        const axis = a as "x" | "y" | "z";
        m.position[axis] = Math.round(m.position[axis]);
      });
      const e = new THREE.Euler().setFromQuaternion(m.quaternion, "XYZ");
      ["x", "y", "z"].forEach((a) => {
        const axis = a as "x" | "y" | "z";
        e[axis] = Math.round(e[axis] / (Math.PI / 2)) * (Math.PI / 2);
      });
      m.quaternion.setFromEuler(e);
    };

    const rotateLayer = (
      axis: "x" | "y" | "z",
      idx: number,
      cw: boolean,
      dur = 150
    ) => {
      if (isAnimating) return;
      isAnimating = true;

      const layer = cubies.filter((c) => Math.round(c.position[axis]) === idx);
      const pivot = new THREE.Group();
      layer.forEach((c) => pivot.attach(c));
      scene.add(pivot);

      const target = (cw ? -1 : 1) * Math.PI / 2;
      const start = performance.now();
      const turn = (t: number) => {
        const p = Math.min((t - start) / dur, 1);
        pivot.rotation[axis] = target * p;
        if (p < 1) requestAnimationFrame(turn);
        else {
          layer.forEach((c) => {
            scene.attach(c);
            snap(c);
          });
          scene.remove(pivot);
          isAnimating = false;
        }
      };
      requestAnimationFrame(turn);
    };
    rotateLayerRef.current = rotateLayer;

    // resize
    window.addEventListener("resize", () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    });

    // render loop
    let frameId: number;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(loop);
      sceneRef.current = { renderer, frameId };
    };
    loop();

    // cleanup
    return () => {
      cancelAnimationFrame(sceneRef.current!.frameId);
      renderer.dispose();
      window.removeEventListener("resize", () => {});
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
            {/* Scramble button */}
      <button
        onClick={runScramble}
        disabled={isScrambling}
        className="absolute top-4 right-4 text-blue-900 z-10 px-4 py-2 text-md uppercase rounded-lg border border-teal-300
                   bg-white backdrop-blur-md hover:bg-white/2 hover:text-white hover:cursor-pointer"
      >
        {isScrambling ? "Scrambling…" : "Scramble"}
      </button>
    </div>
  );
};

export default ModelCube;
