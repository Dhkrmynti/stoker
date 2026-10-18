---
name: STOKER
description: The footplate of a steam locomotive that burns its own supply, drawn in pixels. Soot-black riveted iron, one ember light, brass instruments, steam-white pixel type, Edmondson tickets. The fee escrow is the fire.
colors:
  soot: "#0f0d0d"
  iron: "#171414"
  plate: "#211c1b"
  plate-hi: "#2c2524"
  seam: "#3a3230"
  rivet: "#5c514c"
  steam: "#eee9e2"
  ash: "#aaa098"
  ember: "#ff5a1f"
  ember-hi: "#ff7a45"
  ember-lo: "#b8321a"
  flame: "#ffa630"
  core: "#ffe08a"
  brass: "#d4a648"
  brass-hi: "#ecc97a"
  brass-lo: "#8a6a24"
  rail: "#6d6560"
  ticket: "#e7d7a8"
  ticket-band: "#2f6b4f"
  ticket-ink: "#1d1814"
typography:
  display:
    fontFamily: "Jersey 10, Courier New, monospace"
    fontSize: "clamp(4rem, 11vw, 8.4rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Jersey 10, Courier New, monospace"
    fontSize: "clamp(2.8rem, 6vw, 5rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "0.01em"
  title:
    fontFamily: "Jersey 10, Courier New, monospace"
    fontSize: "clamp(1.9rem, 3vw, 2.6rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "0.01em"
  body:
    fontFamily: "DotGothic16, Courier New, monospace"
    fontSize: "1.08rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Tiny5, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
rounded:
  none: "0px"
spacing:
  px: "4px"
  gutter-sm: "16px"
  gutter-md: "40px"
  gutter-lg: "64px"
  section-sm: "96px"
  section-md: "128px"
  container: "88rem"
components:
  button-buy:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.soot}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "16px 28px"
  button-chip:
    backgroundColor: "{colors.iron}"
    textColor: "{colors.steam}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "9.6px 16px"
  button-chip-hover:
    textColor: "{colors.brass-hi}"
  button-ink:
    backgroundColor: "{colors.soot}"
    textColor: "{colors.ember}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "13.6px 22.4px"
  ca-field:
    backgroundColor: "{colors.iron}"
    textColor: "{colors.steam}"
    typography: "{typography.mono}"
    rounded: "{rounded.none}"
    padding: "7.2px 7.2px 7.2px 16px"
  iron-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.steam}"
    rounded: "{rounded.none}"
    padding: "40px"
  nameplate:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.ticket-ink}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  ticket:
    backgroundColor: "{colors.ticket}"
    textColor: "{colors.ticket-ink}"
    rounded: "{rounded.none}"
    padding: "16px 56px 16px 40px"
  flap:
    backgroundColor: "{colors.iron}"
    textColor: "{colors.steam}"
    rounded: "{rounded.none}"
  speech:
    backgroundColor: "{colors.steam}"
    textColor: "{colors.soot}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "5.6px 12.8px 4px"
  nav-link-active:
    textColor: "{colors.brass-hi}"
    typography: "{typography.label}"
---

# Design System: STOKER

## Overview

**Creative North Star: "The Footplate"**

The page is the footplate of a steam locomotive, and the fee escrow is literally the fire. The first view is the boiler backhead: a brass pressure gauge whose needle is the live escrow over the claim threshold, mounted above a stepped firebox arch with a pixel fire that burns as hard as the gauge reads. Scrolling pushes the camera through the firebox door until the heat fills the screen, then the page runs along the rails: the run as stops on the line, the engine classes as a route map, the logbook as punched card tickets, the cab board as a split-flap departure board, Stoker's footplate pass, and a last fire bed to end on.

