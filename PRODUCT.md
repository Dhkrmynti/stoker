# Product

<!-- impeccable:product-schema 1 -->

## Current brand (2026-10-18): STOKER ($COAL)

The public site was redrawn as **STOKER ($COAL)**, the footplate of a steam locomotive that burns its own supply. Engine, bot, API, tokenomics and `/memex` are unchanged; only UI and lore copy changed.

- Lore: every steam engine has a fireman. **Stoker** works the footplate of an engine that runs on its own supply: every $COAL that goes in the firebox is gone. Catchphrase: "Shovel it in."
- The fire is the fee escrow: the hero firebox burns as hard as the gauge reads (escrow / claim threshold), so trading literally stokes it.
- Engine classes by real share of supply burned (Whyte wheel arrangements): **Yard Shunter 0-4-0** (0–0.5%), **Goods Engine 0-6-0** (0.5–1%), **Mainline 4-6-0** (1–2.5%), **Pacific Express 4-6-2** (2.5–5%), **The Northern 4-8-4** (5%+). Thresholds are lore, tunable in `src/components/stoker/stages.ts`.
- Terms: fee escrow → **the fee gauge / fee pressure**; claim threshold → **a full gauge** (the whistle blows); the bot → **the bot** (no nickname); claim → **the bot claims it**; buyback → **buying $COAL**; burn → **into the firebox / a fire**; dead address → **the firebox at 0x…dEaD**; odd runs → **burn runs**; even runs → **Stoker's pay** (project wallet, shown openly); burn log → **the logbook**; one burn → **a ticket**; live status → **the cab board**.
- Voice: loud, sooty, working-class, short sentences ("nothing comes back out of a firebox.", "shovel it in.").
- The page is one 3D map (user asked for a 3D map that stays pixel and light): a low-poly island rendered by three.js at 1/3 resolution (1/2 on phones), behind every section. Scrolling flies the camera between stations: furnace at 0x…dEaD with its doors shut (hero), gauge tower, water tower, $COAL hopper, furnace (odd runs), pay office (even runs), five class platforms, logbook depot, signal box (cab), island overview (story). The page ends inside the furnace (user's call, 2026-10-18: going in has to be the last thing, nothing comes back out): back at the doors with "Shovel it in.", the doors swing open as you scroll, the camera flies in through the doorway, a wall of pixel fire climbs over the screen with "Into the fire.", and the Buy button and CA wait inside the fire (`Finale.tsx`). The live train on the loop is today's class; locked classes stand as wireframes. Camera shots live in `src/components/stoker/world/World.tsx` (`SHOTS`), keyed by `data-cam` on sections.
- Look: pixel art (2026-10-18, user asked for pixel). Fonts: Jersey 10 (display), Tiny5 (stamps), DotGothic16 (body), JetBrains Mono (addresses). Fire is a pixel "Doom fire" canvas, the gauge, engines and mark are pixel sprites drawn in code, all motion is stepped. The palette (soot iron, one ember light, brass) keeps it apart from the retired DIGBY pixel graveyard (night purple, ecto green).
- Not live yet: no domain, no X, no CA. $COAL needs a new Pons launch; the on-chain name/ticker of the current token cannot change. `X_URL` in `App.tsx` is empty until there is an account; og:image and canonical were removed from `index.html` until there is a domain and a STOKER link-preview image.
- Demo a burn with `?burn` or `?burn=1234567`: the alert shows, and on the map a coal wagon rolls into the furnace and the stack flares.
- Previous brands (DIGBY, MUNCH, Lava Pit/Brr, Black Void, Mort's Ghost Train, Sherwood) are retired; the Black Void sections below are historical.

## Platform

web

## Purpose

VOID ($VOID) is a memecoin on Robinhood Chain (chain ID 4663, Pons Family v2) with an autonomous buyback-and-burn engine. Trading generates creator fees in ETH that accumulate in a Fee Escrow. When the escrow passes the claim threshold, a 24/7 bot claims the fees and, on burn cycles, market-buys the token on the DEX (Pons curve before graduation, Uniswap v4 after) and sends it to `0x000000000000000000000000000000000000dEaD`. Cycles alternate: odd cycles burn, even cycles keep (fees go to the creator/treasury wallet). See `useBurnEngine` and `bot/pons-burn-bot.ts`.

The public website is a read-only tracker and landing page. A hidden `/memex` route is the operator admin panel.

This project is a separate copy of the BLAZE site (`../mburn-2`); BLAZE stays live and untouched.

## Users

- **Primary:** crypto traders and memecoin buyers on Robinhood Chain deciding whether to buy, usually arriving from X/Telegram on a phone or desktop. Their job: verify the burn is real, copy the CA, buy.
- **Secondary:** existing holders ("Observers") checking that falls keep happening.
- **Operator:** the creator, using `/memex` to configure the engine.

## Positioning

The first viewport must prove the burn is real: the live fallen total, the share of supply gone, and the primary Buy action sit in the first view. Lore supports the proof. Tone: deadpan, cosmic, a little ominous.

## Lore & terminology (confirmed 2026-10-10, replaces Mort's Ghost Train and Sherwood)

- Name and ticker: **Black Void ($VOID)**. Domain: **blackvoid.fun** (confirmed 2026-10-10). Tagline: "Everything falls in."
- Story: every token ever sent to 0x…dEaD piled up until the address collapsed into a black hole, catalogued **dEaD-1** and nicknamed **the Void**. **Deadsky Observatory** watches it; its night bot, **the Watcher**, feeds it. The Void speaks rarely ("more.").
- Fee Escrow → **the accretion disk**; claim threshold → **critical mass**; claim → **the pull**; buyback → **the feed**; burn → **falls in / crosses the horizon**; dead address → **the event horizon**; cycles → **orbits** (odd orbit: falls in; even orbit: **observatory fuel**); burn log → **the observing log**; holders → **Observers**; the bot → **the Watcher**.
- Keep cycles are shown openly as observatory fuel, never hidden.
- The CA comes from the bot / admin panel as before.

## Constraints

- Change UI and lore copy only. Never change backend, bot, hooks (`useBurnEngine`), web3 utils, contracts, thresholds, features, handlers, data flow, or tokenomics.
- Existing tokenomics claims ("0% TAX", "LP LOCKED", "100% BURN", "Zero team allocation") belong to the user. "100% BURN" contradicts the keep cycles; the user was asked on 2026-10-07 and chose to keep the line as is. Do not raise it again or rewrite it unasked.
- Persisted data keys (`burnedJollyburn`, `burnedMuseburn`, `burnedIncinerator`, `jollyburn_*` storage keys) must stay readable.

## Open decisions

- X account: `@blackvoidrh` (https://x.com/blackvoidrh), confirmed 2026-10-10.
- Final CA for the new token.
