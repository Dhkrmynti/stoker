import { useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Check, Copy, ExternalLink, ScrollText } from 'lucide-react';
import type { ActivityLog, BurnLedgerEntry } from '../../types';

interface LogbookProps {
  burnLedger: BurnLedgerEntry[];
  logs: ActivityLog[];
  totalBurned: number;
  tokenSymbol: string;
  deadAddress: string;
  explorerUrl: string;
  copiedDead: boolean;
  onCopyDead: () => void;
  onOpenLog: () => void;
}

gsap.registerPlugin(ScrollTrigger, useGSAP);

const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(n));
const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1, roundingMode: 'floor' } as Intl.NumberFormatOptions).format(n);
const shortHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;
const when = (e: BurnLedgerEntry) => {
  // ledger timestamps from the chain are in seconds
  const ms = e.timestamp && e.timestamp < 1e12 ? e.timestamp * 1000 : e.timestamp;
  const d = ms ? new Date(ms) : null;
  if (!d || Number.isNaN(d.getTime())) return e.timeStr?.split(' (')[0] ?? '';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
};
const burned = (e: BurnLedgerEntry) => e.burnedJollyburn || e.burnedMuseburn || e.burnedIncinerator || 0;

interface PayRun {
  key: string;
  eth: number;
  time: string;
  tx: string;
}

/**
 * Every burn as a punched card ticket, newest first, each with its transaction.
 * Then Stoker's pay runs, in the open.
 */
