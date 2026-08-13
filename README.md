# Bounce Mallow

An endless procedural platformer HTML5 game. Control a tiny marshmallow character as it bounces through an ever-changing world of platforms, spikes, enemies, and gaps.

![Bounce Mallow](https://img.shields.io/badge/HTML5-Green) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)

## Gameplay

- The player character moves automatically to the right
- **Jump** to avoid obstacles, cross gaps, and climb platforms
- **Score** is determined by the distance travelled
- Avoid **spikes**, **spike bugs**, and **gaps** in the ground
- Fall off a ledge and the game ends!

## Controls

| Action | Keyboard | Mobile |
|--------|----------|--------|
| Start / Jump | `Space` / `Enter` | Tap screen |
| Pause | `ESC` | Not available |

## How to Play

1. Open `index.html` in any modern web browser
2. On the title screen, press `Space`, `Enter`, or tap the screen
3. Wait for the 3-second countdown
4. Jump over obstacles and across gaps
5. Survive as long as possible to get a high score!

## Game States

- **Title Screen** — Welcome screen with game title and instructions
- **Countdown** — 3-second countdown before gameplay begins
- **Playing** — Main game loop with procedural generation
- **Paused** — Pause menu (press ESC) with quit option
- **Game Over** — Final score display with option to replay

## Features

- ✅ Endless procedural level generation with chunk-based system
- ✅ Smooth camera following the player
- ✅ Marshmallow character with personality (eyes looking right)
- ✅ Multiple obstacle types: spikes, patrol enemies, gaps
- ✅ Balanced difficulty progression
- ✅ Arne16 limited color palette (16 colors only)
- ✅ Square canvas that scales to fit any browser window
- ✅ Mobile-friendly touch controls
- ✅ Distance-based scoring system
- ✅ No external dependencies

## Color Palette

The game uses the **Arne16** 16-color palette exclusively:

| Color | Hex | Usage |
|-------|-----|-------|
| Black | `#000000` | Eyes, text, outlines |
| Gray | `#9D9D9D` | UI elements |
| White | `#FFFFFF` | Spikes, marshmallow body, clouds |
| Red | `#BE2633` | Enemies, danger elements |
| Pink | `#E06F8B` | Accents |
| Dark Brown | `#493C2B` | Ground, platforms |
| Brown | `#A46422` | Platform details |
| Orange | `#EB8931` | UI accents |
| Yellow | `#F7E26B` | Score, stars |
| Dark Teal | `#2F484E` | Background elements |
| Green | `#44891A` | Decorations |
| Lime | `#A3CE27` | Decorations |
| Dark Blue | `#1B2632` | Sky background |
| Blue | `#005784` | Sky gradient |
| Light Blue | `#31A2F2` | Sky details |
| Sky Blue | `#B2DCEF` | Clouds, sky highlights |

## Technical Details

- **Canvas**: Square aspect ratio (800×800), auto-scales to viewport
- **Frame Rate**: 60 FPS target
- **Physics**: Custom gravity and collision system
- **Generation**: Chunk-based procedural generation with cleanup
- **Collision**: AABB bounding box detection

## File Structure

```
bmallow/
├── README.md    # This file
├── index.html   # Main HTML entry point
└── game.js      # Complete game logic
```

## Browser Support

Works in all modern browsers: Chrome, Firefox, Safari, Edge, and mobile browsers.

---

Made with ❤️ using vanilla HTML5 Canvas and JavaScript.