The whole world is drawn in pixels. One art pixel of UI chrome is 4px (`--px`): corners notch in 4px steps, edges are lit and shaded in 4px rows, rivets are 4px squares and shadows are hard offsets. The art is pixel art generated in code: the fire is a low-res demo-scene "Doom fire" canvas, the gauge a 48x48 canvas, the locomotives canvas sprites built from their wheel arrangement, the mark a 16x16 SVG. Everything is scaled up without smoothing, and motion steps instead of easing.

Everything sits on soot-black riveted iron. There is exactly one light, ember orange, and it belongs to Buy and to things that are live or next. Brass is the colour of instruments and of position: the gauge bezel, the route line and the train marker on it, the nav's active rule, the current engine class. Text is steam white on the iron and ticket ink on card stock. The world refuses the category default of a dark hero with a stat row and three feature cards.

**Key Characteristics:**
- Soot and riveted iron plates as the ground, built on a 4px art pixel; depth from hard pixel offset shadows and lit/shaded 4px edges.
- One ember light for Buy and live/next indicators; brass for instruments, progress and position.
- Chunky pixel plate type (Jersey 10), tiny pixel stamps (Tiny5), a dot-matrix reading face (DotGothic16), mono only for chain data.
- Edmondson card tickets (buff stock, green band, square punched hole, stepped corners) for the logbook and the pass.
- Every number on the page is live from the engine; motion is GSAP on `steps()` eases that leaves a readable default state.

### The map (signature)

The whole page sits on one fixed 3D map, `world/World.tsx` (lazy-loaded three.js). A low-poly island of instanced 2-unit ground blocks sits in a slowly heaving molten sea; a railway loop runs round it past the furnace at 0x…dEaD, the gauge tower (needle = fee gauge), the water tower (lets off steam at a full gauge or mid-run), the $COAL hopper, the pay office, five class platforms (unlocked engines solid, locked ones wireframe), the logbook depot and the signal box. Today's class pulls two coal wagons round the loop, faster mid-run. The furnace door glows and its light, stack embers and flare follow the fee gauge and fresh burns.

It renders at 1/3 of the screen's resolution (1/2 on phones) with antialiasing off and the canvas scaled with `image-rendering: pixelated`, so every face reads as pixels. Flat-shaded Lambert materials, a hemisphere light, one cool key light and the furnace point light; fog into the night sky. 30 fps cap, paused when the tab is hidden; under reduced motion it renders still frames and cuts between shots.

The furnace is a real firebox: brick walls round an opening with two riveted iron doors on hinges, a glowing interior and a pixel fire texture on its walls. The doors stay shut (a glowing slit between them) until the finale, where they swing open as the camera nears and the camera flies straight in through the doorway; that one hop never arcs. The page ends inside the furnace with the fire wall up and the buy panel over it; the camera never comes back out.

Until the map has a frame, a pixel still of the first view (`public/world-poster-wide.png` / `-tall.png`, rendered from the map itself) sits behind it, so the page never opens on black; the canvas steps in over it. The class platforms are walked under one sticky panel whose list lights the class in view. On phones a buy bar sits at the bottom of the screen from the run until the buy panel inside the furnace shows.

When a real burn lands (or `?burn` for a demo), the furnace plays it out: the doors swing open, one coal wagon with a glowing load rolls off the loop down a short spur and through the doorway, the fire flares, the stack throws a burst of smoke and embers, and the doors shut again (about 6.5 s; under reduced motion only the flare).

A pixel mini-map (`MiniMap.tsx`, md and up, bottom left, hidden over the first view) draws the island from the layout the 3D map publishes (`world/mapStore.ts`, no three.js in the main bundle): ground, the line, brass station squares, the furnace in ember (pulsing during a burn), the train, and the camera with its view direction. It names the station in view and flies the page to a station on click; the same jumps exist as screen-reader buttons.

Each section names its station with `data-cam`; the camera eases toward the station of whatever is at the middle of the screen, arcing over the island on long hops. On wide screens a horizontal view offset puts the station on the side opposite the section's panel. On phones the station is lifted into the top of the screen and the panels sit low. Text over the map sits in `.map-panel` (soot at 88% with a pixel border) or uses `.map-type` (hard soot outline and drop).

