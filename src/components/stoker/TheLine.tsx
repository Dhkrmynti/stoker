import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { STAGES, fmtPct, stageIndexFor, stageProgress } from './stages';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface TheLineProps {
  burnedPercent: number;
  tokenSymbol: string;
}

const pctLabel = (p: number) => `${p}%`;
/** where the camera stops for the overview and each platform, down the section */
const STOPS = [8, 24, 38, 52, 66, 80];

/**
 * The engine's five classes, one platform each on the south side of the island. One panel stays
 * on screen while the camera walks the platforms; the class in view lights up in the list.
 * Unlocked classes stand on their siding in full, the rest are wireframe works drawings.
 */
export function TheLine({ burnedPercent, tokenSymbol }: TheLineProps) {
  const now = stageIndexFor(burnedPercent);
  const cur = STAGES[now];
  const next = STAGES[now + 1];
  const prog = stageProgress(burnedPercent, now);
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(-1);

  useGSAP(
    () => {
      // the platform the camera is at: the last stop whose marker has passed the middle of the screen
      gsap.utils.toArray<HTMLElement>('[data-platform]').forEach((el, i) =>
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          onEnter: () => setInView(i),
          onLeaveBack: () => setInView(i - 1),
        }),
      );
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-meter] > span', { autoAlpha: 0, duration: 0.05, stagger: 0.04, ease: 'steps(1)', scrollTrigger: { trigger: '[data-meter]', start: 'top 85%', once: true } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} id="line" aria-labelledby="line-title" className="relative h-[300svh]">
      <div data-cam="line" aria-hidden="true" className="absolute inset-x-0 h-px" style={{ top: `${STOPS[0]}%` }} />
      {STAGES.map((s, i) => (
        <div key={s.n} data-cam={`class-${i}`} data-platform aria-hidden="true" className="absolute inset-x-0 h-px" style={{ top: `${STOPS[i + 1]}%` }} />
      ))}

      <div className="pointer-events-none sticky top-0 flex h-[100svh] items-end pb-6 pt-20 lg:items-center lg:pb-0">
        <div className="mx-auto w-full max-w-[88rem] px-4 sm:px-10 lg:px-16">
          <div className="map-panel pointer-events-auto w-full max-w-[30rem] p-5 sm:p-7">
            <h2 id="line-title" className="plate-type m-0 text-[clamp(2rem,4.4vw,3.4rem)] text-steam">
              The engine grows as the supply burns
            </h2>
            <p className="m-0 mt-3 hidden text-[1rem] leading-relaxed text-ash sm:block">
              One platform per class, unlocked by the share of all {tokenSymbol} at 0x…dEaD. The only way down the line is more burns.
            </p>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="plate-type text-[1.5rem] text-brass-hi">
                Class {cur.wheels} · {cur.name}
              </span>
              <span className="text-[0.95rem] tabular text-ash">
                {fmtPct(burnedPercent)}% · {next ? `next at ${pctLabel(next.from)}` : 'end of the line'}
              </span>
            </div>
            <div data-meter className="mt-2 grid h-4 gap-1" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(prog * 100)} aria-label={`Progress to the next class, ${Math.round(prog * 100)}%`}>
              {Array.from({ length: 20 }, (_, i) => (
                <span key={i} className={i < Math.round(prog * 20) ? 'bg-brass' : 'bg-seam'} />
              ))}
            </div>

            <ol className="m-0 mt-5 list-none p-0">
              {STAGES.map((s, i) => {
                const state = i < now ? 'done' : i === now ? 'now' : 'ahead';
                const lit = i === inView;
                return (
                  <li key={s.n} className={`border-t-4 border-seam py-2.5 transition-colors duration-150 ease-[steps(2)] ${lit ? 'bg-plate-hi/70' : ''}`}>
                    <div className="flex items-baseline justify-between gap-3 px-2">
                      <span className={`plate-type text-[1.45rem] ${lit ? 'text-brass-hi' : state === 'ahead' ? 'text-ash' : 'text-steam'}`}>
                        {s.wheels} {state === 'ahead' ? '' : s.name}
                      </span>
                      <span className={`stencil shrink-0 text-[0.8rem] ${state === 'now' ? 'text-brass-hi' : 'text-ash'}`}>
                        {state === 'now' ? 'on the line' : state === 'done' ? 'unlocked' : `at ${pctLabel(s.from)}`}
                      </span>
                    </div>
                    {lit ? <p className="m-0 mt-1 px-2 text-[0.95rem] leading-snug text-steam/85">{state === 'ahead' ? `Still a works drawing on platform ${i + 1}. It rolls out when ${pctLabel(s.from)} of the supply has burned.` : s.blurb}</p> : null}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
