/**
 * The 16×16 pixel art of the STOKER mark: a riveted firebox door with the fire in it.
 * b brass, B dark brass, p plate, s soot, e ember, f flame, c core, w white-hot
 */
const ART = [
  '.BBBBBBBBBBBBBB.',
  'BbppppppppppppbB',
  'BpppsssssssspppB',
  'BppsseeeeeessppB',
  'BpseeeffeeeeespB',
  'BpseeffcffeeespB',
  'BpseffccfffeespB',
  'BpsefccwcffeespB',
  'BpsefcwwwcffespB',
  'BpsefcwwwccfespB',
  'BpseffccccffespB',
  'BpsseffffffesspB',
  'BppssssssssssppB',
  'BbppppppppppppbB',
  'BBBBBBBBBBBBBBBB',
  '.BBBBBBBBBBBBBB.',
];

const COLORS: Record<string, string> = {
  b: '#d4a648',
  B: '#8a6a24',
  p: '#2c2524',
  s: '#0f0d0d',
  e: '#ff5a1f',
  f: '#ffa630',
  c: '#ffe08a',
  w: '#fff6dc',
};

/** The STOKER mark: a riveted firebox door with the fire showing through, in pixels. */
export function StokerMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className={className} aria-hidden="true">
      {ART.flatMap((row, y) => row.split('').map((ch, x) => (COLORS[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[ch]} /> : null)))}
    </svg>
  );
}