## Colors

A near-black warm iron palette lit by a single ember, with brass instruments and buff card stock as the only other materials.

### Primary
- **Firebox Ember** (`ember`): the one light. The Buy button, the blinking live square in the cab, the "next run" outcome ring and stamp, the burn tag in the cab's log, the BurnAlert title and ring, the gauge needle's tip, focus outlines, text selection and the caret. `ember-hi` and `ember-lo` are its lit top row and shaded bottom row on the Buy button; `ember-lo` is also the gauge's red line and needle body and the locomotive buffer beam.
- **Flame** (`flame`) and **White Heat** (`core`): the inside of the fire only. The fire ramp, the banded heat rings after the firebox push, the cab's fee-gauge segments below the red zone, the tx link in the BurnAlert, the centre of the mark's flame. They never colour a control.

### Secondary
- **Instrument Brass** (`brass`, with `brass-hi` and `brass-lo`): instruments, progress and position. The gauge bezel (lit `brass-hi` upper-left, `brass-lo` rims) and hub, the brass nameplate behind the hero's burned total and the run's "full gauge" readout, the drawn route line and the square train marker on TheLine, station squares that are reached, the "on the line now" tag, the current class heading, the nav's active underline and text, live readings in TheRun (`brass-hi`), and the hover border of quiet controls (`brass-lo`).

### Tertiary
- **Ticket Stock** (`ticket`), **Ticket Band** (`ticket-band`), **Ticket Ink** (`ticket-ink`): Edmondson card tickets. Buff stock, a green vertical band and band-coloured stamps, dark ink text. Used for logbook tickets, the pay-packet stub and Stoker's footplate pass. Ticket ink also draws the gauge's ticks and its reading.

### Neutral
- **Soot** (`soot`): page ground, the firebox interior, the 4px outline round the Buy button and the speech bubble, text on ember and brass.
- **Iron** (`iron`): alternate section ground (TheLine, the cab), quiet control and field fill, the shaded bottom-right edge of plates.
- **Plate** / **Plate High** (`plate`, `plate-hi`): the plate surface is flat `plate`; `plate-hi` is its lit 4px top-left edge, the firebox door and the rivet line on the soot wall.
- **Seam** (`seam`): the 4px pixel border round plates, the firebox frame, inset outlines of controls, dividers, the untravelled route line, coal lumps.
- **Rivet** (`rivet`): 4px square rivets in plate corners and on the firebox door; the dotted outline of locked works drawings.
- **Steam** (`steam`): all primary text on iron. **Ash** (`ash`): secondary text, stamps, intros, wheel rims.
- **Rail** (`rail`): rails under the engine, wheel spokes, the cab's not-live square.

### Legacy remaps
`index.css` also defines the old names (`ink`, `cream`, `mist`, `ecto`, `gold`, `paper`, `pen`, `lcd`, `bubble`, `ring`, `fuel` and the rest) and old font names (`logo`, `lcd`, `display`, `pixel`, `hand`, `sign`) as aliases onto the footplate palette and the pixel faces. They exist only so the log drawer (`BurnLedgerDrawer`) and the `/memex` operator panel keep rendering. New surfaces use the STOKER names; never introduce a legacy name into new code.

### Named Rules
**The One Light Rule.** Ember is reserved for Buy and for things that are live or next. If a decorative element glows ember, it is wrong; brass or steam takes it.

**The Brass Means Where Rule.** Brass marks instruments, progress and position: how full, how far, which one is current. It is not a second accent for emphasis or decoration.

**The Card Stock Rule.** Light surfaces exist only as ticket stock (and the gauge face). There is no light theme and no light card on the iron otherwise.

## Typography

