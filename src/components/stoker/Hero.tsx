import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowUpRight, Check, Copy, Flame } from 'lucide-react';
import { Gauge } from './Gauge';
import { LiveNumber } from './LiveNumber';
import { STAGES, fmtPct, stageIndexFor } from './stages';

interface HeroProps {
  tokenSymbol: string;
  totalBurned: number;
  burnedPercent: number;
  fires: number;
  escrow: number;
  threshold: number;
  fill: number;
  nextCycle: 'burn' | 'keep';
  live: boolean;
  running: boolean;
  tokenAddress: string;
  copiedCA: boolean;
  onCopyCA: () => void;
  buyHref: string;
  chartHref: string;
  onStoke: () => void;
  stokes: number;
  say: string;
}

gsap.registerPlugin(useGSAP);

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(n));

/**
 * The first view. The map behind it is framed on the furnace at 0x…dEaD, its door glowing as hard
 * as the fee gauge reads. On the left: the name, what has burned, the gauge, and the way to buy.
 */
export function Hero(props: HeroProps) {
  const { tokenSymbol, totalBurned, burnedPercent, fires, escrow, threshold, fill, nextCycle, live, running, tokenAddress, copiedCA, onCopyCA, buyHref, chartHref, onStoke, stokes, say } = props;
  const stage = STAGES[stageIndexFor(burnedPercent)];

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('[data-intro]', { y: 24, autoAlpha: 0, duration: 0.7, ease: 'steps(6)', stagger: 0.08, delay: 0.2 });
    });
    return () => mm.revert();
  });

  // his shout hangs over the button for a few seconds
  const [talking, setTalking] = useState(false);
  useEffect(() => {
    if (!stokes) return;
    setTalking(true);
    const id = window.setTimeout(() => setTalking(false), 3200);
    return () => window.clearTimeout(id);
  }, [stokes]);

  const empty = fires === 0 && totalBurned <= 0;
  const pct = Math.round(fill * 100);
  const nextRun = nextCycle === 'burn' ? 'a burn' : "Stoker's pay";
  const gaugeLine = !live ? 'The fire is lit at launch.' : running ? 'A run is going on right now.' : `Gauge at ${pct}%${threshold ? ` of ${threshold.toFixed(2)} ETH` : ''}. Next run: ${nextRun}.`;

  return (
    <section data-cam="hero" id="firebox" aria-labelledby="hero-title" className="relative">
      <div className="mx-auto flex min-h-[100svh] max-w-[88rem] flex-col justify-end px-4 pb-8 pt-24 sm:px-10 lg:justify-center lg:px-16 lg:pb-12">
        <div className="w-full max-w-[34rem]">
          <h1 id="hero-title" data-intro className="plate-type map-type m-0 text-[clamp(4.4rem,10vw,8rem)] text-steam">
            Stoker
            <span className="sr-only"> ({tokenSymbol}), the engine that burns its own supply</span>
          </h1>
          <p data-intro className="map-type m-0 mt-3 max-w-[26ch] text-[clamp(1.1rem,1.5vw,1.35rem)] leading-snug text-steam">
            Every trade stokes the fire. A full gauge burns {tokenSymbol} for good.
          </p>

          <div data-intro className="nameplate mt-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4">
            <div className="min-w-0">
              {empty ? (
                <>
                  <p className="plate-type m-0 text-[clamp(1.8rem,3vw,2.4rem)]">Fire lit. No burns yet.</p>
                  <p className="m-0 mt-2 text-[0.95rem] leading-snug">{gaugeLine} The first full gauge buys {tokenSymbol} and burns it, on chain.</p>
                </>
              ) : (
                <>
                  <p className="m-0 flex flex-wrap items-baseline gap-x-2">
                    <LiveNumber value={totalBurned} format={fmt} className="plate-type tabular text-[clamp(2.3rem,4.4vw,3.4rem)]" />
                    <span className="plate-type text-[1.3rem]">{tokenSymbol} burned</span>
                  </p>
                  <p className="m-0 mt-1 text-[0.95rem]">
                    <strong className="tabular">{fmtPct(burnedPercent)}%</strong> of the supply, {fires} {fires === 1 ? 'fire' : 'fires'}. {gaugeLine}
                  </p>
                </>
              )}
            </div>
            <Gauge fill={fill} live={live} reading={`${escrow.toFixed(3)}`} className="w-[5.5rem] sm:w-[6.5rem]" />
          </div>

          <div data-intro className="mt-5 flex flex-wrap items-center gap-3">
            <a href={buyHref} target="_blank" rel="noreferrer" className="btn-buy px-6 py-3.5 text-[1rem] no-underline">
              Buy {tokenSymbol}
              <ArrowUpRight className="h-5 w-5" />
            </a>
            {tokenAddress ? (
              <a href={chartHref} target="_blank" rel="noreferrer" className="btn-chip py-3.5 no-underline">
                Chart
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : null}
            <span className="relative">
              <button type="button" onClick={onStoke} className="btn-chip cursor-pointer py-3.5" title="Rap on the furnace door. Stoker shouts back.">
                <Flame className="h-4 w-4 text-ember" />
                stoke
              </button>
              {talking ? (
                <span className="speech absolute bottom-[calc(100%+14px)] left-1/2 -translate-x-1/2 whitespace-nowrap" role="status">
                  {say}
                </span>
              ) : null}
            </span>
          </div>

          {tokenAddress ? (
            <button data-intro type="button" onClick={onCopyCA} className="ca-field mt-4 w-full cursor-pointer text-left" title="Copy contract address">
              <span className="min-w-0">
                <span className="stencil block text-[0.68rem] text-ash">contract address</span>
                <span className="block truncate font-mono text-[0.85rem] text-steam">{tokenAddress}</span>
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-soot text-ember" aria-hidden="true">
                {copiedCA ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </span>
              <span className="sr-only" aria-live="polite">
                {copiedCA ? 'Copied' : ''}
              </span>
            </button>
          ) : (
            <div data-intro className="ca-field mt-4 py-3 pr-4">
              <span className="min-w-0">
                <span className="stencil block text-[0.68rem] text-ash">contract address · class {stage.wheels}</span>
                <span className="block text-[0.98rem] text-steam">Posted here the moment {tokenSymbol} launches.</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
