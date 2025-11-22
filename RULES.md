# PROJECT NORTH STAR
Build "NEON RUNNER": An infinite, forward-scrolling rail shooter/dodger. The player controls a ship flying into the screen through a procedural retro-3D landscape.
* **Vibe:** Blade Runner meets Synthwave. Dark rainy atmosphere, neon wireframe structures (pyramids, obelisks) appearing from the horizon.
* **Core Mechanic:** Avoid collisions while maintaining high speed to increase score.

# TECH STACK
* **Core:** HTML5 Canvas API (2D Context).
* **Engine:** Custom "Pseudo-3D" Projection Engine (Vanilla JS).
    * *Logic:* `ScreenX = WorldX / WorldZ`.
* **Rendering:** Wireframe Vector Graphics with `globalCompositeOperation = 'lighter'` for neon glow effects.
* **Input:** Mouse or Arrow Keys for X/Y movement.

# DEVELOPMENT LAWS
1.  **The Z-Axis Rule:** All objects must spawn at `MAX_Z` (far away) and move towards `Z=0` (camera).
2.  **Perspective Projection:** Use a central "Vanishing Point." Objects must scale down as they get further away (`scale = focalLength / z`).
3.  **Performance:** Recycle objects. Once a building passes the camera (`Z < 0`), reset it to `MAX_Z` with new random properties (Object Pooling).
4.  **Aesthetic:** No solid fills yet. Use `stroke()` with colors like `#00FFFF` (Cyan) and `#FF00FF` (Magenta) against a `#000000` background.
5.  **The Flat Earth Rule:** The Player and Obstacles must exist on the exact same Y-plane. The Player cannot move vertically (X-axis only).

# ACTIVE CONTEXT
**Sprint 2: The Runner & The Obstacles.**
* **Goal:** Implement player movement and incoming hazards.
* **Current Task:**
    1.  Create `Player` entity (Wireframe Ship).
    2.  Implement Input Handling (Arrow Keys).
    3.  Create `Obstacle` entity (Wireframe Pyramids/Cubes).
    4.  Implement Obstacle Spawning & Pooling (Spawn at MaxZ, move to Camera).
    5.  Basic Collision Detection (Game Over state).
