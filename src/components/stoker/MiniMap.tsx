import { useEffect, useRef, useState } from 'react';
import { mapStore, STATIONS } from './world/mapStore';

/** map units: one art pixel per world unit, x -64..64, z -48..48 */
const W = 128;
const H = 96;
const px = (x: number) => Math.round(x + W / 2);
const pz = (z: number) => Math.round(z + H / 2);

/** Fly the page to a station: centre its section's camera stop on the screen. */
function goTo(cam: string) {
  const el = document.querySelector<HTMLElement>(`[data-cam="${cam}"]`);
  if (!el) return;
  const r = el.getBoundingClientRect();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: r.top + window.scrollY + r.height / 2 - window.innerHeight / 2, behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * A pixel mini-map of the island in the corner: the ground, the line, the stations, the train
 * going round, and where the camera is looking from. Click a station to fly there. It appears once
 * the 3D map has built the island, and redraws on its own ten-a-second clock.
 */
export function MiniMap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let base: ImageData | null = null;
    let tick = 0;
    const id = window.setInterval(() => {
      // stay out of the first view, where the panel needs the corner
      const past = window.scrollY > window.innerHeight * 0.7;
      if (navRef.current) navRef.current.dataset.away = past ? 'false' : 'true';
      const layout = mapStore.layout;
      const ctx = ref.current?.getContext('2d');
      if (!layout || !ctx) return;
      if (!base) {
        setReady(true);
        // the island, drawn once: ground cells, then the line on top
        ctx.fillStyle = '#1a0805';
        ctx.fillRect(0, 0, W, H);
        for (const c of layout.cells) {
          ctx.fillStyle = `#${c.color.toString(16).padStart(6, '0')}`;
          ctx.fillRect(px(c.x) - 1, pz(c.z) - 1, 2, 2);
        }
        ctx.fillStyle = '#c9bfb6';
        for (const t of layout.track) ctx.fillRect(px(t.x), pz(t.z), 1, 1);
        base = ctx.getImageData(0, 0, W, H);
      }
      tick++;
      ctx.putImageData(base, 0, 0);
      // stations: brass squares, the furnace bigger and ember, pulsing while a burn plays out
      for (const s of layout.stations) {
        const furnace = s.key === 'furnace';
        const size = furnace ? (mapStore.burning && tick % 4 < 2 ? 7 : 5) : 3;
        ctx.fillStyle = '#0f0d0d';
        ctx.fillRect(px(s.x) - (size >> 1) - 1, pz(s.z) - (size >> 1) - 1, size + 2, size + 2);
        ctx.fillStyle = furnace ? '#ff5a1f' : '#d4a648';
        ctx.fillRect(px(s.x) - (size >> 1), pz(s.z) - (size >> 1), size, size);
      }
      // the train
      ctx.fillStyle = '#ffa630';
      ctx.fillRect(px(mapStore.train.x) - 1, pz(mapStore.train.z) - 1, 2, 2);
      // the camera: a white square with a line the way it looks
      const { x, z, yaw } = mapStore.cam;
      const cx = Math.max(2, Math.min(W - 3, px(x)));
      const cz = Math.max(2, Math.min(H - 3, pz(z)));
      ctx.fillStyle = '#eee9e2';
      for (let k = 2; k < 8; k++) ctx.fillRect(Math.round(cx + Math.cos(yaw) * k), Math.round(cz + Math.sin(yaw) * k), 1, 1);
      ctx.fillStyle = '#0f0d0d';
      ctx.fillRect(cx - 2, cz - 2, 5, 5);
      ctx.fillStyle = '#eee9e2';
      ctx.fillRect(cx - 1, cz - 1, 3, 3);
      // name the station the camera is looking at
      let best = STATIONS[0];
      let bestD = Infinity;
      const lx = x + Math.cos(yaw) * 18;
      const lz = z + Math.sin(yaw) * 18;
      for (const s of layout.stations) {
        const d = (s.x - lx) ** 2 + (s.z - lz) ** 2;
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }
      if (labelRef.current && labelRef.current.textContent !== best.label) labelRef.current.textContent = best.label;
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W - W / 2;
    const z = ((e.clientY - r.top) / r.height) * H - H / 2;
    let best = STATIONS[0];
    let bestD = Infinity;
    for (const s of STATIONS) {
      const d = (s.x - x) ** 2 + (s.z - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (bestD < 14 * 14) goTo(best.cam);
  };

  return (
    <nav ref={navRef} data-away="true" aria-label="Island map" className={`map-panel fixed bottom-4 left-4 z-30 hidden p-2 transition-[opacity,translate] duration-300 ease-[steps(3)] data-[away=true]:pointer-events-none data-[away=true]:translate-y-6 data-[away=true]:opacity-0 md:block ${ready ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <canvas ref={ref} width={W} height={H} onClick={pick} className="pixelated block h-[120px] w-[160px] cursor-pointer lg:h-[144px] lg:w-[192px]" aria-hidden="true" />
      <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
        <span className="stencil text-[0.68rem] text-ash">map</span>
        <span ref={labelRef} className="plate-type truncate text-[1rem] text-steam" aria-live="off" />
      </div>
      {/* the same jumps for keyboards and screen readers */}
      <ul className="sr-only">
        {STATIONS.map((s) => (
          <li key={s.key}>
            <button type="button" onClick={() => goTo(s.cam)}>
              Go to {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
