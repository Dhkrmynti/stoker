import { useEffect, useRef } from 'react';

interface LocomotiveProps {
  lead: number;
  drive: number;
  trail: number;
  /** not unlocked yet: drawn as a dotted works drawing */
  locked?: boolean;
  /** wheels turn */
  running?: boolean;
  className?: string;
  label: string;
  /** leave out the rail and sleepers, for when the page draws its own */
  noRail?: boolean;
}

const RD = 6; // driving wheel radius, art pixels
const RS = 3; // carrying wheel radius
const RAIL = 30; // top of the rail
const H = 33;
const COL = {
  body: '#2c2524',
  bodyHi: '#3d3432',
  dark: '#211c1b',
  iron: '#171414',
  rim: '#aaa098',
  spoke: '#6d6560',
  brass: '#d4a648',
  brassLo: '#8a6a24',
  ember: '#ff5a1f',
  emberLo: '#b8321a',
  soot: '#0f0d0d',
  rail: '#6d6560',
  sleeper: '#3a3230',
  seam: '#5c514c',
};

interface Layout {
  W: number;
  front: number;
  wheels: { cx: number; r: number; driver: boolean }[];
  firstDriver: number;
  lastDriver: number;
}

function layout(lead: number, drive: number, trail: number): Layout {
  const wheels: Layout['wheels'] = [];
  let x = trail > 0 ? 6 : 5;
  for (let i = 0; i < trail; i++) {
    wheels.push({ cx: x + RS, r: RS, driver: false });
    x += RS * 2 + 2;
  }
  const firstDriver = x + RD;
  for (let i = 0; i < drive; i++) {
    wheels.push({ cx: x + RD, r: RD, driver: true });
    x += RD * 2 + 1;
  }
  const lastDriver = x - 1 - RD;
  x += 2;
  for (let i = 0; i < lead; i++) {
    wheels.push({ cx: x + RS, r: RS, driver: false });
    x += RS * 2 + 2;
  }
  const front = Math.max(x + 4, lastDriver + RD + 13);
  return { W: front + 3, front, wheels, firstDriver, lastDriver };
}

/** Draw the engine at one wheel frame (0..3). */
function paint(ctx: CanvasRenderingContext2D, L: Layout, frame: number, locked: boolean, noRail: boolean) {
  const { W, front, wheels, firstDriver, lastDriver } = L;
  const r = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  ctx.clearRect(0, 0, W, H);
  const cabL = 2;
  const cabR = 17;
  const smoke = front - 10;
  const mid = Math.round((cabR + smoke) / 2);

  // frame, running board, cylinder, buffer beam
  r(cabL + 1, 24, front - cabL - 1, 2, COL.iron);
  r(cabL, 23, front - cabL + 1, 1, COL.bodyHi);
  r(front - 13, 24, 8, 4, COL.dark);
  r(front, 20, 2, 6, COL.emberLo);
  // boiler with brass bands, smokebox, chimney, dome, safety valve
  r(cabR, 12, smoke - cabR, 11, COL.body);
  r(cabR, 12, smoke - cabR, 1, COL.bodyHi);
  for (let b = cabR + 6; b < smoke - 2; b += 8) r(b, 12, 1, 11, COL.brass);
  r(smoke, 11, front - smoke, 12, COL.dark);
  r(smoke + 3, 5, 4, 6, COL.dark);
  r(smoke + 2, 4, 6, 2, COL.dark);
  r(mid - 2, 9, 5, 1, COL.brass);
  r(mid - 3, 10, 7, 2, COL.brass);
  r(cabR + 3, 10, 2, 2, COL.brass);
  // cab, roof, window, the fire showing through
  r(cabL, 8, cabR - cabL, 15, COL.body);
  r(cabL - 1, 6, cabR - cabL + 3, 2, COL.dark);
  r(cabL + 4, 10, 6, 5, COL.soot);
  if (!locked) r(cabR - 4, 18, 3, 3, frame % 2 ? COL.ember : '#ffa630');

  // wheels: iron disc, light rim, spokes at this frame, brass hub
  for (const w of wheels) {
    const cy = RAIL - w.r;
    for (let y = -w.r; y <= w.r; y++)
      for (let x = -w.r; x <= w.r; x++) {
        const d = Math.hypot(x, y);
        if (d > w.r + 0.3) continue;
        r(w.cx + x, cy + y, 1, 1, d > w.r - 0.8 ? COL.rim : COL.iron);
      }
    if (w.driver) {
      for (let s = 0; s < 4; s++) {
        const a = ((s * 45 + frame * 22.5) * Math.PI) / 180;
        for (let k = 1; k < w.r - 1; k++) {
          r(Math.round(w.cx + Math.cos(a) * k), Math.round(cy + Math.sin(a) * k), 1, 1, COL.spoke);
          r(Math.round(w.cx - Math.cos(a) * k), Math.round(cy - Math.sin(a) * k), 1, 1, COL.spoke);
        }
      }
    }
    r(w.cx, cy, 1, 1, COL.brass);
  }
  // coupling rod rides round with the cranks
  if (wheels.filter((w) => w.driver).length > 1) {
    const a = (frame * Math.PI) / 2;
    const dx = Math.round(Math.cos(a) * 2);
    const dy = Math.round(Math.sin(a) * 2);
    r(firstDriver + dx, RAIL - RD + dy, lastDriver - firstDriver + 1, 1, COL.brassLo);
  }

  if (locked) {
    // a works drawing: keep only the outline, every other pixel
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
    const keep: boolean[] = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) keep.push(solid(x, y) && (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) && (x + y) % 2 === 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COL.seam;
    keep.forEach((k, i) => k && ctx.fillRect(i % W, Math.floor(i / W), 1, 1));
  }

  if (!noRail) {
    r(0, RAIL, W, 1, COL.rail);
    for (let x = 1; x < W; x += 4) r(x, RAIL + 1, 2, 2, COL.sleeper);
  }
}

/**
 * A side elevation of a steam engine in pixels, built from its wheel arrangement, facing right.
 * The fire glows through the cab; when it runs, the spokes and the coupling rod turn at 8 fps.
 */
export function Locomotive({ lead, drive, trail, locked = false, running = false, className = '', label, noRail = false }: LocomotiveProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const L = layout(lead, drive, trail);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    paint(ctx, L, frame, locked, noRail);
    if (!running || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => {
        frame = (frame + 1) % 4;
        paint(ctx, L, frame, locked, noRail);
      }, 125);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : window.clearInterval(timer)));
    io.observe(canvas);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
    };
    // the layout is derived from the wheel counts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead, drive, trail, locked, running, noRail]);

  return (
    <canvas
      ref={ref}
      width={L.W}
      height={H}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={`pixelated block ${className}`}
    />
  );
}
