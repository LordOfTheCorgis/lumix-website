# Hyperframes Composition Brief: Lumix Solutions

## Objective
Create a short launch-style brag video for Lumix Solutions, a game server host whose pitch is that it caps its servers on purpose instead of overselling.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: ~20.5 seconds

## Source Material
- Project root: `/home/evan-voisel/Github Repos/lumix-website`
- Primary files read: `src/pages/index.astro`, `src/styles/global.css`, `src/config.ts`, `src/components/Included.astro`, `src/lib/locations.ts`, `src/content/games/*.yaml`
- Product name: Lumix Solutions
- Tagline / strongest claim: "Order your game server." / "A finite number of servers, run properly." (capped on purpose)
- Key UI or visual moment to recreate: the hero H1 with its red period, the chamfered game-tile catalog with real prices, the four-region globe beat with red markers and a ping readout
- Copy that must appear verbatim:
  - Order your game server.
  - Pick your game
  - Capped on purpose.
  - A finite number of servers, run properly.
  - Scrubbed before it reaches you.
  - Online in minutes.
  - lumixsolutions.org
  - Real prices: FiveM $8.99, Palworld $9.99, Minecraft $14.99, BeamMP $5.99, Terraria $5.00
  - Real regions: Salt Lake City, Dallas, Ashburn, Miami

## Creative Direction
- Tone preset: polished
- Creative direction: dry, confident infrastructure film, the anti-hype game host
- Interpretation: fewer scenes, longer holds, restraint over density. Motion is one orchestrated system (ember light + red accents + chamfer reveals), not scattered effects.
- Angle: Every host screams "unlimited"; Lumix brags about a limit. Let the product's own anti-hype voice sell it, with real copy, real prices, real regions.
- Hook: the real H1 "Order your game server" slams in on warm ink, red period pops last.
- Outro / punchline: "Online in minutes." with the red Order-now button and the wordmark landing on a strong beat.
- Avoid:
  - Generic SaaS language ("streamline your workflow")
  - Abstract filler visuals, particle systems, waveform/equalizer graphics
  - Any redesign that isn't grounded in the site's real palette and type

## Visual Identity
- Background: `#161114` (ink), raised panels `#201c1c` (ink-soft)
- Text: `#f7f5f1` (paper), `#b7afb5` (fog), `#97909a` (slate labels)
- Accent: `#ff4c4c` (red, sparingly), `#ff7a45` (ember light), `#ffb347` (gold, price only)
- Display font: Space Grotesk (700/600/500) — Google Fonts, fallback system-ui
- Body font: Inter — Google Fonts, fallback system-ui
- Signature elements: the chamfer cut (top-left + bottom-right corners clipped, from the monogram) and the red period ending every headline; ember light rays from a corner; region markers as the only red on the globe beat
- Visual references from the project: hero section, "Pick your game" grid of GameTiles, the globe/regions section with PingTest, the "Order now" chamfered CTA button

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hero / hook — 3.3s — overline + "Order your game server" with the red period popping last
2. Pick your game — 5.4s — five chamfered price tiles arrive one by one (real games, gold prices)
3. The claim — 3.5s — "Capped on purpose." + "A finite number of servers, run properly." (slam locked ~8.74s)
4. Where it runs — 5.0s — four region markers arrive one by one; ping counts down to ~12 ms; "Scrubbed before it reaches you."
5. Outro — 3.3s — "Online in minutes." + red Order-now button + wordmark + lumixsolutions.org (logo locked ~17.47s)

## Audio
- Audio role: cinematic support, restrained. Steady clean bed + a few dry motion-matched accents.
- Audio arc: bed enters at 0s and holds; two strong-beat accents (claim slam, outro logo); soft fade under the wordmark.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` at volume 0.30
- Music treatment: start 0s, hold ~0.30, fade to 0 under the final logo. Never above 0.35.
- Music cue guidance: bundled preset `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`, ~110 BPM. Strong-cue locks: claim slam ~8.74s, outro logo ~17.47s. Beat-grid: tiles every-other beat (3.82, 4.91, 6.00, 7.09, 8.19), regions every-other beat (13.11, 14.20, 15.29, 16.38).
- Audio-reactive treatment: per-frame extraction helper (hyperframes-creative) is NOT installed in this environment; true audio-reactive is skipped. Substitute a subtle deterministic ambient glow/breathe on the ember light so the frame isn't static. Documented, not faked as beat sync.
- Audio-coupled moments:
  - Scene 1 red-period pop — soft impact
  - Scene 2 first + last tile — soft drop (not every tile; polished restraint)
  - Scene 3 "Capped on purpose." slam — one dry hit // beat-locked ~8.74s
  - Scene 4 ping settle — soft drop as it lands on 12 ms
  - Scene 5 wordmark landing — one bell // beat-locked ~17.47s
- SFX selection guidance: soft/low-HF-risk families only. `interface/drop_001`, `impact/impactSoft_medium_00x`, `impact/impactBell_heavy_000` for the single outro bell. Nothing aggressive, nothing stacked.
- SFX analysis guidance: `~/.claude/plugins/cache/brag/brag/0.2.2/skills/brag/assets/sfx/sfx-analysis.md` — prefer low-HF picks for the repeated tile drops.
- Exact SFX choice: chosen after the animation exists; files copied into `assets/sfx/...`.
- Audio files: music + chosen SFX copied into `brag-output/composition/assets/`.

## Hyperframes Instructions
- Show real UI/copy from the source (hero line, real prices, real regions) — done across scenes 1, 2, 4, 5.
- Keep all text readable: reading floor honored (tiles ~1.1s apart and held; claim sentence held ~3s).
- Duration 15-25s: target ~20.5s.
- Music present, subtle ambient glow stands in for audio-reactive (extraction unavailable, documented).
- 2 strong-beat locks marked `// beat-locked`; sequential tiles + regions marked `// beat-grid`.
- Deterministic only: count-ups via GSAP proxy `onUpdate`, no `Math.random`/`Date.now`/fetch.
- Run `hyperframes check` before render (the single gate).
