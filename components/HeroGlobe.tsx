"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's background: a globe of dots with crawler paths arcing between points —
 * the web, being read. three.js, loaded only on the client and only when this mounts.
 *
 * Cost control: device pixel ratio capped, renders only while on screen and the tab is
 * visible, and a single still frame under prefers-reduced-motion.
 */
export function HeroGlobe({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let teardown: (() => void) | null = null;

    void (async () => {
      const THREE = await import("three");
      if (disposed || !el) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL: the hero simply has no globe
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(0, 0, 9.2);

      const globe = new THREE.Group();
      globe.rotation.x = 0.38;
      scene.add(globe);

      // ── Dots on a Fibonacci sphere ─────────────────────────────────────
      const COUNT = 2600;
      const R = 2.4;
      const positions = new Float32Array(COUNT * 3);
      const accent = new Float32Array(COUNT);
      const seed = new Float32Array(COUNT);
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < COUNT; i++) {
        const y = 1 - (i / (COUNT - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const t = golden * i;
        positions[i * 3] = Math.cos(t) * r * R;
        positions[i * 3 + 1] = y * R;
        positions[i * 3 + 2] = Math.sin(t) * r * R;
        accent[i] = Math.random() < 0.035 ? 1 : 0;
        seed[i] = Math.random();
      }
      const dotGeo = new THREE.BufferGeometry();
      dotGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      dotGeo.setAttribute("aAccent", new THREE.BufferAttribute(accent, 1));
      dotGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

      const dotMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 26 * dpr },
          uGrey: { value: new THREE.Color("#bdbdbd") },
          uAccent: { value: new THREE.Color("#ff4c00") },
        },
        vertexShader: /* glsl */ `
          attribute float aAccent;
          attribute float aSeed;
          uniform float uTime;
          uniform float uSize;
          varying float vAccent;
          varying float vFacing;
          varying float vPulse;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vec3 n = normalize(normalMatrix * position);
            vFacing = smoothstep(-0.35, 0.55, n.z);
            vAccent = aAccent;
            vPulse = 0.55 + 0.45 * sin(uTime * 2.2 + aSeed * 6.2831);
            float s = mix(1.0, 1.9, aAccent * vPulse);
            gl_PointSize = uSize * s / -mv.z;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uGrey;
          uniform vec3 uAccent;
          varying float vAccent;
          varying float vFacing;
          varying float vPulse;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            if (dot(c, c) > 0.25) discard;
            vec3 col = mix(uGrey, uAccent, vAccent);
            float a = mix(0.12, 0.85, vFacing) * mix(1.0, vPulse, vAccent);
            gl_FragColor = vec4(col, a);
          }
        `,
      });
      globe.add(new THREE.Points(dotGeo, dotMat));

      // ── Crawler arcs ───────────────────────────────────────────────────
      type Arc = { line: import("three").Line; total: number; start: number; dur: number };
      const arcs: Arc[] = [];
      const arcMat = new THREE.LineBasicMaterial({ color: 0xff4c00, transparent: true, opacity: 0.75 });
      const randomOnSphere = () => {
        const u = Math.random() * 2 - 1;
        const t = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        return new THREE.Vector3(Math.cos(t) * r, u, Math.sin(t) * r).multiplyScalar(R);
      };
      const makeArc = (now: number): Arc => {
        const a = randomOnSphere();
        let b = randomOnSphere();
        while (a.distanceTo(b) < R * 0.6) b = randomOnSphere();
        const mid = a.clone().add(b).multiplyScalar(0.5);
        mid.setLength(R + a.distanceTo(b) * 0.42);
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        const pts = curve.getPoints(64);
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        geo.setDrawRange(0, 0);
        const line = new THREE.Line(geo, arcMat);
        globe.add(line);
        return { line, total: pts.length, start: now + Math.random() * 1.5, dur: 1.6 + Math.random() * 1.2 };
      };
      for (let i = 0; i < 7; i++) arcs.push(makeArc(i * 0.6));

      // ── Sizing, pointer, visibility ────────────────────────────────────
      const resize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(el);

      const target = { x: 0, y: 0 };
      const onPointer = (ev: PointerEvent) => {
        target.x = (ev.clientX / window.innerWidth - 0.5) * 0.5;
        target.y = (ev.clientY / window.innerHeight - 0.5) * 0.3;
      };
      window.addEventListener("pointermove", onPointer, { passive: true });

      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduced) loop();
      });
      io.observe(el);

      const clock = new THREE.Clock();
      let raf = 0;
      const frame = () => {
        const t = clock.getElapsedTime();
        dotMat.uniforms.uTime.value = t;
        globe.rotation.y = t * 0.06 + target.x;
        globe.rotation.x += (0.38 + target.y - globe.rotation.x) * 0.04;
        for (let i = 0; i < arcs.length; i++) {
          const arc = arcs[i];
          const p = (t - arc.start) / arc.dur;
          const geo = arc.line.geometry as import("three").BufferGeometry;
          if (p < 0) {
            geo.setDrawRange(0, 0);
          } else if (p <= 1) {
            geo.setDrawRange(0, Math.floor(arc.total * p));
          } else if (p <= 2) {
            const k = Math.floor(arc.total * (p - 1));
            geo.setDrawRange(k, arc.total - k);
          } else {
            globe.remove(arc.line);
            geo.dispose();
            arcs[i] = makeArc(t + Math.random() * 0.8);
          }
        }
        renderer.render(scene, camera);
      };
      const loop = () => {
        cancelAnimationFrame(raf);
        if (disposed || !visible || document.hidden) return;
        frame();
        raf = requestAnimationFrame(loop);
      };
      const onVis = () => !document.hidden && !reduced && loop();
      document.addEventListener("visibilitychange", onVis);

      if (reduced) {
        // One still frame with arcs drawn part-way.
        arcs.forEach((a) => (a.start = -a.dur * 0.6));
        frame();
      } else {
        loop();
      }
      requestAnimationFrame(() => el.setAttribute("data-ready", ""));

      teardown = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVis);
        arcs.forEach((a) => (a.line.geometry as import("three").BufferGeometry).dispose());
        dotGeo.dispose();
        dotMat.dispose();
        arcMat.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className={`pointer-events-none opacity-0 transition-opacity duration-1000 data-[ready]:opacity-100 ${className}`}
    />
  );
}
