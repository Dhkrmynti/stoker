import * as THREE from 'three';
import { STAGES, type Stage } from '../stages';

/**
 * The STOKER island, built from a few hundred low-poly pieces. It is rendered at a fraction of
 * the screen's resolution and scaled up without smoothing, so every face reads as a block of pixels.
 * Ground level is y = 0; the island sits in a slow-glowing molten sea.
 */

export const PAL = {
  sky: 0x120c10,
  soot: 0x0f0d0d,
  earth: 0x4b3b31,
  earth2: 0x574536,
  path: 0x6b5a48,
  moss: 0x5f5a33,
  moss2: 0x716b3d,
  ballast: 0x857a72,
  rock: 0x5e534d,
  rockHi: 0x7d7068,
  coal: 0x221b1a,
  lamp: 0xffcf7a,
  brick: 0x7a2e1e,
  brickLo: 0x52200f,
  plate: 0x2c2524,
  plateHi: 0x3d3432,
  dark: 0x211c1b,
  brass: 0xd4a648,
  ember: 0xff5a1f,
  flame: 0xffa630,
  steam: 0xeee9e2,
  ash: 0xaaa098,
  ticket: 0xe7d7a8,
  band: 0x2f6b4f,
  seam: 0x5c514c,
};

const mats = new Map<string, THREE.Material>();
/** One shared flat-shaded material per colour. */
export function mat(color: number, emissive = 0, emissiveIntensity = 1) {
  const key = `${color}-${emissive}-${emissiveIntensity}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity, flatShading: true });
    mats.set(key, m);
  }
  return m;
}
const wire = new THREE.MeshBasicMaterial({ color: PAL.seam, wireframe: true });

const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
};
const cyl = (rt: number, rb: number, h: number, m: THREE.Material, seg = 8, x = 0, y = 0, z = 0) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  return mesh;
};

/** A sign: pixel lettering painted on a tiny canvas, kept crisp with nearest filtering. */
export function sign(text: string, opts: { w?: number; h?: number; fg?: string; bg?: string } = {}) {
  const { w = 4, h = 1.2, fg = '#1d1814', bg = '#d4a648' } = opts;
  const c = document.createElement('canvas');
  const px = 16;
  c.width = Math.round(w * px);
  c.height = Math.round(h * px);
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = fg;
  g.font = `${Math.round(c.height * 0.8)}px "Jersey 10", monospace`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text.toUpperCase(), c.width / 2, c.height / 2 + 1);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
  return mesh;
}

/* ───────── terrain and sea ───────── */

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export function terrain(track: THREE.CatmullRomCurve3) {
  const CELL = 2;
  const pts = track.getSpacedPoints(240);
  const nearTrack = (x: number, z: number) => {
    let best = Infinity;
    for (const p of pts) best = Math.min(best, (p.x - x) ** 2 + (p.z - z) ** 2);
    return Math.sqrt(best);
  };
  const cells: { x: number; z: number; top: number; color: number }[] = [];
  const embers: THREE.Vector3[] = [];
  for (let gx = -32; gx <= 32; gx++)
    for (let gz = -24; gz <= 24; gz++) {
      const x = gx * CELL;
      const z = gz * CELL;
      const a = Math.atan2(z, x);
      const edge = 1 + 0.12 * Math.sin(a * 3 + 1) + 0.08 * Math.sin(a * 7) + 0.06 * (hash(gx, gz) - 0.5);
      const r = Math.hypot(x / 58, z / 40) / edge;
      if (r > 1) continue;
      // the rim steps down to the sea in terraces
      const top = r > 0.93 ? -2 : r > 0.86 ? -1 : 0;
      const d = nearTrack(x, z);
      const n = hash(gx * 3, gz * 5);
      // broad patches of scrub moss, so the ground is not one brown
      const patch = Math.sin(x * 0.11 + 1.3) + Math.cos(z * 0.15 - 0.4) + n * 0.6;
      let color = n > 0.5 ? PAL.earth : PAL.earth2;
      if (top < 0) color = top === -2 ? PAL.rock : PAL.rockHi;
      else if (d < 2.6) color = PAL.ballast;
      else if (d < 4.2) color = PAL.path;
      else if (patch > 1.25) color = n > 0.5 ? PAL.moss : PAL.moss2;
      else if (n > 0.9) {
        color = PAL.coal;
        // some coal on the ground is still smouldering
        if (n > 0.965) embers.push(new THREE.Vector3(x, 0.08, z));
      }
      cells.push({ x, z, top, color });
    }
  const geo = new THREE.BoxGeometry(CELL, 4, CELL);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ flatShading: true }), cells.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  cells.forEach((c, i) => {
    m4.makeTranslation(c.x, c.top - 2, c.z);
    mesh.setMatrixAt(i, m4);
    mesh.setColorAt(i, col.setHex(c.color));
  });
  // the smouldering cells: small glowing squares on top of the coal
  const emberMat = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: PAL.ember, emissiveIntensity: 1.2, flatShading: true });
  const glow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), emberMat, Math.max(1, embers.length));
  embers.forEach((e, i) => {
    m4.makeTranslation(e.x + (hash(i, 4) - 0.5) * 0.6, e.y, e.z + (hash(i, 8) - 0.5) * 0.6);
    glow.setMatrixAt(i, m4);
  });
  glow.count = embers.length;
  return { mesh, glow, emberMat, cells };
}

/** Lamp posts along the line, every few metres on alternating sides, heads lit warm. */
export function lamps(curve: THREE.Curve<THREE.Vector3>, every = 9) {
  const len = curve.getLength();
  const n = Math.floor(len / every);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 2.6, 0.22), mat(PAL.dark), n);
  const heads = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), new THREE.MeshLambertMaterial({ color: 0x000000, emissive: PAL.lamp, emissiveIntensity: 1.5, flatShading: true }), n);
  const pools = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 0.04, 2.2), new THREE.MeshBasicMaterial({ color: PAL.lamp, transparent: true, opacity: 0.12, depthWrite: false }), n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(i % 2 ? 2.4 : -2.4);
    const at = p.clone().add(side);
    m4.makeTranslation(at.x, 1.3, at.z);
    posts.setMatrixAt(i, m4);
    m4.makeTranslation(at.x, 2.75, at.z);
    heads.setMatrixAt(i, m4);
    m4.makeTranslation(at.x, 0.05, at.z);
    pools.setMatrixAt(i, m4);
  }
  const g = new THREE.Group();
  g.add(posts, heads, pools);
  return g;
}

export function sea() {
  const m = new THREE.MeshLambertMaterial({ color: 0x1a0805, emissive: 0x7a1c0c, emissiveIntensity: 0.6, flatShading: true });
  const geo = new THREE.PlaneGeometry(400, 400, 40, 40);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.y = -3.4;
  return { mesh, material: m, geo, base: Float32Array.from(geo.attributes.position.array as Float32Array) };
}

/* ───────── railway ───────── */

export function trackCurve() {
  return new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-34, 0, 0),
      new THREE.Vector3(-30, 0, -13),
      new THREE.Vector3(-14, 0, -15),
      new THREE.Vector3(4, 0, -14),
      new THREE.Vector3(24, 0, -12),
      new THREE.Vector3(37, 0, 0),
      new THREE.Vector3(26, 0, 12),
      new THREE.Vector3(6, 0, 13),
      new THREE.Vector3(-14, 0, 13),
      new THREE.Vector3(-30, 0, 11),
    ],
    true,
    'centripetal',
  );
}

/** Rails and sleepers laid along any curve, as two instanced meshes. */
export function rails(curve: THREE.Curve<THREE.Vector3>, steps: number, closed = true) {
  const group = new THREE.Group();
  const n = steps;
  const railGeo = new THREE.BoxGeometry(1, 0.16, 0.16);
  const sleeperGeo = new THREE.BoxGeometry(0.4, 0.12, 2.2);
  const railMesh = new THREE.InstancedMesh(railGeo, mat(PAL.ash), n * 2);
  const sleeperMesh = new THREE.InstancedMesh(sleeperGeo, mat(0x3b2a20), n);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const s = new THREE.Vector3();
  const last = closed ? n : n - 1;
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = closed ? ((i + 1) % n) / n : Math.min(1, (i + 1) / n);
    if (!closed && i >= last) break;
    const a = curve.getPointAt(t0);
    const b = curve.getPointAt(t1 === 0 && closed ? 0 : t1);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const ang = Math.atan2(-dir.z, dir.x);
    q.setFromAxisAngle(up, ang);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(0.7);
    s.set(len + 0.05, 1, 1);
    m4.compose(mid.clone().add(side).setY(0.2), q, s);
    railMesh.setMatrixAt(i * 2, m4);
    m4.compose(mid.clone().sub(side).setY(0.2), q, s);
    railMesh.setMatrixAt(i * 2 + 1, m4);
    m4.compose(a.clone().setY(0.06), q, new THREE.Vector3(1, 1, 1));
    sleeperMesh.setMatrixAt(i, m4);
  }
  group.add(railMesh, sleeperMesh);
  return group;
}

/* ───────── rolling stock ───────── */

/** A low-poly engine for a class, facing +x, wheels on y = 0. Locked classes are wireframes. */
export function engine(stage: Stage, locked = false) {
  const g = new THREE.Group();
  const M = (c: number, e = 0, ei = 1) => (locked ? wire : mat(c, e, ei));
  const RD = 0.62;
  const RS = 0.36;
  const wheels: { x: number; r: number }[] = [];
  let x = 0;
  for (let i = 0; i < stage.trail; i++) {
    wheels.push({ x: x + RS, r: RS });
    x += RS * 2 + 0.2;
  }
  const d0 = x + RD;
  for (let i = 0; i < stage.drive; i++) {
    wheels.push({ x: x + RD, r: RD });
    x += RD * 2 + 0.12;
  }
  const d1 = x - 0.12 - RD;
  x += 0.2;
  for (let i = 0; i < stage.lead; i++) {
    wheels.push({ x: x + RS, r: RS });
    x += RS * 2 + 0.2;
  }
  const front = Math.max(x + 0.4, d1 + RD + 1.6);
  const cabL = -0.2;
  const cabR = 1.7;
  const len = front - cabR;
  // frame and running board
  g.add(box(front - cabL, 0.3, 1.3, M(PAL.dark), (front + cabL) / 2, 1.05, 0));
  // boiler, smokebox, chimney, dome
  const boiler = cyl(0.62, 0.62, len - 0.9, M(PAL.plate), 10);
  boiler.rotation.z = Math.PI / 2;
  boiler.position.set(cabR + (len - 0.9) / 2, 1.85, 0);
  g.add(boiler);
  const smoke = cyl(0.66, 0.66, 0.9, M(PAL.dark), 10);
  smoke.rotation.z = Math.PI / 2;
  smoke.position.set(front - 0.45, 1.85, 0);
  g.add(smoke);
  g.add(cyl(0.2, 0.26, 0.8, M(PAL.dark), 8, front - 0.5, 2.75, 0));
  g.add(cyl(0.26, 0.3, 0.32, M(PAL.brass), 8, cabR + len * 0.45, 2.55, 0));
  // brass bands
  for (let b = cabR + 0.6; b < front - 1; b += 0.9) {
    const band = cyl(0.64, 0.64, 0.08, M(PAL.brass), 10);
    band.rotation.z = Math.PI / 2;
    band.position.set(b, 1.85, 0);
    g.add(band);
  }
  // cab with roof and the fire showing through
  g.add(box(cabR - cabL, 1.7, 1.4, M(PAL.plateHi), (cabR + cabL) / 2, 2.05, 0));
  g.add(box(cabR - cabL + 0.4, 0.14, 1.7, M(PAL.dark), (cabR + cabL) / 2, 2.95, 0));
  if (!locked) g.add(box(0.3, 0.3, 1.42, mat(PAL.ember, PAL.ember, 1.6), cabR - 0.35, 1.6, 0));
  // buffer beam
  g.add(box(0.12, 0.4, 1.4, M(0xb8321a), front + 0.05, 1.05, 0));
  // wheels on both sides
  const wheelMeshes: THREE.Mesh[] = [];
  for (const w of wheels)
    for (const side of [-0.62, 0.62]) {
      const wm = cyl(w.r, w.r, 0.14, M(PAL.ash), 10);
      wm.rotation.x = Math.PI / 2;
      wm.position.set(w.x, w.r, side);
      g.add(wm);
      wheelMeshes.push(wm);
    }
  if (stage.drive > 1)
    for (const side of [-0.72, 0.72]) g.add(box(d1 - d0, 0.08, 0.06, M(PAL.brass), (d0 + d1) / 2, RD * 0.7, side));
  // centre it on the bogie
  g.children.forEach((c) => (c.position.x -= front / 2));
  return { group: g, length: front - cabL, chimney: new THREE.Vector3(front / 2 - 0.5, 3.2, 0), wheels: wheelMeshes };
}

/** A coal wagon, heaped. */
export function wagon() {
  const g = new THREE.Group();
  g.add(box(3, 1.1, 1.5, mat(PAL.plate), 0, 1.3, 0));
  for (let i = 0; i < 7; i++) g.add(box(0.5 + hash(i, 2) * 0.4, 0.4, 0.5, mat(PAL.coal), -1.1 + i * 0.37, 2 + hash(i, 5) * 0.2, (hash(i, 9) - 0.5) * 0.8));
  for (const x of [-0.9, 0.9])
    for (const z of [-0.62, 0.62]) {
      const w = cyl(0.4, 0.4, 0.14, mat(PAL.ash), 8, x, 0.4, z);
      w.rotation.x = Math.PI / 2;
      g.add(w);
    }
  return g;
}

/* ───────── buildings ───────── */

/**
 * A pixel fire on a tiny canvas, for surfaces inside the 3D world: the same demo-scene spread as
 * the page's fire, stepped by the world's loop. `step(k)` takes the heat, 0..1.
 */
export function fireTexture(W = 48, H = 36) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const cells = new Uint8Array(W * H);
  const ramp = [0x1a0805, 0x3a0a05, 0x5c1207, 0x8f1d07, 0xb32a08, 0xd9400a, 0xec5512, 0xff6a1a, 0xff8526, 0xffa630, 0xffbe4a, 0xffd166, 0xffe394, 0xfff2c0, 0xffffff];
  const TOP = ramp.length - 1;
  const rgb = ramp.map((v) => [(v >> 16) & 255, (v >> 8) & 255, v & 255]);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const step = (k: number) => {
    for (let x = 0; x < W; x++) cells[(H - 1) * W + x] = Math.random() < 0.3 + k * 0.7 ? TOP : TOP - 4;
    const decay = TOP / Math.max(3, (0.45 + 0.5 * k) * H);
    for (let x = 0; x < W; x++)
      for (let y = 1; y < H; y++) {
        const src = y * W + x;
        const p = cells[src];
        if (!p) {
          cells[src - W] = 0;
          continue;
        }
        const r = (Math.random() * 3) | 0;
        const dst = Math.min(W * H - 1, Math.max(W, src - r + 1));
        cells[dst - W] = Math.max(0, p - (Math.floor(decay) + (Math.random() < decay % 1 ? 1 : 0)));
      }
    for (let i = 0; i < W * H; i++) {
      const v = rgb[cells[i]];
      img.data[i * 4] = v[0];
      img.data[i * 4 + 1] = v[1];
      img.data[i * 4 + 2] = v[2];
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    tex.needsUpdate = true;
  };
  return { tex, step };
}

/**
 * The furnace at 0x…dEaD: brick walls round a real firebox you can fly into. The east wall has an
 * arched opening closed by two riveted iron doors on hinges; inside, the walls glow, coal is heaped
 * on the grate and a pixel fire burns on the back wall. `open(0..1)` swings the doors.
 */
export function furnace(fire: THREE.Texture) {
  const g = new THREE.Group();
  const brick = mat(PAL.brick);
  const brickLo = mat(PAL.brickLo);
  // walls: west, north, south, and the east wall built round the opening (z -2.4..2.4, y 0..4.8)
  g.add(box(1, 8, 10, brick, -4.5, 4, 0));
  g.add(box(10, 8, 1, brick, 0, 4, -4.5));
  g.add(box(10, 8, 1, brick, 0, 4, 4.5));
  g.add(box(1, 8, 2.6, brick, 4.5, 4, -3.7));
  g.add(box(1, 8, 2.6, brick, 4.5, 4, 3.7));
  g.add(box(1, 3.2, 4.8, brick, 4.5, 6.4, 0));
  // roof, stack
  g.add(box(10.6, 0.8, 10.6, brickLo, 0, 8.2, 0));
  g.add(box(8, 1.6, 8, brickLo, 0, 9.4, 0));
  g.add(cyl(1.4, 1.8, 12, brick, 8, -1.5, 16, -1.5));
  g.add(cyl(1.6, 1.6, 0.6, brickLo, 8, -1.5, 22.2, -1.5));
  // the iron frame round the opening
  g.add(box(0.4, 0.5, 5.6, mat(PAL.dark), 5.1, 5.05, 0));
  g.add(box(0.4, 5, 0.4, mat(PAL.dark), 5.1, 2.5, -2.6));
  g.add(box(0.4, 5, 0.4, mat(PAL.dark), 5.1, 2.5, 2.6));

  // inside: glowing brick seen from within, the fire on the back wall, coal on the grate
  const inner = new THREE.Mesh(new THREE.BoxGeometry(8, 7.6, 8), new THREE.MeshLambertMaterial({ color: 0x5a1c10, emissive: 0x7a2410, emissiveIntensity: 0.8, side: THREE.BackSide, flatShading: true }));
  inner.position.set(0, 3.8, 0);
  g.add(inner);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 7.2), new THREE.MeshBasicMaterial({ map: fire }));
  back.rotation.y = Math.PI / 2;
  back.position.set(-3.9, 3.7, 0);
  g.add(back);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 7.2), new THREE.MeshBasicMaterial({ map: fire, color: 0xb0b0b0 }));
    wall.position.set(0, 3.7, side * 3.9);
    wall.rotation.y = side > 0 ? Math.PI : 0;
    g.add(wall);
  }
  for (let i = 0; i < 26; i++) {
    const s = 0.5 + hash(i, 3) * 0.7;
    const lump = box(s, s * 0.7, s, i % 3 ? mat(0x1a100c) : mat(0x2a1208, PAL.ember, 0.9), -3 + hash(i, 7) * 6.2, 0.3 + hash(i, 1) * 0.2, -3.2 + hash(i, 11) * 6.4);
    g.add(lump);
  }

  // the doors: riveted iron leaves hinged on the frame, a glowing slit where they meet
  const leaf = () => {
    const l = new THREE.Group();
    l.add(box(0.2, 4.6, 2.35, mat(PAL.plateHi), 0, 2.4, 1.175));
    for (const y of [0.6, 2.4, 4.2]) l.add(box(0.26, 0.2, 2.1, mat(PAL.dark), 0.02, y, 1.175));
    for (const y of [0.6, 2.4, 4.2]) for (const z of [0.3, 2.05]) l.add(box(0.3, 0.16, 0.16, mat(PAL.rockHi), 0.04, y, z));
    for (const x of [-0.12, 0.12]) l.add(box(0.12, 0.5, 0.18, mat(PAL.brass), x, 2.4, 2.0));
    return l;
  };
  const left = new THREE.Group();
  left.position.set(5.2, 0.1, -2.35);
  left.add(leaf());
  const right = new THREE.Group();
  right.position.set(5.2, 0.1, 2.35);
  const rl = leaf();
  rl.rotation.y = Math.PI; // the same leaf, turned to hang the other way
  right.add(rl);
  g.add(left, right);
  const slitMat = new THREE.MeshLambertMaterial({ color: 0x000000, emissive: PAL.flame, emissiveIntensity: 1.6, flatShading: true });
  const slit = box(0.1, 4.6, 0.14, slitMat, 5.25, 2.5, 0);
  g.add(slit);

  const plate = sign('0x…dEaD', { w: 5, h: 1.2 });
  plate.rotation.y = Math.PI / 2;
  plate.position.set(5.12, 6.6, 0);
  g.add(plate);

  /** swing the doors, 0 shut .. 1 wide open */
  const open = (v: number) => {
    const a = v * THREE.MathUtils.degToRad(105);
    left.rotation.y = a;
    right.rotation.y = -a;
    slit.visible = v < 0.02;
  };
  open(0);
  return { group: g, doorMat: slitMat, open, doors: [left, right], stackTop: new THREE.Vector3(-1.5, 22.6, -1.5), doorPos: new THREE.Vector3(5.4, 2.5, 0) };
}

/** A tall post carrying a big pressure gauge; the needle turns with the fee escrow. */
export function gaugeTower() {
  const g = new THREE.Group();
  g.add(box(0.6, 7, 0.6, mat(PAL.dark), 0, 3.5, 0));
  const dial = cyl(2.2, 2.2, 0.3, mat(PAL.brass), 16, 0, 8.6, 0);
  dial.rotation.x = Math.PI / 2;
  g.add(dial);
  const face = cyl(1.9, 1.9, 0.32, mat(0xece3cb), 16, 0, 8.6, 0.02);
  face.rotation.x = Math.PI / 2;
  g.add(face);
  const red = box(0.5, 0.5, 0.34, mat(0xb8321a), 1.2, 7.6, 0.04);
  red.rotation.z = Math.PI / 4;
  g.add(red);
  const pivot = new THREE.Group();
  pivot.position.set(0, 8.6, 0.25);
  pivot.add(box(0.14, 1.7, 0.08, mat(PAL.ember, PAL.ember, 0.8), 0, 0.75, 0));
  g.add(pivot);
  g.add(cyl(0.25, 0.25, 0.4, mat(PAL.brass), 8, 0, 8.6, 0.3).rotateX(Math.PI / 2));
  return { group: g, needle: pivot };
}

/** A water tower with the whistle; it lets off steam at a full gauge. */
export function waterTower() {
  const g = new THREE.Group();
  for (const [x, z] of [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]]) g.add(box(0.3, 6, 0.3, mat(PAL.dark), x, 3, z));
  g.add(cyl(2.4, 2.4, 3, mat(PAL.plate), 10, 0, 7.5, 0));
  g.add(cyl(2.6, 0.2, 1.2, mat(PAL.dark), 10, 0, 9.6, 0));
  g.add(cyl(0.18, 0.22, 1, mat(PAL.brass), 8, 0, 10.6, 0));
  return { group: g, whistle: new THREE.Vector3(0, 11.2, 0) };
}

/** The coal hopper: where the bought $COAL is loaded. */
export function hopper() {
  const g = new THREE.Group();
  g.add(box(6, 5, 4, mat(PAL.plate), 0, 4.5, 0));
  g.add(box(6.4, 0.4, 4.4, mat(PAL.dark), 0, 7.2, 0));
  for (const x of [-2.6, 2.6]) for (const z of [-1.6, 1.6]) g.add(box(0.4, 2.2, 0.4, mat(PAL.dark), x, 1.1, z));
  const chute = box(1.2, 0.3, 3, mat(PAL.dark), 0, 2.4, 2.6);
  chute.rotation.x = -0.5;
  g.add(chute);
  const heap = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2, 7), mat(PAL.coal));
  heap.position.set(-5, 1, 1);
  g.add(heap);
  const s = sign('$COAL', { w: 4, h: 1.2 });
  s.position.set(0, 5.4, 2.02);
  g.add(s);
  return g;
}

/** A small house with a sign. */
export function house(label: string, w = 5, d = 4, h = 3.2, color: number = PAL.plateHi) {
  const g = new THREE.Group();
  g.add(box(w, h, d, mat(color), 0, h / 2, 0));
  const roof = box(w + 0.6, 0.4, d + 0.6, mat(PAL.dark), 0, h + 0.2, 0);
  g.add(roof);
  g.add(box(1, 1, 0.1, mat(0x000000, PAL.flame, 0.9), -w / 4, h * 0.55, d / 2 + 0.05));
  g.add(box(1, 1, 0.1, mat(0x000000, PAL.flame, 0.9), w / 4, h * 0.55, d / 2 + 0.05));
  const s = sign(label, { w: Math.min(w - 0.6, label.length * 0.75 + 1), h: 0.9 });
  s.position.set(0, h + 1, d / 2 - 0.2);
  g.add(s);
  return g;
}

/** A signal box on legs, windows lit, a semaphore arm beside it. */
export function signalBox() {
  const g = new THREE.Group();
  g.add(box(4, 3, 3, mat(PAL.brick), 0, 1.5, 0));
  g.add(box(4.2, 2, 3.2, mat(PAL.plateHi), 0, 4, 0));
  g.add(box(3.6, 1, 0.1, mat(0x000000, PAL.flame, 1.1), 0, 4.2, 1.62));
  g.add(box(4.8, 0.4, 3.8, mat(PAL.dark), 0, 5.2, 0));
  g.add(box(0.25, 7, 0.25, mat(PAL.dark), 3.4, 3.5, 1));
  const arm = box(2, 0.3, 0.12, mat(0xb8321a), 4.2, 6.4, 1.1);
  arm.rotation.z = 0.5;
  g.add(arm);
  const s = sign('cab', { w: 2.4, h: 0.9 });
  s.position.set(0, 5.95, 1.92);
  g.add(s);
  return g;
}

/** A platform with a class board and a lamp; the lamp is lit once the class is unlocked. */
export function platform(stage: Stage, unlocked: boolean) {
  const g = new THREE.Group();
  g.add(box(12, 0.6, 2.6, mat(PAL.rock), 0, 0.3, 2.6));
  g.add(box(0.2, 3, 0.2, mat(PAL.dark), -5, 1.5, 3.4));
  g.add(box(0.6, 0.6, 0.6, unlocked ? mat(0x000000, PAL.brass, 1.4) : mat(PAL.dark), -5, 3.2, 3.4));
  const s = sign(stage.wheels, { w: 2.4, h: 1, bg: unlocked ? '#d4a648' : '#3a3230', fg: unlocked ? '#1d1814' : '#aaa098' });
  s.position.set(0, 2.2, 3.92);
  g.add(s);
  g.add(box(0.2, 1.8, 0.2, mat(PAL.dark), -1.3, 0.9, 3.8));
  g.add(box(0.2, 1.8, 0.2, mat(PAL.dark), 1.3, 0.9, 3.8));
  return g;
}

export { STAGES };
