import { useEffect, useRef } from 'react';

interface GaugeProps {
  /** 0..1 of the claim threshold */
  fill: number;
  /** what the dial face says under the needle, e.g. "0.0042 ETH" */
  reading: string;
  live: boolean;
  className?: string;
}

const N = 48; // art pixels across
const C = (N - 1) / 2;
const SWEEP = 270;
const START = -135;
const COL = {
  brassHi: '#ecc97a',
  brass: '#d4a648',
  brassLo: '#8a6a24',
  face: '#ece3cb',
  faceLo: '#cfc1a0',
  ink: '#1d1814',
  red: '#b8321a',
  needle: '#ff5a1f',
};

/** Paint one art pixel. */
const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
};
const toXY = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};

/** The dial without the needle: bezel, face, red line, ticks. */
function paintDial(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, N, N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = x - C;
      const dy = y - C;
      const d = Math.hypot(dx, dy);
      if (d > C + 0.5) continue;
      if (d > C - 0.6) dot(ctx, x, y, COL.brassLo);
      else if (d > C - 2.6) dot(ctx, x, y, dx + dy < 0 ? COL.brassHi : COL.brass);
      else if (d > C - 3.4) dot(ctx, x, y, COL.brassLo);
      else dot(ctx, x, y, d > C - 4.6 && dx + dy > 0 ? COL.faceLo : COL.face);
    }
  // the red line: a full gauge
  for (let a = START + SWEEP * 0.86; a <= START + SWEEP; a += 1.5)
    for (const r of [16, 17, 18]) {
      const [x, y] = toXY(a, r);
      dot(ctx, x, y, COL.red);
    }
  for (let i = 0; i <= 20; i++) {
    const a = START + (SWEEP * i) / 20;
    const major = i % 5 === 0;
    for (let r = major ? 14 : 17; r <= 19; r++) {
      const [x, y] = toXY(a, r);
      dot(ctx, x, y, COL.ink);
    }
  }
}

/** Needle from the hub out, one pixel at a time, with a brass hub on top. */
function paintNeedle(ctx: CanvasRenderingContext2D, deg: number) {
  for (let r = -3; r <= 15; r += 0.5) {
    const [x, y] = toXY(deg, r);
    dot(ctx, x, y, r > 11 ? COL.needle : COL.red);
  }
  ctx.fillStyle = COL.brassLo;
  ctx.fillRect(Math.round(C) - 2, Math.round(C) - 2, 4, 4);
  ctx.fillStyle = COL.brassHi;
  ctx.fillRect(Math.round(C) - 1, Math.round(C) - 1, 2, 2);
}

/**
 * The fee pressure gauge on the boiler backhead, in pixels. The needle is the fee escrow over the
 * claim threshold: when it reaches the red line, the whistle blows and the bot claims. It ticks
 * toward a new reading a few degrees at a time, like a sprite.
 */
export function Gauge({ fill, reading, live, className = '' }: GaugeProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const shown = useRef(START);
  const f = Math.max(0, Math.min(1, fill));
  const target = live ? START + SWEEP * f : START;
  const pct = Math.round(f * 100);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const paint = (deg: number) => {
      paintDial(ctx);
      paintNeedle(ctx, deg);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = target;
      paint(target);
      return;
    }
    paint(shown.current);
    const id = window.setInterval(() => {
      const diff = target - shown.current;
      if (Math.abs(diff) < 0.5) {
        window.clearInterval(id);
        return;
      }
      shown.current += Math.sign(diff) * Math.min(Math.abs(diff), 9);
      paint(shown.current);
    }, 70);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <div className={`relative [container-type:inline-size] ${className}`} role="img" aria-label={live ? `Fee pressure gauge: ${pct}% of a full gauge, ${reading}` : 'Fee pressure gauge, lit at launch'}>
      <canvas ref={ref} width={N} height={N} className="pixelated block aspect-square w-full" aria-hidden="true" />
      <span aria-hidden="true" className="stencil absolute inset-x-0 top-[27%] text-center text-[7cqw] leading-none text-pen-soft">
        fee
      </span>
      <span aria-hidden="true" className="plate-type absolute inset-x-0 top-[64%] text-center text-[11cqw] leading-none text-ticket-ink">
        {live ? reading : 'cold'}
      </span>
    </div>
  );
}
