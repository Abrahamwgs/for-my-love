// ════════════════════════════════════════════════════════════════
//  Three.js — a soft, glowing, beating heart that follows the cursor.
//  Uses a parametric heart curve extruded into 3D, surrounded by
//  a particle aura, illuminated by warm rose-gold lights.
// ════════════════════════════════════════════════════════════════
import * as THREE from "three";

const canvas = document.getElementById("heart-canvas");
if (canvas) initHeart(canvas);

function initHeart(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // ── Heart shape (2D Bezier curves, then extrude) ──────────────
  const shape = new THREE.Shape();
  const x = 0, y = 0;
  shape.moveTo(x + 0, y + 0.5);
  shape.bezierCurveTo(x + 0, y + 0.5, x - 0.5, y + 1.5, x - 1.5, y + 1.5);
  shape.bezierCurveTo(x - 2.55, y + 1.5, x - 2.55, y + 0.2, x - 2.55, y + 0.2);
  shape.bezierCurveTo(x - 2.55, y - 0.55, x - 1.55, y - 1.4, x + 0, y - 2.4);
  shape.bezierCurveTo(x + 1.55, y - 1.4, x + 2.55, y - 0.55, x + 2.55, y + 0.2);
  shape.bezierCurveTo(x + 2.55, y + 0.2, x + 2.55, y + 1.5, x + 1.5, y + 1.5);
  shape.bezierCurveTo(x + 0.5, y + 1.5, x + 0, y + 0.5, x + 0, y + 0.5);

  const extrudeSettings = {
    depth: 1.1,
    bevelEnabled: true,
    bevelSegments: 24,
    steps: 4,
    bevelSize: 0.55,
    bevelThickness: 0.55,
    curveSegments: 64
  };
  const heartGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  heartGeometry.center();
  heartGeometry.computeVertexNormals();

  // Material — physically based, like polished glass over warm flesh
  const heartMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xdc143c),
    metalness: 0.15,
    roughness: 0.32,
    clearcoat: 1.0,
    clearcoatRoughness: 0.18,
    sheen: 1.0,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color(0xffb3c9),
    emissive: new THREE.Color(0x4a0613),
    emissiveIntensity: 0.45,
    transmission: 0.05,
    ior: 1.4
  });

  const heart = new THREE.Mesh(heartGeometry, heartMaterial);
  heart.scale.set(0.85, 0.85, 0.85);
  heart.rotation.x = Math.PI; // flip so the point is down
  scene.add(heart);

  // Inner glow — slightly larger, additive, behind the heart
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5a82,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const glow = new THREE.Mesh(heartGeometry, glowMaterial);
  glow.scale.set(0.95, 0.95, 0.95);
  glow.rotation.x = Math.PI;
  scene.add(glow);

  // ── Particle aura ─────────────────────────────────────────────
  const particleCount = 600;
  const positions = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  const offsets = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const r = 4 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi) * 0.4;
    speeds[i]  = 0.0008 + Math.random() * 0.0022;
    offsets[i] = Math.random() * Math.PI * 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const pTexture = makeSpriteTexture();
  const pMat = new THREE.PointsMaterial({
    size: 0.18,
    map: pTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: 0xf3d27a,
    opacity: 0.85
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Lights ────────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0xffd6e4, 0.35);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff7aa2, 80, 30, 2);
  keyLight.position.set(4, 5, 6);
  scene.add(keyLight);

  const rimLight = new THREE.PointLight(0xf3d27a, 60, 30, 2);
  rimLight.position.set(-6, -3, 4);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(0, 0, 8);
  scene.add(fillLight);

  // ── Resize ────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ── Cursor parallax ───────────────────────────────────────────
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("mousemove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // ── Heartbeat (lub-dub) waveform over a 1.1s cycle ─────────────
  function heartbeatScale(t) {
    const cycle = (t % 1.1) / 1.1; // 0..1
    if (cycle < 0.06)        return 1 + smooth(cycle / 0.06) * 0.10;       // lub up
    if (cycle < 0.14)        return 1.10 - smooth((cycle - 0.06) / 0.08) * 0.06; // lub down
    if (cycle < 0.22)        return 1.04 + smooth((cycle - 0.14) / 0.08) * 0.07; // dub up
    if (cycle < 0.32)        return 1.11 - smooth((cycle - 0.22) / 0.10) * 0.11; // dub down
    return 1.0 + Math.sin(cycle * Math.PI) * 0.005;                          // gentle rest
  }
  function smooth(t) { return t * t * (3 - 2 * t); }

  // ── Animate ───────────────────────────────────────────────────
  const clock = new THREE.Clock();
  function tick() {
    const t  = clock.getElapsedTime();
    const dt = clock.getDelta();

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const beat = heartbeatScale(t);
    heart.scale.set(0.85 * beat, 0.85 * beat, 0.85 * beat);
    glow.scale.set(0.95 * beat * 1.02, 0.95 * beat * 1.02, 0.95 * beat * 1.02);
    glowMaterial.opacity = 0.10 + (beat - 1) * 1.6;
    heartMaterial.emissiveIntensity = 0.35 + (beat - 1) * 2.2;

    heart.rotation.y = mouse.x * 0.45 + Math.sin(t * 0.4) * 0.06;
    heart.rotation.z = mouse.y * 0.18;
    heart.rotation.x = Math.PI + mouse.y * 0.18 + Math.sin(t * 0.3) * 0.04;
    glow.rotation.copy(heart.rotation);

    particles.rotation.y += 0.0009;
    particles.rotation.x += 0.0004;

    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.6 + offsets[i]) * speeds[i];
      pos[i * 3]     += Math.cos(t * 0.5 + offsets[i]) * speeds[i] * 0.7;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  // ── Helpers ───────────────────────────────────────────────────
  function makeSpriteTexture() {
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0,    "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,220,180,0.9)");
    grad.addColorStop(0.55, "rgba(243,210,122,0.35)");
    grad.addColorStop(1,    "rgba(243,210,122,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
}
