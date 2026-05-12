// ════════════════════════════════════════════════════════════════
//  Three.js — a slowly rotating DNA double helix, lit from within.
//  Two strands of "nucleotides" (spheres) joined by hydrogen-bond
//  rungs (cylinders), built procedurally and gently floating.
// ════════════════════════════════════════════════════════════════
import * as THREE from "three";

const canvas = document.getElementById("dna-canvas");
if (canvas) {
  // Defer one frame so layout is finalized before reading clientWidth/Height.
  // This is critical because the DNA section sits below the fold; without
  // this wait, the canvas can briefly report 0×0 and the scene renders blank.
  requestAnimationFrame(() => requestAnimationFrame(() => initDNA(canvas)));
}

function initDNA(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
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

  const sphereGeo = new THREE.SphereGeometry(0.34, 28, 28);
  const rungGeo   = new THREE.CylinderGeometry(0.06, 0.06, 1, 12);

  const matA = new THREE.MeshPhysicalMaterial({
    color: 0xe8a4c9,
    metalness: 0.15, roughness: 0.30,
    clearcoat: 0.7, clearcoatRoughness: 0.25,
    emissive: 0x7a1e3d, emissiveIntensity: 0.7
  });
  const matB = new THREE.MeshPhysicalMaterial({
    color: 0xf3d27a,
    metalness: 0.20, roughness: 0.28,
    clearcoat: 0.7, clearcoatRoughness: 0.25,
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

    const sa = new THREE.Mesh(sphereGeo, matA);
    sa.position.copy(pa);
    helixA.add(sa);

    const sb = new THREE.Mesh(sphereGeo, matB);
    sb.position.copy(pb);
    helixB.add(sb);

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

  // Backbone tubes for cohesion
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
  dna.add(new THREE.Mesh(new THREE.TubeGeometry(curveA, 240, 0.06, 10, false), tubeMatA));
  dna.add(new THREE.Mesh(new THREE.TubeGeometry(curveB, 240, 0.06, 10, false), tubeMatB));

  // ── Particles (floating motes) ────────────────────────────────
  const pCount = 280;
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

  // ── Lights — brighter so the helix glows clearly ──────────────
  scene.add(new THREE.AmbientLight(0xffd8e4, 0.9));
  const l1 = new THREE.PointLight(0xff7aa2, 120, 40, 2);
  l1.position.set(6, 4, 6); scene.add(l1);
  const l2 = new THREE.PointLight(0xf3d27a, 90, 40, 2);
  l2.position.set(-6, -4, 4); scene.add(l2);
  const l3 = new THREE.DirectionalLight(0xffffff, 0.45);
  l3.position.set(0, 0, 10); scene.add(l3);

  // ── Resize — uses ResizeObserver so we catch layout changes ───
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
  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas);
  }

  // ── Mouse parallax ────────────────────────────────────────────
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ── Animate ───────────────────────────────────────────────────
  const clock = new THREE.Clock();
  function tick() {
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    dna.rotation.y = t * 0.25 + mouse.x * 0.4;
    dna.rotation.x = Math.sin(t * 0.15) * 0.08 + mouse.y * 0.18;
    dna.position.y = Math.sin(t * 0.4) * 0.25;

    motes.rotation.y = -t * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
