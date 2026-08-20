# Bounce Mallow

An endless procedural auto-runner platformer built with plain HTML5 Canvas + vanilla JavaScript. You are a small marshmallow. You run. The only thing you can do is **jump**.  Avoid white spikes and patrolling spike bugs, don't fall in the gaps, and see how far you can go.

## Controls

| Action            | Keyboard            | Mobile            |
| ----------------- | ------------------- | ----------------- |
| Jump              | `Enter` or `Space`  | Tap / click       |
| Pause             | `Esc`               | ⏸ button (top right) |
| Resume (paused)   | `Esc` / `Enter`     | RESUME button     |
| Quit to title (paused) | `Q`           | QUIT button       |
| Start / play again | `Enter` / `Space`  | Tap / click       |

That's the whole control scheme — one button. Timing is everything.

## Gameplay

- **Title screen** → press a key or tap to start.
- **3-2-1 countdown** → then Mallow starts running to the right automatically
  and the camera follows.
- **Score** = distance travelled in meters, shown top-left during play and on
  the Game Over screen. Your best score is saved locally.
- **Death** by touching white spikes, a spike bug, or falling out of view
  (missed gap / ledge) → Game Over screen with final + best score and
  play-again.
- **Pause** any time with `Esc` (or the on-screen button on mobile) — resume
  or quit back to the title.

### The World

The level is never predefined. It is generated in chunks ahead of the camera:

- Ground runs with **gaps** to jump across,
- **White spike** clusters on the ground,
- **Spike bugs** that patrol back and forth along the ground,
- **Floating one-way platforms** you can hop up and climb over.

Chunks behind the player are discarded as soon as they scroll off screen.
Difficulty scales with distance: the run gets faster, gaps get wider, and
there are more spikes and faster bugs. Generation includes playability
guarantees — a safe flat opening, minimum spacing between hazards, spike-free
landing zones after gaps, and bugs never patrol over spikes.

## Technical notes

- **Files:** `index.html` (shell + CSS), `game.js` (everything else).
- **Canvas:** logical 640×640 square, internal resolution scaled by
  `devicePixelRatio` (capped at 3) for crisp graphics; CSS size is the largest
  square that fits the viewport, re-fitted on resize.
- **Palette:** strictly the 16 colors of the Arne16 scheme
  (`#000000 #9D9D9D #FFFFFF #BE2633 #E06F8B #493C2B #A46422 #EB8931 #F7E26B
  #2F484E #44891A #A3CE27 #1B2632 #005784 #31A2F2 #B2DCEF`).
- **Game loop:** `requestAnimationFrame` with clamped delta time; physics runs
  in fixed sub-steps for stable collision.
- **Player:** grounded-state check prevents double/infinite jumping; a short
  coyote time + jump buffer make jumps feel fair. Squash-and-stretch on
  jump/land, X-eyes on death.
- **States:** TITLE → COUNTDOWN → PLAYING → (PAUSED) → GAMEOVER → restart.
- **Audio:** tiny WebAudio beeps (jump, land, countdown tick, go, death) —
  the `AudioContext` is created lazily on the first user gesture, all wrapped
  in try/catch.
- **Storage:** best score in `localStorage` (guarded; falls back gracefully).
- **Input:** pointer events (tap/click) + keyboard; touch scrolling/zoom
  prevented on the page.

## Balance

Tuned so it is challenging but not impossible:

- Base run speed 260 px/s, ramping to 420 px/s (≈ 500 m).
- Gap width scales 90 → 150 px (a full jump covers ≈ 200–300 px).
- Hazard spacing, landing zones, and bug patrol bounds are constrained so no
  generated pattern is unjumpable.
- Player and hazard hitboxes are slightly inset — forgiving but fair.
