class Player {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 100; // Slightly above floor? Floor is at Y=200. Let's say player is at Y=150.
        this.z = 100; // Fixed distance from camera
        this.width = 50;
        this.height = 30;
        this.speed = 15;
        this.targetX = 0;
        this.targetY = 150;
    }

    update(input) {
        // Smooth movement
        if (input.keys['ArrowLeft']) this.targetX -= this.speed;
        if (input.keys['ArrowRight']) this.targetX += this.speed;
        if (input.keys['ArrowUp']) this.targetY -= this.speed;
        if (input.keys['ArrowDown']) this.targetY += this.speed;

        // Boundaries
        const limitX = 800;
        const limitYMin = -500; // Ceiling?
        const limitYMax = 200; // Floor

        this.targetX = Math.max(-limitX, Math.min(limitX, this.targetX));
        this.targetY = Math.max(limitYMin, Math.min(limitYMax, this.targetY));

        // Lerp
        this.x += (this.targetX - this.x) * 0.1;
        this.y += (this.targetY - this.y) * 0.1;
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
        this.y = 200; // On the floor
        this.size = 100 + Math.random() * 100;
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

        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;
        ctx.beginPath();

        // Pyramid
        // Base is at y, Tip is at y - height
        // We need 3D points really, but let's fake it with 2D projection of center
        // Actually, let's project the tip and base corners for better 3D look

        const tip = this.game.project(this.x, this.y - this.size, this.z);
        const baseL = this.game.project(this.x - this.size / 2, this.y, this.z - this.size / 2); // Front-ish
        const baseR = this.game.project(this.x + this.size / 2, this.y, this.z - this.size / 2);
        // We can't easily do full 3D wireframe without projecting all vertices. 
        // Let's stick to a simple shape for now: Triangle facing camera

        if (tip && baseL && baseR) {
            ctx.moveTo(tip.x, tip.y);
            ctx.lineTo(baseL.x, baseL.y);
            ctx.lineTo(baseR.x, baseR.y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Configuration
        this.focalLength = 400;
        this.cx = this.width / 2;
        this.cy = this.height / 2;
        this.speed = 40; // Faster!
        this.gridSize = 4000;
        this.gridSpacing = 200;

        // State
        this.offsetZ = 0;
        this.input = { keys: {} };
        this.gameOver = false;
        this.score = 0;

        // Entities
        this.player = new Player(this);
        this.obstacles = [];
        this.obstaclePoolSize = 20;
        for (let i = 0; i < this.obstaclePoolSize; i++) {
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

    handleKey(e, isDown) {
        this.input.keys[e.code] = isDown;
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
        // Simple spawn logic: every N frames or random chance
        if (Math.random() < 0.05) {
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
                // Check X/Y overlap
                // Simple distance for now
                const dx = obs.x - this.player.x;
                const dy = obs.y - this.player.y; // Player Y is 150, Obs Y is 200
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < (obs.size / 2 + this.player.width / 2)) {
                    this.gameOver = true;
                    console.log("HIT!");
                }
            }
        });
    }

    update() {
        if (this.gameOver) return;

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
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.gameOver) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.font = '40px Courier New';
            this.ctx.fillText("GAME OVER", this.cx - 100, this.cy);
            this.ctx.font = '20px Courier New';
            this.ctx.fillText("Score: " + this.score, this.cx - 50, this.cy + 40);
            return;
        }

        // Neon Style
        this.ctx.globalCompositeOperation = 'lighter';

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
        const floorY = 200;

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
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Courier New';
        this.ctx.fillText("SCORE: " + this.score, 20, 30);
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
