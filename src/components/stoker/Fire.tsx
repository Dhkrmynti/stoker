import { useEffect, useRef } from 'react';

interface FireProps {
  /** 0..1: how hard it burns. The page feeds it the fee gauge, so trading literally stokes it. */
  intensity: number;
  /** change this to make it flare up (a stoke, a fresh burn) */
  flareKey?: string | number | null;
  className?: string;
  label?: string;
  /** art pixels across; the height follows the box */
  cols?: number;
  /**
   * drive the fire from outside, 0..1, without re-rendering: 0 lets it die down to nothing,
   * 1 sends the flames to the top of the box (the scroll-driven wall of fire uses this)
   */
  heatRef?: { current: number };
  /** cold cells are see-through and there is no coal, so the fire stands over whatever is behind */
  clear?: boolean;
}

/** A 37-step fire ramp, warmer than the classic one: soot, through red and orange, to white-hot. */
const STOPS: [number, number][] = [
  [0, 0x0b0807],
  [4, 0x3a0a05],
  [10, 0x8f1d07],
  [16, 0xd9400a],
  [21, 0xff6a1a],
  [26, 0xffa630],
  [31, 0xffd166],
  [34, 0xfff2c0],
  [36, 0xffffff],
];
const RAMP = Array.from({ length: 37 }, (_, i) => {
  const j = STOPS.findIndex(([at]) => at >= i);
  if (STOPS[j][0] === i) return STOPS[j][1];
  const [a0, c0] = STOPS[j - 1];
  const [a1, c1] = STOPS[j];
  const t = (i - a0) / (a1 - a0);
  const mix = (sh: number) => Math.round(((c0 >> sh) & 255) * (1 - t) + ((c1 >> sh) & 255) * t);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
});
const TOP = RAMP.length - 1;
const COAL = [0x140d0b, 0x24160f, 0x3a2216];

/**
 * A pixel coal fire: the old demo-scene fire spread. Heat is fed in along the bottom row and
 * drifts up, cooling and wandering sideways one cell at a time, drawn through a black-red-white
 * ramp and scaled up without smoothing. A heap of coal sits on the grate, glowing in spots.
 * It ticks at 20 fps, sleeps off screen, and draws one settled frame under reduced motion.
 */
export function Fire({ intensity, flareKey, className = '', label, cols = 80, heatRef, clear = false }: FireProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const heat = useRef(intensity);
  const flare = useRef(0);
  heat.current = intensity;

  useEffect(() => {
    if (flareKey == null) return;
    flare.current = 1;
  }, [flareKey]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = cols;
    let H = 48;
    let fire = new Uint8Array(W * H);
    let coal: Int8Array = new Int8Array(0); // per cell: -1 none, else coal shade index
    let img = ctx.createImageData(W, H);
    let timer = 0;
    let visible = true;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rgb = RAMP.map((c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]);
    const coalRgb = COAL.map((c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255]);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = cols;
      H = Math.max(16, Math.round((rect.height / Math.max(1, rect.width)) * cols));
      canvas.width = W;
      canvas.height = H;
      fire = new Uint8Array(W * H);
      img = ctx.createImageData(W, H);
      // the coal heap: a lumpy mound along the grate, a few cells tall
      coal = new Int8Array(W * H).fill(-1);
      if (clear) return;
      const heapH = Math.max(3, Math.round(H * 0.12));
      let lump = 0;
      for (let x = 0; x < W; x++) {
        if (x % 4 === 0) lump = Math.round(Math.random() * 2);
        const h = heapH - 1 + lump - (x === 0 || x === W - 1 ? 1 : 0);
        for (let y = H - h; y < H; y++) coal[y * W + x] = (x + y) % 3 === 0 ? 2 : (x * 7 + y) % 5 === 0 ? 1 : 0;
      }
    };

    const step = () => {
      flare.current = Math.max(0, flare.current - 0.012);
      const k = heatRef ? Math.max(0, Math.min(1, heatRef.current)) : Math.min(1, 0.32 + heat.current * 0.68 + flare.current * 0.8);
      // feed the bottom row; gaps in it make the flames ragged. Driven from outside, no heat means no feed
      const base = (H - 1) * W;
      for (let x = 0; x < W; x++) fire[base + x] = heatRef && k < 0.03 ? 0 : Math.random() < 0.15 + k * 0.8 ? TOP : Math.max(0, TOP - 12);
      // cool each step just enough that the flames stand at a share of the box: higher when it burns harder
      // driven to zero, what is left cools at once instead of floating off the grate
      const reach = heatRef ? (k < 0.03 ? 0.02 : 0.05 + 1.2 * k) : 0.34 + 0.5 * k;
      const decay = TOP / Math.max(4, reach * H);
      const whole = Math.floor(decay);
      const part = decay - whole;
      for (let x = 0; x < W; x++) {
        for (let y = 1; y < H; y++) {
          const src = y * W + x;
          const p = fire[src];
          if (p === 0) {
            fire[src - W] = 0;
            continue;
          }
          const r = (Math.random() * 3) | 0;
          const dst = Math.min(W * H - 1, Math.max(W, src - r + 1));
          const cool = whole + (Math.random() < part ? 1 : 0);
          fire[dst - W] = Math.max(0, p - cool);
        }
      }
    };

    let tick = 0;
    const draw = () => {
      tick++;
      const d = img.data;
      for (let i = 0; i < W * H; i++) {
        let c: number[];
        const cs = coal[i];
        if (cs >= 0) {
          // coal glows where the fire behind it is hottest, and flickers
          const glow = fire[i] > TOP - 6 && (i * 31 + tick) % 11 === 0;
          c = glow ? rgb[24 + ((i + tick) % 6)] : coalRgb[cs];
        } else {
          c = rgb[fire[i]];
        }
        const o = i * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = clear && cs < 0 && fire[i] < 3 ? 0 : 255;
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = () => {
      step();
      draw();
    };
    const start = () => {
      window.clearInterval(timer);
      if (!still && visible && !document.hidden) timer = window.setInterval(loop, 50);
    };
    const settle = () => {
      for (let i = 0; i < H * 2; i++) step();
      draw();
    };

    resize();
    settle();
    start();

    const ro = new ResizeObserver(() => {
      resize();
      settle();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else window.clearInterval(timer);
    });
    io.observe(canvas);
    const onVis = () => start();
    document.addEventListener('visibilitychange', onVis);

    return () => {
      window.clearInterval(timer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [cols]);

  return <canvas ref={ref} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`pixelated block ${className}`} />;
}
