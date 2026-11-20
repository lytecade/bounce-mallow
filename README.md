# Bounce Mallow

An endless procedural auto-runner platformer built with plain HTML5 Canvas + vanilla JavaScript. You are an animated marshmallow. You run. The only thing you can do is **jump**. Avoid imposing spikes and armored spike bugs, don't fall in the gaps, and see how far you can go.

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
- **Death** by touching spikes, a spike bug, or falling out of view
  (missed gap / ledge) → Game Over screen with final + best score and
  play-again.
- **Pause** any time with `Esc` (or the on-screen button on mobile) — resume
  or quit back to the title.

### The World

The level is never predefined. It is generated in chunks ahead of the camera:

- Stratified earth & evergreen-turf ground runs with **gaps** to jump across,
- **Forged steel spike** clusters on the ground,
- **Armored spike bugs** that patrol safely along spike-free ground runs,
- **Floating rocky one-way platforms** placed at guaranteed reachable heights
  you can hop up onto and climb over,
- **Rare speed powerups** that appear occasionally along safe ground or
  platforms — an **Espresso Cup** that doubles your base run speed (making
  Mallow super energetic) and a **Chamomile Flower** that halves your base run
  speed (making Mallow very sleepy). Effects are temporary and non-stackable,
- Layered **snow-capped alpine peaks**, **drifting clouds**, and **evergreen
  conifer ridges** scrolling with parallax in the background.

Chunks behind the player are discarded as soon as they scroll off screen.
Difficulty scales with distance: the run gets faster, gaps get wider, and
there are more spikes and faster bugs. Generation includes playability
guarantees — safe flat opening chunks, guaranteed jump-reachable floating rock
platforms with spike-free takeoff zones, spike-free landing zones after gaps,
bugs confined to spike-free single ground runs, and rare spaced-out powerups
placed clear of spikes.

## Technical notes

- **Files:** `index.html` (responsive viewport shell + CSS), `game.js` (everything else).
- **Canvas:** dynamically fills the entire viewport across desktop, mobile
  portrait, and mobile landscape; adapts automatically on window resize and
  live device rotation (`resize`, `orientationchange`, `visualViewport`), with
  internal backing resolution scaled by `devicePixelRatio` (capped at 3).
- **Game loop:** `requestAnimationFrame` with clamped delta time; physics runs
  in fixed sub-steps for stable collision.
- **Player:** animated hopping feet, spring-damped squash-and-stretch, velocity
  tilt, natural blinking, dust/stone particles, dedicated energetic (espresso)
  and sleepy (chamomile) animations with speed trails/floating Zzzs, and dizzy
  stars / X-eyes on death; grounded-state check prevents double/infinite jumping
  while coyote time and jump buffering keep jumps responsive.
- **States:** TITLE → COUNTDOWN → PLAYING → (PAUSED) → GAMEOVER → restart.
- **Audio:** tiny WebAudio beeps (jump, land, countdown tick, go, espresso,
  chamomile, death) — the `AudioContext` is created lazily on the first user
  gesture, all wrapped in try/catch.
- **Storage:** best score in `localStorage` (guarded; falls back gracefully).
- **Input:** pointer events (tap/click) + keyboard; touch scrolling/zoom
  prevented on the page.

## Balance

Tuned so it is challenging but fair:

- Base run speed 260 px/s, ramping to 420 px/s (≈ 300 m).
- Speed powerups (non-stackable, 6.0 s duration): **Espresso Cup** sets speed
  to `2×` base speed; **Chamomile Flower** sets speed to `0.5×` base speed.
  Powerups spawn rarely (14% chance per eligible chunk with at least a 2-chunk
  cooldown between spawns) so pace changes stay exciting without chaos.
- Gap width scales 90 → 150 px (a full jump covers ≈ 200–300 px).
- Floating rocky platforms sit 66–96 px above ground (safely below the ~120 px
  jump apex) with clear takeoff clearance and one-way top collision.
- Player and hazard hitboxes are slightly inset — forgiving but fair.