**Plate Font:** Jersey 10 (with Courier New, monospace)
**Stamp Font:** Tiny5 (with Courier New, monospace)
**Body Font:** DotGothic16 (with Courier New, monospace)
**Mono Font:** JetBrains Mono, self-hosted (with ui-monospace)

Jersey 10, Tiny5 and DotGothic16 load from `@fontsource` (weight 400 only); JetBrains Mono is self-hosted in `fonts.css`.

**Character:** Chunky bitmap capitals like the letters cast on an engine's cab side, over a dot-matrix reading face. The stamp face is tiny pixel caps, a mark punched or painted onto iron and card. Pixel faces carry their weight in the glyph; there is no bold.

### Hierarchy
- **Display** (Jersey 10 400, clamp(4rem, 11vw, 8.4rem), 0.82): the STOKER wordmark in the hero, the finale "Shovel it in." (up to 7.5rem) and "Into the fire." in the heat. Uppercase.
- **Headline** (Jersey 10 400, clamp(2.8rem, 6vw, 5rem), 0.82): section titles (The run, The engine grows, The logbook, In the cab, the story).
- **Title** (Jersey 10 400, clamp(1.9rem, 3vw, 2.6rem), 0.82): stop titles, station names, ticket amounts, nameplate figures, readings, the Buy label, the speech bubble. Numbers use tabular lining figures.
- **Body** (DotGothic16 400, 0.96 to 1.12rem, leading 1.375 to 1.625): running text in `steam` at 85 to 90% or `ash`, capped at 26 to 62ch.
- **Label** (Tiny5 400, 0.68 to 0.85rem, 0.06em tracking, uppercase): stamps, field labels, quiet buttons, the nav, instrument captions.
- **Mono** (0.78 to 0.85rem): contract address, the dead address, tx hashes, ticket serial numbers, the footer chain line.

### Named Rules
**The Cast Plate Rule.** Plate type is always uppercase Jersey 10 at line-height 0.82 and 0.01em tracking. Never set it in sentence case, never fake-bold it.