export function Logbook({ burnLedger, logs, totalBurned, tokenSymbol, deadAddress, explorerUrl, copiedDead, onCopyDead, onOpenLog }: LogbookProps) {
  const fires = useMemo(() => {
    const chrono = [...burnLedger].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    return chrono
      .filter((e) => e.cycleType !== 'keep' && (burned(e) > 0 || e.burnTx))
      .map((e, i) => ({ e, n: i + 1 }))
      .reverse();
  }, [burnLedger]);

  // pay runs: keep entries from the ledger, plus the bot's "forwarded … to treasury" log lines
  const pay = useMemo(() => {
    const out: PayRun[] = [];
    const seen = new Set<string>();
    for (const e of burnLedger) {
      if (e.cycleType !== 'keep') continue;
      const tx = e.claimTx || '';
      seen.add(tx || e.id);
      out.push({ key: e.id, eth: e.retainedETH || e.claimedETH || 0, time: when(e), tx });
    }
    for (const l of logs) {
      const m = /forwarded\s+([\d.]+)\s*ETH\s+to\s+treasury/i.exec(l.details || '');
      if (!m) continue;
      const tx = l.txHash || '';
      const key = tx || l.id;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, eth: parseFloat(m[1]) || 0, time: l.timestamp, tx });
    }
    return out;
  }, [burnLedger, logs]);

  const ref = useRef<HTMLElement>(null);
  // tickets come out of the machine one after another, then get punched
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.batch('[data-ticket]', {
          start: 'top 90%',
          once: true,
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { clipPath: 'inset(0 100% 0 0)', x: -24 },
              { clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.7, ease: 'steps(6)', stagger: 0.07, clearProps: 'clipPath' },
            ),
        });
        ScrollTrigger.batch('[data-pay-row]', {
          start: 'top 92%',
          once: true,
          onEnter: (els) => gsap.from(els, { autoAlpha: 0, y: 16, duration: 0.6, ease: 'steps(6)', stagger: 0.06 }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [fires.length] },
  );

  const shown = fires.slice(0, 12);
  const biggest = Math.max(0, ...fires.map(({ e }) => burned(e)));

  return (
    <section ref={ref} id="logbook" data-cam="logbook" aria-labelledby="logbook-title" className="relative px-4 py-24 sm:px-10 sm:py-32 lg:px-16">
      <div className="map-panel mx-auto max-w-[88rem] p-6 sm:p-9 lg:mr-0 lg:max-w-[56rem]">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:items-end">
          <div>
            <h2 id="logbook-title" className="plate-type m-0 text-[clamp(2.8rem,6vw,5rem)] text-steam">
              The logbook
            </h2>
            <p className="m-0 mt-5 max-w-[54ch] text-[1.08rem] leading-relaxed text-ash">
              One ticket per burn, with the amount and the transaction, read straight from Robinhood Chain. Newest first. {fires.length > 0 ? `${fires.length} ${fires.length === 1 ? 'fire' : 'fires'} so far.` : ''}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="stencil text-[0.75rem] text-ash">burns go to</span>
            <span className="truncate font-mono text-[0.85rem] text-steam" title={deadAddress}>
              {deadAddress.slice(0, 8)}…{deadAddress.slice(-6)}
            </span>
            <button type="button" onClick={onCopyDead} className="btn-chip shrink-0 cursor-pointer px-3 py-1.5 text-[0.72rem]">
              {copiedDead ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedDead ? 'copied' : 'copy'}
            </button>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="mt-12 grid grid-cols-[minmax(0,1fr)] items-center gap-8 md:grid-cols-[19rem_minmax(0,1fr)]">
            {/* a blank stub: the slot the first ticket prints into */}
            <div className="ticket flex min-h-[9.5rem] flex-col justify-between py-4 pl-10 pr-14 opacity-80" aria-hidden="true">
              <div className="flex items-baseline justify-between gap-3">
                <span className="stencil text-[0.72rem] text-ticket-band">firebox, single</span>
                <span className="font-mono text-[0.78rem] tabular">No. 0001</span>
              </div>
              <div className="mt-3 h-7 w-40 bg-ticket-ink/12" />
              <div className="mt-3 h-3 w-24 bg-ticket-ink/12" />
            </div>
            <div>
              <p className="plate-type m-0 text-[clamp(1.8rem,3vw,2.5rem)] text-steam">{totalBurned > 0 ? `${compact(totalBurned)} ${tokenSymbol} burned.` : 'No tickets yet.'}</p>
              <p className="m-0 mt-3 max-w-[46ch] text-[1.05rem] leading-relaxed text-ash">{totalBurned > 0 ? 'Reading the tickets from the chain.' : 'The fire is lit and waiting. Ticket No. 0001 prints here with its transaction the moment the first burn lands.'}</p>
            </div>
          </div>
        ) : (
          <ol className="m-0 mt-12 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))] gap-x-6 gap-y-7 p-0" aria-label="Recent burns">
            {shown.map(({ e, n }, i) => {
              const tx = e.burnTx || e.buyTx || e.claimTx;
              const amt = burned(e);
              const top = amt > 0 && amt === biggest;
              return (
                <li key={e.id} data-ticket className="ticket flex min-h-[9.5rem] flex-col justify-between py-4 pl-10 pr-14" style={{ rotate: `${((i * 7) % 5) - 2}deg` }}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="stencil text-[0.72rem] text-ticket-band">{top ? 'biggest fire' : 'firebox, single'}</span>
                    <span className="font-mono text-[0.78rem] tabular">No. {String(n).padStart(4, '0')}</span>
                  </div>
                  <div className="mt-2">
                    <span className="plate-type text-[clamp(1.9rem,2.4vw,2.3rem)] tabular" title={`${fmt(amt)} ${tokenSymbol}`}>
                      {amt >= 1e6 ? compact(amt) : fmt(amt)}
                    </span>{' '}
                    <span className="stencil text-[0.8rem]">{tokenSymbol}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 text-[0.82rem]">
                    <span>{when(e)}</span>
                    {tx && tx.startsWith('0x') ? (
                      <a href={`${explorerUrl}/tx/${tx}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[0.78rem] text-ticket-ink underline decoration-ticket-ink/40">
                        {shortHash(tx)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-10">
          <button type="button" onClick={onOpenLog} className="btn-chip cursor-pointer">
            <ScrollText className="h-4 w-4" />
            open the full logbook
          </button>
        </div>

        <div id="pay" className="mt-16 grid grid-cols-[minmax(0,1fr)] gap-8 border-t-4 border-seam pt-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-start">
          <div>
            <h2 className="plate-type m-0 text-[clamp(2rem,3.6vw,3rem)] text-steam">Stoker&apos;s pay</h2>
            <p className="m-0 mt-4 max-w-[44ch] text-[1.03rem] leading-relaxed text-ash">
              Every other run pays the crew instead: the ETH goes to the project wallet that keeps the engine running. Nothing hidden, so those runs are listed here too.
            </p>
          </div>
          {pay.length === 0 ? (
            <p className="m-0 text-[1rem] leading-relaxed text-ash">No pay run in the recent log. The next one shows up here with its transaction. Older ones are in the project wallet’s history.</p>
          ) : (
            <ol className="m-0 grid list-none gap-3 p-0">
              {pay.slice(0, 4).map((f) => (
                <li key={f.key} data-pay-row className="iron-plate flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 px-6 py-4">
                  <span className="stencil text-[0.75rem] text-brass">pay packet</span>
                  <span className="plate-type text-[1.5rem] tabular text-steam">{f.eth.toFixed(4)} ETH</span>
                  <span className="text-[0.88rem] text-ash">{f.time}</span>
                  {f.tx && f.tx.startsWith('0x') ? (
                    <a href={`${explorerUrl}/tx/${f.tx}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[0.8rem] text-steam underline decoration-steam/40">
                      {shortHash(f.tx)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
