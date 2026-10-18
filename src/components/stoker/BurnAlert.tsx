import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ExternalLink, X } from 'lucide-react';
import type { BurnLedgerEntry } from '../../types';
import { sounds } from '../../utils/audio';
import { Fire } from './Fire';

gsap.registerPlugin(useGSAP);

interface BurnAlertProps {
  burnLedger: BurnLedgerEntry[];
  tokenSymbol: string;
  explorerUrl: string;
  sound: boolean;
  /** a fresh burn: its id while the alert is up, so the firebox can flare */
  onBurn: (id: string | null) => void;
}

interface Burn {
  id: string;
  amount: number;
  tx: string;
}

/** A burn only counts as news if it happened in the last few minutes; older ones are history. */
const RECENT_MS = 15 * 60 * 1000;
const SHOW_MS = 9000;
const burned = (e: BurnLedgerEntry) => e.burnedJollyburn || e.burnedMuseburn || e.burnedIncinerator || 0;
const msOf = (e: BurnLedgerEntry) => (e.timestamp && e.timestamp < 1e12 ? e.timestamp * 1000 : e.timestamp || 0);
const compact = (n: number) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2, roundingMode: 'floor' } as Intl.NumberFormatOptions).format(n);
const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(n));

/** Two shovel scrapes, then the steam whistle: a three-note chord that holds. */
function whistle() {
  sounds.playTone(140, 'square', 0.08, 0.05);
  setTimeout(() => sounds.playTone(120, 'square', 0.08, 0.05), 220);
  setTimeout(() => {
    sounds.playTone(587.3, 'triangle', 1.1, 0.07);
    sounds.playTone(740, 'triangle', 1.1, 0.06);
    sounds.playTone(880, 'square', 1.1, 0.025);
  }, 560);
}

/**
 * When a real burn lands while the page is open, the whistle blows and the notice says how
 * much went into the firebox, with the transaction.
 * Add ?burn (or ?burn=1234567) to the URL to play one for a recording.
 */
export function BurnAlert({ burnLedger, tokenSymbol, explorerUrl, sound, onBurn }: BurnAlertProps) {
  const [burn, setBurn] = useState<Burn | null>(null);
  const seen = useRef<Set<string> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // a new burn: one not on the page before, written in the last few minutes
  useEffect(() => {
    const all = burnLedger.filter((e) => e.cycleType !== 'keep' && burned(e) > 0);
    if (!seen.current) {
      seen.current = new Set(all.map((e) => e.id));
      return;
    }
    const known = seen.current;
    const fresh = all.filter((e) => !known.has(e.id));
    fresh.forEach((e) => known.add(e.id));
    const news = fresh.filter((e) => Date.now() - msOf(e) < RECENT_MS).sort((a, b) => msOf(b) - msOf(a))[0];
    if (news) setBurn({ id: news.id, amount: burned(news), tx: news.burnTx || news.buyTx || '' });
  }, [burnLedger]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('burn')) return;
    const id = window.setTimeout(() => setBurn({ id: `demo-${Date.now()}`, amount: Number(q.get('burn')) || 1234567, tx: '' }), 2500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!burn) return;
    onBurn(burn.id);
    if (soundRef.current) whistle();
    const id = window.setTimeout(() => setBurn(null), SHOW_MS);
    return () => {
      window.clearTimeout(id);
      onBurn(null);
    };
  }, [burn, onBurn]);

  useGSAP(
    () => {
      if (!burn || !boxRef.current) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(boxRef.current, { yPercent: 130, autoAlpha: 0, duration: 0.7, ease: 'steps(6)' });
      });
      return () => mm.revert();
    },
    { dependencies: [burn?.id] },
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 sm:bottom-6" role="status" aria-live="polite">
      {burn ? (
        <div ref={boxRef} key={burn.id} className="iron-plate pointer-events-auto relative flex w-full max-w-[27rem] items-stretch overflow-hidden pr-10 shadow-[0_0_0_4px_var(--color-ember),0_12px_0_rgba(0,0,0,0.5)]">
          <div className="w-24 shrink-0">
            <Fire intensity={1} flareKey={burn.id} cols={24} className="h-full min-h-[6.5rem] w-full" />
          </div>
          <div className="min-w-0 flex-1 px-4 py-3">
            <div className="plate-type text-[2rem] text-ember">Into the fire</div>
            <div className="mt-1 text-[0.98rem] text-steam" title={`${fmt(burn.amount)} ${tokenSymbol}`}>
              Stoker burned {compact(burn.amount)} {tokenSymbol}
            </div>
            {burn.tx.startsWith('0x') ? (
              <a href={`${explorerUrl}/tx/${burn.tx}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-mono text-[0.78rem] text-flame underline decoration-flame/40">
                see the burn on chain
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <div className="stencil mt-1 text-[0.7rem] text-ash">gone for good · 0x…dEaD</div>
            )}
          </div>
          <button type="button" onClick={() => setBurn(null)} className="absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center text-ash hover:text-ember" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