**The Stamp Is Not a Kicker Rule.** Tiny5 is for in-world stamps (a ticket's "firebox, single", a reading's caption, a field's label, a quiet button). It never sits above a section heading as an eyebrow.

**The Mono Is Chain Data Rule.** JetBrains Mono appears only for addresses, hashes and serials, never for numbers that are readings or for prose. It is the one non-pixel face on the page.

## Layout

A single column of full-bleed sections inside an 88rem container, with side gutters of 16px, 40px from 640px and 64px from 1024px. Sections breathe at 96px vertical padding, 128px from 640px. Grounds alternate between the soot wall (soot with a row of 4px square rivets and a plate seam every 360px) and plain iron, so each chapter reads as a different plate of the engine.

The hero is a 5/12 by 7/12 grid at 1024px: wordmark and line, then the brass nameplate, Buy/Chart and the CA strip on the left; the boiler backhead (gauge plate and gauge above, firebox below) on the right. On phones it stacks copy, backhead, proof, with the gauge tucked at the top right of the firebox. TheRun lays its stops in a horizontal track at 1024px (pinned) and stacks them below that. TheLine is a five-column route at 1024px and a vertical line with stations on the left below it. The nav is fixed, transparent at the top and soot at 92% with a seam rule and blur once scrolled; section links appear from 768px, the CA chip from 1024px.

## Elevation & Depth

Depth is pixel depth. A plate is lit along its top-left 4px edge (`plate-hi`), shaded along its bottom-right 4px edge (`iron`), wrapped in a 4px `seam` border drawn from four offset shadows, and casts a hard, zero-blur drop straight down. Hard offset shadows are the native depth language: plates and nameplates drop 12px, the gauge and the BurnAlert drop 8 to 12px at about 50% black. The only soft light on the page is real light: the firebox heat spill, a radial glow behind the arch whose strength (`--heat`, 0.30 to 0.70) follows the gauge. The heat that fills the screen after the push is posterised, hard-banded rings of core, flame, ember, ember-lo and a deep red, not a smooth gradient; the fade below it and the soot fade over the closing fire bed are banded the same way.

### Shadow Vocabulary
- **Plate** (`inset 4px 4px 0 plate-hi, inset -4px -4px 0 iron, ±4px 0 0 seam, 0 ±4px 0 seam, 0 12px 0 rgb(0 0 0 / 0.45)`): riveted iron plates. The four seam offsets leave the corners open, so the border notches in by one art pixel.
- **Nameplate** (`inset 0 4px 0 brass-hi, inset 0 -4px 0 brass-lo, ±4px 0 0 brass-lo, 0 ±4px 0 brass-lo, 0 12px 0 rgb(0 0 0 / 0.45)`): the brass plate, same notched build in brass.
- **Buy ledge** (`inset 0 4px 0 ember-hi, inset 0 -4px 0 ember-lo, ±4px 0 0 soot, 0 -4px 0 soot, 0 4px 0 ember-lo, 0 8px 0 soot`): the Buy button stands on an ember-lo ledge outlined in soot.
- **Sprite drop** (`drop-shadow(6px 8px 0 rgb(0 0 0 / 0.55))`): the gauge sprite.
- **Live ring** (`0 0 0 4px ember, 0 12px 0 rgb(0 0 0 / 0.5)`): the BurnAlert; the next-run outcome takes the 4px ember ring alone.
- **Firebox spill** (`radial-gradient(closest-side, rgb(255 110 30 / var(--heat)), transparent)` on a layer 48px outside the arch): the one soft glow.

### Named Rules
**The Hard Pixel Rule.** Shadows are hard offsets with zero blur, in whole art pixels, and edges are lit and shaded in 4px rows. Soft blur is reserved for real light, which means the firebox heat spill and nothing else. The scrolled nav bar sits on solid soot with a 4px seam under it.

## Shapes

There is no border radius anywhere. Corners are notched pixel corners: plates and the nameplate get theirs from the 4px offset-shadow border, tickets from a stepped `clip-path` that cuts each corner in two 4px steps. The firebox is the one arch, a stepped pixel arch (`.arch`) clipped as a staircase over the full width, set in a seam frame with an iron grate along the bottom. The gauge is a pixel circle painted on its canvas. Rivets are 4px squares, 12px in from each plate corner. Tickets carry a 12px square punched hole near the right edge and a green band near the left. Station markers on TheLine are squares with a 4px border; the train marker is a square brass block ringed in soot; wagon wheels are octagons. Stoker's speech bubble is square-cornered with a soot pixel outline and a stepped tail.

## Components

### Buttons
- **Buy** (`.btn-buy`): a firebox handle you pull. Flat ember face with a lit `ember-hi` top row and a shaded `ember-lo` bottom row, soot plate type at 1.35em, square corners, outlined in soot and standing on the Buy ledge. Hover lifts one art pixel (4px) and brightens; active presses down 4px. Transitions run on `steps(2)`. The only primary; used in the nav, the hero and the finale.
- **Chip** (`.btn-chip`): a quiet key. Iron fill, steam Tiny5 text, a 4px seam inset border; hover turns text `brass-hi` and the border `brass-lo`; active presses down 4px. Chart, copy, open the full logbook, follow links.
- **Ink** (`.btn-ink`): the operator panel's dark key, soot with ember text, for `/memex`.
- Focus on every control is a 4px ember outline at 4px offset.

### Contract address field
- **Style** (`.ca-field`): an iron strip with a 4px seam inset border, a stamp "contract address" label over the full address in mono, and a square soot copy key with an ember glyph. Hover takes the brass-lo border. Before launch it says the CA is posted at launch.

### Iron plate
- **Style** (`.iron-plate`): the base container. Flat plate fill, four square rivets, lit and shaded 4px edges, notched seam border, 12px hard drop, 24 to 40px padding. Hosts TheRun stops, the gauge plate, the cab board, pay rows and the BurnAlert.

### Nameplate
- **Style** (`.nameplate`): cast brass with ticket-ink plate type, a lit top row and a notched brass-lo border. Carries the hero's live burned total (counts up in steps, then re-inks only changed digits) and the "full gauge" threshold.

### Ticket
- **Style** (`.ticket`): Edmondson card stock with stepped corners, a green band and a square punched hole; each logbook ticket tilted between -2 and 2 degrees. Band-coloured stamp ("firebox, single" or "biggest fire"), mono serial "No. 0001", the burned amount in plate type, time and tx hash. An empty logbook shows a blank stub where ticket No. 0001 will print.

### Navigation
- Fixed bar: the StokerMark (tilts on hover in `steps(3)`) and the plate-type wordmark, Tiny5 section links that turn `brass-hi` with a 2px brass underline that scales in on `steps(3)` for the current chapter, a mute key, the X link, the CA chip and Buy.

### Fire (signature)
A pixel coal fire: the demo-scene "Doom fire" cellular spread. Heat is fed along the bottom row of a low-res canvas (`cols` art pixels across, 24 to 160; the height follows the box) and drifts up, cooling and wandering sideways a cell at a time, drawn through a 37-step warm ramp from soot through red and orange to white-hot and scaled up with `image-rendering: pixelated`. A lumpy pixel coal heap sits on the grate and glows in spots. The flame height follows intensity, which is the gauge fill (0.15 before launch), so trading visibly stokes it; it flares on a stoke (rapping the firebox door) and on a fresh burn. Ticks at 20fps, sleeps off screen or when the tab is hidden, and draws one settled frame under reduced motion. Used in the hero firebox, the burn-run outcome, the BurnAlert and the closing fire bed.

### Gauge (signature)
A pixel Bourdon pressure gauge on a 48x48 canvas: brass bezel lit from the upper left, cream face, 270-degree sweep with 21 ticks in ticket ink, an ember-lo red line over the last 14% (a full gauge), a needle drawn pixel by pixel (ember-lo body, ember tip) and a square brass hub. An HTML pixel-font overlay prints "fee" in Tiny5 and the live ETH reading in Jersey 10, sized in container units; it reads COLD before launch. The needle ticks toward a new reading in steps of up to 9 degrees every 70ms, like a sprite, with no overshoot; under reduced motion it jumps.

### Locomotive (signature)
A pixel side elevation on a canvas sprite, generated from the Whyte wheel arrangement (0-4-0 up to 4-8-4): drivers with spokes and a brass hub, carrying wheels, a brass coupling rod riding the cranks, boiler with brass bands, dome, chimney, cab with the fire flickering through. When running, the spokes and rod animate through 4 frames at 8fps. A locked class is drawn as a dotted works drawing: only its outline, every other pixel, in rivet grey.

### Mark
The StokerMark is a 16x16 pixel SVG with `crispEdges`: a brass-framed firebox door with soot, ember, flame, core and white-hot pixels inside. `public/stoker-mark.svg` is the same art.

### Hero backhead
The gauge plate (class and gauge line on an iron plate) and gauge over the stepped firebox arch; the door hangs open on its hinge, rapping it flares the fire and Stoker shouts a line in a pixel speech bubble.

### TheRun, TheLine, Cab, BurnAlert
- **TheRun**: three iron-plate stops (pressure gauge, full-gauge nameplate, the $COAL wagon with pixel coal lumps) each with a live brass reading, then the two outcomes (burn run with a fire, Stoker's pay with a ticket); the next one gets the 4px ember ring and an ember "next run" stamp.
- **TheLine**: the five engine classes as stations on a route map; the 4px brass line is drawn to the real burned share with a square brass train marker, reached stations' squares turn brass, the current class gets the brass "on the line now" tag, classes ahead are dotted works drawings.
- **Cab**: an iron-plate board with split-flap tiles (`.flap`, a dark two-tone tile split by a 2px soot line, in plate type) for what the bot is doing and four totals, a 12-segment square fee gauge (flame, ember in the last two), and the last five moves with stamp kind tags (ember for a burn) and tx links. The live indicator is a square that blinks on `steps(1)`.
- **BurnAlert**: a bottom toast on an iron plate with the live ring, a small fire, "Into the fire" in ember and the burned amount; the whistle plays if sound is on. `?burn` or `?burn=1234567` plays a demo for recordings.

### Motion
All scroll motion is GSAP ScrollTrigger inside `gsap.matchMedia`, and every section is readable in its default state, so reduced motion or a failed script shows the finished page. Every ease steps: GSAP uses `steps(n)` throughout and CSS transitions use `steps(2)` or `steps(3)`. There is no smooth easing curve in the system.
- **Into the firebox (signature, 768px and up, motion-safe):** the hero pins for 120% of a screen; the backhead zooms toward the firebox centre on `steps(24)`, the door swings on `steps(4)`, copy and gauge fall away on `steps(6)`, the banded heat fills the screen and "Into the fire." snaps in on `steps(5)`. Phones get a gentle gauge lift only.
- **The run (1024px and up, motion-safe):** the section pins and the stops pan horizontally while the current engine rolls along the rails underneath; each stop's art scales up in `steps(4)` as it reaches the middle. Below 1024px the stops rise in on `steps(6)`; with reduced motion they stack.
- **The line:** the brass route draws out to the train's live position as you scroll, snapping to 1/40 increments and lighting stations as it passes; the engines rise in on `steps(6)`.
- **Logbook:** tickets clip in from the left one after another on `steps(6)`; pay rows rise.
- **Story and finale:** story lines rise on `steps(6)`; the words of "Shovel it in." drop in like coal lumps on `steps(5)`; the footplate pass swings into place on `steps(8)`.
- **Entrances:** hero plates bolt in on `steps(6)`; the BurnAlert slides up on `steps(6)`.
- **State changes:** split-flap tiles scramble through letters on a value change; live numbers count up once on `steps(6)`, then re-ink only the changed digits (`steps(3)`); the gauge needle ticks over in 9-degree steps.

## Do's and Don'ts

### Do:
- **Do** keep every number live from the engine and show Stoker's pay runs as openly as the burns.
- **Do** reserve ember for Buy and for live or next indicators; use brass for gauges, progress, position and the current state.
- **Do** build everything on the 4px art pixel (`--px`): square corners notched in 4px steps, lit and shaded 4px edges, 4px square rivets.
- **Do** use hard zero-blur offset shadows in whole art pixels for depth, and keep soft glow for the firebox heat spill only.
- **Do** set headings in uppercase Jersey 10 at line-height 0.82, stamps in Tiny5 with 0.06em tracking, and reading text in DotGothic16.
- **Do** draw world art as pixel art in code (canvas or crispEdges SVG, scaled with `image-rendering: pixelated`), bound to live data, with a still frame under reduced motion.
- **Do** run scroll motion through `gsap.matchMedia` from a readable default state, with `steps(n)` eases.
- **Do** keep engine class thresholds in `src/components/stoker/stages.ts`.

### Don't:
- **Don't** add a second accent colour or use ember for decoration.
- **Don't** use any border radius, or smooth anti-aliased curves in the art.
- **Don't** use soft blurred drop shadows or smooth gradients for heat; posterise into hard bands.
- **Don't** use smooth easing curves (expo, back, bounce); motion steps.
- **Don't** use Tiny5 as a kicker or eyebrow above a heading.
- **Don't** use JetBrains Mono for anything but addresses, hashes and serials.
- **Don't** use the legacy colour or font names outside the log drawer and `/memex`.
- **Don't** show a ticket, fire or pay run that is not a real on-chain event on the live site (the `?burn` demo is for recordings).
