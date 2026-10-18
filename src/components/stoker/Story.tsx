import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { StokerMark } from './Mark';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface StoryProps {
  tokenSymbol: string;
  deadAddress: string;
}

/**
 * Who Stoker is, with his footplate pass, over the whole island seen from above.
 */
export function Story({ tokenSymbol, deadAddress }: StoryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // the story's lines come up out of the dark one by one as you read down
        gsap.from('[data-story-line]', {
          y: 30,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'steps(6)',
          stagger: 0.12,
          scrollTrigger: { trigger: '[data-story]', start: 'top 70%', once: true },
        });
        gsap.fromTo('[data-pass]', { rotate: 6, y: 60, autoAlpha: 0 }, { rotate: -2, y: 0, autoAlpha: 1, ease: 'steps(8)', scrollTrigger: { trigger: '[data-pass]', start: 'top 95%', end: 'top 55%', scrub: 0.6 } });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  const pass = [
    ['Name', 'Stoker'],
    ['Ticker', tokenSymbol],
    ['Works', `the footplate at ${deadAddress.slice(0, 6)}…${deadAddress.slice(-4)}, Robinhood Chain`],
    ['Job', `Shovels every ${tokenSymbol} the bot buys back into the firebox`],
    ['Manner', 'Soot to the elbows. Loud. Has never sat down on shift.'],
    ['Days off', 'None so far'],
  ];

  return (
    <div ref={ref}>
      <section data-story data-cam="story" id="story" aria-labelledby="story-title" className="relative overflow-hidden px-4 py-24 sm:px-10 sm:py-32 lg:px-16">
        <div className="mx-auto grid max-w-[88rem] grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div className="map-panel min-w-0 p-6 sm:p-9">
            <h2 id="story-title" data-story-line className="plate-type m-0 max-w-[13ch] text-[clamp(2.8rem,6vw,5rem)] text-steam">
              Somebody has to feed the fire
            </h2>
            <div className="mt-9 grid max-w-[62ch] gap-5 text-[1.1rem] leading-relaxed text-steam/88">
              <p data-story-line className="m-0">
                Every steam engine has a fireman, and his whole job is keeping the fire fed. Stoker works the footplate of an engine that runs on its own supply. Every {tokenSymbol} that goes into the firebox is gone, and the engine pulls a little harder for it.
              </p>
              <p data-story-line className="m-0">
                The deal never changes. Every {tokenSymbol} trade pays a little ETH into the fee gauge. When the gauge is full the whistle blows and the bot claims it. On a burn run it buys {tokenSymbol} on the open market and Stoker shovels the lot into the firebox at 0x…dEaD. Nothing comes back out of a firebox.
              </p>
              <p data-story-line className="m-0">
                On the other runs the ETH is Stoker&apos;s pay, sent to the project wallet that keeps the engine running and listed right next to the burns. Every percent of the supply burned rolls a bigger engine out of the shed.
              </p>
            </div>
          </div>

          <aside data-pass className="ticket mx-auto w-full max-w-[27rem] self-start py-8 pl-12 pr-16 lg:mt-10" aria-label="Stoker's footplate pass">
            <div className="flex items-center gap-4">
              <StokerMark className="h-14 w-14 shrink-0" />
              <div className="plate-type text-[2.6rem]">Stoker</div>
            </div>
            <dl className="m-0 mt-6 grid gap-3">
              {pass.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] gap-3 border-b border-dashed border-ticket-ink/25 pb-3">
                  <dt className="stencil pt-0.5 text-[0.72rem] text-ticket-band">{k}</dt>
                  <dd className="m-0 text-[0.98rem]">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="plate-type m-0 mt-6 text-[1.7rem]">“Shovel it in.”</p>
          </aside>
        </div>
      </section>

    </div>
  );
}
