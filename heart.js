// ════════════════════════════════════════════════════════════════
//  Three.js — a soft, glowing, beating heart that follows the cursor.
//
//  Compatibility notes (the painful kind):
//   • Pinned to three@0.149 so we can use WebGL1Renderer (GLSL ES 1.00).
//     Integrated GPUs / Linux drivers often fail to link GLSL ES 3.00
//     programs, causing CONTEXT_LOST and shader-error spam.
//   • Material is MeshLambertMaterial — simplest lit material in three.
//   • If WebGL still misbehaves, the SVG fallback (in HTML) stays visible
//     because we only fade the canvas in *after* a clean first render.
// ════════════════════════════════════════════════════════════════
import * as THREE from "three";

const canvas = document.getElementById("heart-canvas");
if (canvas) {
  requestAnimationFrame(() => requestAnimationFrame(() => initHeart(canvas)));
}

function initHeart(canvas) {
  let contextValid = true;
  let stopped      = false;

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextValid = false;
    stopped = true;        // give up — SVG fallback remains visible
  });

  // Prefer WebGL1 for broad driver compatibility; fall back to WebGL2 if
  // WebGL1Renderer is missing (e.g. someone bumps the version).
  let renderer;
  try {
    const Renderer = THREE.WebGL1Renderer || THREE.WebGLRenderer;
    renderer = new Renderer({
      canvas, antialias: true, alpha: true,
      powerPreference: "default"
    });
  } catch (err) {
    console.warn("[heart] WebGL unavailable; using SVG fallback.", err);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;   // 0.149 API

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Heart shape (2D Bezier curves, extruded)
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.bezierCurveTo(0, 0.5, -0.5, 1.5, -1.5, 1.5);
  shape.bezierCurveTo(-2.55, 1.5, -2.55, 0.2, -2.55, 0.2);
  shape.bezierCurveTo(-2.55, -0.55, -1.55, -1.4, 0, -2.4);
  shape.bezierCurveTo(1.55, -1.4, 2.55, -0.55, 2.55, 0.2);
  shape.bezierCurveTo(2.55, 0.2, 2.55, 1.5, 1.5, 1.5);
  shape.bezierCurveTo(0.5, 1.5, 0, 0.5, 0, 0.5);

  const heartGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.1,
    bevelEnabled: true,
    bevelSegments: 6,
    steps: 2,
    bevelSize: 0.55,
    bevelThickness: 0.55,
    curveSegments: 24
  });
  heartGeometry.center();
  heartGeometry.computeVertexNormals();

  // Lambert lighting — cheapest lit shader in Three.js.
  const heartMaterial = new THREE.MeshLambertMaterial({
    color:    new THREE.Color(0xdc143c),
    emissive: new THREE.Color(0x5a0815)
  });

  const heart = new THREE.Mesh(heartGeometry, heartMaterial);
  heart.scale.set(0.85, 0.85, 0.85);
  heart.rotation.x = Math.PI;
  scene.add(heart);

  // Inner glow (additive, no lighting needed).
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5a82, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const glow = new THREE.Mesh(heartGeometry, glowMaterial);
  glow.scale.set(0.95, 0.95, 0.95);
  glow.rotation.x = Math.PI;
  scene.add(glow);

  // Particle aura
  const particleCount = 260;
  const positions = new Float32Array(particleCount * 3);
  const speeds    = new Float32Array(particleCount);
  const offsets   = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const r     = 4 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi) * 0.4;
    speeds[i]  = 0.0008 + Math.random() * 0.0022;
    offsets[i] = Math.random() * Math.PI * 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.18, map: makeSpriteTexture(),
    transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xf3d27a, opacity: 0.85
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Lights
  scene.add(new THREE.AmbientLight(0xffd6e4, 0.55));
  const key = new THREE.PointLight(0xff7aa2, 1.5, 30);
  key.position.set(4, 5, 6);  scene.add(key);
  const rim = new THREE.PointLight(0xf3d27a, 1.0, 30);
  rim.position.set(-6, -3, 4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(0, 0, 8); scene.add(fill);

  // Resize
  function resize() {
    const w = canvas.clientWidth  || canvas.parentElement.clientWidth  || 1;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight || 1;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);

  // Mouse parallax
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Heartbeat (lub-dub) over a 1.1s cycle
  function beatScale(t) {
    const c = (t % 1.1) / 1.1;
    if (c < 0.06) return 1 + smooth(c / 0.06) * 0.10;
    if (c < 0.14) return 1.10 - smooth((c - 0.06) / 0.08) * 0.06;
    if (c < 0.22) return 1.04 + smooth((c - 0.14) / 0.08) * 0.07;
    if (c < 0.32) return 1.11 - smooth((c - 0.22) / 0.10) * 0.11;
    return 1.0 + Math.sin(c * Math.PI) * 0.005;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }

  // ── Render loop with health monitor ──────────────────────────
  const gl    = renderer.getContext();
  const clock = new THREE.Clock();
  let goodFrames = 0;
  let badFrames  = 0;

  function tick() {
    if (stopped) return;
    requestAnimationFrame(tick);
    if (!contextValid) return;

    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const beat = beatScale(t);
    heart.scale.set(0.85 * beat, 0.85 * beat, 0.85 * beat);
    glow.scale.set(0.97 * beat, 0.97 * beat, 0.97 * beat);
    glowMaterial.opacity = 0.10 + (beat - 1) * 1.6;
    heart.rotation.y = mouse.x * 0.45 + Math.sin(t * 0.4) * 0.06;
    heart.rotation.z = mouse.y * 0.18;
    heart.rotation.x = Math.PI + mouse.y * 0.18 + Math.sin(t * 0.3) * 0.04;
    glow.rotation.copy(heart.rotation);

    particles.rotation.y += 0.0009;
    particles.rotation.x += 0.0004;
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i*3+1] += Math.sin(t * 0.6 + offsets[i]) * speeds[i];
      pos[i*3]   += Math.cos(t * 0.5 + offsets[i]) * speeds[i] * 0.7;
    }
    pGeo.attributes.position.needsUpdate = true;

    try {
      renderer.render(scene, camera);
    } catch (err) {
      bail("render exception", err);
      return;
    }

    // Health check — if the GPU is yelling, walk away from WebGL.
    const e = gl.getError();
    if (e !== gl.NO_ERROR) {
      badFrames++;
      if (badFrames > 3) { bail("repeated WebGL errors: 0x" + e.toString(16)); return; }
    } else {
      badFrames = 0;
      goodFrames++;
      if (goodFrames === 2) {
        canvas.classList.add("is-rendered");
      }
    }
  }
  tick();

  function bail(reason, err) {
    stopped = true;
    canvas.classList.remove("is-rendered");
    console.info("[heart] falling back to SVG (" + reason + ")", err || "");
    try { renderer.dispose(); } catch (_) {}
  }

  function makeSpriteTexture() {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0,    "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,220,180,0.9)");
    g.addColorStop(0.55, "rgba(243,210,122,0.35)");
    g.addColorStop(1,    "rgba(243,210,122,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }
}
