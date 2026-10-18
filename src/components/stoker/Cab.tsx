import { useEffect, useRef } from 'react';
import { ExternalLink, ScrollText } from 'lucide-react';
import type { ActivityLog, FlywheelState, MachineConfig } from '../../types';

interface CabProps {
  state: FlywheelState;
  config: MachineConfig;
  logs: ActivityLog[];
  live: boolean;
  fill: number;
  explorerUrl: string;
  onOpenLog: () => void;
}

const PHASE: Record<string, string> = {
  accumulate: 'watching the gauge',
  claim: 'claiming the fees',
  buyback: 'buying $COAL',
  burn: 'shovelling it in',
  keep: "paying the crew",
};

/** What each kind of log line is, in the cab's words. */
const KIND: Record<string, string> = {
  accumulate: 'gauge',
  claim: 'claim',
  buyback: 'buy',
  burn: 'burn',
  keep: 'pay',
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const shortHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;

/**
 * A split-flap readout: when the text changes, every tile clatters through a few letters
 * before it lands, left to right, like a station departure board.
 */
function SplitFlap({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tiles = Array.from(el.querySelectorAll<HTMLElement>('[data-tile]'));
    const timers: number[] = [];
    tiles.forEach((tile, i) => {
      const final = tile.dataset.char ?? '';
      if (final === ' ') return;
      let n = 4 + Math.floor(i * 0.6);
      const tick = () => {
        if (n-- <= 0) {
          tile.textContent = final;
          return;
        }
        tile.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        timers.push(window.setTimeout(tick, 55));
      };
      timers.push(window.setTimeout(tick, i * 18));
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [text]);

  // tiles grouped by word, so a word never breaks across lines
  let n = 0;
  const words = text.toUpperCase().split(' ');
  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.35em] gap-y-1 font-[family-name:var(--font-plate)] ${className}`} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} className="inline-flex gap-[2px] whitespace-nowrap" aria-hidden="true">
          {w.split('').map((c) => (
            <span key={n++} data-tile data-char={c} className="flap">
              {c}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

/**
 * The cab board: only what the rest of the page does not already say. What the bot is
 * doing this second, how full the gauge is, and its last few moves, each with its transaction.
 */
export function Cab({ state, config, logs, live, fill, explorerUrl, onOpenLog }: CabProps) {
  const doing = !live ? 'cold until launch' : state.isWheelSpinning ? PHASE[state.currentPhase] ?? 'on a run' : 'watching the gauge';
  const lit = Math.round(fill * 12);
  const recent = logs.filter((l) => l.status !== 'failed').slice(0, 5);
  const totals = [
    { k: 'runs made', v: `${state.cycleCount || 0}` },
    { k: 'next run', v: state.nextCycleType === 'keep' ? 'pay · 0.02 ETH' : 'burn · 0.01 ETH' },
    { k: 'buys on', v: state.swapRouter === 'uniswap' || state.isTokenMigrated ? 'Uniswap v4' : 'Pons curve' },
    { k: 'pay so far', v: `${(state.totalFeesRetainedETH || 0).toFixed(4)} ETH` },
  ];

  return (
    <section id="cab" data-cam="cab" aria-labelledby="cab-title" className="relative px-4 py-24 sm:px-10 sm:py-32 lg:px-16">
      <div className="mx-auto max-w-[88rem] lg:mr-0 lg:max-w-[60rem]">
        <h2 id="cab-title" className="plate-type map-type m-0 text-[clamp(2.8rem,6vw,5rem)] text-steam">
          In the cab
        </h2>
        <p className="map-type m-0 mt-5 max-w-[54ch] text-[1.08rem] leading-relaxed text-steam">The bot never clocks off. This board shows what it is doing right now and the last things it did, as they happen.</p>

        <div className="iron-plate mt-12 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* right now */}
          <div className="min-w-0 border-b border-seam p-6 sm:p-9 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 text-[0.8rem]">
              <span className={`inline-block h-2.5 w-2.5 ${live ? 'nom-blink bg-ember' : 'bg-rail'}`} aria-hidden="true" />
              <span className="stencil text-ash">{live ? 'right now' : 'not live yet'}</span>
            </div>
            <div className="mt-3 text-[clamp(1.5rem,2.6vw,2.2rem)]" aria-live="polite">
              <SplitFlap text={doing} />
            </div>

            <div className="mt-9">
              <div className="flex items-baseline justify-between gap-4">
                <span className="stencil text-[0.72rem] text-ash">fee gauge</span>
                <span className="plate-type text-[1.25rem] tabular text-steam">{(state.currentEscrowBalanceETH || 0).toFixed(4)} ETH</span>
              </div>
              <div className="mt-3 grid h-5 gap-[3px]" style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }} role="img" aria-label={`Fee gauge ${Math.round(fill * 100)}% full`}>
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className={` ${i < lit ? (i >= 10 ? 'bg-ember' : 'bg-flame') : 'bg-soot'}`} />
                ))}
              </div>
            </div>

            <dl className="m-0 mt-9 grid grid-cols-2 gap-x-6 gap-y-6">
              {totals.map((r) => (
                <div key={r.k} className="min-w-0">
                  <dt className="stencil text-[0.7rem] text-ash">{r.k}</dt>
                  <dd className="m-0 mt-1.5 truncate text-[1.05rem]" title={r.v}>
                    <SplitFlap text={r.v} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* the last few moves */}
          <div className="min-w-0 p-6 sm:p-9">
            <h3 className="plate-type m-0 text-[1.8rem] text-steam">Last moves</h3>
            {recent.length === 0 ? (
              <p className="m-0 mt-4 max-w-[46ch] text-[1rem] leading-relaxed text-ash">
                {live ? 'Quiet line so far. Each claim, buy and burn shows up here as the bot makes it.' : 'Nothing yet. Once the contract address is set, every claim, buy and burn shows up here as the bot makes it.'}
              </p>
            ) : (
              <ol className="m-0 mt-5 list-none p-0">
                {recent.map((l) => (
                  <li key={l.id} data-log-row className="grid grid-cols-[4.2rem_minmax(0,1fr)] gap-x-4 gap-y-1 border-b border-seam py-3.5 last:border-b-0 sm:grid-cols-[4.2rem_minmax(0,1fr)_auto]">
                    <span className={`stencil self-start px-1.5 py-0.5 text-center text-[0.68rem] ${l.phase === 'burn' ? 'bg-ember text-soot' : 'bg-soot text-steam'}`}>{KIND[l.phase] ?? l.phase}</span>
                    <div className="min-w-0">
                      <div className="truncate text-[0.98rem] text-steam" title={l.details || l.action}>
                        {l.action}
                      </div>
                      <div className="text-[0.82rem] text-ash">{l.timestamp}</div>
                    </div>
                    {l.txHash && l.txHash.startsWith('0x') ? (
                      <a href={`${explorerUrl}/tx/${l.txHash}`} target="_blank" rel="noreferrer" className="col-start-2 inline-flex items-center gap-1 self-center font-mono text-[0.78rem] text-steam underline decoration-steam/40 sm:col-start-3">
                        {shortHash(l.txHash)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[0.78rem] text-ash">
                burns to {config.deadAddress.slice(0, 6)}…{config.deadAddress.slice(-4)}
              </span>
              <button type="button" onClick={onOpenLog} className="btn-chip cursor-pointer">
                <ScrollText className="h-4 w-4" />
                open the full logbook
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
