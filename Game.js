class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 100; // Base Y
        this.z = 300;
        this.width = 50;
        this.height = 30;

        // Physics
        this.vx = 0;
        this.bobTimer = 0;
    }

    update(input) {
        // Physics-based movement
        // Acceleration
        if (input.keys['ArrowLeft']) {
            this.vx -= 2; // Impulse
        }
        if (input.keys['ArrowRight']) {
            this.vx += 2; // Impulse
        }

        // Apply Friction
        this.vx *= CONFIG.PLAYER_FRICTION;

        // Cap Speed
        const maxSpeed = 15; // Tuned for feel
        this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

        // Apply Velocity
        this.x += this.vx;

        // Boundaries
        const limitX = (this.game.width / 2) - this.width;
        if (this.x < -limitX) { this.x = -limitX; this.vx = 0; }
        if (this.x > limitX) { this.x = limitX; this.vx = 0; }

        // Floating Bob Animation
        this.bobTimer += CONFIG.PLAYER_BOB_SPEED;
        this.y = CONFIG.FLOOR_Y + Math.sin(this.bobTimer) * CONFIG.PLAYER_BOB_AMOUNT;
    }

    draw(ctx) {
        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        const size = 20 * p.scale;

        // Use sprites if loaded, otherwise fall back to procedural
        if (this.game.spritesLoaded) {
            // SPRITE-BASED RENDERING
            // Use 'source-over' for solid, non-transparent rendering
            ctx.globalCompositeOperation = 'source-over';

            // Apply perspective warp to make ship feel like it's flying toward horizon
            ctx.save();
            ctx.translate(p.x, p.y);

            // Perspective warp: compress vertically to simulate depth
            // This makes the ship appear to be angled toward the horizon
            ctx.scale(1.2, 0.7); // Horizontal scale 1.2, vertical scale 0.7

            // Increase contrast and brightness to make sprite pop against background
            ctx.filter = 'contrast(1.5) brightness(1.2)';

            // Draw player ship with engine animation
            // Slow animation for smooth engine pulsing
            const frameSpeed = 30; // Change frame every 30 ticks (very slow, smooth pulse)
            this.game.spriteManager.drawAnimatedSprite(
                ctx,
                'player_ship',
                this.bobTimer * 10, // Animation timer
                frameSpeed,
                0, // Draw at origin (we already translated)
                0, // Draw at origin (we already translated)
                1.3, // 1.3x scale for good visibility
                0 // No rotation (sprite already faces right/forward in sheet)
            );

            // Reset filter
            ctx.filter = 'none';
            ctx.restore();
        } else {
            // PROCEDURAL RENDERING (FALLBACK)
            // Engine Glow (Underneath)
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#00FFFF';
            ctx.globalAlpha = 0.3 + Math.random() * 0.2; // Flicker
            ctx.beginPath();
            ctx.ellipse(p.x, p.y + size * 1.2, size * 0.8, size * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Ship Body (Floating)
            ctx.strokeStyle = '#00E5FF'; // Electric Cyan
            ctx.lineWidth = 3;
            ctx.beginPath();

            // Main Hull
            ctx.moveTo(p.x, p.y - size); // Nose
            ctx.lineTo(p.x - size, p.y + size); // Left Wing
            ctx.lineTo(p.x, p.y + size * 0.5); // Rear Center (Indented)
            ctx.lineTo(p.x + size, p.y + size); // Right Wing
            ctx.closePath();
            ctx.stroke();

            // Core Highlight
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}

class Obstacle {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.size = 100;
        this.type = 'pyramid'; // pyramid, crystal
        this.color = '#FFFF00'; // Yellow

        // Animation
        this.rotation = 0;
        this.bobTimer = 0;
    }

    spawn(z, type = 'pyramid', x = null) {
        this.active = true;
        this.z = z;
        this.type = type;
        this.y = CONFIG.FLOOR_Y;
        this.size = 120 + Math.random() * 50;
        this.color = '#FFFF00'; // Always Yellow

        if (x !== null) {
            this.x = x;
        } else {
            this.x = (Math.random() - 0.5) * 3000;
        }

        this.rotation = Math.random() * Math.PI * 2;
        this.bobTimer = Math.random() * 100;
    }

    update() {
        if (!this.active) return;

        this.z -= this.game.speed; // Move with grid

        // Animation
        this.rotation += 0.01;
        this.bobTimer += 0.05;

        if (this.z < 10) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        if (this.z < 10) return;

        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        const s = this.size * p.scale;

        ctx.lineWidth = 3;

        if (this.type === 'pyramid') {
            // Pyramid: Bobbing
            const bobY = Math.sin(this.bobTimer) * 10 * p.scale;
            const py = p.y + bobY;

            ctx.strokeStyle = '#F59E0B'; // Amber Apex
            ctx.fillStyle = this.color;

            ctx.beginPath();
            ctx.moveTo(p.x, py - s); // Tip
            ctx.lineTo(p.x - s / 2, py); // Left
            ctx.lineTo(p.x + s / 2, py); // Right
            ctx.closePath();
            ctx.stroke();

            // Wireframe internal
            ctx.beginPath();
            ctx.moveTo(p.x, py - s);
            ctx.lineTo(p.x, py + s / 4);
            ctx.stroke();

        } else if (this.type === 'crystal') {
            // Crystal: Complex, Rainbow
            const hue = (Date.now() / 20) % 360;
            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;

            ctx.save();
            ctx.translate(p.x, p.y - s / 2);
            ctx.rotate(this.rotation);

            ctx.beginPath();
            ctx.moveTo(0, -s / 2);
            ctx.lineTo(s / 2, 0);
            ctx.lineTo(0, s / 2);
            ctx.lineTo(-s / 2, 0);
            ctx.closePath();
            ctx.stroke();

            // Cross
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 2);
            ctx.lineTo(s / 2, s / 2);
            ctx.moveTo(s / 2, -s / 2);
            ctx.lineTo(-s / 2, s / 2);
            ctx.stroke();

            ctx.restore();
        }
    }
}

