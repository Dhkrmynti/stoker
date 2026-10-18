import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STAGES, stageIndexFor } from '../stages';
import { mapStore, STATIONS } from './mapStore';
import { PAL, engine, fireTexture, furnace, lamps, gaugeTower, hopper, house, mat, platform, rails, sea, signalBox, terrain, trackCurve, wagon, waterTower } from './build';

export interface WorldProps {
  /** fee gauge, 0..1: the fire and the gauge needle follow it */
  fill: number;
  burnedPercent: number;
  live: boolean;
  /** the bot is mid-run: the train hurries and the tower lets off steam */
  running: boolean;
  /** a fresh burn: the furnace flares */
  burnKey: string | null;
  /** a rap on the furnace door */
  stokes: number;
  /**
   * render for the X kit instead of the page: no scroll, no clock. The kit page drives it through
   * `window.__stokerKit` (set the shot and doors, step time, render a frame).
   */
  kit?: { pix: number };
}

/** The handle the X kit page drives the map with. */
export interface StokerKit {
  setShot: (shot: Shot) => void;
  setDoors: (v: number) => void;
  burn: () => void;
  step: (dt: number) => void;
}

declare global {
  interface Window {
    __stokerKit?: StokerKit;
  }
}

type V3 = [number, number, number];
export interface Shot {
  pos: V3;
  look: V3;
  /** fly straight to and from this shot, never arcing over (the way in through the furnace door) */
  straight?: boolean;
  /** where the subject sits across the screen on wide layouts: -1 left .. 1 right */
  side?: number;
}

/** Where the platforms for the five classes stand, west to east. */
const PLATFORM_X = [-26, -13, 0, 13, 26];

/** Every camera position the page can fly to, by the data-cam name on its section. */
const SHOTS: Record<string, Shot> = {
  hero: { pos: [-8, 16, 34], look: [-40, 5, 0], side: 0.45 },
  // in front of the furnace, square to the doors as they swing open
  door: { pos: [-25, 3.4, 0], look: [-50, 2.6, 0], side: 0, straight: true },
  // through the doorway and inside, facing the fire on the back wall
  dive: { pos: [-41.5, 2.6, 0], look: [-60, 2.4, 0], side: 0, straight: true },
  run: { pos: [-10, 30, 22], look: [-4, 0, -12], side: 0.35 },
  gauge: { pos: [-8, 12, 4], look: [-22, 6, -21], side: 0.45 },
  whistle: { pos: [10, 13, 2], look: [-4, 7, -22], side: -0.45 },
  coal: { pos: [26, 12, 2], look: [12, 4, -22], side: 0.45 },
  odd: { pos: [-25, 9, 15], look: [-42, 5, 0], side: -0.45 },
  even: { pos: [40, 11, -4], look: [28, 3, -23], side: 0.45 },
  line: { pos: [0, 36, 60], look: [0, 0, 12], side: 0.35 },
  ...Object.fromEntries(PLATFORM_X.map((x, i) => [`class-${i}`, { pos: [x + 5, 6, 30] as V3, look: [x, 2, 17] as V3, side: 0.45 }])),
  logbook: { pos: [62, 15, 34], look: [44, 3, 10], side: -0.5 },
  cab: { pos: [62, 13, 14], look: [45, 4, -6], side: -0.55 },
  story: { pos: [-34, 62, 72], look: [0, -2, 0], side: 0.4 },
};

const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp3 = (a: V3, b: V3, t: number, out: THREE.Vector3) => out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);

/**
 * The map behind the page: a pixel-rendered 3D island with the furnace at 0x…dEaD, the railway
 * loop and its stations. The camera flies to the station of whatever section is in the middle of
 * the screen. It renders at a third of the screen's resolution (half on phones), caps at 30 fps,
 * stops when the tab is hidden, and holds still under reduced motion.
 */
