# PROJECT NORTH STAR
Build "NORTH STAR (北極星)": A 90s Japanese arcade-style vertical shooter.
* **Vibe:** Treasure's Radiant Silvergun meets Blade Runner 2049. Neon geometric monuments, hypnotic flow state.
* **Core Mechanic:** Vertical shooting with pattern-based enemies and obstacle weaving.

# TECH STACK
* **Core:** HTML5 Canvas API (2D Context).
* **Engine:** Custom "Pseudo-3D" Projection Engine (Vanilla JS).
* **Rendering:** Wireframe Vector Graphics with `globalCompositeOperation = 'lighter'`.
* **Input:** Keyboard (Arrow Keys + Space).

# DEVELOPMENT LAWS
1.  **The Z-Axis Rule:** All objects must spawn at `MAX_Z` (far away) and move towards `Z=0` (camera).
2.  **The Flat Earth Rule:** The Player and Obstacles must exist on the exact same Y-plane.
3.  **Flow State Physics:** Movement must be physics-based (acceleration/friction) for "smooth curve" feel.
4.  **Pattern Mastery:** Enemies and obstacles spawn in learnable patterns, never pure randomness.
5.  **Aesthetic:** Neon monuments (Obelisks, Pyramids) with bold outlines and pulsing glows.

# ACTIVE CONTEXT
**Sprint 3: Game Polish & Persistence - COMPLETE.**
* **Completed:**
    1.  ✅ Restart mechanism (SPACE key)
    2.  ✅ High score persistence (LocalStorage)
    3.  ✅ Progressive difficulty (speed + spawn rate)
    4.  ✅ Obstacle variety (pyramid, cube, obelisk)
    5.  ✅ Enhanced UI (neon styling, CRT scanlines)
* **Status:** Game is fully playable with polished visuals and persistent high scores.
