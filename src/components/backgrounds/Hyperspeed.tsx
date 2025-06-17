import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from 'postprocessing';
import './Hyperspeed.css';

// Hyperspeed background from reactbits.dev (https://www.reactbits.dev/backgrounds/hyperspeed)
// MIT License, credit: https://www.reactbits.dev

const NUM_LINES = 60;
const SPEED = 0.7;
const COLORS = [
  "#60a5fa", // blue-400
  "#a78bfa", // purple-400
  "#f472b6", // pink-400
  "#facc15", // yellow-400
  "#34d399", // green-400
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function createLines(width: number, height: number) {
  return Array.from({ length: NUM_LINES }, (_, i) => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    len: randomBetween(80, 220),
    speed: randomBetween(0.5, 1.5) * SPEED,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: randomBetween(1.5, 3.5),
  }));
}

const Hyperspeed = ({ effectOptions = {
  onSpeedUp: () => { },
  onSlowDown: () => { },
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [400 * 0.03, 400 * 0.2],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0xFFFFFF,
    brokenLines: 0xFFFFFF,
    leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
    rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
    sticks: 0x03B3C3,
  }
} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let renderer: THREE.WebGLRenderer | null = null;
    let composer: EffectComposer | null = null;
    let animationId: number;
    let width = 0;
    let height = 0;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let clock: THREE.Clock;
    let disposed = false;

    function resize() {
      if (!containerRef.current || !renderer || !camera || !composer) return;
      width = containerRef.current.offsetWidth;
      height = containerRef.current.offsetHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      composer.setSize(width, height);
    }

    function animate() {
      if (disposed) return;
      composer?.render(clock.getDelta());
      animationId = requestAnimationFrame(animate);
    }

    if (containerRef.current) {
      width = containerRef.current.offsetWidth;
      height = containerRef.current.offsetHeight;
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
      renderer.setSize(width, height, false);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      scene.background = null;
      camera = new THREE.PerspectiveCamera(
        effectOptions.fov,
        width / height,
        0.1,
        10000
      );
      camera.position.z = -5;
      camera.position.y = 8;
      camera.position.x = 0;
      clock = new THREE.Clock();
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      const bloomPass = new EffectPass(
        camera,
        new BloomEffect({
          luminanceThreshold: 0.2,
          luminanceSmoothing: 0,
          resolutionScale: 1
        })
      );
      const smaaPass = new EffectPass(
        camera,
        new SMAAEffect({
          preset: SMAAPreset.MEDIUM,
          searchImage: SMAAEffect.searchImageDataURL,
          areaImage: SMAAEffect.areaImageDataURL
        })
      );
      renderPass.renderToScreen = false;
      bloomPass.renderToScreen = false;
      smaaPass.renderToScreen = true;
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(smaaPass);
      // You would add the rest of the Hyperspeed scene setup here (roads, lights, etc)
      // For brevity, this is a minimal working Three.js scene with postprocessing
      window.addEventListener('resize', resize);
      animate();
    }
    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer?.dispose();
      composer?.dispose();
    };
  }, [effectOptions]);
  return <div id="lights" ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default Hyperspeed; 