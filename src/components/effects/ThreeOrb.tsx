'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export default function ThreeOrb() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Crystal/Icosahedron sphere
    const geometry = new THREE.IcosahedronGeometry(1.4, 1);
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#7C3AED'),
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.6,
      thickness: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1,
      wireframe: false,
      transparent: true,
      opacity: 0.7,
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Wireframe overlay
    const wireGeometry = new THREE.IcosahedronGeometry(1.45, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#a78bfa'),
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // Particle cloud
    const particleCount = 80;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.8 + Math.random() * 0.8;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color('#c4b5fd'),
      size: 0.03,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x7c3aed, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xa78bfa, 2, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x818cf8, 1.5, 10);
    pointLight2.position.set(-3, -1, 2);
    scene.add(pointLight2);

    // Inner glow
    const glowGeometry = new THREE.SphereGeometry(1.6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#7c3aed'),
      transparent: true,
      opacity: 0.05,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Animation loop
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow auto-rotation
      sphere.rotation.y = elapsed * 0.15;
      sphere.rotation.x = Math.sin(elapsed * 0.1) * 0.1;
      wireframe.rotation.y = elapsed * 0.12;
      wireframe.rotation.x = Math.sin(elapsed * 0.08) * 0.15;
      particles.rotation.y = elapsed * 0.05;
      particles.rotation.x = elapsed * 0.03;

      // Mouse parallax (subtle tilt)
      const targetX = mouseRef.current.y * 0.3;
      const targetY = mouseRef.current.x * 0.3;
      sphere.rotation.x += (targetX - sphere.rotation.x) * 0.02;
      wireframe.rotation.x += (targetX - wireframe.rotation.x) * 0.015;
      wireframe.rotation.y += (targetY - wireframe.rotation.y) * 0.015;

      // Breathing glow
      glow.scale.setScalar(1 + Math.sin(elapsed * 0.5) * 0.05);
      (glowMaterial as THREE.MeshBasicMaterial).opacity = 0.04 + Math.sin(elapsed * 0.8) * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none opacity-80"
      style={{ willChange: 'transform' }}
    />
  );
}
