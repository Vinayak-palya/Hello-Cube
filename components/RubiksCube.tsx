import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";



// ---- constants -----------------------------------------------------------

const stickerColors = ["white", "red", "orange", "blue", "green", "yellow"];
const faceColorMap: Record<string, string> = {
  "1,0,0": "red",
  "-1,0,0": "orange",
  "0,1,0": "white",
  "0,-1,0": "yellow",
  "0,0,1": "green",
  "0,0,-1": "blue",
};

// ---- component -----------------------------------------------------------

const RubiksCube = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>("red");
  const colorRef = useRef(selectedColor);
  const [solution, setSolution] = useState("");

  // keep ref up to date
  useEffect(() => {
    colorRef.current = selectedColor;
  }, [selectedColor]);

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    frameId: number;
    cubies: THREE.Mesh[];
    stickers: THREE.Mesh[];
  } | null>(null);

  useEffect(() => {
    if (sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f0f10");
    // scene.background = new THREE.Color("#073e79");
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
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

    const cubies: THREE.Mesh[] = [];
    const stickers: THREE.Mesh[] = [];
    const spacing = 1;

    const createSticker = (n: THREE.Vector3, cubie: THREE.Mesh) => {
      const color = faceColorMap[`${n.x},${n.y},${n.z}`] ?? "gray";
      const geo = new THREE.PlaneGeometry(0.9, 0.9);
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.2,
        side: THREE.DoubleSide,
      });
      const s = new THREE.Mesh(geo, mat);
      s.position.copy(n.clone().multiplyScalar(0.51));
      s.lookAt(n);
      cubie.add(s);
      s.userData = { color };
      stickers.push(s);
    };

    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const geo = new THREE.BoxGeometry(1, 1, 1);
          const mats = Array.from(
            { length: 6 },
            () => new THREE.MeshBasicMaterial({ color: 0x000000 })
          );
          const c = new THREE.Mesh(geo, mats);
          c.position.set(x * spacing, y * spacing, z * spacing);
          if (x === 1) createSticker(new THREE.Vector3(1, 0, 0), c);
          if (x === -1) createSticker(new THREE.Vector3(-1, 0, 0), c);
          if (y === 1) createSticker(new THREE.Vector3(0, 1, 0), c);
          if (y === -1) createSticker(new THREE.Vector3(0, -1, 0), c);
          if (z === 1) createSticker(new THREE.Vector3(0, 0, 1), c);
          if (z === -1) createSticker(new THREE.Vector3(0, 0, -1), c);
          scene.add(c);
          cubies.push(c);
        }

    let isAnimating = false;
    const snapCubie = (cubie: THREE.Mesh, spacing = 1, eps = 1e-4) => {
      ["x", "y", "z"].forEach((k) => {
        const axis = k as "x" | "y" | "z";
        const v = cubie.position[axis] / spacing;
        cubie.position[axis] = Math.round(v) * spacing;
      });
      const e = new THREE.Euler().setFromQuaternion(cubie.quaternion, "XYZ");
      ["x", "y", "z"].forEach((k) => {
        const axis = k as "x" | "y" | "z";
        const q = Math.round(e[axis] / (Math.PI / 2));
        e[axis] = q * (Math.PI / 2);
        if (Math.abs(e[axis]) < eps) e[axis] = 0;
      });
      cubie.quaternion.setFromEuler(e);
    };
    const rotateLayer = (
      axis: "x" | "y" | "z",
      index: number,
      clockwise = true,
      duration = 200
    ) => {
      if (isAnimating) return;
      isAnimating = true;

      const layer = cubies.filter(
        (c) => Math.round(c.position[axis]) === index
      );

      const pivot = new THREE.Group();
      layer.forEach((c) => pivot.attach(c));
      scene.add(pivot);

      const targetAngle = ((clockwise ? -1 : 1) * Math.PI) / 2;
      const start = performance.now();

      const turn = (t: number) => {
        const p = Math.min((t - start) / duration, 1);
        pivot.rotation[axis] = targetAngle * p;

        if (p < 1) {
          requestAnimationFrame(turn);
        } else {
          layer.forEach((c) => {
            scene.attach(c);
            snapCubie(c, spacing);
          });

          scene.remove(pivot);
          isAnimating = false;
        }
      };

      requestAnimationFrame(turn);
    };

    const keyHandler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ccw = e.shiftKey;
      if (k === "r") rotateLayer("x", 1, !ccw);
      if (k === "l") rotateLayer("x", -1, !ccw);
      if (k === "u") rotateLayer("y", 1, !ccw);
      if (k === "d") rotateLayer("y", -1, !ccw);
      if (k === "f") rotateLayer("z", 1, !ccw);
      if (k === "b") rotateLayer("z", -1, !ccw);
    };
    window.addEventListener("keydown", keyHandler);

    const ray = new THREE.Raycaster();
    const m = new THREE.Vector2();
    const clickHandler = (ev: MouseEvent) => {
      if (!mountRef.current) return;
      const r = mountRef.current.getBoundingClientRect();
      m.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      m.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(m, camera);
      const hit = ray.intersectObjects(stickers, false)[0];
      if (hit) {
        const s = hit.object as THREE.Mesh;
        const newColor = colorRef.current;
        (s.material as THREE.MeshStandardMaterial).color.set(newColor);
        s.userData.color = newColor;
      }
    };
    window.addEventListener("click", clickHandler);

    const resize = () => {
      if (!mountRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);

    let frameId = 0;
    const loop = () => {
      frameId = requestAnimationFrame(loop);
      renderer.render(scene, camera);
    };
    loop();

    sceneRef.current = { renderer, frameId, cubies, stickers };

    return () => {
      if (!sceneRef.current) return;
      cancelAnimationFrame(sceneRef.current.frameId);
      sceneRef.current.renderer.dispose();
      window.removeEventListener("resize", resize);
      window.removeEventListener("click", clickHandler);
      window.removeEventListener("keydown", keyHandler);
      if (mountRef.current?.contains(sceneRef.current.renderer.domElement))
        mountRef.current.removeChild(sceneRef.current.renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-[86vh] flex flex-col items-center bg-[#0f0f10]">
      <h1 className="text-4xl font-bold text-white mt-8 mb-2 text-center">
        Set Your Custom{" "}
        <span className="text-[#00ffcc]">
          <Typewriter
            words={["Cube", "State", "Colors"]}
            loop={true}
            cursor
            cursorStyle="|"
            typeSpeed={70}
            deleteSpeed={40}
            delaySpeed={1800}
          />
        </span>
      </h1>
      <div ref={mountRef} className="w-full h-[80%]" />
      <div className="flex gap-4 my-4 ">
        {stickerColors.map((color) => (
          <motion.button
            key={color}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedColor(color)}
            className={`w-10 h-10 rounded-full border-4 ${
              selectedColor === color ? "border-white" : "border-transparent"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

    </div>
  );
};

export default RubiksCube;
