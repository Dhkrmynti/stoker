import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, Check, Copy, LineChart, Send } from 'lucide-react';
import { Fire } from './Fire';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface FinaleProps {
  tokenSymbol: string;
  buyHref: string;
  tokenAddress: string;
  copiedCA: boolean;
  onCopyCA: () => void;
  /** where to follow and check: each one shows only once it exists */
  links: { x: string; telegram: string; chart: string; deadAddr: string };
}

/**
 * How high the wall of fire stands across the section's scroll: down while the doors swing open
 * and the camera closes in, up as the camera crosses the threshold, and it never comes back down.
 */
const heatAt = (p: number) => (p < 0.5 ? 0 : p < 0.58 ? (p - 0.5) / 0.08 : 1);

/**
 * The end of the page is the end of the line for every $COAL: the furnace. Back at its doors with
 * the last word, the doors swing open as you scroll, the camera goes in through the doorway, the
 * fire climbs over the screen, and the way to buy waits inside it. Nothing comes back out.
 */
export function Finale({ tokenSymbol, buyHref, tokenAddress, copiedCA, onCopyCA, links }: FinaleProps) {
  const ref = useRef<HTMLElement>(null);
  const heat = useRef(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.create({
          trigger: ref.current,
          start: 'top bottom',
          end: 'bottom bottom',
          onUpdate: (self) => (heat.current = heatAt(self.progress)),
          onLeaveBack: () => (heat.current = 0),
        });
        gsap
          .timeline({ scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom bottom', scrub: true } })
          .fromTo('[data-dive-line] > span', { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, duration: 0.03, stagger: 0.015, ease: 'steps(3)' }, 0.56)
          .to('[data-dive-line] > span', { autoAlpha: 0, yPercent: -60, duration: 0.03, stagger: 0.01, ease: 'steps(3)' }, 0.65)
          .set({}, {}, 1);
        // the last word goes in like lumps of coal off a shovel
        gsap.from('[data-lump]', {
          yPercent: -160,
          rotate: () => gsap.utils.random(-14, 14),
          autoAlpha: 0,
          duration: 0.8,
          ease: 'steps(5)',
          stagger: 0.12,
          scrollTrigger: { trigger: '[data-last-word]', start: 'top 75%', once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} aria-labelledby="finale-title" id="finale" className="relative h-[320svh]">
      {/* camera stops: square to the doors as they open, then inside the furnace */}
      <div data-cam="door" aria-hidden="true" className="absolute inset-x-0 top-[18%] h-px" />
      <div data-cam="dive" aria-hidden="true" className="absolute inset-x-0 top-[42%] h-px" />

      {/* the fire and the words in it stay on screen to the end */}
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <Fire intensity={0} heatRef={heat} clear cols={96} className="absolute inset-0 h-full w-full motion-reduce:hidden" />
        <p data-dive-line aria-hidden="true" className="plate-type map-type relative m-0 flex flex-wrap justify-center gap-x-[0.3em] px-4 text-center text-[clamp(3.6rem,11vw,9rem)] text-steam motion-reduce:hidden">
          {'Into the fire.'.split(' ').map((w) => (
            <span key={w} className="inline-block">
              {w}
            </span>
          ))}
        </p>
      </div>

      <div className="relative -mt-[100svh] flex h-[320svh] flex-col justify-between">
        {/* at the doors: the last word */}
        <div data-last-word className="mx-auto flex min-h-[100svh] w-full max-w-[88rem] items-end px-4 pb-[14svh] sm:px-10 lg:px-16">
          <div>
            <h2 id="finale-title" className="plate-type map-type m-0 text-[clamp(4rem,10vw,7.5rem)] text-steam" aria-label="Shovel it in.">
              {'Shovel it in.'.split(' ').map((word, i) => (
                <span key={i} aria-hidden="true" className="inline-block whitespace-pre">
                  <span data-lump className="inline-block">
                    {word}
                  </span>{' '}
                </span>
              ))}
            </h2>
            <p className="map-type m-0 mt-4 max-w-[40ch] text-[1.12rem] leading-relaxed text-steam">Every trade raises the pressure. Every full gauge is another fire. Scroll on and the doors open.</p>
          </div>
        </div>

        {/* inside: the way to buy, standing in the fire */}
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[88rem] items-center justify-center px-4 sm:px-10 lg:px-16">
          <div id="finale-cta" className="map-panel w-full max-w-[32rem] p-6 text-center sm:p-9">
            <p className="plate-type m-0 text-[clamp(2.4rem,5vw,3.6rem)] text-steam">Nothing comes back out.</p>
            <p className="m-0 mt-3 text-[1.02rem] leading-relaxed text-ash">Every {tokenSymbol} that goes in this furnace is gone for good. Feed it.</p>
            <div className="mt-6 flex flex-col gap-4">
              <a href={buyHref} target="_blank" rel="noreferrer" className="btn-buy px-6 py-4 text-[1.08rem] no-underline">
                Buy {tokenSymbol}
                <ArrowUpRight className="h-5 w-5" />
              </a>
              {tokenAddress ? (
                <button type="button" onClick={onCopyCA} className="ca-field w-full cursor-pointer text-left" title="Copy contract address">
                  <span className="min-w-0 truncate font-mono text-[0.85rem] text-steam">{tokenAddress}</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-soot text-ember" aria-hidden="true">
                    {copiedCA ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </span>
                </button>
              ) : null}
              <ul className="m-0 flex list-none flex-wrap justify-center gap-3 p-0" aria-label="Follow and check">
                {links.x ? (
                  <li>
                    <a href={links.x} target="_blank" rel="noreferrer" className="btn-chip no-underline">
                      <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-6.4L6.5 22H3.4l7.2-8.2L2.9 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.8h1.7L8.3 4.1H6.5l11.3 15.7Z" />
                      </svg>
                      Follow on X
                    </a>
                  </li>
                ) : null}
                {links.telegram ? (
                  <li>
                    <a href={links.telegram} target="_blank" rel="noreferrer" className="btn-chip no-underline">
                      <Send className="h-4 w-4" />
                      Telegram
                    </a>
                  </li>
                ) : null}
                {links.chart ? (
                  <li>
                    <a href={links.chart} target="_blank" rel="noreferrer" className="btn-chip no-underline">
                      <LineChart className="h-4 w-4" />
                      Dexscreener
                    </a>
                  </li>
                ) : null}
                <li>
                  <a href={links.deadAddr} target="_blank" rel="noreferrer" className="btn-chip no-underline">
                    <ArrowUpRight className="h-4 w-4" />
                    Check 0x…dEaD
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