// Configuration Constants
const CONFIG = {
    FOCAL_LENGTH: 400,
    BASE_SPEED: 40,
    GRID_SPACING: 200,
    FLOOR_Y: 100,
    PLAYER_Z: 300,
    MAX_DRAW_DISTANCE: 8000, // Doubled
    OBSTACLE_SPAWN_BASE_CHANCE: 0.05,
    DIFFICULTY_SCORE_INTERVAL: 1250,
    DIFFICULTY_SPEED_INCREMENT: 2,
    OBSTACLE_POOL_SIZE: 100,

    // Physics
    PLAYER_ACCELERATION: 0.4,
    PLAYER_FRICTION: 0.92,
    PLAYER_MAX_SPEED: 280 / 60,
    PLAYER_BOB_SPEED: 0.05,
    PLAYER_BOB_AMOUNT: 3
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Configuration
        this.focalLength = CONFIG.FOCAL_LENGTH;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
        this.baseSpeed = CONFIG.BASE_SPEED;
        this.speed = this.baseSpeed;
        this.gridSize = 4000;
        this.gridSpacing = CONFIG.GRID_SPACING;

        // State
        this.offsetZ = 0;
        this.input = { keys: {} };

        this.gameState = 'START'; // START, PLAYING, GAMEOVER
        this.audioReady = false; // Track if audio context is unlocked
        this.score = 0;
        this.globalTimer = 0; // For animations

        // Images
        this.images = {
            start: new Image(),
            gameOver: new Image(),
            spaceBackground: new Image()
        };
        this.images.start.src = 'assets/start_screen.jpg';
        this.images.gameOver.src = 'assets/game_over_clean.jpg';
        this.images.spaceBackground.src = 'assets/space_background.jpg';

        // Sprite Manager (NEW)
        this.spriteManager = new SpriteManager();
        this.spritesLoaded = false;

        // UI Particles
        this.uiParticles = [];

        // High Score (LocalStorage)
        this.highScore = parseInt(localStorage.getItem('neonRunnerHighScore')) || 0;

        // Entities
        this.player = new Player(this);

        // Projectile Pool
        this.projectiles = [];
        for (let i = 0; i < 50; i++) {
            this.projectiles.push(new Projectile(this));
        }

        // Enemy Pool
        this.enemies = [];
        for (let i = 0; i < 30; i++) {
            this.enemies.push(new Enemy(this));
        }

        // Obstacle Pool
        this.obstacles = [];
        for (let i = 0; i < CONFIG.OBSTACLE_POOL_SIZE; i++) {
            this.obstacles.push(new Obstacle(this));
        }

        // Game State
        this.health = 3;
        this.maxHealth = 3;
        this.invincibilityTimer = 0;

        this.combo = 0;
        this.comboTimer = 0;
        this.multiplier = 1;

        // Wave Manager
        this.waveManager = new WaveManager(this);
        this.wave = 1; // UI Display only
        this.waveComplete = false; // UI Display only

        this.audio = new AudioController();

        // Particles
        this.particles = new ParticleSystem(this);

        // Starfield
        this.starfield = new Starfield(this);

        // Screen Shake
        this.shake = 0;

        // Bindings
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        this.handleKey = this.handleKey.bind(this);

        window.addEventListener('resize', this.resize);
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        // Unlock Audio Context on first interaction
        const unlockAudio = () => {
            if (this.audio.ctx.state === 'suspended') {
                this.audio.ctx.resume().then(() => {
                    // Start idle beep after audio context is unlocked
                    if (this.gameState === 'START' || this.gameState === 'GAMEOVER') {
                        this.audio.startIdleBeep();
                    }
                });
            }
        };

        window.addEventListener('keydown', unlockAudio, { once: true });
        window.addEventListener('click', unlockAudio, { once: true });

        this.init();
    }

    async init() {
        // Load sprite sheet
        try {
            await this.spriteManager.load('assets/spritesheet.png');
            this.spritesLoaded = true;
        } catch (error) {
            console.warn('Failed to load sprite sheet, using procedural graphics:', error);
            this.spritesLoaded = false;
        }

        this.audio.initEngine();
        // Don't start idle beep here - wait for audio context to be unlocked
        this.loop();
    }

    restart() {
        // Reset game state
        this.gameState = 'PLAYING';
        this.score = 0;
        this.speed = this.baseSpeed;
        this.offsetZ = 0;

        // Reset Wave State
        this.wave = 1;
        this.waveComplete = false;
        this.waveManager.start();

        // Reset Stats
        this.health = 3;
        this.combo = 0;
        this.multiplier = 1;

        // Reset player
        this.player.x = 0;
        this.player.vx = 0;

        // Clear all obstacles and enemies
        this.obstacles.forEach(o => o.active = false);
        this.enemies.forEach(e => e.active = false);
        this.projectiles.forEach(p => p.active = false);
        this.particles.particles = [];

        // Clear input
        this.input.keys = {};

        this.audio.stopIdleBeep(); // Stop idle beep when playing
    }

    handleKey(e, isDown) {
        this.input.keys[e.code] = isDown;

        // Restart on SPACE when game over
        if (e.code === 'Space' && isDown) {
            if (this.gameState === 'START') {
                // Check if audio context needs to be unlocked first
                if (this.audio.ctx.state === 'suspended') {
                    // First press: unlock audio and start idle beep
                    this.audio.ctx.resume().then(() => {
                        this.audioReady = true;
                        this.audio.startIdleBeep();
                    });
                } else {
                    // Second press (or later): actually start the game
                    this.gameState = 'PLAYING';
                    this.audio.stopIdleBeep(); // Stop idle beep
                    this.shake = 0; // Ensure no leftover shake
                }
            } else if (this.gameState === 'GAMEOVER') {
                this.restart();
            } else {
                // Shoot
                const p = this.projectiles.find(p => !p.active);
                if (p) {
                    p.spawn(this.player.x, this.player.y, this.player.z);
                    this.audio.playShoot();
                }
            }
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
        this.draw(); // Force immediate redraw to prevent black screen
    }

    project(x, y, z) {
        if (z <= 0) return null;
        const scale = this.focalLength / z;
        const sx = this.cx + x * scale;
        const sy = this.cy + y * scale;
        return { x: sx, y: sy, scale: scale };
    }

    getInactiveEnemy() {
        return this.enemies.find(e => !e.active);
    }

    getInactiveObstacle() {
        return this.obstacles.find(o => !o.active);
    }

    // Wave logic moved to WaveManager.js

    checkCollisions() {
        // 1. Projectiles vs Enemies
        this.projectiles.forEach(p => {
            if (!p.active) return;

            this.enemies.forEach(e => {
                if (!e.active) return;

                if (Math.abs(p.z - e.z) < 50) {
                    // Circle Collision
                    const dx = p.x - e.x;
                    const dy = p.y - e.y; // Should be close to 0 as they are on same plane usually
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < (e.width / 2 + p.width / 2)) {
                        // Hit!
                        p.active = false;
                        e.active = false;

                        // Score & Combo
                        const prevCombo = this.combo;
                        this.combo++;
                        this.comboTimer = 180; // 3 seconds

                        // Play combo sound on every combo increase (starting from 2)
                        if (this.combo >= 2 && this.combo > prevCombo) {
                            this.audio.playComboSound(this.combo);
                        }

                        // Multiplier Logic
                        if (this.combo < 5) this.multiplier = 1;
                        else if (this.combo < 10) this.multiplier = 2;
                        else if (this.combo < 20) this.multiplier = 3;
                        else if (this.combo < 50) this.multiplier = 4;
                        else this.multiplier = 5;

                        const points = 100 * this.multiplier;
                        this.score += points;

                        // Juice
                        this.particles.createExplosion(e.x, e.y, e.z, '#FF00FF');
                        // this.audio.playExplosion(); // OLD
                        this.audio.playEnemyHit(); // NEW: Distinct hit sound
                        this.shake = 5 + this.multiplier;
                    }
                }
            });
        });

        // 2. Player vs Enemies/Obstacles
        if (this.invincibilityTimer > 0) return; // Invincible

        const hitZ = 50;
        let hit = false;

        // Enemies (Circle Collision)
        this.enemies.forEach(e => {
            if (!e.active) return;
            if (Math.abs(e.z - this.player.z) < hitZ) {
                const dx = e.x - this.player.x;
                const dist = Math.sqrt(dx * dx); // 1D distance since Y is mostly same

                if (dist < (e.width / 2 + this.player.width / 2)) {
                    hit = true;
                    e.active = false; // Destroy enemy on impact
                }
            }
        });

        // Obstacles (Box Collision for Pyramids/Crystals still feels okay, but let's tighten)
        this.obstacles.forEach(obs => {
            if (!obs.active) return;
            if (Math.abs(obs.z - this.player.z) < hitZ) {
                if (Math.abs(obs.x - this.player.x) < (obs.size / 3 + this.player.width / 2)) { // Tighter hitbox
                    hit = true;
                }
            }
        });

        if (hit) {
            this.health--;
            this.invincibilityTimer = 120; // 2 seconds invincibility
            // this.audio.playExplosion(); // OLD
            this.audio.playShipCrash(); // NEW: Distinct crash sound
            this.shake = 20;
            this.combo = 0;
            this.multiplier = 1;

            if (this.health <= 0) {
                this.gameState = 'GAMEOVER';
                this.audio.startIdleBeep(); // Start idle beep on death
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('neonRunnerHighScore', this.highScore);
                }
            }
        }
    }
    update() {
        this.globalTimer++;

        // Update UI Particles (Always run if in UI state)
        if (this.gameState !== 'PLAYING') {
            // Spawn
            if (Math.random() < 0.3) {
                this.uiParticles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 3,
                    life: 1.0,
                    color: Math.random() > 0.5 ? '#00FFFF' : '#FF00FF'
                });
            }
            // Update
            for (let i = this.uiParticles.length - 1; i >= 0; i--) {
                const p = this.uiParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.01;
                if (p.life <= 0) this.uiParticles.splice(i, 1);
            }

            // Faint Idle Engine
            this.audio.updateEngine(0, 0, true);
        }

        if (this.gameState !== 'PLAYING') return;

        // Update Audio Engine
        // Normalize speed: 1.0 at base speed, up to ~2.0
        const speedRatio = (this.speed - this.baseSpeed) / 100;
        // Normalize pan: -1 (left) to 1 (right)
        const pan = this.player.x / (this.width / 2);
        this.audio.updateEngine(speedRatio, pan, false);

        // Screen Shake Decay
        if (this.shake > 0) this.shake *= 0.9;
        if (this.shake < 0.5) this.shake = 0;

        // Invincibility
        if (this.invincibilityTimer > 0) this.invincibilityTimer--;

        // Combo Decay
        if (this.combo > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.multiplier = 1;
            }
        }

        // Progressive Difficulty
        this.speed = this.baseSpeed + Math.floor(this.score / CONFIG.DIFFICULTY_SCORE_INTERVAL) * CONFIG.DIFFICULTY_SPEED_INCREMENT;

        // Move grid
        this.offsetZ -= this.speed;
        if (this.offsetZ <= 0) {
            this.offsetZ += this.gridSpacing;
        }

        this.player.update(this.input);

        this.waveManager.update();

        this.projectiles.forEach(p => p.update());
        this.enemies.forEach(e => e.update());
        this.obstacles.forEach(o => o.update());
        this.particles.update();
        this.starfield.update();

        this.checkCollisions();

        // Score by Distance
        this.score += Math.floor(this.speed / 10);
    }

    draw() {
        // Clear & Background (Dark Blue Night Sky)
        this.ctx.globalCompositeOperation = 'source-over';

        // Circular Gradient for "Night Sky" feel
        const gradient = this.ctx.createRadialGradient(
            this.cx, this.cy, 100,
            this.cx, this.cy, this.width
        );
        gradient.addColorStop(0, '#0F172A'); // Slate 900 (Center)
        gradient.addColorStop(1, '#020617'); // Slate 950 (Edges)

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars moved to gameplay block


        // Neon Style
        this.ctx.globalCompositeOperation = 'lighter';

        if (this.gameState === 'START') {
            // Gentle Shake
            this.ctx.save();
            const shakeX = (Math.random() - 0.5) * 1;
            const shakeY = (Math.random() - 0.5) * 1;
            this.ctx.translate(shakeX, shakeY);

            this.ctx.globalCompositeOperation = 'source-over';
            if (this.images.start.complete) {
                // Scale up slightly to cover shake edges
                this.ctx.drawImage(this.images.start, -10, -10, this.width + 20, this.height + 20);
            } else {
                // Fallback if image not loaded yet
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.ctx.fillStyle = '#00FFFF';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("LOADING...", this.cx, this.cy);
            }

            // UI Particles
            this.ctx.globalCompositeOperation = 'lighter';
            this.uiParticles.forEach(p => {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;

            // CRT Flicker
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Flashing Text
            if (Math.floor(this.globalTimer / 30) % 2 === 0) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '20px "Press Start 2P"';
                this.ctx.textAlign = 'center';
                this.ctx.shadowColor = '#00FFFF';
                this.ctx.shadowBlur = 10;

                // Different text based on audio ready state
                if (!this.audioReady) {
                    this.ctx.fillText("PRESS SPACE TO START ENGINES", this.cx, this.height - 122);
                } else {
                    this.ctx.fillText("SYSTEMS READY - PRESS SPACE TO START", this.cx, this.height - 122);
                }

                this.ctx.shadowBlur = 0;
            }

            this.ctx.restore(); // End Shake
            return;
        }

        if (this.gameState === 'GAMEOVER') {
            // Moderate Shake (Reduced range)
            this.ctx.save();
            const shakeX = (Math.random() - 0.5) * 2; // Reduced from 3
            const shakeY = (Math.random() - 0.5) * 2; // Reduced from 3
            this.ctx.translate(shakeX, shakeY);

            this.ctx.globalCompositeOperation = 'source-over';

            if (this.images.gameOver.complete) {
                // Scale up slightly to cover shake edges
                this.ctx.drawImage(this.images.gameOver, -10, -10, this.width + 20, this.height + 20);
            } else {
                // Fallback
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(0, 0, this.width, this.height);
            }

            // UI Particles
            this.ctx.globalCompositeOperation = 'lighter';
            this.uiParticles.forEach(p => {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;

            // CRT Flicker
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
            this.ctx.fillRect(0, 0, this.width, this.height);

            // Overlay Score
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#FF1493'; // Deep Pink Glow
            this.ctx.shadowBlur = 20;

            // GAME OVER Title
            this.ctx.fillStyle = '#FFFFFF'; // White Text
            this.ctx.font = '60px "Press Start 2P"';
            this.ctx.fillText("GAME OVER", this.cx, this.cy - 30); // Moved down 50px (from -80)

            // Score
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.font = '30px "Press Start 2P"';
            this.ctx.fillText(`SCORE: ${this.score}`, this.cx, this.cy + 50); // Moved down 50px (from +0)

            // High Score
            this.ctx.fillStyle = '#FF00FF';
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.cx, this.cy + 100); // Moved down 50px (from +50)

            this.ctx.shadowBlur = 0;

            // Flashing Restart Text
            if (Math.floor(this.globalTimer / 30) % 2 === 0) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '20px "Press Start 2P"';
                this.ctx.fillText("PRESS SPACE TO RESTART", this.cx, this.height - 100); // Kept as is
            }

            this.ctx.restore(); // End Shake
            return;
        }

        // Gameplay Rendering
        this.ctx.save();

        // Apply Gameplay Shake
        if (this.shake > 0) {
            const dx = (Math.random() - 0.5) * this.shake;
            const dy = (Math.random() - 0.5) * this.shake;
            this.ctx.translate(dx, dy);
        }

        // Space Background (Bottom layer - behind everything)
        if (this.images.spaceBackground.complete) {
            // Draw space background in upper portion (above horizon)
            const bgHeight = this.cy; // Fill from top to horizon line
            this.ctx.globalAlpha = 1.0; // Full opacity
            this.ctx.drawImage(
                this.images.spaceBackground,
                0, 0, // Source position
                this.images.spaceBackground.width, this.images.spaceBackground.height, // Source size
                0, 0, // Destination position
                this.width, bgHeight // Destination size (fill width, stop at horizon)
            );
            this.ctx.globalAlpha = 1.0;
        }

        // Stars (On top of space background)
        this.starfield.draw(this.ctx);

        // 1. Horizon
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.cy);
        this.ctx.lineTo(this.width, this.cy);
        this.ctx.stroke();

        // 2. Grid
        this.ctx.strokeStyle = '#FF00FF';
        const maxZ = CONFIG.MAX_DRAW_DISTANCE; // Use config
        const floorY = CONFIG.FLOOR_Y;

        // Vertical
        for (let i = -10; i <= 10; i++) {
            const x = i * this.gridSpacing;
            const p1 = this.project(x, floorY, 10);
            const p2 = this.project(x, floorY, maxZ);
            if (p1 && p2) {
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
        }

        // Horizontal
        for (let z = this.offsetZ; z < maxZ; z += this.gridSpacing) {
            if (z < 10) continue;
            const leftX = -2500; // Wider grid
            const rightX = 2500;
            const pLeft = this.project(leftX, floorY, z);
            const pRight = this.project(rightX, floorY, z);
            if (pLeft && pRight) {
                this.ctx.beginPath();
                this.ctx.moveTo(pLeft.x, pLeft.y);
                this.ctx.lineTo(pRight.x, pRight.y);
                this.ctx.stroke();
            }
        }

        // 3. Entities (Sorted by Z)
        const renderList = [
            ...this.obstacles.filter(o => o.active),
            ...this.enemies.filter(e => e.active),
            ...this.projectiles.filter(p => p.active)
        ];

        renderList.sort((a, b) => b.z - a.z);
        renderList.forEach(e => e.draw(this.ctx));

        // 4. Player (Before particles so it renders behind them)
        this.player.draw(this.ctx);

        // 5. Particles (Rendered last so they appear on top)
        this.particles.draw(this.ctx);

        this.ctx.restore(); // End Gameplay Shake

        // 6. HUD (No Shake)
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.font = '16px "Press Start 2P"';

        // Top Bar Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, 50);
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 50);
        this.ctx.lineTo(this.width, 50);
        this.ctx.stroke();

        // Score
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 35);

        // High Score
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#FF00FF';
        this.ctx.fillText(`HIGH: ${this.highScore}`, this.cx, 35);

        // Health Bar
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillText("HP:", this.width - 140, 35);

        for (let i = 0; i < this.maxHealth; i++) {
            if (i < this.health) {
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(this.width - 130 + (i * 35), 15, 25, 25);
            }
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(this.width - 130 + (i * 35), 15, 25, 25);
        }

        // Combo Indicator (Bottom Center)
        if (this.combo > 1) {
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.font = '20px "Press Start 2P"';
            this.ctx.fillText(`${this.combo}x COMBO`, this.cx, this.height - 50);

            // Combo Bar
            const barWidth = 200;
            const pct = this.comboTimer / 180;
            this.ctx.fillStyle = '#555';
            this.ctx.fillRect(this.cx - barWidth / 2, this.height - 40, barWidth, 10);
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillRect(this.cx - barWidth / 2, this.height - 40, barWidth * pct, 10);
        }

        // Wave Indicator
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px "Press Start 2P"';
        this.ctx.fillText(`WAVE ${this.wave}`, 20, this.height - 20);

        // CRT Scanline Effect
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.globalAlpha = 0.05;
        this.ctx.lineWidth = 1;
        for (let y = 0; y < this.height; y += 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1.0;

        this.ctx.restore(); // End Shake
    }

    loop() {
        try {
            this.update();
            this.draw();
            requestAnimationFrame(this.loop);
        } catch (e) {
            console.error("Game Loop Error:", e);
        }
    }
}

window.onload = () => {
    const game = new Game();
};
