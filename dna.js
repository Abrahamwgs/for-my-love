// ════════════════════════════════════════════════════════════════
//  Three.js — anatomically-shaped DNA double helix.
//
//  Real B-DNA parameters used here:
//    • 10 base pairs per turn
//    • Two strands offset 135° (not 180°) — creates the major /
//      minor grooves that make DNA look like DNA.
//    • Phosphate "knobs" on each backbone position
//    • Base pairs rendered as two half-cylinders meeting in the
//      middle, coloured like A-T / G-C alternation.
// ════════════════════════════════════════════════════════════════
import * as THREE from "three";

const canvas = document.getElementById("dna-canvas");
if (canvas) {
  requestAnimationFrame(() => requestAnimationFrame(() => initDNA(canvas)));
}

function initDNA(canvas) {
  let contextValid = true;
  let stopped      = false;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextValid = false;
    stopped = true;
  });

  let renderer;
  try {
    const Renderer = THREE.WebGL1Renderer || THREE.WebGLRenderer;
    renderer = new Renderer({
      canvas, antialias: true, alpha: true,
      powerPreference: "default"
    });
  } catch (err) {
    console.warn("[dna] WebGL unavailable; using SVG fallback.", err);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 26);

  // ── Helix parameters (B-DNA-like) ─────────────────────────────
  const dna = new THREE.Group();
  scene.add(dna);

  const turns         = 4;
  const bpPerTurn     = 10;
  const totalBp       = turns * bpPerTurn;        // 40 base pairs
  const radius        = 2.0;
  const rise          = 0.42;                     // height per bp
  const height        = totalBp * rise;
  const grooveOffset  = Math.PI * (135 / 180);    // 135° → asymmetric grooves
  const baseTilt      = 0.18;                     // radians, slight bp tilt

  // ── Geometry — re-used across instances ───────────────────────
  const phosGeo  = new THREE.SphereGeometry(0.36, 14, 14);   // backbone "phosphate" knob
  const halfRung = new THREE.CylinderGeometry(0.10, 0.10, 1, 8);  // half base pair

  // ── Materials ─────────────────────────────────────────────────
  const matStrandA = new THREE.MeshLambertMaterial({
    color: 0xe8a4c9, emissive: 0x5a1530
  });
  const matStrandB = new THREE.MeshLambertMaterial({
    color: 0xf3d27a, emissive: 0x6a4514
  });

  // Base-pair colours — A-T vs G-C alternation, romantic palette
  const matAT_a = new THREE.MeshLambertMaterial({ color: 0xff7aa2, emissive: 0x6a0a25 });
  const matAT_b = new THREE.MeshLambertMaterial({ color: 0xf3d27a, emissive: 0x6a4514 });
  const matGC_a = new THREE.MeshLambertMaterial({ color: 0xfde7ee, emissive: 0x3a1525 });
  const matGC_b = new THREE.MeshLambertMaterial({ color: 0xe6a85c, emissive: 0x4a2a08 });

  // ── Build base pairs + phosphate knobs ────────────────────────
  const upAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < totalBp; i++) {
    const angle = (i / bpPerTurn) * Math.PI * 2;
    const y     = -height / 2 + i * rise;

    const pa = new THREE.Vector3(Math.cos(angle)               * radius, y, Math.sin(angle)               * radius);
    const pb = new THREE.Vector3(Math.cos(angle + grooveOffset) * radius, y, Math.sin(angle + grooveOffset) * radius);

    // Phosphate knobs on each backbone
    const knobA = new THREE.Mesh(phosGeo, matStrandA);
    knobA.position.copy(pa);
    dna.add(knobA);

    const knobB = new THREE.Mesh(phosGeo, matStrandB);
    knobB.position.copy(pb);
    dna.add(knobB);

    // Base pair: two half-cylinders meeting in the middle.
    // Alternates A-T / G-C colour pairs every base.
    const isAT = (i % 2) === 0;
    const matLeft  = isAT ? matAT_a : matGC_a;
    const matRight = isAT ? matAT_b : matGC_b;

    const mid    = pa.clone().lerp(pb, 0.5);
    const dir    = pb.clone().sub(pa);
    const dirLen = dir.length();
    const q      = new THREE.Quaternion().setFromUnitVectors(upAxis, dir.clone().normalize());

    // Slight bp tilt — multiply by a small rotation around X for realism
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), baseTilt);
    q.multiply(tilt);

    const halfA = new THREE.Mesh(halfRung, matLeft);
    halfA.position.copy(pa.clone().lerp(mid, 0.5));
    halfA.scale.y = dirLen * 0.5;
    halfA.quaternion.copy(q);
    dna.add(halfA);

    const halfB = new THREE.Mesh(halfRung, matRight);
    halfB.position.copy(mid.clone().lerp(pb, 0.5));
    halfB.scale.y = dirLen * 0.5;
    halfB.quaternion.copy(q);
    dna.add(halfB);
  }

  // ── Phosphate-sugar backbone — continuous ribbons ─────────────
  function strandPoints(phase) {
    const pts = [];
    const samples = totalBp * 4;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const angle = t * turns * Math.PI * 2 + phase;
      const y     = -height / 2 + t * height;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }
    return pts;
  }
  const curveA = new THREE.CatmullRomCurve3(strandPoints(0));
  const curveB = new THREE.CatmullRomCurve3(strandPoints(grooveOffset));

  const tubeMatA = new THREE.MeshLambertMaterial({
    color: 0xc4677d, emissive: 0x3a0a1f
  });
  const tubeMatB = new THREE.MeshLambertMaterial({
    color: 0xe6a85c, emissive: 0x3a2a08
  });
  dna.add(new THREE.Mesh(new THREE.TubeGeometry(curveA, 240, 0.13, 10, false), tubeMatA));
  dna.add(new THREE.Mesh(new THREE.TubeGeometry(curveB, 240, 0.13, 10, false), tubeMatB));

  // ── Floating motes for atmosphere ─────────────────────────────
  const pCount = 160;
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i*3]   = (Math.random() - 0.5) * 24;
    pPos[i*3+1] = (Math.random() - 0.5) * 24;
    pPos[i*3+2] = (Math.random() - 0.5) * 16;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xfde7ee, size: 0.05, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const motes = new THREE.Points(pGeo, pMat);
  scene.add(motes);

  // ── Lighting — dramatic rim + warm key ────────────────────────
  scene.add(new THREE.AmbientLight(0xffd8e4, 0.55));

  const key  = new THREE.PointLight(0xff7aa2, 1.8, 50);
  key.position.set(8, 6, 10); scene.add(key);

  const rim  = new THREE.PointLight(0xf3d27a, 1.4, 50);
  rim.position.set(-9, -4, -6); scene.add(rim);

  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(0, 0, 12); scene.add(fill);

  const top  = new THREE.DirectionalLight(0xfde7ee, 0.30);
  top.position.set(0, 10, 0); scene.add(top);

  // ── Resize ────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth  || canvas.parentElement.clientWidth  || 1;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || 1;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 900 ? 30 : 26;
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

  // ── Render loop with health monitor ───────────────────────────
  const gl    = renderer.getContext();
  const clock = new THREE.Clock();
  let goodFrames = 0;
  let badFrames  = 0;

  function tick() {
    if (stopped) return;
    requestAnimationFrame(tick);
    if (!contextValid) return;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;

    dna.rotation.y = t * 0.22 + mouse.x * 0.35;
    dna.rotation.x = Math.sin(t * 0.15) * 0.06 + mouse.y * 0.15;
    dna.position.y = Math.sin(t * 0.4) * 0.2;
    motes.rotation.y = -t * 0.04;

    try {
      renderer.render(scene, camera);
    } catch (err) {
      bail("render exception", err);
      return;
    }

    const e = gl.getError();
    if (e !== gl.NO_ERROR) {
      badFrames++;
      if (badFrames > 3) { bail("repeated WebGL errors: 0x" + e.toString(16)); return; }
    } else {
      badFrames = 0;
      goodFrames++;
      if (goodFrames === 2) canvas.classList.add("is-rendered");
    }
  }
  tick();

  function bail(reason, err) {
    stopped = true;
    canvas.classList.remove("is-rendered");
    console.info("[dna] falling back to SVG (" + reason + ")", err || "");
    try { renderer.dispose(); } catch (_) {}
  }
}
