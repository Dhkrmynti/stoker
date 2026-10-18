import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface TheRunProps {
  tokenSymbol: string;
  escrow: number;
  threshold: number;
  fill: number;
  claimedETH: number;
  retainedETH: number;
  routerName: string;
  nextCycle: 'burn' | 'keep';
  live: boolean;
}

interface Stop {
  cam: string;
  title: string;
  body: ReactNode;
  readingLabel: string;
  reading: string;
  next?: boolean;
}

/**
 * How a run happens, as stops along the line. Each stop is a panel; as it reaches the middle of
 * the screen the map behind flies to its station: the gauge tower, the water tower with the
 * whistle, the coal hopper, the furnace, the pay office. Every reading is live from the engine.
 */
export function TheRun({ tokenSymbol, escrow, threshold, fill, claimedETH, retainedETH, routerName, nextCycle, live }: TheRunProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('[data-stop]').forEach((el) => {
          gsap.from(el, { y: 60, autoAlpha: 0, duration: 0.6, ease: 'steps(6)', scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' } });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const stops: Stop[] = [
    {
      cam: 'gauge',
      title: 'Trades build pressure',
      body: <>Every {tokenSymbol} buy or sell pays a small creator fee in ETH. It collects in the Pons fee escrow, and the needle on the gauge tower climbs.</>,
      readingLabel: 'in the gauge now',
      reading: `${escrow.toFixed(4)} ETH · ${Math.round(fill * 100)}%`,
    },
    {
      cam: 'whistle',
      title: 'A full gauge blows the whistle',
      body: <>A bot watches the gauge around the clock. Once it holds {threshold ? `${threshold.toFixed(2)} ETH` : 'enough'}, the water tower lets off steam and the bot claims all of it on its own. Nobody presses a button.</>,
      readingLabel: 'ETH claimed so far',
      reading: `${claimedETH.toFixed(4)} ETH`,
    },
    {
      cam: 'coal',
      title: `It buys ${tokenSymbol}`,
      body: <>On a burn run every bit of that ETH market-buys {tokenSymbol} on {routerName} and loads it at the hopper. Real buying, every time, in the open.</>,
      readingLabel: 'buying on',
      reading: routerName.replace(/^the /, ''),
    },
    {
      cam: 'odd',
      title: 'Odd runs: into the furnace',
      body: <>Every {tokenSymbol} bought goes to the furnace at 0x…dEaD, where nothing can move it again. The supply is smaller for good.</>,
      readingLabel: 'burns go to',
      reading: '0x…dEaD',
      next: nextCycle === 'burn',
    },
    {
      cam: 'even',
      title: "Even runs: Stoker's pay",
      body: <>The claimed ETH goes to the project wallet that keeps the engine running, paid in the open and listed in the logbook.</>,
      readingLabel: 'paid so far',
      reading: `${retainedETH.toFixed(4)} ETH`,
      next: nextCycle === 'keep',
    },
  ];

  return (
    <section ref={ref} id="run" aria-labelledby="run-title" className="relative">
      <div data-cam="run" className="mx-auto flex min-h-[60svh] max-w-[88rem] items-center px-4 sm:px-10 lg:px-16">
        <div className="map-panel max-w-[34rem] p-6 sm:p-8">
          <h2 id="run-title" className="plate-type m-0 text-[clamp(2.8rem,6vw,4.6rem)] text-steam">
            The run
          </h2>
          <p className="m-0 mt-4 text-[1.05rem] leading-relaxed text-ash">Trading fills the gauge, a bot does the rest, and every step lands on Robinhood Chain where anyone can check it. Five stops round the island.</p>
        </div>
      </div>

      <ol className="m-0 list-none p-0">
        {stops.map((s, i) => (
          <li key={s.cam} data-cam={s.cam} className={`mx-auto flex min-h-[75svh] max-w-[88rem] items-end pb-[10svh] lg:items-center lg:pb-0 px-4 sm:px-10 lg:px-16 ${i % 2 ? 'lg:justify-end' : ''}`}>
            <article data-stop className={`iron-plate w-full max-w-[30rem] p-6 sm:p-8 ${s.next && live ? 'shadow-[0_0_0_4px_var(--color-ember)]' : ''}`}>
              {s.next && live ? <div className="stencil mb-2 text-[0.75rem] text-ember">next run</div> : null}
              <h3 className="plate-type m-0 text-[clamp(2rem,3.4vw,2.8rem)] text-steam">{s.title}</h3>
              <p className="m-0 mt-3 text-[1rem] leading-relaxed text-steam/85">{s.body}</p>
              <div className="mt-6 border-t-4 border-seam pt-4">
                <div className="stencil text-[0.72rem] text-ash">{s.readingLabel}</div>
                <div className="plate-type mt-1 text-[1.9rem] tabular text-brass-hi">{s.reading}</div>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
