# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GoGo Drive is a 3D arcade racing game built as a single `index.html` file using Three.js (r128 via CDN) and vanilla JavaScript. No build system, package manager, or transpilation — open `index.html` directly in a browser to run.

## Development

**Run the game:** Open `index.html` in any modern browser, or serve with any static file server (e.g., `python3 -m http.server`).

**No build/lint/test tooling exists.** There is no `package.json`, bundler, linter, or test framework.

## Architecture

The entire application lives in `index.html` (~1,875 lines) organized into clearly commented sections separated by `// =====` dividers:

- **HTML/CSS** (~590 lines): UI overlays for menu, HUD, game over, name entry, and ranking screens
- **Constants** (lines ~363-394): Game physics, lane positions, boost parameters, spawn distances, visual settings
- **State Management** (lines ~399-434): Game state machine with four states: `'menu'` → `'playing'` → `'crashing'` → `'gameover'`
- **Three.js Scene Setup** (lines ~464-517): Camera, renderer, lighting, fog, clouds
- **3D Asset Generation** (lines ~520-860): Procedural geometry for car, buildings, fences, balloons, gates — no external model files
- **Gameplay Objects** (lines ~920-1072): Coins, bombs, obstacle cars, explosions, coin scatter
- **Audio System** (lines ~1084-1188): Procedural sound synthesis via Web Audio API (no audio files)
- **Input Handling** (lines ~1193-1261): Keyboard (arrows/A/D/space) and mobile touch (swipe + boost button)
- **Collision Detection** (lines ~1266-1318): Proximity-based checks for coins, bombs, and obstacles
- **Game State Transitions** (lines ~1354-1549): Start, crash sequence, game over, name entry, ranking (persisted in localStorage)
- **Main Game Loop** (lines ~1554-1826): Delta-time update, object spawning/recycling, particle systems, rendering

## Key Patterns

- **Game state machine** drives all behavior — always check/update `gameState` when modifying game logic
- **Object arrays** (`coins`, `obstacles`, `gates`, `explosionParticles`, `scatterCoins`) are iterated and cleaned up each frame
- **Road/scenery recycling**: Chunks are repositioned behind the camera rather than destroyed/recreated
- **Difficulty scaling**: Obstacle spawn distance decreases as `distanceTraveled` increases
- **All 3D assets are procedural**: Built from Three.js primitives (BoxGeometry, CylinderGeometry, etc.) — no external models or textures
- **All audio is synthesized**: Generated via Web Audio API oscillators and noise — no sound files
- **Rankings**: Top 10 scores stored in `localStorage` under key `'gogodrive_rankings'`

## Conventions

- Constants: `UPPER_SNAKE_CASE`
- Functions: verb-first camelCase (`createCoin`, `updateCrash`, `checkCollisions`)
- Game states: lowercase strings (`'playing'`, `'menu'`)
- DOM element refs: camelCase with `El` suffix (`scoreValueEl`, `boostGaugeEl`)
- Traditional for-loops in hot update paths; arrow functions for callbacks
- 2-space indentation
