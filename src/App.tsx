import { useState, useEffect, useRef, lazy, Suspense, Component, type ReactNode } from 'react';
import { useFlywheelEngine } from './hooks/useBurnEngine';
import { PONS_V2_CONFIG } from './contracts';
import { sounds } from './utils/audio';
import { Volume2, VolumeX, Copy, Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { BurnLedgerDrawer } from './components/BurnLedgerDrawer';
import { Hero } from './components/stoker/Hero';
import { TheRun } from './components/stoker/TheRun';
import { TheLine } from './components/stoker/TheLine';
import { Logbook } from './components/stoker/Logbook';
import { Cab } from './components/stoker/Cab';
import { Story } from './components/stoker/Story';
import { Finale } from './components/stoker/Finale';
import { MiniMap } from './components/stoker/MiniMap';
import { BurnAlert } from './components/stoker/BurnAlert';
import { StokerMark } from './components/stoker/Mark';
import { STOKER_SAYS, STAGES, stageIndexFor } from './components/stoker/stages';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The operator panel: only the /memex route needs it, so visitors never download it. */
const MemexAdmin = lazy(() => import('./components/MemexAdmin'));
/** The 3D map behind the page: three.js loads after the first paint. */
const World = lazy(() => import('./components/stoker/world/World'));

/** X account for the project: empty until there is one. */
const X_URL = '';
/** Telegram group for the project: empty until there is one. */
const TG_URL = '';
const EXPLORER_URL = 'https://explorer.mainnet.chain.robinhood.com';
/** Where to trade and where to watch, once the CA is known. */
const buyUrl = (ca: string) => (ca ? `https://ponsfamily.com/launchpad/${ca}` : EXPLORER_URL);
const chartUrl = (ca: string) => (ca ? `https://dexscreener.com/robinhood/${ca}` : EXPLORER_URL);

/** If the 3D map fails for any reason, drop it and keep the page. */
class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function App() {
  const { state, config, setConfig, logs, burnLedger } = useFlywheelEngine();

  const getIsMemex = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/memex') || hash.startsWith('#memex') || hash.startsWith('#/memex');
  };

  const [isMemexRoute, setIsMemexRoute] = useState(getIsMemex());
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [copiedCA, setCopiedCA] = useState(false);
  const [copiedDead, setCopiedDead] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [stokes, setStokes] = useState(0);
  const [burn, setBurn] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('');
  const [showBar, setShowBar] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLocationChange = () => setIsMemexRoute(getIsMemex());
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Late fonts change line heights; re-measure every trigger once they land
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  const stokeFire = () => {
    setStokes((prev) => prev + 1);
    sounds.playPokeSound();
  };

  // the mute button covers every sound on the page, not just the whistle
  useEffect(() => {
    sounds.enabled = config.soundEnabled !== false;
  }, [config.soundEnabled]);

  // audio stays locked until the first click, tap or key press; open it then so the whistle can blow later
  useEffect(() => {
    const unlock = () => {
      sounds.unlock();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setIsMemexRoute(false);
  };

  const threshold = state.currentThresholdETH || state.claimThresholdETH || config.claimThresholdETH || 0;
  const escrow = state.currentEscrowBalanceETH || 0;
  const gaugeFill = threshold > 0 ? Math.max(0, Math.min(1, escrow / threshold)) : 0;

  useGSAP(
    () => {
      if (isMemexRoute) return;
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        ScrollTrigger.batch('[data-log-row]', {
          start: 'top 92%',
          once: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: 'steps(3)', stagger: 0.06 }),
        });
      });
      // the nav lights the chapter you are in
      ['run', 'line', 'logbook', 'cab', 'story'].forEach((id) =>
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: 'top 45%',
          end: 'bottom 45%',
          onToggle: (self) => self.isActive && setActiveSection(id),
          onLeaveBack: (self) => self.trigger?.id === 'run' && setActiveSection(''),
        }),
      );
      // Sections build their own triggers (children first); put them back in page order and re-measure
      // phones: a buy bar once the first view is gone, until the buy panel inside the furnace shows
      ScrollTrigger.create({
        trigger: '#run',
        start: 'top 85%',
        endTrigger: '#finale-cta',
        end: 'top bottom',
        onToggle: (self) => setShowBar(self.isActive),
      });
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      return () => mm.revert();
    },
    { scope: pageRef, dependencies: [isMemexRoute] },
  );

  if (isMemexRoute) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-ink" />}>
        <MemexAdmin onBack={navigateToHome} />
      </Suspense>
    );
  }

  const copyCA = () => {
    if (!config.tokenAddress) return;
    navigator.clipboard.writeText(config.tokenAddress);
    setCopiedCA(true);
    sounds.playClaimSound();
    setTimeout(() => setCopiedCA(false), 2500);
  };

  const copyDead = () => {
    navigator.clipboard.writeText(config.deadAddress || PONS_V2_CONFIG.contracts.deadAddress);
    setCopiedDead(true);
    sounds.playBurnSound();
    setTimeout(() => setCopiedDead(false), 2000);
  };

  const totalTokensBurned =
    state.totalTokensBurned > 0
      ? state.totalTokensBurned
      : burnLedger.reduce((acc, cur) => acc + (cur.burnedJollyburn || cur.burnedMuseburn || cur.burnedIncinerator || 0), 0);

  const burnedPercent =
    state.burnedPercentageOfSupply > 0
      ? state.burnedPercentageOfSupply
      : state.totalSupply > 0
        ? (totalTokensBurned / state.totalSupply) * 100
        : 0;

  const tokenSymbol = '$COAL';
  const deadAddress = config.deadAddress || PONS_V2_CONFIG.contracts.deadAddress;
  const isConfigured = Boolean(config.tokenAddress && config.tokenAddress.startsWith('0x') && config.tokenAddress.length === 42);
  const nextCycle = state.nextCycleType || 'burn';
  const fires = burnLedger.filter((e) => e.cycleType !== 'keep' && ((e.burnedJollyburn || e.burnedMuseburn || e.burnedIncinerator || 0) > 0 || e.burnTx)).length;
  const stage = STAGES[stageIndexFor(burnedPercent)];
  const routerName = state.swapRouter === 'uniswap' || state.isTokenMigrated ? 'Uniswap v4' : 'the Pons bonding curve';

  return (
    <div ref={pageRef} className="relative min-h-screen overflow-x-clip bg-soot font-body text-steam">
      {/* ───────── The nav ───────── */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-200 ease-[steps(2)] ${scrolled ? 'bg-soot shadow-[0_4px_0_var(--color-seam)]' : ''}`}>
        <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-10 lg:px-16">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateToHome();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group flex items-center gap-3 text-steam no-underline"
            aria-label="STOKER home"
          >
            <StokerMark className="h-9 w-9 transition-transform duration-300 ease-[steps(3)] group-hover:-rotate-6" />
            <span className="plate-type text-[1.9rem] leading-none">Stoker</span>
          </a>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
            {[
              ['run', 'the run'],
              ['line', 'the line'],
              ['logbook', 'logbook'],
              ['cab', 'cab'],
              ['story', 'story'],
            ].map(([id, name]) => (
              <a
                key={id}
                href={`#${id}`}
                aria-current={activeSection === id ? 'location' : undefined}
                className={`stencil relative py-1 text-[0.85rem] no-underline transition-colors hover:text-brass-hi ${activeSection === id ? 'text-brass-hi' : 'text-steam'}`}
              >
                {name}
                <span aria-hidden="true" className={`absolute inset-x-0 -bottom-0.5 h-[2px] origin-left bg-brass transition-transform duration-300 ease-[steps(3)] ${activeSection === id ? 'scale-x-100' : 'scale-x-0'}`} />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })}
              title={config.soundEnabled ? 'Mute the whistle' : 'Turn the sounds on'}
              aria-label={config.soundEnabled ? 'Mute the whistle' : 'Turn the sounds on'}
              className="flex h-10 w-10 cursor-pointer items-center justify-center text-steam shadow-[inset_0_0_0_1px_var(--color-seam)] transition-colors hover:text-brass-hi hover:shadow-[inset_0_0_0_1px_var(--color-brass-lo)]"
            >
              {config.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            {X_URL ? (
              <a href={X_URL} target="_blank" rel="noreferrer" title="STOKER on X" aria-label="STOKER on X" className="flex h-10 w-10 items-center justify-center text-steam shadow-[inset_0_0_0_1px_var(--color-seam)] hover:text-brass-hi">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.9-6.4L6.5 22H3.4l7.2-8.2L2.9 2h6.4l4.4 5.8L18.9 2Zm-1.1 17.8h1.7L8.3 4.1H6.5l11.3 15.7Z" />
                </svg>
              </a>
            ) : null}
            {config.tokenAddress ? (
              <button type="button" onClick={copyCA} className="btn-chip hidden cursor-pointer py-2 lg:inline-flex" title="Copy contract address">
                {copiedCA ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCA ? 'copied' : <>CA <span className="font-mono text-[0.8rem] normal-case tracking-normal">{`${config.tokenAddress.slice(0, 6)}…${config.tokenAddress.slice(-4)}`}</span></>}</span>
              </button>
            ) : null}
            <a href={buyUrl(config.tokenAddress)} target="_blank" rel="noreferrer" className="btn-buy hidden px-4 py-2.5 text-[0.85rem] no-underline sm:inline-flex">
              Buy {tokenSymbol}
            </a>
          </div>
        </div>
      </header>

      {/* a still of the first view, in pixels, so the page never opens on black while the map loads */}
      <div aria-hidden="true" className="pixelated pointer-events-none fixed inset-0 z-0 bg-soot bg-[url(/world-poster-tall.png)] bg-cover bg-center md:bg-[url(/world-poster-wide.png)]" />
      <MapBoundary>
      <Suspense fallback={null}>
        <World fill={gaugeFill} burnedPercent={burnedPercent} live={isConfigured} running={state.isWheelSpinning} burnKey={burn} stokes={stokes} />
      </Suspense>
      </MapBoundary>
      <MiniMap />

      <main className="relative z-10">
        <Hero
          tokenSymbol={tokenSymbol}
          totalBurned={totalTokensBurned}
          burnedPercent={burnedPercent}
          fires={fires}
          escrow={escrow}
          threshold={threshold}
          fill={gaugeFill}
          nextCycle={nextCycle}
          live={isConfigured}
          running={state.isWheelSpinning}
          tokenAddress={config.tokenAddress}
          copiedCA={copiedCA}
          onCopyCA={copyCA}
          buyHref={buyUrl(config.tokenAddress)}
          chartHref={chartUrl(config.tokenAddress)}
          onStoke={stokeFire}
          stokes={stokes}
          say={`“${STOKER_SAYS[(stokes - 1 + STOKER_SAYS.length) % STOKER_SAYS.length]}”`}
        />

        <TheRun
          tokenSymbol={tokenSymbol}
          escrow={escrow}
          threshold={threshold}
          fill={gaugeFill}
          claimedETH={state.totalFeesClaimedETH || 0}
          retainedETH={state.totalFeesRetainedETH || 0}
          routerName={routerName}
          nextCycle={nextCycle}
          live={isConfigured}
        />

        <TheLine burnedPercent={burnedPercent} tokenSymbol={tokenSymbol} />

        <Logbook
          burnLedger={burnLedger}
          totalBurned={totalTokensBurned}
          logs={logs}
          tokenSymbol={tokenSymbol}
          deadAddress={deadAddress}
          explorerUrl={EXPLORER_URL}
          copiedDead={copiedDead}
          onCopyDead={copyDead}
          onOpenLog={() => setIsLogOpen(true)}
        />

        <Cab state={state} config={config} logs={logs} live={isConfigured} fill={gaugeFill} explorerUrl={EXPLORER_URL} onOpenLog={() => setIsLogOpen(true)} />

        <Story tokenSymbol={tokenSymbol} deadAddress={deadAddress} />

        <Finale
          tokenSymbol={tokenSymbol}
          buyHref={buyUrl(config.tokenAddress)}
          tokenAddress={config.tokenAddress}
          copiedCA={copiedCA}
          onCopyCA={copyCA}
          links={{ x: X_URL, telegram: TG_URL, chart: config.tokenAddress ? chartUrl(config.tokenAddress) : '', deadAddr: `${EXPLORER_URL}/address/${deadAddress}` }}
        />

        <footer className="relative border-t border-seam bg-soot">
          <div className="mx-auto flex max-w-[88rem] flex-col gap-4 px-4 pb-12 pt-8 text-[0.95rem] text-ash sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
            <div className="flex items-center gap-3">
              <StokerMark className="h-7 w-7" />
              <span className="font-semibold text-steam">{tokenSymbol} on Robinhood Chain</span>
            </div>
            <p className="m-0 max-w-[52ch]">Burns and pay runs are made by a bot and every one is on chain. A meme, not financial advice.</p>
            <div className="font-mono text-[0.8rem]">
              Chain ID 4663 · {!isConfigured ? 'fire not lit yet' : state.isWheelSpinning ? 'on a run now' : `class ${stage.wheels} on the line`}
            </div>
          </div>
        </footer>
      </main>

      <div
        aria-hidden={!showBar}
        className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 bg-soot px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_0_var(--color-seam)] transition-transform duration-200 ease-[steps(3)] sm:hidden ${showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
      >
        <a href={buyUrl(config.tokenAddress)} target="_blank" rel="noreferrer" tabIndex={showBar ? 0 : -1} className="btn-buy flex-1 py-3 text-[1rem] no-underline">
          Buy {tokenSymbol}
        </a>
        {config.tokenAddress ? (
          <button type="button" onClick={copyCA} tabIndex={showBar ? 0 : -1} className="btn-chip h-[3.25rem] shrink-0 cursor-pointer px-3" aria-label="Copy contract address">
            {copiedCA ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            CA
          </button>
        ) : null}
      </div>

      <BurnAlert burnLedger={burnLedger} tokenSymbol={tokenSymbol} explorerUrl={EXPLORER_URL} sound={config.soundEnabled} onBurn={setBurn} />

      <BurnLedgerDrawer isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} logs={logs} burnLedger={burnLedger} state={state} config={config} />
    </div>
  );
}

export default App;
