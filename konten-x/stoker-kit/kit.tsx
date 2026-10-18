/**
 * Renders the $COAL X kit from the site's own 3D map and pixel parts. Open with ?shot=<name> at
 * the asset's size; `render.mjs` drives it frame by frame through `window.__kitFrame` and
 * screenshots it (see ../stoker/caption.md for the list).
 */
import { useEffect, type ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/jersey-10/400.css';
import '@fontsource/tiny5/400.css';
import '@fontsource/dotgothic16/400.css';
import '../../src/index.css';
import World, { type Shot } from '../../src/components/stoker/world/World';
import { StokerMark } from '../../src/components/stoker/Mark';
import { Locomotive } from '../../src/components/stoker/Locomotive';
import { STAGES } from '../../src/components/stoker/stages';

declare global {
  interface Window {
    /** set frame i of n: camera, doors, overlays; then the renderer screenshots */
    __kitFrame?: (i: number, n: number) => void;
  }
}

const q = new URLSearchParams(window.location.search);
const SHOT = q.get('shot') || 'og';
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Where the camera sits for each still, and for the start of each film. */
const VIEWS: Record<string, Shot> = {
  og: { pos: [-6, 15, 34], look: [-40, 5, 0], side: 0.42 },
  banner: { pos: [34, 40, 74], look: [-6, -2, -2], side: -0.52 },
  meme: { pos: [-23, 4.6, 7], look: [-46, 3, 0], side: 0 },
  classes: { pos: [0, 15, 60], look: [0, 0.5, 15], side: 0 },
  receipt: { pos: [-25, 5, 8], look: [-46, 3.4, 0], side: 0 },
  burn: { pos: [-15, 11, 21], look: [-37, 2, 2], side: 0 },
  'tile-gauge': { pos: [-12, 10, 2], look: [-22, 7, -21], side: 0 },
  'tile-whistle': { pos: [6, 11, 0], look: [-4, 7, -22], side: 0 },
  'tile-coal': { pos: [22, 9, 0], look: [12, 4, -22], side: 0 },
  'tile-furnace': { pos: [-24, 7, 9], look: [-44, 3, 0], side: 0 },
  // one close-up per class platform, west to east
  ...Object.fromEntries([-26, -13, 0, 13, 26].map((x, i) => [`tile-class-${i}`, { pos: [x + 4.5, 4.2, 25.5], look: [x, 1.6, 17], side: 0 } as Shot])),
};

/** The prelaunch film: a slow orbit round the island, ending square on the furnace doors. */
function orbit(t: number): Shot {
  if (t < 0.72) {
    const a = lerp(0.5, 2.6, t / 0.72);
    return { pos: [Math.cos(a) * 72, 36 - t * 10, Math.sin(a) * 60], look: [-6, 0, 0], side: 0 };
  }
  const k = smooth((t - 0.72) / 0.28);
  const from: Shot = orbit(0.7199);
  return {
    pos: [lerp(from.pos[0], -22, k), lerp(from.pos[1], 5, k), lerp(from.pos[2], 0, k)],
    look: [lerp(-6, -46, k), lerp(0, 3, k), 0],
    side: 0,
  };
}

const setOpacity = (sel: string, v: number) => document.querySelectorAll<HTMLElement>(sel).forEach((el) => (el.style.opacity = String(v)));

/** Per frame: camera, doors and which overlay lines are showing. */
function frame(i: number, n: number) {
  const k = window.__stokerKit;
  if (!k) return;
  const t = n > 1 ? i / (n - 1) : 0;
  if (SHOT === 'prelaunch') {
    k.setShot(orbit(t));
    k.setDoors(0);
    setOpacity('[data-at="start"]', t < 0.66 ? 1 : 0);
    setOpacity('[data-at="end"]', t > 0.8 ? 1 : 0);
  } else if (SHOT === 'burn') {
    k.setShot(VIEWS.burn);
    if (i === 0) k.burn();
    setOpacity('[data-at="end"]', t > 0.6 && t < 0.97 ? 1 : 0);
  } else {
    k.setShot(VIEWS[SHOT] ?? VIEWS.og);
    k.setDoors(SHOT === 'meme' || SHOT === 'receipt' || SHOT === 'tile-furnace' ? 1 : 0);
  }
  k.step(n > 1 ? 1 / (SHOT === 'burn' ? 12 : 24) : 0.05);
}

/** A full-bleed frame: the map behind, whatever goes on top. */
function MapFrame({ children, burned = 0.3 }: { children?: ReactNode; burned?: number }) {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-soot">
      <World kit={{ pix: 3 }} fill={0.7} burnedPercent={burned} live running={false} burnKey={null} stokes={0} />
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

const Word = ({ className = '' }: { className?: string }) => <div className={`plate-type map-type m-0 text-steam ${className}`}>Stoker</div>;

/** The 16×16 mark on a banded ember glow: reads at avatar size and crops to a circle. */
function Logo() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[radial-gradient(circle_at_50%_52%,#ffa630_0_18%,#ff5a1f_18%_30%,#b8321a_30%_42%,#5c1a0a_42%_56%,#1a0805_56%)]">
      <StokerMark className="h-[64%] w-[64%] drop-shadow-[0_3vmin_0_rgba(0,0,0,0.5)]" />
    </div>
  );
}

function Kit() {
  useEffect(() => {
    window.__kitFrame = frame;
  }, []);

  switch (SHOT) {
    case 'logo':
      return <Logo />;
    case 'og':
      return (
        <MapFrame>
          <div className="flex h-full flex-col justify-center pl-[6%]">
            <Word className="text-[150px]" />
            <p className="map-type m-0 mt-3 max-w-[13em] text-[34px] leading-tight text-steam">Every trade stokes the fire. A full gauge burns $COAL for good.</p>
            <div className="mt-7 flex items-center gap-4">
              <span className="btn-buy px-5 py-3 text-[26px]">$COAL</span>
              <span className="stencil map-type text-[20px] text-ash">buyback &amp; burn · robinhood chain</span>
            </div>
          </div>
        </MapFrame>
      );
    case 'banner':
      return (
        <MapFrame>
          <div className="flex h-full flex-col items-end justify-center pr-[5%] text-right">
            <Word className="text-[140px]" />
            <p className="map-type m-0 mt-2 text-[30px] text-steam">Every trade stokes the fire.</p>
            <p className="stencil map-type m-0 mt-3 text-[20px] text-brass-hi">$COAL · buyback &amp; burn · robinhood chain</p>
          </div>
        </MapFrame>
      );
    case 'prelaunch':
      return (
        <MapFrame burned={0}>
          <div className="flex h-full flex-col items-center justify-between py-[12%] text-center">
            <div data-at="start">
              <Word className="text-[170px]" />
              <p className="map-type m-0 mt-3 text-[40px] text-steam">An engine that burns its own supply.</p>
            </div>
            <div data-at="end" style={{ opacity: 0 }} className="map-panel px-10 py-8">
              <p className="plate-type m-0 text-[88px] text-steam">The fire is lit.</p>
              <p className="stencil m-0 mt-3 text-[30px] text-brass-hi">$COAL · soon on robinhood chain</p>
            </div>
          </div>
        </MapFrame>
      );
    case 'burn':
      return (
        <MapFrame>
          <div className="flex h-full flex-col items-center justify-between py-[7%] text-center">
            <p className="stencil map-type m-0 text-[30px] text-brass-hi">every full gauge</p>
            <div data-at="end" style={{ opacity: 0 }}>
              <p className="plate-type map-type m-0 text-[104px] text-steam">Into the fire.</p>
              <p className="stencil map-type m-0 mt-2 text-[26px] text-ember">$COAL · gone for good</p>
            </div>
          </div>
        </MapFrame>
      );
    case 'meme':
      return (
        <MapFrame>
          <div className="flex h-full flex-col items-center justify-between py-[6%] text-center">
            <p className="plate-type map-type m-0 px-6 text-[110px] text-steam">Sold your $COAL?</p>
            <p className="plate-type map-type m-0 px-10 text-[76px] leading-[0.9] text-steam">Nothing comes back out of a firebox.</p>
          </div>
        </MapFrame>
      );
    case 'classes':
      return (
        <div className="flex h-screen w-screen flex-col gap-6 bg-soot p-12">
          <div className="flex items-end justify-between gap-10">
            <p className="plate-type m-0 text-[96px] text-steam">The engine grows as the supply burns.</p>
            <p className="m-0 max-w-[24ch] pb-3 text-right text-[26px] text-ash">Each class rolls out of the shed when enough $COAL has gone to 0x…dEaD.</p>
          </div>
          <div className="flex flex-1 items-center">
            {/* the five classes on one line of track, smallest to biggest; locked ones as dotted works drawings */}
            <div className="flex w-full items-end justify-between gap-6">
              {STAGES.map((s, i) => (
                <div key={s.n} style={{ width: `${(s.lead * 8 + s.drive * 13 + s.trail * 8 + 30) * 3.3}px` }}>
                  {i === 0 ? <div className="stencil mb-4 inline-block bg-brass px-3 py-1.5 text-[18px] text-soot">on the line now</div> : null}
                  <Locomotive lead={s.lead} drive={s.drive} trail={s.trail} locked={i > 0} running={false} label="" className="h-auto w-full" />
                  <div className={`plate-type mt-6 text-[52px] ${i === 0 ? 'text-brass-hi' : 'text-ash'}`}>{s.wheels}</div>
                  <div className={`plate-type text-[30px] ${i === 0 ? 'text-steam' : 'text-ash'}`}>{s.name}</div>
                  <div className="stencil mt-1 text-[17px] text-ash">{s.from === 0 ? 'day one' : `at ${s.from}% burned`}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'receipt': {
      const amount = q.get('amount') || '0,000,000';
      const n = q.get('n') || '0001';
      const tx = q.get('tx') || '0x…';
      const date = q.get('date') || 'Oct 00, 00:00';
      return (
        <MapFrame>
          <div className="flex h-full flex-col items-center justify-center gap-10 px-[8%]">
            <p className="plate-type map-type m-0 text-center text-[120px] text-steam">Into the fire.</p>
            <div className="ticket w-full py-10 pl-20 pr-28">
              <div className="flex items-baseline justify-between">
                <span className="stencil text-[26px] text-ticket-band">firebox, single</span>
                <span className="font-mono text-[28px]">No. {n.padStart(4, '0')}</span>
              </div>
              <div className="mt-6 flex items-baseline gap-4">
                <span className="plate-type text-[150px] leading-none">{amount}</span>
                <span className="stencil text-[36px]">$COAL</span>
              </div>
              <div className="mt-6 flex items-baseline justify-between text-[28px]">
                <span>{date}</span>
                <span className="font-mono text-[26px]">{tx}</span>
              </div>
            </div>
            <p className="stencil map-type m-0 text-[28px] text-brass-hi">burned at 0x…dEaD · nothing comes back out</p>
          </div>
        </MapFrame>
      );
    }
    case 'how': {
      const steps = [
        ['tile-gauge', 'You trade', 'A small fee raises the pressure on the gauge.'],
        ['tile-whistle', 'The whistle blows', 'Full gauge: the bot claims the fees.'],
        ['tile-coal', 'It buys $COAL', 'On the open market, every time.'],
        ['tile-furnace', 'Into the fire', 'Burned at 0x…dEaD. Gone for good.'],
      ];
      return (
        <div className="flex h-screen w-screen flex-col gap-5 bg-soot p-12">
          <p className="plate-type m-0 text-[96px] text-steam">How $COAL burns</p>
          {steps.map(([img, title, body], i) => (
            <div key={img} className="relative flex-1 overflow-hidden">
              <img src={`../stoker/_tiles/${img}.png`} className="pixelated absolute inset-0 h-full w-full object-cover" alt="" />
              <div className="map-panel absolute bottom-4 left-4 max-w-[70%] px-6 py-4">
                <p className="plate-type m-0 text-[52px] text-steam">
                  <span className="text-brass-hi">{i + 1}.</span> {title}
                </p>
                <p className="m-0 mt-1 text-[24px] text-ash">{body}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    default:
      return <MapFrame />;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Kit />);
