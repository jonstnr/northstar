class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 100; // Fixed floor height relative to camera
        this.z = 300; // Pushed back to be visible
        this.width = 50;
        this.height = 30;
        this.speed = 15;
        this.targetX = 0;
    }

    update(input) {
        // Smooth movement
        if (input.keys['ArrowLeft']) this.targetX -= this.speed;
        if (input.keys['ArrowRight']) this.targetX += this.speed;

        // Boundaries
        const limitX = 800;
        this.targetX = Math.max(-limitX, Math.min(limitX, this.targetX));

        // Lerp
        this.x += (this.targetX - this.x) * 0.1;
        // Y is constant
    }

    draw(ctx) {
        // Player is always at fixed Z, but we project it to see perspective warp if we want,
        // or just draw it at screen coords based on project(x,y,z).
        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        const size = 20 * p.scale;

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Triangle Ship
        ctx.moveTo(p.x, p.y - size); // Tip
        ctx.lineTo(p.x - size, p.y + size); // Bottom Left
        ctx.lineTo(p.x + size, p.y + size); // Bottom Right
        ctx.closePath();
        ctx.stroke();

        // Engine Glow
        ctx.fillStyle = '#00FFFF';
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

class Obstacle {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.type = 'pyramid'; // or cube
        this.size = 100;
    }

    spawn(z) {
        this.active = true;
        this.z = z;
        // Random X within grid width
        this.x = (Math.random() - 0.5) * 3000;
        this.y = 100; // On the floor (Same as Player)
        this.size = 100 + Math.random() * 100;

        // Randomize type and color
        const types = ['pyramid', 'cube', 'obelisk'];
        this.type = types[Math.floor(Math.random() * types.length)];

        const colors = ['#FF0000', '#00FFFF', '#FF00FF'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        if (!this.active) return;
        this.z -= this.game.speed;

        if (this.z < 10) { // Passed camera
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        if (this.z < 10) return;

        const p = this.game.project(this.x, this.y, this.z);
        if (!p) return;

        const s = this.size * p.scale;

        ctx.strokeStyle = this.color || '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (this.type === 'pyramid') {
            // Pyramid: Triangle facing camera
            const tip = this.game.project(this.x, this.y - this.size, this.z);
            const baseL = this.game.project(this.x - this.size / 2, this.y, this.z - this.size / 2);
            const baseR = this.game.project(this.x + this.size / 2, this.y, this.z - this.size / 2);

            if (tip && baseL && baseR) {
                ctx.moveTo(tip.x, tip.y);
                ctx.lineTo(baseL.x, baseL.y);
                ctx.lineTo(baseR.x, baseR.y);
                ctx.closePath();
                ctx.stroke();
            }
        } else if (this.type === 'cube') {
            // Cube: Wireframe box
            const h = this.size;
            const w = this.size / 2;

            // Front face corners
            const tl = this.game.project(this.x - w, this.y - h, this.z);
            const tr = this.game.project(this.x + w, this.y - h, this.z);
            const bl = this.game.project(this.x - w, this.y, this.z);
            const br = this.game.project(this.x + w, this.y, this.z);

            if (tl && tr && bl && br) {
                // Front face
                ctx.moveTo(tl.x, tl.y);
                ctx.lineTo(tr.x, tr.y);
                ctx.lineTo(br.x, br.y);
                ctx.lineTo(bl.x, bl.y);
                ctx.closePath();
                ctx.stroke();

                // Back face (smaller, further back)
                const depth = this.size / 2;
                const tl2 = this.game.project(this.x - w * 0.7, this.y - h * 0.7, this.z + depth);
                const tr2 = this.game.project(this.x + w * 0.7, this.y - h * 0.7, this.z + depth);

                if (tl2 && tr2) {
                    ctx.beginPath();
                    ctx.moveTo(tl.x, tl.y);
                    ctx.lineTo(tl2.x, tl2.y);
                    ctx.moveTo(tr.x, tr.y);
                    ctx.lineTo(tr2.x, tr2.y);
                    ctx.stroke();
                }
            }
        } else if (this.type === 'obelisk') {
            // Obelisk: Tall thin rectangle
            const h = this.size * 1.5;
            const w = this.size / 4;

            const tl = this.game.project(this.x - w, this.y - h, this.z);
            const tr = this.game.project(this.x + w, this.y - h, this.z);
            const bl = this.game.project(this.x - w, this.y, this.z);
            const br = this.game.project(this.x + w, this.y, this.z);

            if (tl && tr && bl && br) {
                ctx.moveTo(tl.x, tl.y);
                ctx.lineTo(tr.x, tr.y);
                ctx.lineTo(br.x, br.y);
                ctx.lineTo(bl.x, bl.y);
                ctx.closePath();
                ctx.stroke();
            }
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
    MAX_DRAW_DISTANCE: 2000,
    OBSTACLE_SPAWN_BASE_CHANCE: 0.05,
    DIFFICULTY_SCORE_INTERVAL: 500,
    DIFFICULTY_SPEED_INCREMENT: 5,
    OBSTACLE_POOL_SIZE: 20
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
        this.gameOver = false;
        this.score = 0;

        // High Score (LocalStorage)
        this.highScore = parseInt(localStorage.getItem('neonRunnerHighScore')) || 0;

        // Entities
        this.player = new Player(this);
        this.obstacles = [];
        for (let i = 0; i < CONFIG.OBSTACLE_POOL_SIZE; i++) {
            this.obstacles.push(new Obstacle(this));
        }

        // Bindings
        this.resize = this.resize.bind(this);
        this.loop = this.loop.bind(this);
        this.handleKey = this.handleKey.bind(this);

        window.addEventListener('resize', this.resize);
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));

        this.init();
    }

    init() {
        this.loop();
    }

    restart() {
        // Reset game state
        this.gameOver = false;
        this.score = 0;
        this.speed = this.baseSpeed;
        this.offsetZ = 0;

        // Reset player
        this.player.x = 0;
        this.player.targetX = 0;

        // Clear all obstacles
        this.obstacles.forEach(o => o.active = false);

        // Clear input
        this.input.keys = {};
    }

    handleKey(e, isDown) {
        this.input.keys[e.code] = isDown;

        // Restart on SPACE when game over
        if (e.code === 'Space' && isDown && this.gameOver) {
            this.restart();
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
    }

    project(x, y, z) {
        if (z <= 0) return null;
        const scale = this.focalLength / z;
        const sx = this.cx + x * scale;
        const sy = this.cy + y * scale;
        return { x: sx, y: sy, scale: scale };
    }

    spawnObstacle() {
        // Progressive spawn rate: increases with score
        const spawnChance = CONFIG.OBSTACLE_SPAWN_BASE_CHANCE + (this.score / 10000);

        if (Math.random() < spawnChance) {
            const obs = this.obstacles.find(o => !o.active);
            if (obs) {
                obs.spawn(2000 + Math.random() * 1000); // Spawn far away
            }
        }
    }

    checkCollisions() {
        // Simple box/distance check
        // Player is at this.player.z (100)
        // Obstacle is at this.obstacles[i].z

        // We only care if obstacle is crossing player's Z plane
        const hitZ = 50; // Depth of collision box

        this.obstacles.forEach(obs => {
            if (!obs.active) return;

            // Check Z depth overlap
            if (Math.abs(obs.z - this.player.z) < hitZ) {
                // Check X overlap
                const dx = Math.abs(obs.x - this.player.x);
                // Simple distance for now (assuming same Y)

                if (dx < (obs.size / 2 + this.player.width / 2)) {
                    this.gameOver = true;

                    // Update high score
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('neonRunnerHighScore', this.highScore);
                    }

                    console.log("HIT!");
                }
            }
        });
    }

    update() {
        if (this.gameOver) return;

        // Progressive Difficulty: Increase speed based on score
        this.speed = this.baseSpeed + Math.floor(this.score / CONFIG.DIFFICULTY_SCORE_INTERVAL) * CONFIG.DIFFICULTY_SPEED_INCREMENT;

        // Move grid
        this.offsetZ -= this.speed;
        if (this.offsetZ <= 0) {
            this.offsetZ += this.gridSpacing;
        }

        this.player.update(this.input);
        this.spawnObstacle();
        this.obstacles.forEach(o => o.update());
        this.checkCollisions();

        this.score++;
    }

    draw() {
        // Clear
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Neon Style
        this.ctx.globalCompositeOperation = 'lighter';

        if (this.gameOver) {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = 'bold 48px Courier New';
            this.ctx.fillText("GAME OVER", this.cx - 140, this.cy - 20);

            this.ctx.fillStyle = '#00FFFF';
            this.ctx.font = '24px Courier New';
            this.ctx.fillText("SCORE: " + this.score, this.cx - 70, this.cy + 30);

            this.ctx.fillStyle = '#FF00FF';
            this.ctx.font = '24px Courier New';
            this.ctx.fillText("HIGH SCORE: " + this.highScore, this.cx - 110, this.cy + 65);

            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '18px Courier New';
            this.ctx.fillText("PRESS SPACE TO RESTART", this.cx - 130, this.cy + 110);
            return;
        }

        // 1. Horizon
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.cy);
        this.ctx.lineTo(this.width, this.cy);
        this.ctx.stroke();

        // 2. Grid
        this.ctx.strokeStyle = '#FF00FF';
        const maxZ = 2000;
        const floorY = 100;

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
            const leftX = -2000;
            const rightX = 2000;
            const pLeft = this.project(leftX, floorY, z);
            const pRight = this.project(rightX, floorY, z);
            if (pLeft && pRight) {
                this.ctx.beginPath();
                this.ctx.moveTo(pLeft.x, pLeft.y);
                this.ctx.lineTo(pRight.x, pRight.y);
                this.ctx.stroke();
            }
        }

        // 3. Obstacles
        // Sort by Z (painter's algorithm) - furthest first
        // Actually, we should sort everything including grid lines if we want perfect occlusion, 
        // but for wireframe it doesn't matter as much. 
        // Let's just draw obstacles on top of grid.
        this.obstacles.sort((a, b) => b.z - a.z);
        this.obstacles.forEach(o => o.draw(this.ctx));

        // 4. Player
        this.player.draw(this.ctx);

        // UI
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = 'bold 20px Courier New';
        this.ctx.fillText("SCORE: " + this.score, 20, 30);

        // High Score (top-right)
        const highScoreText = "HIGH: " + this.highScore;
        const textWidth = this.ctx.measureText(highScoreText).width;
        this.ctx.fillStyle = '#FF00FF';
        this.ctx.fillText(highScoreText, this.width - textWidth - 20, 30);

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
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

window.onload = () => {
    const game = new Game();
};
