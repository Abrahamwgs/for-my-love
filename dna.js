// ════════════════════════════════════════════════════════════════
//  Three.js — a slowly rotating DNA double helix, lit from within.
//  Uses MeshStandardMaterial (lighter shader than Physical) and
//  modest geometry counts so even integrated GPUs / mobile chips
//  compile and run it cleanly.
// ════════════════════════════════════════════════════════════════
import * as THREE from "three";

const canvas = document.getElementById("dna-canvas");
if (canvas) {
  requestAnimationFrame(() => requestAnimationFrame(() => initDNA(canvas)));
}

function initDNA(canvas) {
  let contextValid = true;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextValid = false;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    contextValid = true;
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true,
      powerPreference: "high-performance"
    });
  } catch (err) {
    console.warn("[dna] WebGL unavailable:", err);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 24);

  // ── Build helix ───────────────────────────────────────────────
  const dna = new THREE.Group();
  scene.add(dna);

  const turns        = 3;
  const pointsPerTurn = 14;
  const totalPoints  = turns * pointsPerTurn;
  const radius       = 2.0;
  const height       = 12;
  const dy           = height / totalPoints;

  const sphereGeo = new THREE.SphereGeometry(0.34, 16, 16);
  const rungGeo   = new THREE.CylinderGeometry(0.06, 0.06, 1, 8);

  const matA = new THREE.MeshStandardMaterial({
    color: 0xe8a4c9, metalness: 0.15, roughness: 0.35,
    emissive: 0x7a1e3d, emissiveIntensity: 0.7
  });
  const matB = new THREE.MeshStandardMaterial({
    color: 0xf3d27a, metalness: 0.20, roughness: 0.32,
    emissive: 0x7a5418, emissiveIntensity: 0.6
  });
  const matRung = new THREE.MeshBasicMaterial({
    color: 0xfde7ee, transparent: true, opacity: 0.65
  });

  const helixA = new THREE.Group();
  const helixB = new THREE.Group();

  for (let i = 0; i < totalPoints; i++) {
    const a = (i / pointsPerTurn) * Math.PI * 2;
    const y = -height / 2 + i * dy;

    const pa = new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
    const pb = new THREE.Vector3(Math.cos(a + Math.PI) * radius, y, Math.sin(a + Math.PI) * radius);

    const sa = new THREE.Mesh(sphereGeo, matA); sa.position.copy(pa); helixA.add(sa);
    const sb = new THREE.Mesh(sphereGeo, matB); sb.position.copy(pb); helixB.add(sb);

    if (i % 2 === 0) {
      const rung = new THREE.Mesh(rungGeo, matRung);
      const mid  = pa.clone().lerp(pb, 0.5);
      const dir  = pb.clone().sub(pa);
      rung.position.copy(mid);
      rung.scale.y = dir.length();
      rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      dna.add(rung);
    }
  }
  dna.add(helixA);
  dna.add(helixB);

  // Backbone tubes
  const curveA = new THREE.CatmullRomCurve3(
    Array.from({ length: totalPoints }, (_, i) => {
      const a = (i / pointsPerTurn) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, -height/2 + i*dy, Math.sin(a) * radius);
    })
  );
  const curveB = new THREE.CatmullRomCurve3(
    Array.from({ length: totalPoints }, (_, i) => {
      const a = (i / pointsPerTurn) * Math.PI * 2 + Math.PI;
      return new THREE.Vector3(Math.cos(a) * radius, -height/2 + i*dy, Math.sin(a) * radius);
    })
  );
  const tubeMatA = new THREE.MeshBasicMaterial({ color: 0xc4677d, transparent: true, opacity: 0.7 });
  const tubeMatB = new THREE.MeshBasicMaterial({ color: 0xe6a85c, transparent: true, opacity: 0.7 });
  dna.add(new THREE.Mesh(new THREE.TubeGeometry(curveA, 140, 0.06, 6, false), tubeMatA));
  dna.add(new THREE.Mesh(new THREE.TubeGeometry(curveB, 140, 0.06, 6, false), tubeMatB));

  // ── Particles (floating motes) ────────────────────────────────
  const pCount = 200;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 22;
    pPos[i*3+1] = (Math.random() - 0.5) * 22;
    pPos[i*3+2] = (Math.random() - 0.5) * 14;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xfde7ee, size: 0.06, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const motes = new THREE.Points(pGeo, pMat);
  scene.add(motes);

  // ── Lights ────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffd8e4, 0.9));
  const l1 = new THREE.PointLight(0xff7aa2, 110, 40, 2);
  l1.position.set(6, 4, 6); scene.add(l1);
  const l2 = new THREE.PointLight(0xf3d27a, 85,  40, 2);
  l2.position.set(-6, -4, 4); scene.add(l2);
  const l3 = new THREE.DirectionalLight(0xffffff, 0.4);
  l3.position.set(0, 0, 10); scene.add(l3);

  // ── Resize ────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth  || canvas.parentElement.clientWidth  || 1;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || 1;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 900 ? 28 : 24;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);

  // ── Mouse parallax ────────────────────────────────────────────
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ── Animate ───────────────────────────────────────────────────
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (!contextValid) return;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    dna.rotation.y = t * 0.25 + mouse.x * 0.4;
    dna.rotation.x = Math.sin(t * 0.15) * 0.08 + mouse.y * 0.18;
    dna.position.y = Math.sin(t * 0.4) * 0.25;

    motes.rotation.y = -t * 0.05;

    try {
      renderer.render(scene, camera);
    } catch (err) {
      contextValid = false;
      console.warn("[dna] render error, halting:", err);
    }
  }
  tick();
}