export default function World(props: WorldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  live.current = props;
  const flare = useRef(0);
  /** a fresh burn waiting to be played out at the furnace */
  const burnQueued = useRef(false);

  useEffect(() => {
    if (props.burnKey) burnQueued.current = true;
  }, [props.burnKey]);
  useEffect(() => {
    if (props.stokes) flare.current = Math.max(flare.current, 0.6);
  }, [props.stokes]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
    } catch {
      return; // no WebGL: the page reads fine on its own ground
    }
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(PAL.sky);
    scene.fog = new THREE.Fog(PAL.sky, 70, 190);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.5, 400);

    scene.add(new THREE.HemisphereLight(0xa596b4, 0x8a3416, 3.4));
    const moon = new THREE.DirectionalLight(0xc8d0ec, 3.2);
    moon.position.set(30, 60, 40);
    scene.add(moon);

    // the land
    const track = trackCurve();
    const ground = terrain(track);
    mapStore.layout = {
      cells: ground.cells.map((c) => ({ x: c.x, z: c.z, color: c.color })),
      track: track.getSpacedPoints(260).map((v) => ({ x: v.x, z: v.z })),
      stations: STATIONS,
    };
    // a burn: one coal wagon rolls off the loop down a short spur, through the doors, into the fire
    const burnPath = new THREE.CatmullRomCurve3([new THREE.Vector3(-14, 0, 13), new THREE.Vector3(-27, 0, 10.5), new THREE.Vector3(-32.5, 0, 4.5), new THREE.Vector3(-36, 0, 0.6), new THREE.Vector3(-42.5, 0, 0)], false, 'centripetal');
    const burnWagon = wagon();
    // its load is already glowing, so it reads from across the island
    for (let n = 0; n < 6; n++) {
      const lump = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.45), mat(0x000000, PAL.flame, 1.6));
      lump.position.set(-1.1 + n * 0.45, 2.25, (n % 2 ? 0.25 : -0.25));
      burnWagon.add(lump);
    }
    burnWagon.visible = false;
    scene.add(burnWagon);
    let burnT = -1;
    let emberBoost = 0;
    scene.add(ground.mesh, ground.glow);
    scene.add(lamps(track));
    const molten = sea();
    scene.add(molten.mesh);
    scene.add(rails(track, 220));
    scene.add(rails(new THREE.LineCurve3(new THREE.Vector3(-32.5, 0, 4.5), new THREE.Vector3(-39.5, 0, 0)), 10, false));

    // the furnace and its light
    const inside = fireTexture();
    const fx = furnace(inside.tex);
    fx.group.position.set(-44, 0, 0);
    scene.add(fx.group);
    // one light in the firebox, one where it pours out of the open doors
    const fireLight = new THREE.PointLight(PAL.flame, 40, 14, 1.2);
    fireLight.position.set(-43, 3, 0);
    scene.add(fireLight);
    const spill = new THREE.PointLight(PAL.flame, 0, 40, 1.6);
    spill.position.set(-36, 3, 0);
    scene.add(spill);
    let fireClock = 0;

    // stations along the line
    const gt = gaugeTower();
    gt.group.position.set(-22, 0, -21);
    scene.add(gt.group);
    const wt = waterTower();
    wt.group.position.set(-4, 0, -22);
    scene.add(wt.group);
    const hp = hopper();
    hp.position.set(13, 0, -22);
    scene.add(hp);
    const pay = house('pay', 5, 4);
    pay.position.set(28, 0, -23);
    scene.add(pay);
    const sb = signalBox();
    sb.position.set(45, 0, -7);
    scene.add(sb);
    const depot = house('logbook', 8, 5, 3.6, PAL.brick);
    depot.position.set(44, 0, 11);
    depot.rotation.y = -0.4;
    scene.add(depot);
    // a few boulders and coal heaps so the ground is not bare
    for (const [x, z, s] of [[-50, -14, 2], [-12, -28, 1.6], [34, 24, 2.2], [-40, 22, 1.8], [50, -20, 1.4], [8, 30, 1.6], [-26, 26, 1.2]] as V3[]) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat(PAL.rock));
      rock.position.set(x, s * 0.5, z);
      scene.add(rock);
    }

    // platforms, sidings and the five classes (rebuilt when the class changes)
    const yard = new THREE.Group();
    scene.add(yard);
    let builtStage = -1;
    const buildYard = (now: number) => {
      yard.clear();
      PLATFORM_X.forEach((x, i) => {
        const s = STAGES[i];
        const p = platform(s, i <= now);
        p.position.set(x, 0, 17);
        yard.add(p);
        const siding = rails(new THREE.LineCurve3(new THREE.Vector3(x - 6, 0, 17), new THREE.Vector3(x + 6, 0, 17)), 14, false);
        yard.add(siding);
        const e = engine(s, i > now);
        e.group.position.set(x, 0.25, 17);
        yard.add(e.group);
      });
    };

    // the train on the loop: today's class pulling two coal wagons
    const train = new THREE.Group();
    scene.add(train);
    let loco = engine(STAGES[0]);
    const wagons = [wagon(), wagon()];
    wagons.forEach((w) => train.add(w));
    const buildTrain = (now: number) => {
      train.remove(loco.group);
      loco = engine(STAGES[now]);
      train.add(loco.group);
    };

    // smoke and steam: recycled pixel puffs
    const PUFFS = 48;
    const puffGeo = new THREE.BoxGeometry(1, 1, 1);
    const puffs = new THREE.InstancedMesh(puffGeo, new THREE.MeshLambertMaterial({ color: 0x8f8780, flatShading: true }), PUFFS);
    puffs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(puffs);
    const puffState = Array.from({ length: PUFFS }, () => ({ p: new THREE.Vector3(0, -50, 0), v: new THREE.Vector3(), life: 0, size: 1 }));
    let nextPuff = 0;
    const emit = (at: THREE.Vector3, size: number, up: number) => {
      const s = puffState[nextPuff];
      nextPuff = (nextPuff + 1) % PUFFS;
      s.p.copy(at);
      s.v.set((Math.random() - 0.5) * 0.6, up, (Math.random() - 0.5) * 0.6);
      s.life = 1;
      s.size = size;
    };

    // embers off the stack
    const EMBERS = 60;
    const emberGeo = new THREE.BufferGeometry();
    const emberPos = new Float32Array(EMBERS * 3);
    const emberVel = new Float32Array(EMBERS * 3);
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
    const embers = new THREE.Points(emberGeo, new THREE.PointsMaterial({ color: PAL.flame, size: 1, sizeAttenuation: false }));
    scene.add(embers);
    const stack = fx.stackTop.clone().add(fx.group.position);
    const resetEmber = (i: number) => {
      emberPos[i * 3] = stack.x + (Math.random() - 0.5) * 1.5;
      emberPos[i * 3 + 1] = stack.y + Math.random() * 2;
      emberPos[i * 3 + 2] = stack.z + (Math.random() - 0.5) * 1.5;
      emberVel[i * 3] = (Math.random() - 0.5) * 1.5 + 1;
      emberVel[i * 3 + 1] = 3 + Math.random() * 4;
      emberVel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    };
    for (let i = 0; i < EMBERS; i++) {
      resetEmber(i);
      emberPos[i * 3 + 1] += Math.random() * 20;
    }

    // ───────── camera along the page ─────────
    let anchors: { key: string; y: number }[] = [];
    const measure = () => {
      anchors = Array.from(document.querySelectorAll<HTMLElement>('[data-cam]'))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { key: el.dataset.cam ?? '', y: r.top + window.scrollY + r.height / 2 };
        })
        .filter((a) => SHOTS[a.key])
        .sort((a, b) => a.y - b.y);
    };
    let target = 0;
    let dirty = true;
    const readScroll = () => {
      if (!anchors.length) return;
      const mid = window.scrollY + window.innerHeight / 2;
      if (mid <= anchors[0].y) target = 0;
      else if (mid >= anchors[anchors.length - 1].y) target = anchors.length - 1;
      else
        for (let i = 0; i < anchors.length - 1; i++)
          if (mid < anchors[i + 1].y) {
            target = i + (mid - anchors[i].y) / (anchors[i + 1].y - anchors[i].y);
            break;
          }
      if (still) dirty = true;
    };
    const kit = live.current.kit;
    const st = kit ? null : ScrollTrigger.create({ start: 0, end: 'max', onUpdate: readScroll, onRefresh: () => (measure(), readScroll()) });
    measure();
    readScroll();
    let t = target;
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();
    const tmpA = new THREE.Vector3();
    const tmpB = new THREE.Vector3();

    let W = 0;
    let H = 0;
    let wide = true;
    const resize = () => {
      const pix = kit ? kit.pix : window.innerWidth < 768 ? 2 : 3;
      wide = kit ? true : window.innerWidth >= 1024;
      W = Math.max(64, Math.ceil(window.innerWidth / pix));
      H = Math.max(64, Math.ceil(window.innerHeight / pix));
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      measure();
      readScroll();
      dirty = true;
    };
    window.addEventListener('resize', resize);
    resize();

    let doorOpen = 0;
    let kitShot: Shot = SHOTS.hero;
    let kitDoors = 0;
    const placeCamera = () => {
      if (kit) {
        doorOpen = kitDoors;
        camera.position.set(...kitShot.pos);
        camera.lookAt(...kitShot.look);
        camera.setViewOffset(W, H, -(kitShot.side ?? 0) * W * 0.5, 0, W, H);
        return;
      }
      if (!anchors.length) return;
      const i = Math.max(0, Math.min(anchors.length - 1, Math.floor(t)));
      const j = Math.min(anchors.length - 1, i + 1);
      const p = smooth(Math.max(0, Math.min(1, t - i)));
      const a = SHOTS[anchors[i].key];
      const b = SHOTS[anchors[j].key];
      lerp3(a.pos, b.pos, p, pos);
      lerp3(a.look, b.look, p, look);
      // long hops arc up over the island instead of ploughing through it; the way into the furnace is straight
      const hop = tmpA.set(...a.pos).distanceTo(tmpB.set(...b.pos));
      if (!(a.straight && b.straight)) pos.y += Math.sin(Math.PI * p) * Math.min(18, hop * 0.25);
      // the doors swing open on the last stretch to them, and stay open once you are through
      const di = anchors.findIndex((x) => x.key === 'door');
      doorOpen = di < 0 ? 0 : t >= di ? 1 : Math.max(0, Math.min(1, (t - (di - 0.65)) / 0.6));
      camera.position.copy(pos);
      camera.lookAt(look);
      mapStore.cam.x = pos.x;
      mapStore.cam.z = pos.z;
      mapStore.cam.yaw = Math.atan2(look.z - pos.z, look.x - pos.x);
      const side = wide ? (a.side ?? 0) + ((b.side ?? 0) - (a.side ?? 0)) * p : 0;
      // phones: panels sit low, so the subject is lifted into the top of the screen
      camera.setViewOffset(W, H, -side * W * 0.5, wide ? 0 : H * 0.2, W, H);
    };

    // ───────── the loop ─────────
    const trackLen = track.getLength();
    let u = 0;
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    let puffClock = 0;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const yAxis = new THREE.Vector3(0, 1, 0);

    const step = (dt: number, time: number) => {
      const { fill, running, burnedPercent, live: isLive } = live.current;
      const now = stageIndexFor(burnedPercent);
      if (now !== builtStage) {
        builtStage = now;
        buildYard(now);
        buildTrain(now);
      }
      // the burn, played out: doors open, the wagon rolls in, the fire roars up the stack, doors shut
      let burnDoor = 0;
      if (burnQueued.current) {
        burnQueued.current = false;
        if (still) flare.current = 1.6;
        else {
          burnT = 0;
          burnWagon.visible = true;
          mapStore.burning = true;
        }
      }
      if (burnT >= 0) {
        burnT += dt;
        burnDoor = burnT < 0.8 ? burnT / 0.8 : burnT < 5.4 ? 1 : Math.max(0, 1 - (burnT - 5.4));
        const k = Math.max(0, Math.min(1, (burnT - 0.4) / 3.4));
        if (burnWagon.visible) {
          const uu = smooth(k);
          const p = burnPath.getPointAt(uu);
          const tan = burnPath.getTangentAt(uu);
          burnWagon.position.set(p.x, 0.25, p.z);
          burnWagon.rotation.y = Math.atan2(-tan.z, tan.x);
          if (k >= 1) {
            // it is in: the fire takes it
            burnWagon.visible = false;
            flare.current = 1.8;
            emberBoost = 1;
            for (let n = 0; n < 12; n++) emit(stack.clone().add(tmpA.set((Math.random() - 0.5) * 2, n * 0.4, (Math.random() - 0.5) * 2)), 2.2, 5 + Math.random() * 3);
          }
        }
        if (burnT > 6.6) {
          burnT = -1;
          mapStore.burning = false;
        }
      }
      emberBoost = Math.max(0, emberBoost - dt * 0.3);
      flare.current = Math.max(0, flare.current - dt * 0.35);
      const heat = (isLive ? 0.3 + fill * 0.7 : 0.3) + flare.current;

      // the furnace breathes with the gauge
      const flick = 0.85 + 0.15 * Math.sin(time * 9.1) * Math.sin(time * 3.7);
      fireLight.intensity = (30 + 60 * heat) * flick;
      fx.doorMat.emissiveIntensity = (0.9 + 1.4 * heat) * flick;
      const doors = Math.max(smooth(doorOpen), smooth(burnDoor));
      fx.open(doors);
      spill.intensity = (10 + 90 * heat) * doors * flick;
      fireClock += dt;
      if (fireClock > 0.05 || dt === 0) {
        fireClock = 0;
        inside.step(Math.min(1, heat));
      }
      molten.material.emissiveIntensity = 0.5 + 0.15 * Math.sin(time * 0.8);
      ground.emberMat.emissiveIntensity = 0.9 + 0.5 * Math.sin(time * 2.3) * Math.sin(time * 1.1);
      const sp = molten.geo.attributes.position as THREE.BufferAttribute;
      for (let k = 0; k < sp.count; k++) sp.setY(k, Math.sin(time * 0.9 + molten.base[k * 3] * 0.15) * 0.25 + Math.cos(time * 0.7 + molten.base[k * 3 + 2] * 0.12) * 0.25);
      sp.needsUpdate = true;

      // the gauge tower's needle
      const ang = THREE.MathUtils.degToRad(135 - 270 * (isLive ? fill : 0));
      gt.needle.rotation.z += (ang - gt.needle.rotation.z) * Math.min(1, dt * 3);

      // the train
      const speed = running ? 11 : 6;
      u = (u + (speed * dt) / trackLen) % 1;
      const cars: [THREE.Object3D, number][] = [[loco.group, 0], [wagons[0], -(loco.length / 2 + 2.2)], [wagons[1], -(loco.length / 2 + 5.6)]];
      for (const [obj, off] of cars) {
        const uu = (u + off / trackLen + 1) % 1;
        const p = track.getPointAt(uu);
        const tan = track.getTangentAt(uu);
        obj.position.set(p.x, 0.25, p.z);
        obj.rotation.y = Math.atan2(-tan.z, tan.x);
      }
      mapStore.train.x = loco.group.position.x;
      mapStore.train.z = loco.group.position.z;
      for (const w of loco.wheels) w.rotation.y -= dt * speed * 1.4;

      // puffs: the engine's chimney always, the water tower at a full gauge or mid-run
      puffClock += dt;
      if (puffClock > 0.18) {
        puffClock = 0;
        emit(loco.chimney.clone().applyMatrix4(loco.group.matrixWorld), 0.7, 2.5);
        if (isLive && (fill >= 0.88 || running)) emit(wt.whistle.clone().add(wt.group.position), 1.1, 4);
        if (Math.random() < 0.5) emit(stack.clone(), 1.6, 3);
      }
      puffState.forEach((s, k) => {
        if (s.life > 0) {
          s.life -= dt * 0.45;
          s.p.addScaledVector(s.v, dt);
          s.v.x += dt * 0.4;
        }
        const sc = s.life > 0 ? s.size * (1.6 - s.life) : 0.0001;
        q.setFromAxisAngle(yAxis, k);
        m4.compose(s.p, q, tmpA.set(sc, sc, sc));
        puffs.setMatrixAt(k, m4);
      });
      puffs.instanceMatrix.needsUpdate = true;

      // embers: more of them when it burns hard
      const active = Math.round(EMBERS * Math.min(1, 0.3 + heat * 0.7 + emberBoost));
      const lift = 1 + emberBoost * 1.8;
      for (let k = 0; k < EMBERS; k++) {
        if (k >= active) {
          emberPos[k * 3 + 1] = -50;
          continue;
        }
        emberPos[k * 3] += emberVel[k * 3] * dt;
        emberPos[k * 3 + 1] += emberVel[k * 3 + 1] * dt * lift;
        emberPos[k * 3 + 2] += emberVel[k * 3 + 2] * dt;
        if (emberPos[k * 3 + 1] > stack.y + 22 || emberPos[k * 3 + 1] < 0) resetEmber(k);
      }
      emberGeo.attributes.position.needsUpdate = true;
    };

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (nowMs - last) / 1000);
      last = nowMs;
      acc += dt;
      if (acc < 1 / 30) return;
      const d = acc;
      acc = 0;
      t += (target - t) * (1 - Math.exp(-d * 3.5));
      step(d, nowMs / 1000);
      placeCamera();
      renderer.render(scene, camera);
      reveal();
    };

    const renderStill = () => {
      if (!dirty) return;
      dirty = false;
      t = Math.round(target);
      step(0, 0);
      placeCamera();
      renderer.render(scene, camera);
      reveal();
    };

    // the canvas starts hidden over the poster and steps in once it has a frame
    let shown = false;
    const reveal = () => {
      if (shown) return;
      shown = true;
      canvas.style.opacity = '1';
    };
    let stillTimer = 0;
    const start = () => {
      cancelAnimationFrame(raf);
      window.clearInterval(stillTimer);
      if (document.hidden) return;
      if (still) stillTimer = window.setInterval(renderStill, 200);
      else {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    let kitTime = 0;
    if (kit) {
      canvas.style.opacity = '1';
      window.__stokerKit = {
        setShot: (s) => (kitShot = s),
        setDoors: (v) => (kitDoors = v),
        burn: () => (burnQueued.current = true),
        step: (dt) => {
          kitTime += dt;
          step(dt, kitTime);
          placeCamera();
          renderer.render(scene, camera);
        },
      };
    } else {
      document.addEventListener('visibilitychange', start);
      // fonts for the signs, then the first frame
      (document.fonts?.ready ?? Promise.resolve()).then(() => {
        measure();
        readScroll();
        start();
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(stillTimer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', start);
      st?.kill();
      if (kit) delete window.__stokerKit;
      renderer.dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={`pixelated pointer-events-none ${props.kit ? "absolute" : "fixed"} inset-0 z-0 block h-full w-full opacity-0 transition-opacity duration-500 ease-[steps(5)]`} />;
}
