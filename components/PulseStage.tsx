"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * PulseStage: 3D Oscilloscope Heartbeat & Global Probe Radar Stage.
 * Synchronized with document scroll and responsive to active ambient theme.
 */
export default function PulseStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x05070a, 6, 60);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 15);

    // 1. Oscilloscope Sinusoidal Wave Ribbon
    const waveSegments = 160;
    const waveGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(waveSegments * 3);
    const colors = new Float32Array(waveSegments * 3);

    for (let i = 0; i < waveSegments; i++) {
      const u = (i / (waveSegments - 1)) * 2 - 1; // -1 to +1
      positions[i * 3] = u * 16;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Color gradient from emerald to cyan
      colors[i * 3] = 0.1 + Math.abs(u) * 0.1;
      colors[i * 3 + 1] = 0.85;
      colors[i * 3 + 2] = 0.6 + Math.abs(u) * 0.3;
    }

    waveGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    waveGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const waveMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 2,
      transparent: true,
      opacity: 0.55,
    });
    const waveLine = new THREE.Line(waveGeo, waveMat);
    scene.add(waveLine);

    // 2. Global Edge Probe Radar Rings
    const radarGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(3.5, 3.55, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.3;
    radarGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(5.2, 5.25, 48), ringMat);
    ring2.rotation.x = Math.PI / 2.3;
    radarGroup.add(ring2);

    // Probe Nodes orbiting on the ring
    const probeCount = 5;
    const probeNodes: THREE.Mesh[] = [];
    const nodeGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

    for (let i = 0; i < probeCount; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      radarGroup.add(node);
      probeNodes.push(node);
    }
    radarGroup.position.set(0, -3.5, -4);
    scene.add(radarGroup);

    // 3. Ambient Floating Zen Dust
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPos[i] = (Math.random() - 0.5) * 30;
      dustPos[i + 1] = (Math.random() - 0.5) * 16;
      dustPos[i + 2] = -Math.random() * 45;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.08,
      transparent: true,
      opacity: 0.45,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Dynamic Camera Tracking & Scroll Lerp
    let targetZ = 15;
    let targetY = 0;
    let mouseX = 0;

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      targetZ = 15 - progress * 24;
      targetY = -progress * 3.5;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const handlePointerMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    };
    window.addEventListener("mousemove", handlePointerMove, { passive: true });

    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Camera lerp
      camera.position.z += (targetZ - camera.position.z) * 0.06;
      camera.position.y += (targetY - camera.position.y) * 0.06;
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.05;
      camera.lookAt(0, camera.position.y - 0.3, camera.position.z - 12);

      // Oscilloscope waveform harmonic pulse
      const posAttr = waveGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < waveSegments; i++) {
        const u = (i / (waveSegments - 1)) * 2 - 1;
        // Superposition of fundamental and higher harmonics + heartbeat beat pulse
        const freq1 = Math.sin(u * 5 + elapsed * 3.2);
        const freq2 = Math.cos(u * 12 - elapsed * 4.5) * 0.35;
        const envelope = Math.exp(-Math.pow(u * 2, 2)); // center peak envelope
        posArray[i * 3 + 1] = (freq1 + freq2) * envelope * 1.6;
      }
      posAttr.needsUpdate = true;

      // Orbit radar nodes
      probeNodes.forEach((node, idx) => {
        const angle = elapsed * 0.4 + (idx * Math.PI * 2) / probeCount;
        const radius = 3.5;
        node.position.set(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * Math.cos(Math.PI / 2.3),
          Math.sin(angle) * radius * Math.sin(Math.PI / 2.3)
        );
      });

      // Subtle rotation on radar rings
      ring1.rotation.z = elapsed * 0.1;
      ring2.rotation.z = -elapsed * 0.08;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      waveGeo.dispose();
      waveMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
      aria-hidden="true"
    />
  );
}
